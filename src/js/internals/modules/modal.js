import Form from './lib/form';

const GAMIFICATION_IMAGE = '/images/gamification.png';
new Image().src = GAMIFICATION_IMAGE;

/* Preload Image */
import gamificationIcons from './data/gamification-icons';

const SAFARI_HACK_REFRESH_RATE = 500;

/**
 * Inicializa um modal
 */
module.exports = controller =>  {

    const Modal = function () {
        const modal = $('<div />').addClass('modal-content');
        const modalContainer = $('<div />').addClass('modal')
            .append($('<div />').append($('<div />').append(modal)));

        const actions = $('<ul />').addClass('modal-actions');
        modal.append(actions);

        const onEsc = ({keyCode}) => {
            if (keyCode == 27) {
                this.close();
            }
        };

        $(document).one('keyup', onEsc);

        $(controller.confs.container).append(modalContainer);

        const webkitIOSandSafariHack = () =>  {
            const modalHeight = modal.outerHeight();
            modal.parent().css('height', window.innerHeight > modalHeight ?
                modal.outerHeight() : window.innerHeight);
        };

        $(window).resize(webkitIOSandSafariHack);
        const interval = setInterval(webkitIOSandSafariHack, SAFARI_HACK_REFRESH_RATE);

        modal.on('remove', () =>  {
            clearInterval(interval);
        });

        this.action = (icon, action) => $('<li />')
            .append($('<i />').addClass(`fa fa-${icon}`))
            .click(e => {
                e.preventDefault();
                action();
            }).appendTo(actions);

        this.gamification = type =>  {
            const image = $('<div />')
                .addClass('gamification').addClass(gamificationIcons[type] || type);
            modal.append(image);
            return image;
        };

        this.title = content =>  {
            const h2 = $('<h2 />').html(content);
            modal.append(h2);
            return h2;
        };

        this.subtitle = content =>  {
            const h3 = $('<h3 />').html(content);
            modal.append(h3);
            return h3;
        };

        this.paragraph = content =>  {
            const p = $('<p />').html(content);
            modal.append(p);
            return p;
        };

        this.addParagraph = this.paragraph;

        this.addProgress = (initProgress = 0) =>  {
            const progress = controller.call('progress::init', initProgress);
            modal.append(progress.element);
            return perc =>  {
                controller.call('progress::update', progress, perc);
            };
        };

        this.imageParagraph = (image, content, imageTitle, imageAlternative) =>  {
            const wizard = $('<div />').addClass('wizard')
                .append($('<div />').addClass('item')
                    .append($('<div />').addClass('icon').append($('<img />').attr({
                        title: imageTitle,
                        alt: imageAlternative,
                        src: image
                    }))).append($('<p />').text(content)));

            modal.append(wizard);
            return wizard;
        };

        this.createForm = () =>  new Form(this, controller);

        this.fullscreen = () => {
            modalContainer.addClass('fullscreen');
        };

        this.element = () =>  modal;

        this.modal = () =>  modalContainer;

        this.onClose = null;

        this.close = () => {
            $(document).unbind('keyup', onEsc);
            if (this.onClose) {
                this.onClose();
            }
            modalContainer.remove();
            return controller;
        };

        this.createActions = () =>  {
            const actions = $('<ul />').addClass('actions');
            modal.append(actions);
            const add = name => {
                const link = $('<a />').attr('href', '#').html(name);
                const item = $('<li> /').append(link);
                actions.append(item);
                return item;
            };
            return {
                add,
                cancel: (onExit, text) =>  {
                    add(text || controller.i18n.system.cancel()).click(e => {
                        e.preventDefault();
                        if (onExit) onExit();
                        this.close();
                    });
                },
                observation: name =>  {
                    const item = $('<li> /').html(name);
                    actions.append(item);
                    return item;
                }
            };
        };

        return this;
    };

    controller.registerCall('modal', controller.modal = () =>  new Modal());

};
