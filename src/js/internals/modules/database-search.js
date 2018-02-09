module.exports = controller => {

    controller.registerCall('database::search::submit', args => {
        const form = args[0];
        const tableJNode = args[1];
        const databaseJNode = args[2];
        const section = args[3];

        const database = databaseJNode.attr('name');
        const table = tableJNode.attr('name');

        return e => {
            const loader = section.find('.display-loader');
            e.preventDefault();
            const formdata = form.serialize();
            controller.serverCommunication.call(`SELECT FROM '${database}'.'${table}'`, {
                data: formdata,
                success(doc) {
                    const args = [].concat(doc, database, table, databaseJNode, tableJNode, section, form);
                    controller.trigger('database::success', args);
                    controller.trigger(`database::success::${database}`, args);
                    controller.trigger(`database::success::${database}::${table}`, args);
                },
                error(x, h, r) {
                    const args = [].concat(x, h, r, database, table, databaseJNode, tableJNode, section, form);
                    controller.trigger('database::error', args);
                    controller.trigger(`database::error::${database}`, args);
                    controller.trigger(`database::error::${database}::${table}`, args);
                },
                beforeSend() {
                    loader.css('display', 'inline-block');
                },
                complete() {
                    loader.css('display', 'none');
                }
            });
        };
    });

    controller.registerTrigger('database::success', 'databaseSearch::success', (args, callback) => {
        callback();

        const doc = args[0];
        const database = args[1];
        const table = args[2];
        const databaseJNode = args[3];
        const tableJNode = args[4];
        const section = args[5];
        const form = args[6];

        const results = section.find('.results');
        const htmlNode = controller.call('xml::document', doc);
        htmlNode.find('.xml2html').data('form', form.serializeArray());

        results.empty().append(htmlNode);
        $('html, body').scrollTop(results.offset().top);
    });

};
