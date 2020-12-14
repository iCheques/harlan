const SAFE_PASSWORD = /^.{6,}$/;

const PHONE_REGEX = /^\((\d{2})\)\s*(\d{4})\-(\d{4,5})$/i;
const VALIDATE_NAME = /^[a-z]{2,}\s+[a-z]{2,}/i;
import {CPF} from 'cpf_cnpj';
import {CNPJ} from 'cpf_cnpj';
import emailRegex from 'email-regex';
import sprintf from 'sprintf';

module.exports = controller => {

    const referenceAutocomplete = input => {
        controller.call('instantSearch', input, (value, autocomplete, callback) => {
            controller.serverCommunication.call('SELECT FROM \'ICHEQUES\'.\'REFERENCEAUTOCOMPLETE\'', {
                data: {
                    input: value
                },
                success(document) {
                    $('BPQL > body > references', document).each((idx, value) => {
                        autocomplete.item(
                            $('nome', value).text(),
                            $('username', value).text(),
                            'Referência Comercial').click(() => {
                            input.val($('username', value).text());
                        });
                    });
                },
                completed() {
                    callback();
                }
            });
        });
    };

    controller.registerCall('icheques::createAccount::1', (data, callback) => {
        const modal = controller.call('modal');
        modal.title('Crie sua conta iCheques');
        modal.subtitle('Informe os dados abaixo para que possamos continuar');
        modal.addParagraph('Sua senha é secreta e recomendamos que não a revele a ninguém.');

        const form = modal.createForm();

        const inputName = form.addInput('nome', 'text', 'Nome Completo').magicLabel();

        const objDocument = {
            append: form.multiField(),
            labelPosition: 'before'
        };

        const objEmail = {
            append: form.multiField(),
            labelPosition: 'before'
        };

        const objLocation = {
            append: form.multiField(),
            labelPosition: 'before'
        };

        const inputCommercialReference = form.addInput('commercialReference', 'text', 'Quem nos indicou?', objEmail).magicLabel();
        const inputCpf = form.addInput('cpf', 'text', 'CPF', objDocument).mask('000.000.000-00').magicLabel();
        const inputCnpj = form.addInput('cnpj', 'text', 'CNPJ (opcional)', objDocument, 'CNPJ (opcional)').mask('00.000.000/0000-00').magicLabel();
        const inputZipcode = form.addInput('cep', 'text', 'CEP', objLocation).mask('00000-000').magicLabel();
        const inputPhone = form.addInput('phone', 'text', 'Telefone', objLocation).mask('(00) 0000-00009').magicLabel();

        referenceAutocomplete(inputCommercialReference);

        form.addSubmit('login', 'Criar Conta');

        form.element().submit(e => {
            e.preventDefault();

            const errors = [];
            const name = inputName.val();
            const cpf = inputCpf.val();
            const cnpj = inputCnpj.val();
            const zipcode = inputZipcode.val();
            const commercialReference = inputCommercialReference.val();

            if (!VALIDATE_NAME.test(name)) {
                errors.push('O nome de usuário não pode conter espaços ou caracteres especiais, deve possuir no mínimo 3 caracteres.');
                inputName.addClass('error');
            } else {
                inputName.removeClass('error');
            }

            if (cpf) {
                if (!CPF.isValid(cpf)) {
                    inputCpf.addClass('error');
                    errors.push('O CPF informado não é válido.');
                } else {
                    inputCpf.removeClass('error');
                }
            }

            if (cnpj) {
                if (!CNPJ.isValid(cnpj)) {
                    inputCnpj.addClass('error');
                    errors.push('O CNPJ informado não é válido.');
                } else {
                    data.cnpj = cnpj;
                    inputCnpj.removeClass('error');
                }
            } else {
                inputCnpj.removeClass('error');
            }

            if (zipcode) {
                if (!/^\d{5}-\d{3}$/.test(zipcode)) {
                    inputZipcode.addClass('error');
                    errors.push('O CEP informado não é válido.');
                } else {
                    inputZipcode.removeClass('error');
                }
            }

            if (phone) {
                if (!PHONE_REGEX.test(phone)) {
                    inputPhone.addClass('error');
                    errors.push('O telefone informado não é válido.');
                } else {
                    inputPhone.removeClass('error');
                }
            }

            if (errors.length) {
                for (const i in errors) {
                    toastr.warning(errors[i], 'Não foi possível prosseguir');
                }
                return;
            }

            const phoneMatch = PHONE_REGEX.exec(inputPhone.val());
            const ddd = phoneMatch[1];
            var phone = `${phoneMatch[2]}-${phoneMatch[3]}`;

            controller.serverCommunication.call('INSERT INTO \'IChequesAuthentication\'.\'ACCOUNT\'',
                controller.call('error::ajax', controller.call('loader::ajax', {
                    data: Object.assign({
                        name,
                        cpf,
                        cnpj,
                        commercialReference,
                        zipcode,
                        ddd,
                        phone
                    }, data),
                    success(domDocument) {
                        modal.close();
                        const apiKey = $('BPQL > body apiKey', domDocument).text();
                        controller.call('authentication::force', apiKey, domDocument);
                        if (callback)
                            callback(domDocument);
                    }
                })));
        });
        const actions = modal.createActions();
        actions.add('Voltar').click(e => {
            e.preventDefault();
            modal.close();
            controller.call('icheques::createAccount', callback);
        });

        actions.add('Cancelar').click(e => {
            e.preventDefault();
            modal.close();
        });
    });

    controller.registerCall('icheques::createAccount', (callback, contract, parameters = {}) => {
        const modal = controller.call('modal');

        modal.title('Crie sua conta Credithub');
        modal.subtitle('Informe seu usuário e senha desejados para continuar');
        modal.addParagraph('Sua senha é secreta e recomendamos que não a revele a ninguém.');

        const form = modal.createForm();
        const inputEmail = form.addInput('email', 'email', 'E-mail').magicLabel();
        const inputPassword = form.addInput('password', 'password', 'Senha').magicLabel();
        const inputConfirmPassword = form.addInput('password-confirm', 'password', 'Confirmar Senha').magicLabel();

        const inputAgree = form.addCheckbox('agree', sprintf('Eu li e aceito os <a href="https://drive.google.com/file/d/1V4w67Shc5KmYCJMUc4uPtlmgT4qwMCm_/view?usp=sharing" target="_blank">TERMOS DE SERVIÇO VAREJO</a> ou <a href="https://drive.google.com/file/d/1RwmV7JIQCfSfiZ1CaOeEqFnhojSEMlX7/view?usp=sharing" target="_blank">TERMOS DE SERVIÇO FINANCEIRA</a>.'), false);
        const inputAgreeLGPD = form.addCheckbox('agree', sprintf('Eu li e aceito os <a href="https://drive.google.com/file/d/1-5feP98J3A3jnkW_KLChLlHKfChQojHv/" target="_blank">TERMOS da LGPD / Política de Privacidade</a>.'), false);

        form.addSubmit('login', 'Próximo Passo');

        form.element().submit(e => {
            e.preventDefault();

            const errors = [];
            const email = inputEmail.val();
            const password = inputPassword.val();
            const confirmPassword = inputConfirmPassword.val();

            if (!emailRegex().test(email)) {
                inputEmail.addClass('error');
                errors.push('O endereço de e-mail informado não é válido.');
            } else {
                inputEmail.removeClass('error');
            }

            if (!inputAgree[1].is(':checked') || !inputAgreeLGPD[1].is(':checked')) {
                errors.push('Você precisa aceitar todos os termos.');
            }

            if (!SAFE_PASSWORD.test(password)) {
                inputPassword.addClass('error');
                errors.push('A senha deve possuir no mínimo 6 dígitos.');
            } else if (password !== confirmPassword) {
                inputPassword.addClass('error');
                inputConfirmPassword.addClass('error');
                errors.push('A senha não confere');
            } else {
                inputPassword.removeClass('error');
                inputConfirmPassword.removeClass('error');
            }

            if (errors.length) {
                for (const i in errors) {
                    toastr.warning(errors[i], 'Não foi possível prosseguir');
                }
                return;
            }

            controller.serverCommunication.call('SELECT FROM \'HARLANAUTHENTICATION\'.\'USERNAMETAKEN\'',
                controller.call('error::ajax', controller.call('loader::ajax', {
                    data: {
                        username: email
                    },
                    success: () => {
                        modal.close();
                        controller.call('icheques::createAccount::1', Object.assign(parameters, {
                            username: email,
                            email,
                            password
                        }), callback);
                    }
                })));
        });

        const actions = modal.createActions();

        actions.add('Cancelar').click(e => {
            e.preventDefault();
            modal.close();
        });

        actions.add('Login').click(e => {
            e.preventDefault();
            modal.close();
            controller.call('icheques::login', callback);
        });
    });

    controller.registerCall('icheques::login', callback => {
        const modal = controller.call('modal');
        modal.title('Autentique-se');
        modal.subtitle('Informe seu usuário e senha para continuar');
        modal.addParagraph('Sua senha é secreta e recomendamos que não a revele a ninguém.');

        const form = modal.createForm();
        const inputUsername = form.addInput('user', 'text', 'Usuário');
        const inputPassword = form.addInput('password', 'password', 'Senha');

        form.addSubmit('login', 'Autenticar');

        form.element().submit(e => {
            e.preventDefault();
            controller.call('authentication::authenticate', inputUsername, inputPassword, false, () => {
                modal.close();
                callback();
            });
        });

        const actions = modal.createActions();

        actions.add('Criar Conta').click(e => {
            e.preventDefault();
            controller.call('icheques::createAccount', () => {
                controller.call('icheques::login', callback);
            });
            modal.close();
        });

        actions.add('Esqueci minha Senha').click(e => {
            e.preventDefault();
            controller.call('forgotPassword', () => {
                controller.call('icheques::login', callback);
            });
            modal.close();
        });

        actions.add('Cancelar').click(e => {
            e.preventDefault();
            modal.close();
        });
    });

    controller.registerCall('authentication::need', callback => {
        if (controller.serverCommunication.freeKey()) {
            controller.call('icheques::login', callback);
            return true;
        }

        if (callback) {
            callback();
        }

        return false;
    });

};
