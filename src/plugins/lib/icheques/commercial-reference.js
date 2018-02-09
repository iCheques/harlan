module.exports = controller => {

    controller.registerTrigger('admin::commercial::reference', 'icheques', (report, callback) => {
        callback();
        report.newAction('fa-filter', () => {
            let form = controller.call('form', data => {
                controller.call('admin::commercial::reference', data);
                report.close();
            });
            form.configure({
                title: 'Filtrar Referências Comerciais',
                subtitle: 'Verifique quantos cheques foram trazidos para a plataforma em um intervalo de tempo.',
                paragraph: 'Defina nos campos abaixo o intervalo que pretende utilizar para verificar quantos cheques foram trazidos a plataforma.',
                gamification: 'star',
                magicLabel: true,
                screens: [{
                    fields: [
                        {
                            name: 'from',
                            type: 'text',
                            value: moment().subtract({months: 1}).format('DD/MM/YYYY'),
                            labelText: 'De',
                            pikaday: true
                        },
                        {
                            name: 'to',
                            type: 'text',
                            value: moment().format('DD/MM/YYYY'),
                            placeholder: 'Até',
                            labelText: 'Até',
                            pikaday: true
                        },
                    ]
                }]
            });
        });
    });

};
