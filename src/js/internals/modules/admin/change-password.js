import owasp from 'owasp-password-strength-test';

owasp.config({
    allowPassphrases       : true,
    maxLength              : 128,
    minLength              : 5,
    minPhraseLength        : 20,
    minOptionalTestsToPass : 2,
});

module.exports = controller => {
    controller.registerCall('admin::change::password', username => {
        const modal = controller.call('modal');
        modal.title('Nova Senha Usuário');
        modal.subtitle('Digite a nova senha de usuário.');
        modal.addParagraph('Cuidado para não criar uma nova senha para estranhos, certifique que você está' +
                            ' passando a senha para um contato conhecido.');

        const form = modal.createForm();
        const inputPassword = form.addInput('newpassword', 'password', 'Nova Senha');
        const inputConfirmPassword = form.addInput('newpassword-confirm', 'password', 'Confirmar Nova Senha');

        form.element().submit(e => {
            e.preventDefault();

            const errors = [];
            const password = inputPassword.val();
            const confirmPassword = inputConfirmPassword.val();

            if (!owasp.test(password).strong) {
                inputPassword.addClass('error');
                errors.push('A senha que você tenta configurar é muito fraca, tente' +
                             ' uma com 10 (dez) dígitos, números, caracteres maísculos,' +
                             ' minúsculos e especiais.');
            } else if (password !== confirmPassword) {
                inputPassword.addClass('error');
                inputConfirmPassword.addClass('error');
                errors.push('A senhas informadas não conferem, verifique e tente novamente.');
            } else {
                inputPassword.removeClass('error');
                inputConfirmPassword.removeClass('error');
            }

            if (errors.length) {
                for (const i in errors) {

                    toastr.error(errors[i], 'Não foi possível prosseguir devido a um erro.');
                }
                return;
            }
            controller.call('confirm', {
                subtitle: 'Certifique-se de que a nova senha não esta sendo criada para um estranho, confirme de que este não se trata de um golpe.'
            }, () => {
                controller.serverCommunication.call('UPDATE \'BIPBOPCOMPANYS\'.\'PASSWORD\'',
                    controller.call('error::ajax', controller.call('loader::ajax', {
                        method: 'POST',
                        data: {
                            username,
                            password: inputPassword.val()
                        },
                        success() {
                            modal.close();
                        }
                    })));
            });
        });

        form.addSubmit('new-password', 'Alterar Senha');

        modal.createActions().add('Cancelar').click(e => {
            e.preventDefault();
            modal.close();
        });
    });
};
