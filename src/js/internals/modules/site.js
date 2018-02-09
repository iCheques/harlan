module.exports = controller => {

    controller.registerBootstrap('site::buttons', callback => {
        callback();
        controller.call('site::buttons');
    });

    controller.registerCall('site::buttons', callback => {
        const window = window => e => {
            e.preventDefault();
            controller.interface.helpers.activeWindow(window);
        };

        const newWindow = href => e => {
            e.preventDefault();
            document.location.href = href;
        };

        $('.action-home').click(e => {
            e.preventDefault();
            controller.call('default::page');
        });
        $('body > .site .action-login').click(window($('.login')));
        $('body > .site .action-sales').click(newWindow('http://www.bipbop.com.br/#contato'));
        $('body > .site .action-buy').click(() => {
            controller.call('bipbop::create::account');
        });

        $('body > .site .action-evaluate').click(e => {
            e.preventDefault();
            controller.call('authentication::force', BIPBOP_FREE);
        });
    });

    controller.registerBootstrap('site::carrousel', callback => {
        callback();

        for (let i = 0; i <= 5; i++) {
            $('body > .site .carrousel').append($('<img />')
                .attr('src', `/images/site/screenshoots/${i.toString()}.png`));
        }

        controller.call('site::carrousel');
    });

    controller.registerCall('site::carrousel', () => {
        const carrousel = $('body > .site .carrousel');
        const list = carrousel.find('ul');
        const images = carrousel.find('img');

        let first = true;
        images.each((idx, image) => {
            const jimage = $(image);
            const item = $('<li />');
            if (first) {
                first = false;
                item.addClass('selected');
            }
            item.click(e => {
                e.preventDefault();
                list.find('li').removeClass('selected');
                item.addClass('selected');
                jimage.insertAfter(list);
            });
            list.append(item);
        });
    });
};
