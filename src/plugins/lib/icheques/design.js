import animate from './animation.js';

let loaderRegister = 0;
let loaderUnregister = null;

module.exports = controller => {
    controller.unregisterTriggers('serverCommunication::websocket::sendMessage');
    controller.unregisterTrigger('authentication::authenticated', 'inbox');

    controller.confs.subaccount.icons = ['fa-key', 'fa-folder-open'];

    const siteTemplate = require('../../templates/icheques-site.html.js');
    const emailRegex = require('email-regex');
    const installDatabase = require('../../sql/icheques.sql.js');

    installDatabase(controller);

    /* Sem demonstração */
    $('#demonstration').parent().hide();

    /* Cadastrar no Login */
    $('.login .actions').append($('<li />').append($('<a />').text('Cadastrar').click(e => {
        e.preventDefault();
        controller.call('icheques::createAccount', data => {
            const modal = controller.call('modal');
            modal.title('Parabéns! Seu cadastro no CreditHub foi criado!');
            modal.subtitle('Hora de conhecer o melhor bureau de crédito do Brasil');
            modal.addParagraph('A última etapa necessária é confirmar seu endereço de e-mail na sua caixa de entrada.');
            modal.addParagraph('Aqui você terá acesso às consultas mais atualizadas e completas de CPF/CNPJ para sua análise de crédito. Economize até 70% adquirindo um Plano ainda hoje! Gostaria de um tour? Agende uma apresentação clicando aqui. hiperlink no "clicando aqui": https://meetings.hubspot.com/icheques/apresentacao');
            const form = modal.createForm();
            form.element().submit(e => {
                e.preventDefault();
                delete sessionStorage.apiKey;
                let loggedout = false;

                const logout = () => {
                    loggedout = true;
                    controller.serverCommunication.apiKey(BIPBOP_FREE);
                    controller.call('default::page');
                    $('#input-username').val('');
                    $('#input-password').val('');
                    $('#input-save-password').removeAttr('checked');
                    const setSessionId = (value, cb) => {
                        if (!value) localStorage.removeItem('sessionId', cb);
                        else localStorage.setItem('sessionId', value, cb);
                    };
                    setSessionId(null, () => {
                        controller.trigger('authentication::logout::end');
                        if (navigator.serviceWorker && navigator.serviceWorker.controller)
                            navigator.serviceWorker.controller.postMessage(null);
                        location.reload(true); /* prevent information leak */
                    });
                };
                logout();
                modal.close();
            });
            form.addSubmit('exit', 'Entrar');
        }, 'retail', {
            type: 'retail'
        });
    })));

    document.title = 'CreditHub | Seu Hub de Crédito';
    controller.interface.helpers.changeFavicon('/images/icheques/favicon.png');
    require('../../styles/icheques.js');
    $('#login-about').text('Para acessar sua conta faça o login com usuário ou email e senha cadastrados.');

    $(controller.confs.container).append(siteTemplate);
    $('.input-q').attr('placeholder',
        controller.confs.isCordova ? 'Digite um CPF, CNPJ, CMC7 ou Placa de Veículo.' :
            'Pesquise um CPF/CNPJ, nome completo, telefone, ou número de cheque.');

    $('.actions .container').prepend($('<div />').addClass('content support-phone').text('(11) 3522-8363 (Suporte)').prepend($('<i />').addClass('fa fa-phone')));
    $('.actions .container').prepend($('<div />').addClass('content user').css({
        backgroundColor: '#f80050',
        color: 'white',
        fontWeight: 'bold',
        marginRight: '2px',
        cursor: 'pointer'
    }).text(' Baixar Plugin / Extensão!').prepend($('<i />').addClass('fa fa-download')).on('click', ev => {
        ev.preventDefault();
        window.open('https://chrome.google.com/webstore/detail/credithub/kbabapbdjbfdigkbmicgjkfgobifkoli?hl=pt-BR', '_blank');
    }));
    $('body > .icheques-site .call-to-action').css({
        height: window.innerHeight
    });

    $('#action-show-modules').parent().hide();

    $('.logo').click(() => {
        $('section.group-type,footer.load-more').remove();
    }).css('cursor', 'pointer');

    $('body > .icheques-site .action-login').click(() => {
        controller.interface.helpers.activeWindow('.login');
    });

    controller.registerTrigger('authentication::authenticated', 'welcomeScreen::authenticated', (args, cb) => {
        cb();
    });

    controller.registerCall('default::page', () => {
        controller.interface.helpers.activeWindow('.login');
    });

    const emailInput = $('body > .icheques-site .email');
    $('body > .icheques-site .form-trial').submit(e => {
        e.preventDefault();
        if (!emailRegex().test(emailInput.val())) {
            emailInput.addClass('error');
            return;
        }
        emailInput.removeClass('error');
        controller.call('icheques::newcheck');
    });

    $('.icheques-site .action-buy').click(function(e) {
        e.preventDefault();

        const element = $(this);

        controller.call('icheques::createAccount', data => {
            const modal = controller.call('modal');
            modal.title('Você completou sou cadastro no iCheques');
            modal.subtitle('Parabéns! Sua conta foi criada com sucesso.');
            modal.addParagraph('Esperamos que tenha uma ótima experiência com nosso produto, a partir de agora nunca mais se preocupe se seus cheques estão seguros em sua carteira.');
            const form = modal.createForm();
            form.element().submit(e => {
                e.preventDefault();
                delete sessionStorage.apiKey;
                let loggedout = false;

                const logout = () => {
                    loggedout = true;
                    controller.serverCommunication.apiKey(BIPBOP_FREE);
                    controller.call('default::page');
                    $('#input-username').val('');
                    $('#input-password').val('');
                    $('#input-save-password').removeAttr('checked');
                    const setSessionId = (value, cb) => {
                        if (!value) localStorage.removeItem('sessionId', cb);
                        else localStorage.setItem('sessionId', value, cb);
                    };
                    setSessionId(null, () => {
                        controller.trigger('authentication::logout::end');
                        if (navigator.serviceWorker && navigator.serviceWorker.controller)
                            navigator.serviceWorker.controller.postMessage(null);
                        location.reload(true); /* prevent information leak */
                    });
                };
                logout();
                modal.close();
            });
            form.addSubmit('exit', 'Entrar');
        }, element.attr('data-contract'), {
            type: element.attr('data-type')
        });
    });

    controller.registerCall('loader::register', () => {
        if (!loaderUnregister && !loaderRegister) {
            loaderUnregister = $.bipbopLoader.register();
        }
        loaderRegister++;
    });

    controller.registerCall('loader::unregister', () => {
        if (loaderRegister - 1 > 0) {
            loaderRegister--;
            return;
        }
        loaderRegister = 0;

        if (loaderUnregister) {
            loaderUnregister();
            loaderUnregister = null;
        }
    });

    $.getScript('https://code.createjs.com/createjs-2015.11.26.min.js', () => {
        const lib = {};
        animate(lib, null, createjs, null);

        let canvas = $('<canvas />').attr({
            width: 225,
            height: 255
        }).css({
            'z-index': 11,
            height: '250px',
            left: '50%',
            'margin-left': '-125px',
            'margin-top': '-125px',
            position: 'relative',
            top: '50%',
            width: '250px'
        });

        let container = $('<div />').css({
            'background-color': 'rgba(30,50,58,.8)',
            'background-position': 'center center',
            'background-repeat': 'no-repeat',
            height: '100%',
            left: '0',
            'z-index': 99999999,
            overflow: 'hidden',
            position: 'fixed',
            top: '0',
            width: '100%',
        }).append(canvas);

        let exportRoot = new lib.ichequesanimacao();
        let stage = new createjs.Stage(canvas.get(0));

        stage.addChild(exportRoot);
        stage.update();
        createjs.Ticker.setFPS(lib.properties.fps);
        createjs.Ticker.addEventListener('tick', stage);

        $.bipbopLoader.register = () => {
            $(controller.confs.container).append(container);
            return () => container.remove();
        };
    });

    if (controller.confs.isCordova) {
        $('.app-content').first().insertAfter('.icheques-app .app-header');
        $('.icheques-app').removeAttr('style');
        controller.registerCall('authentication::loggedin', () =>
            controller.interface.helpers.activeWindow('.icheques-app'));
        $('#application-new-check').click(controller.click('icheques::newcheck'));
        $('#application-profile').click(controller.click('icheques::form::company'));

        let appSearch = $('.app-search');
        let appHeader = $('.app-header .main');

        $('#application-search').click(e => {
            e.preventDefault();
            if (appSearch.is(':visible')) {
                appSearch.hide();
                appHeader.show();
            } else {
                appSearch.show();
                appHeader.hide();
            }
        });

    }
};
