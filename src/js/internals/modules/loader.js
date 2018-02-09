const animationEvent = 'animationend animationend webkitAnimationEnd oanimationend MSAnimationEnd';

/**
 * Comentário para a posteridade
 * Criei essa caralha quando não havia ECMAScript 6!
 */

module.exports = controller => {

    let counter = 0;
    let animationElement = null;

    controller.confs.loader = {
        animations: ['animated rotateIn', 'animated rotateOut']
    };

    controller.registerCall('loader::catch::element', () => $('.logo:visible span'));

    const afterExecution = () => {
        animationElement.removeClass(controller.confs.loader.animations[counter++ % controller.confs.loader.animations.length]);
        animationElement.addClass(controller.confs.loader.animations[counter % controller.confs.loader.animations.length]);
    };

    let loaderRegister = 0;

    controller.registerCall('loader::register', () => {
        if (!loaderRegister) {
            animationElement = controller.call('loader::catch::element');
            if (!animationElement.length) {
                $('.q').addClass('loading');
                return;
            }
            animationElement.bind(animationEvent, afterExecution);
            animationElement.addClass(controller.confs.loader.animations[counter % controller.confs.loader.animations.length]);
        }
        loaderRegister++;
    });

    controller.registerCall('loader::unregister', () => {
        if (--loaderRegister > 0) {
            return;
        }

        loaderRegister = 0;
        if (!animationElement.length) {
            $('.q').removeClass('loading');
            return;
        }
        animationElement.removeClass(controller.confs.loader.animations[counter % controller.confs.loader.animations.length]);
        if (animationElement && animationEvent) {
            animationElement.unbind(animationEvent);
        }
    });

    controller.registerCall('loader::ajax', (dict, bipbop = false) => {
        const beforeSend = dict.beforeSend;
        const complete = dict.complete;
        let bipbopRegister = null;
        dict.beforeSend = (...ag) => {
            if (bipbop) {
                bipbopRegister = $.bipbopLoader.register();
            } else {
                controller.call('loader::register');
            }

            if (beforeSend)
                beforeSend(...ag);
        };

        dict.complete = (jqXHR, textStatus, ...ag) => {
            if (bipbopRegister) {
                bipbopRegister();
                bipbopRegister = null;
            } else {
                controller.call('loader::unregister');
            }
            if (complete)
                complete(jqXHR, textStatus, ...ag);
        };

        return dict;
    });
};
