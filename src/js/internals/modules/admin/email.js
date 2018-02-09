module.exports = controller => {
    controller.registerCall('admin::email', (username, section) => {
        const modal = controller.call('modal');
        modal.title('Adicionar E-mail');
        modal.subtitle('Adicione um e-mail para esta conta.');
        modal.paragraph('Os e-mails são utilizados apenas para correspondência, não sendo utilizados para autenticação.');

        const form = modal.createForm();
        const email = form.addInput('email', 'email', 'Endereço de E-mail');
        const emailType = form.addSelect('emailType', 'Tipo do Email', controller.call('admin::contact::types'));

        form.element().submit(e => {
            e.preventDefault();
            controller.serverCommunication.call('INSERT INTO \'BIPBOPCOMPANYS\'.\'EMAIL\'',
                controller.call('error::ajax', controller.call('loader::ajax', {
                    data: {
                        username,
                        email: email.val(),
                        type: emailType.val()
                    },
                    success: response => {
                        controller.call('admin::view::company', $(response).find('BPQL > body > company'), section, 'replaceWith');
                        modal.close();
                    }
                })));
        });
        form.addSubmit('add', 'Adicionar');
        modal.createActions().cancel();
    });
};
