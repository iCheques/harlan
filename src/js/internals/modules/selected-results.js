module.exports = controller => {
    controller.registerCall('selected::results', () => {
        
        const result = $('.result');
        if (result.length === 1) {
            return result;
        }
        
        const results = $('.result.selected');
        if (!results.length) {
            toastr.warning('Nenhum resultado selecionado.');
            return results;
        }
        return results;
    });
};