import owasp from 'owasp-password-strength-test';

owasp.config({
    allowPassphrases       : true,
    maxLength              : 128,
    minLength              : 6,
    minPhraseLength        : 20,
    minOptionalTestsToPass : 3,
});

/* Senha mais simples para esquecidos não anotarem */

module.exports = controller => {

    controller.endpoint.forgot::password = 'SELECT FROM \'HARLANAUTHENTICATION\'.\'FORGOTPASSWORD\'';

    controller.registerCall('forgot::password', callback => {
        const modal = controller.call('modal');
        modal.title('Recupere sua senha');
        modal.subtitle('Insira seus dados para prosseguir');
        modal.addParagraph('Para recuperar sua senha você tem de saber o usuário que usou quando se registrou, caso não lembre entre em contato.');
        const form = modal.createForm();
        const usernameInput = form.addInput('username', 'text', 'Usuário');

        form.element().submit(e => {
            e.preventDefault();

            const username = usernameInput.val();
            if (/^\s*$/.test(username)) {
                usernameInput.addClass('error');
                toastr.warning('É necessário que preencha o campo usuário', 'Preencha seu usuário');
                return;
            }

            usernameInput.removeClass('error');

            controller.serverCommunication.call(controller.endpoint.forgot::password,
                controller.call('error::ajax', controller.call('loader::ajax', {
                    data: {username},
                    success() {
                        controller.call('forgot::password::code', callback, username);
                        modal.close();
                    }
                })));
        });

        form.addSubmit('recover', 'Recuperar');
        form.addSubmit('exit', 'Sair').click(e => {
            e.preventDefault();
            modal.close();
        });
    });

    controller.registerCall('forgot::password::code', (callback, username) => {
        const modal = controller.call('modal');
        modal.title('Confirmação de Conta');
        modal.subtitle('Digite o código que recebeu em seu e-mail');
        modal.addParagraph('Você recebeu no endereço de e-mail principal registrado um código, precisamos que o digite abaixo');

        const form = modal.createForm();
        const inputSecureCode = form.addInput('code', 'text', 'Código Recebido');
        const inputPassword = form.addInput('newpassword', 'password', 'Nova Senha');
        const inputConfirmPassword = form.addInput('newpassword-confirm', 'password', 'Confirmar Nova Senha');

        form.element().submit(e => {
            e.preventDefault();

            const errors = [];
            const password = inputPassword.val();
            const secureCode = inputSecureCode.val();
            const confirmPassword = inputConfirmPassword.val();

            if (/^\s*$/.test(secureCode)) {
                inputSecureCode.addClass('error');
                errors.push('Você deve preencher o código de segurança para poder' +
                             ' continuar.');
            } else {
                inputSecureCode.removeClass('error');
            }

            if (!owasp.test(password).strong) {
                inputPassword.addClass('error');
                errors.push('A senha que você tenta configurar é muito fraca, tente'  +
                             ' uma com 10 (dez) dígitos, números, caracteres maísculos,' +
                             ' minúsculos e especiais.');
            } else if (password !== confirmPassword) {
                inputPassword.addClass('error');
                inputConfirmPassword.addClass('error');
                errors.push('A senhas digitadas não conferem, certifique que a ' +
                             ' senha escolhida pode ser memorizada.');
            } else {
                inputPassword.removeClass('error');
                inputConfirmPassword.removeClass('error');
            }

            if (errors.length) {
                for (let errorMessage of errors.length) {
                    toastr.warning(errorMessage, 'Não foi possível prosseguir devido a um erro.');
                }
                return;
            }

            controller.serverCommunication.call('UPDATE \'HARLANAUTHENTICATION\'.\'FORGOTPASSWORD\'',
                controller.call('error::ajax', controller.call('loader::ajax', {
                    method : 'POST',
                    data: {
                        securecode: inputSecureCode.val(),
                        username,
                        password: inputPassword.val()
                    },
                    success() {
                        toastr.success('A senha foi alterada com sucesso.');
                        modal.close();
                        if (callback)
                            callback();
                    }
                })));
        });

        form.addSubmit('new-password', 'Alterar Senha');

        modal.createActions().add('Cancelar').click(e => {
            e.preventDefault();
            modal.close();
        });
    });

    controller.registerCall('change::password', () => {

    });

    controller.registerBootstrap('forgot::password', callback => {
        callback();
        $('#forgot-password').click(() => {
            controller.call('forgot::password');
        });
    });
};
