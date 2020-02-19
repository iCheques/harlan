module.exports = controller => {
    controller.registerBootstrap('mainSearch', callback => {
        callback();

        $('.main-search .icon').on('click', () => {
            controller.trigger('mainSearch::submit', $('.main-search').find('.input-q').val());
        });

        $('.main-search').each((i, v) => {
            $(v).submit(function (e) {
                e.preventDefault();
                controller.trigger('mainSearch::submit', $(this).find('.input-q').val());
            });
        });
    });
};
