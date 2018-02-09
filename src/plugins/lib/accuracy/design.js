import { CPF } from 'cpf_cnpj';

const logoCaller = $('.accuracy-app .logo i');

module.exports = controller => {

    /* Design SCSS do Accuracy APP */
    require('../../styles/accuracy.js');
    controller.unregisterTrigger('authentication::authenticated', 'welcomeScreen::authenticated');
    controller.unregisterTrigger('server::communication::websocket::authentication', 'account::overview');
    controller.unregisterTrigger('bootstrap::end', 'smartsupp');
    controller.unregisterTrigger('bootstrap::end', 'authentication::bootstrap');
    controller.unregisterTrigger('bootstrap::end', 'authentication::centralized');

    $('.accuracy-app').removeAttr('style');

    /* Input de authentication */
    const inputDocument = $('.login #input-cpf')
        .mask('000.000.000-00', {reverse: true});

    let showCounter = () => {
        controller.sync.queueLength(length => {
            logoCaller.text(length ? length.toString() : '');
        });
    };

    showCounter();
    controller.registerTrigger('sync::change', 'accuracy', (opts, cb) => {
        cb();
        showCounter();
    });

    /* Verifica se o usuário já está logado */
    controller.call('accuracy::authentication', () => {
        /* need authentication */
        controller.interface.helpers.activeWindow('.login');
    }, () => {
        /* change to the app screen */
        controller.interface.helpers.activeWindow('.accuracy-app');
    });

    /* Manipula o Formulário de authentication */
    $('#form-login-accuracy').submit(e => {
        e.preventDefault();
        let cpfDocument = inputDocument.val();
        if (!CPF.isValid(cpfDocument)) {
            toastr.error('O documento informado não é válido',
                'Verifique o documento informado e tente novamente');
            inputDocument.addClass('error');
            return;
        }

        cpfDocument = CPF.strip(cpfDocument);

        controller.call('accuracy::authentication::auth', cpfDocument, () => {
            controller.interface.helpers.activeWindow('.accuracy-app');
        }, (errorMessage) => {
            toastr.error(errorMessage, 'Não foi possível concluir a autenticação.');
            inputDocument.addClass('error');
        });
    });

    $('.clear-login-accuracy').click(e => {
        e.preventDefault();
        inputDocument.val(''); /* clear all inputs */
    });

};
