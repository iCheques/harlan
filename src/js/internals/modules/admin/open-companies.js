const MAX_RESULTS = 10;
import _ from 'underscore';

module.exports = controller => {
    controller.registerCall('admin::open::companys', (report, data = {}) => {
        let skip = 0;
        const results = controller.call('more::results', MAX_RESULTS).callback(callback => {
            controller.serverCommunication.call('SELECT FROM \'BIPBOPCOMPANYS\'.\'LIST\'',
                controller.call('loader::ajax', controller.call('error::ajax', {
                    data: Object.assign({
                        limit: MAX_RESULTS,
                        skip
                    }, data),
                    success: response => {
                        callback(_.map($('BPQL > body > company', response), company => controller.call('admin::view::company', company, false, null, true)));
                    }
                })));
            skip += MAX_RESULTS;
        }).appendTo(report.element()).show((i, items) => {
            if (!i)
                controller.call('alert', {
                    title: 'Infelizmente não há nenhuma empresa para exibir. ;(',
                    subtitle: 'Experimente adicionar alguma empresa pois não há nenhuma cadastrada para exibição.',
                    paragraph: 'Você precisa cadastrar uma empresa para utilizar este recurso, verifique na sua página de usuário,' +
                        ' pelo botão de <a href="javascript:harlan.call(\'admin::create::company\');\'>Criar Conta</strong>'
                });
        });
    });
};
