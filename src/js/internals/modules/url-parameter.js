module.exports = controller => {

    const hasUrlParameter = false;

    controller.registerBootstrap('urlParameter', callback => {
        callback();

        if (typeof controller.query.q === 'undefined') {
            return;
        }

        return;

        //$('.app .input-q').val(controller.query.q.replace(/\/$/, ''));
        //$('.app .main-search').submit();
    });

};
