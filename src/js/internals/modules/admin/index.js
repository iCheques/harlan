import doUntil from 'async/doUntil';

let loaded = false;
import _ from 'underscore';

module.exports = controller => {

    controller.endpoint.adminReport = 'SELECT FROM \'BIPBOPCOMPANYSREPORT\'.\'REPORT\'';
    controller.endpoint.createCompany = 'INSERT INTO \'BIPBOPCOMPANYS\'.\'COMPANY\'';
    controller.endpoint.commercialReferenceOverview = 'SELECT FROM \'BIPBOPCOMPANYSREPORT\'.\'COMMERCIALREFERENCE\'';

    controller.registerCall('admin::roleTypes', () => ({
        '': 'Tipo de Contrato',
        avancado: 'Avançado',
        simples: 'Simples'
    }));

    controller.registerTrigger('serverCommunication::websocket::authentication', 'admin::reference::websocket::authentication', ({adminOf}, callback) => {
        callback();

        if (loaded || !adminOf || !adminOf.length) {
            /* apenas para admins */
            return;
        }

        loaded = true;

        require('./autocomplete')(controller);
        require('./instant-search')(controller);
        require('./open-companies')(controller);
        require('./create-company')(controller);
        require('./view-company')(controller);
        require('./change-password')(controller);
        require('./change-address')(controller);
        require('./change-contract')(controller);
        require('./commercial-reference')(controller);
        require('./change-company')(controller);
        require('./email')(controller);
        require('./phone')(controller);
        require('./send-message')(controller);
        require('./report')(controller);

        controller.registerCall('admin::getApiKeys::notify', filter => {
            let apiKeys = [];
            let total = 0;

            const loaderAjax = controller.call('loader::ajax', {});

            loaderAjax.beforeSend();
            doUntil(callback => controller.serverCommunication.call('SELECT FROM \'BIPBOPCOMPANYS\'.\'LIST\'', {
                data: {
                    limit: 500,
                    skip: apiKeys.length,
                    tags: !$.isEmptyObject(filter.tags) ? filter.tags : null,
                },
                success: data => {
                    apiKeys = apiKeys.concat($('apiKey', data).map((i, v) => $(v).text()).toArray());
                    total = parseInt($('body count', data).text());
                },
                complete: () => callback()
            }), () => total === apiKeys.length, () => {
                loaderAjax.complete();
                controller.call('admin::message::submit', filter, apiKeys);
            });
        });

        controller.registerCall('admin::getApiKeys', filter => {
            let apiKeys = [];
            let total = 0;

            const loaderAjax = controller.call('loader::ajax', {});

            loaderAjax.beforeSend();
            doUntil(callback => controller.serverCommunication.call('SELECT FROM \'BIPBOPCOMPANYS\'.\'LIST\'', {
                data: Object.assign({
                    limit: 500,
                    skip: apiKeys.length
                }, filter),
                success: data => {
                    apiKeys = apiKeys.concat($('apiKey', data).map((i, v) => $(v).text()).toArray());
                    total = parseInt($('body count', data).text());
                },
                complete: () => callback()
            }), () => total === apiKeys.length, () => {
                loaderAjax.complete();
                controller.call('admin::message', apiKeys);
            });
        });

        controller.registerCall('admin::index', () => {
            const report = controller.call('report', 'Administrador da Conta', 'Administre os usuários cadastrados no sistema.',
                'Altere dados cadastrais como CPF, CNPJ, telefones, emails e endereço, bloqueie, desbloqueie, crie ' +
                ' novos usuários, verifique o consumo de seus clientes e quantos créditos eles possuem em suas contas.');

            report.button('Disparar E-mail', () => controller.call('form', filter => controller.call('admin::getApiKeys', filter)).configure({
                title: 'Filtrar E-mail de Clientes',
                subtitle: 'Preencha os campos abaixo para filtrar os destinatários do e-mail.',
                paragraph: 'Você enviará um e-mail para toda sua base de clientes que satisfazerem a condição abaixo, deixe em branco para enviar a todos.',
                gamification: 'checkPoint',
                magicLabel: true,
                screens: [{
                    nextButton: 'Filtrar',
                    fields: [{
                        name: 'commercialReference',
                        optional: true,
                        type: 'text',
                        placeholder: 'Referência Comercial'
                    }, {
                        name: 'tag',
                        optional: true,
                        type: 'text',
                        placeholder: 'Marcador (tag)'
                    }]
                }]
            })).addClass('gray-button');

            report.button('Criar Conta', () => {
                controller.call('admin::createCompany');
            });

            report.button('Abrir Contas', () => {
                controller.call('admin::openCompanys', report);
            });

            report.gamification('accuracy');
            $('.app-content').append(report.element());
            controller.call('admin::report', graph => {
                graph.gamification('levelUp');
            }, report.element());
        });

        controller.call('admin::index');
        controller.call('admin::commercialReference');
        controller.call('admin::tagsViewer');
        controller.trigger('admin');
    });
};
