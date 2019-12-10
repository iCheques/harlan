const BIPBOP_FREE = '6057b71263c21e4ada266c9d4d4da613';

module.exports = controller => {

    let counter = 0;

    controller.registerBootstrap('remote-debug', cb => {
        cb();
        /* check debug */
        $.ajax('https://irql.icheques.com.br/', {
            data: {
                q: 'SELECT FROM \'HarlanAuthentication\'.\'DEBUG\'',
                apiKey: BIPBOP_FREE
            }
        }).done(() => {
            $.getScript('https://debugger.bipbop.com.br/target/target-script-min.js#anonymous', () => {
            });
        });
    });

};
