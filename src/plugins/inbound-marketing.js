import _ from 'underscore';

harlan.addPlugin(controller => {

    const selectInbound = 'SELECT FROM \'TRIGGERS\'.\'INBOUND\'';
    const createInbound = 'INSERT INTO \'TRIGGERS\'.\'INBOUND\'';
    const deleteInbound = 'DELETE FROM \'TRIGGERS\'.\'INBOUND\'';
    const updateInbound = 'UPDATE \'TRIGGERS\'.\'INBOUND\'';

    let descriptionInbound = () => [
        [{
            name: 'name',
            optional: false,
            type: 'text',
            placeholder: 'Nome'
        }, {
            name: 'subject',
            optional: false,
            type: 'text',
            placeholder: 'Assunto'
        }],
        [{
            name: 'description',
            optional: false,
            type: 'text',
            placeholder: 'Descrição (para uso interno)'
        }, {
            name: 'trigger',
            optional: false,
            type: 'text',
            placeholder: 'Disparador'
        }], {
            name: 'filename',
            contentKey: 'content',
            optional: false,
            type: 'file',
            placeholder: 'Conteúdo'
        }
    ];

    controller.registerTrigger('find::database::instant::search', 'inbound::marketing', (args, callback) => {
        callback();
        let [argument, autocomplete] = args;
        if (!/inbound/i.test(argument)) return;
        autocomplete.item('Administrar E-mails Marketing',
            'Gestão de Mensagens de E-mail Marketing',
            'Adicionar, remover ou alterar e-mails marketing enviados a leads e clientes.')
            .addClass('admin-company admin-new-company')
            .click(controller.click('inbound::marketing'));
    });

    let appendList = (list, data) => {
        let item = list.add('fa-envelope-open-o', [data.trigger, data.name, data.description]);
        item.click(controller.click('inbound::marketing::open', list, data, item));
    };

    controller.registerCall('inbound::marketing::open', (list, data, item) => controller.call('form', data => {
        controller.server.call(updateInbound, controller.call('error::ajax', {
            data,
            success: data => appendList(list, data)
        }));
    }).configure({
        title: 'Atualização de Email Marketing',
        subtitle: 'Preencha as informações corretamente para atualizar seu inbound marketing.',
        paragraph: '',
        gamification: 'checkPoint',
        magicLabel: true,
        screens: [{
            fields: descriptionInbound(),
            actions: {
                delete: ['Remover', modal => {
                    modal.close();
                    controller.server.call(deleteInbound, {
                        dataType: 'json',
                        data,
                        success: () => item.remove()
                    });
                }]
            }
        }]
    }).setValues(data));

    controller.registerCall('inbound::marketing', () => {
        let modal = controller.call('modal');
        modal.gamification('checkPoint');
        modal.title('Administrador de Inbound Marketing');
        modal.subtitle('Crie o seu e-mail de inbound marketing.');
        modal.paragraph('A ferramenta de inbound marketing se associa as triggers do sistema BIPBOP para enviar e-mails altamente eficientes.');
        let list = modal.createForm().createList();
        controller.server.call(selectInbound, controller.call('error::ajax', {
            dataType: 'json',
            success: data => _.each(data, inbound => appendList(list, inbound))
        }));

        let actions = modal.createActions();
        actions.add('Criar e-mail').click(controller.click('inbound::marketing::create', list));
        actions.cancel();
    });

    controller.registerCall('inbound::marketing::create', list => controller.call('form', data => {
        controller.server.call(createInbound, controller.call('error::ajax', {
            dataType: 'json',
            data,
            success: data => appendList(list, data)
        }));
    }).configure({
        title: 'Criação de Email Marketing',
        subtitle: 'Preencha as informações corretamente para criar seu inbound marketing.',
        paragraph: '',
        gamification: 'checkPoint',
        magicLabel: true,
        screens: [{
            fields: descriptionInbound()
        }]
    }));

});
