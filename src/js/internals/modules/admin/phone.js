module.exports = controller => {
    controller.registerCall('admin::phone', (username, section) => {
        const modal = controller.call('modal');
        modal.title('Adicionar Telefone');
        modal.subtitle('Adicione um telefone para esta conta.');
        modal.paragraph('Os telefones são utilizados apenas para contato urgente ou tratativas comerciais.');

        const form = modal.createForm();
        const phone = form.addInput('phone', 'text', 'Telefone').mask('(00) 0000-00009');
        const pabx = form.addInput('ramal', 'text', 'Ramal').mask('0#');
        const contact = form.addInput('contato', 'text', 'Nome Contato');
        const phoneType = form.addSelect('phoneType', 'Tipo do phone', controller.call('admin::contact::types'));

        form.element().submit(e => {
            e.preventDefault();

            let match;
            if ((match =/\((\d{2})\)\s*(\d{4}\-\d{4,5})/.exec(phone.val())) === null) {
                phone.addClass('error');
                return;
            }

            controller.serverCommunication.call('INSERT INTO \'BIPBOPCOMPANYS\'.\'PHONE\'',
                controller.call('error::ajax', controller.call('loader::ajax', {
                    data: {
                        username,
                        ddd: match[1],
                        phone: match[2],
                        pabx: pabx.val(),
                        contact: contact.val(),
                        type: phoneType.val()
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
