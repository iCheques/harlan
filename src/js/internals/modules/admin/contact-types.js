module.exports = controller => {
    controller.registerCall('admin::contact::types', () => ({
        financeiro: 'Financeiro',
        comercial: 'Comercial',
        tecnico: 'Técnico'
    }));
};
