let clickLocation = null;
const closeAction = null;

module.exports = controller => {
    const headerNode = $('.iframe header');
    const iframeNode = $('.iframe iframe');
    const inputNode = $('.iframe input');
    const closeButtonNode = $('.iframe #action-close-iframe');
    const gotoButtonNode = $('.iframe .icon.url');
    const iframeLoaderNode = $('.iframe .q');

    /*
     * Quando o módulo é colocado
     * embedded a caixa de consulta deve desaparecer
     */
    controller.registerCall('iframe::embed', () => {
        if (window !== window.top) {
            return true;
        }
        return false;
    });

    /**
     * Abre um iFrame
     */
    controller.registerCall('iframe::embed::open', args => {
        const location = args[0];
        let title = args[1];

        title = title || location;

        controller.interface.helpers.activeWindow('.iframe');

        iframeLoaderNode.addClass('loading');
        clickLocation = location;
        iframeNode.attr('src', location);
        inputNode.val(title);
        onResize();
    });

    /**
     * Quando o projeto se torna whitelabel
     */
    controller.registerBootstrap('iframe::embed::whitelabel', callback => {
        callback();
        if (!controller.call('iframe::embed') && controller.query.whitelabel) {
            $('#scroll-down').hide();
        }
    });

    /**
     * Quando é redimensionada a tela
     * @returns {undefined}
     */
    var onResize = () => {
        iframeNode.css('height', $(window).height() - headerNode.outerHeight());
    };

    /**
     * Abre um iFrame
     * @param {callback} callback Callback fnc
     */
    controller.registerBootstrap('iframe::embed::open', callback => {
        callback();

        $(window).resize(onResize);

        closeButtonNode.click(e => {
            e.preventDefault();
            if (!closeAction) {
                controller.interface.helpers.activeWindow('.app');
            }
        });

        gotoButtonNode.click(e => {
            e.preventDefault();
            if (clickLocation) {
                window.open(clickLocation, '_blank');
            }
        });

        iframeNode.on('load', () => {
            iframeLoaderNode.removeClass('loading');
        });
    });
};
