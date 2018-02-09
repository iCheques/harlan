import AES from 'crypto-js/aes';

import CryptoJS from 'crypto-js';
import owasp from 'owasp-password-strength-test';

/**
 * Gere o Token da IUGU no Harlan para Cobrar de Seus Clientes! =D
 */
module.exports = controller => {

    let loaded = false;

    const iuguError = () => {
        controller.call('alert', {
            title: 'Ocorreu um erro no sistema de pagamentos!',
            subtitle: 'Não foi possível carregar a biblioteca de pagamentos.',
            paragraph: 'Para que o sistema carregue corretamente é necessário que todo o domínio iugu.com esteja liberado, solicite ao seu administrador de redes.'
        });
    };

    const iuguKey = () => `iugu_${controller.confs.iugu.token}`;

    const getPaymentToken = (callback, password) => {
        if (typeof localStorage[iuguKey()] === 'undefined') {
            callback();
            return;
        }

        const data = JSON.parse(localStorage[iuguKey()]);

        const getToken = password => {

            if (!TwinBcrypt.compareSync(password, data.password)) {
                return false;
            }

            Iugu.createPaymentToken(JSON.parse(
                AES.decrypt(data.token, password)
                    .toString(CryptoJS.enc.Utf8)
                    .replace(/^[^{]+/, '')), paymentToken => {
                callback(paymentToken);
            });

            return true;
        };

        if (password && getToken(password)) {
            return;
        }

        const modal = controller.call('modal');
        modal.title('Cartão de Crédito');
        modal.subtitle(`Digite a senha que configurou para seu cartão ${data.cardLabel}`);
        modal.addParagraph('Armazenamos seu cartão de crédito com segurança, para acessá-lo é necessário que você digite a senha que usou para registrar o mesmo.');
        const form = modal.createForm();
        const passwordInput = form.addInput('password', 'password', `Senha do cartão ${data.cardLabel}`);
        form.addSubmit('submit', 'Acessar');
        form.element().submit(e => {
            e.preventDefault();
            if (!getToken(passwordInput.val())) {
                passwordInput.addClass('error');
                return;
            }
            modal.close();
        });

        const actions = modal.createActions();
        actions.add('Atualizar Método de Pagamento').click(e => {
            e.preventDefault();
            callback(null);
            modal.close();
        });

        actions.add('Cancelar').click(e => {
            e.preventDefault();
            modal.close();
        });

        return true;
    };

    const owaspAlert = finish => {
        const modal = controller.call('modal');
        modal.title('Sua senha não é tão segura!');
        modal.subtitle('Você deseja continuar mesmo assim?');
        modal.addParagraph('Quanto mais forte a senha, mais protegido estará o computador contra os hackers e softwares mal-intencionados. Use para uma frase secreta ou senha de no mínimo oito dígitos, com números, caracteres especiais, letras minúsculas e maiúsculas.');
        const form = modal.createForm();

        form.element().submit(e => {
            e.preventDefault();
            modal.close();
        });

        form.addSubmit('changepw', 'Mudar Senha');

        modal.createActions().add('Eu aceito o risco!').click(e => {
            e.preventDefault();
            modal.close();
            finish();
        });
    };

    const storePaymentToken = (token, creditCard, cardLabel, callback, password) => {

        const saveToken = password => {
            localStorage[iuguKey()] = JSON.stringify({
                token: AES.encrypt(CryptoJS.lib.WordArray.random(256).toString() +
                        JSON.stringify(creditCard), password).toString(),
                cardLabel,
                password: TwinBcrypt.hashSync(password)
            });
        };

        if (password) {
            saveToken(password);
            callback(token);
            return;
        }

        const modal = controller.call('modal');
        modal.title('Cartão de Crédito');
        modal.subtitle(`Defina uma senha para seu cartão ${cardLabel}`);
        modal.addParagraph('Armazenamos seu cartão de crédito com segurança, para acessá-lo novamente é necessário que crie uma senha de cobranças.');
        const form = modal.createForm();
        const passwordInput = form.addInput('password', 'password', `Senha para o cartão ${cardLabel}`);
        form.addSubmit('submit', 'Configurar Senha');

        form.element().submit(e => {
            e.preventDefault();
            const password = passwordInput.val();

            const finish = () => {
                saveToken(password);
                modal.close();
                callback(token);
            };

            if (!owasp.test(password).strong) {
                owaspAlert(finish);
                return;
            }

            finish();

        });

        const actions = modal.createActions();
        actions.add('Não Armazenar o Cartão').click(e => {
            callback(token);
            modal.close();
        });
        actions.add('Cancelar').click(e => {
            modal.close();
        });
    };

    const getCreditCard = (callback, {title, subtitle, paragraph, submit} = {}) => {
        const modal = controller.call('modal');
        modal.title(title || 'Cartão de Crédito');
        modal.subtitle(subtitle || 'Configure seu Cartão de Crédito');
        modal.addParagraph(paragraph || 'Armazenamos seu cartão de crédito com segurança, para acessá-lo novamente é necessário que crie uma senha de cobranças.');
        const form = modal.createForm();

        const creditCardHead = form.multiField();
        const creditCardFooter = form.multiField();

        const inputCardNumber = form.addInput('credit-card', 'text', 'Número do Cartão', {
            labelPosition: 'before',
            append: creditCardHead}, 'Número do Cartão').payment('formatCardNumber').addClass('cc-number').magicLabel();

        const inputCardExpiry = form.addInput('expire', 'text', 'Mês / Ano', {
            labelPosition: 'before',
            append: creditCardHead
        }, 'Vencimento').payment('formatCardExpiry').addClass('cc-expiry').magicLabel();

        const inputCardHolder = form.addInput('holder', 'text', 'Nome do Titular', {
            labelPosition: 'before',
            append: creditCardFooter
        }, 'Nome do Titular').addClass('cc-holder').magicLabel();

        const inputCardCVV = form.addInput('cvv', 'text', 'CVV do Cartão (verso)', {
            labelPosition: 'before',
            append: creditCardFooter
        }, 'CVV').addClass('cc-cvv').magicLabel();

        form.addSubmit('submit', submit || 'Configurar Cartão');

        form.element().submit(e => {
            e.preventDefault();

            const errors = [];

            const cardNumber = inputCardNumber.val();
            if (!$.payment.validateCardNumber(cardNumber)) {
                errors.push('O número do cartão de crédito não confere.');
                inputCardNumber.addClass('error');
            } else {
                inputCardNumber.removeClass('error');
            }

            const cardExpire = inputCardExpiry.val().split('/').map(v => v.replace(/[^\d]/, ''));

            if (cardExpire.length !== 2 || !$.payment.validateCardExpiry(cardExpire[0], cardExpire[1])) {
                errors.push('A data de expiração do cartão de crédito não confere.');
                inputCardExpiry.addClass('error');
            } else {
                inputCardExpiry.removeClass('error');
                if (cardExpire[1].length === 2)
                    cardExpire[1] = `20${cardExpire[1]}`;
            }

            const cardCVV = inputCardCVV.val();
            if (!$.payment.validateCardCVC(cardCVV, $.payment.cardType(cardNumber))) {
                errors.push('O CVV do cartão de crédito não confere.');
                inputCardCVV.addClass('error');
            } else {
                inputCardCVV.removeClass('error');
            }

            const names = inputCardHolder.val().split(' ');
            if (names.length < 2) {
                inputCardHolder.addClass('error');
            } else {
                inputCardHolder.removeClass('error');
            }

            if (errors.length) {
                for (const i in errors) {
                    toastr.warning(errors[i], 'Verifique seu cartão de crédito');
                }
                return;
            }

            callback({
                number: cardNumber,
                month: cardExpire[0],
                year: cardExpire[1],
                first_name: names[0],
                last_name: names[names.length - 1],
                verification_value: cardCVV
            });

            modal.close();
        });

        const actions = modal.createActions();

        actions.add('Cancelar').click(e => {
            modal.close();
        });
    };

    controller.registerCall('get::credit::card', (callback, config) => getCreditCard(callback, config));

    controller.registerBootstrap('iugu::init', callback => {
        let alreadyLoaded = false;

        const timeout = setTimeout(() => {
            alreadyLoaded = true;
            callback();
        }, 5000);

        $.getScript('https://js.iugu.com/v2', () => {
            loaded = true;
            clearTimeout(timeout);
            if (!alreadyLoaded) {
                callback(); /* Fucking Done! */
            }
        });
    });

    controller.registerCall('iugu::request::payment::token', (callback, passesErrors, password) => {
        if (!loaded) {
            return iuguError();
        }
        Iugu.setAccountID(controller.confs.iugu.token);
        getPaymentToken(paymentToken => {
            if (paymentToken) {
                callback(paymentToken);
                return;
            }

            getCreditCard(creditCard => {
                Iugu.createPaymentToken(creditCard, paymentToken => {
                    if (paymentToken.errors) {
                        if (passesErrors) {
                            callback(paymentToken);
                        } else {
                            const errors = typeof paymentToken.errors === 'string' ? [paymentToken.errors] : paymentToken.errors;
                            for (const i in errors) {
                                /* toast error */
                                toastr.error(errors[i]);
                            }
                            controller.call('iugu::request::payment::token', callback, passesErrors, password);
                        }
                        return;
                    }
                    storePaymentToken(paymentToken, creditCard, creditCard.number.slice(-4), callback, password);
                });
            });
        });
    });
};
