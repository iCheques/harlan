import sprintf from 'sprintf';

module.exports = controller => {

    controller.registerCall('admin::autocomplete::create::company', autocomplete => {
        autocomplete.item('Criar novo Usuário',
            'Criação Manual de Usuário',
            'Adicionar manualmente cliente da API/Harlan')
            .addClass('admin-company admin-new-company')
            .click(e => {
                e.preventDefault();
                controller.call('admin::create::company');
            });
    });

    controller.registerCall('admin::fill::companys::autocomplete', (document, autocomplete) => {
        $('BPQL > body > company', document).each((idx, company) => {
            controller.call('admin::fill::company::autocomplete', company, autocomplete);
        });
    });

    controller.registerCall('admin::fill::company::autocomplete', (companyNode, autocomplete) => {
        const company = $(companyNode);
        const document = company.children('cnpj').text() || company.children('cpf').text();

        autocomplete.item(company.children('nome').text(), document ?
            sprintf('%s - %s', document, company.children('username').text()) :
            company.children('username').text(), 'Visualizar e editar cliente da API/Harlan')
            .addClass('admin-company')
            .click(e => {
                e.preventDefault();
                autocomplete.empty();
                controller.call('admin::view::company', company);
            });
    });

};
