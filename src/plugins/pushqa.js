import _ from 'underscore';
import ChartJS from 'chart.js';
import harmony from 'color-harmony';
import Color from 'color';
import queue from 'async/queue';
import qs from 'qs';

const MAX_RESULTS = 5;

harlan.addPlugin(controller => {
    let harmonizer = new harmony.Harmonizer(),
        colorMix = 'neutral',
        colors = {
            error: harmonizer.harmonize('#ff1a53', colorMix),
            warning: harmonizer.harmonize('#ffe500', colorMix),
            success: harmonizer.harmonize('#00ff6b', colorMix)
        };

    /**
     * Agrupa resultados com menos de 5% evitando problemas no gráfico
     * @param {array} data
     * @returns {array}
     */
    var reduceDataset = (dataArgument) => {
        let data = Object.assign( {}, dataArgument);
        var sum = _.reduce(data, (a, b) => ({
            value: a.value + b.value
        }));

        sum = sum && sum.value ? sum.value : 0;

        var idx = 1;

        return _.map(_.values(_.groupBy(data, item => {
            if (item.value < sum * 0.05) {
                return 0;
            }
            return idx++;
        })), value => _.reduce(value, (a, b) => {
            a.value += b.value;
            a.color = '#93A7D8';
            a.highlight = new Color('#93A7D8').lighten(0.1).hsl().string();
            a.label = 'Outros';
            return a;
        }));

    };

    controller.serverCommunication.call('SELECT FROM \'PUSH\'.\'QA\'', {
        dataType: 'json',
        success: data => {
            var filter = (hasSuccessMemory) => _.filter(data, element => element._id.hasSuccessMemory === hasSuccessMemory);

            generateReport(filter(true), 'Relatório de Push', 'Consultas Realizadas com Sucesso',
                'O relatório de Push fornece uma estatística de qualidade e detalhada para que as ' +
                'manutenções possam ser orientadas com maior precisão em relação aos problemas. Para ' +
                'obter maiores informações clique sobre a etiqueta logo abaixo do gráfico.');

            generateReport(filter(false), 'Relatório de Push', 'Consultas Relizadas sem Sucesso',
                'O relatório de Push fornece uma estatística de qualidade e detalhada para que as ' +
                'manutenções possam ser orientadas com maior precisão em relação aos problemas. Para ' +
                'obter maiores informações clique sobre a etiqueta logo abaixo do gráfico.');
        }
    });

    let generateDatabaseReport = (data, title, subtitle, paragraph) => {
        let report = controller.call('report', title, subtitle, paragraph);

        report.button('Abrir Consultas', () => {
            let ids = _.reduceRight(_.pluck(_.pluck(data, 'value'), 'ids'), (a, b) => a.concat(b)),
                moreResults = controller.call('more::results', MAX_RESULTS),
                skip = 0;
            moreResults.callback(cb => {
                let items = [],
                    currentIds = ids.slice(skip, skip + MAX_RESULTS);

                if (!currentIds.length) {
                    cb([]);
                    return;
                }

                let q = queue(function(task, callback) {
                    controller.server.call('SELECT FROM \'PUSH\'.\'REPORT\'', {
                        data: {
                            id: task
                        },
                        success: job => {
                            let result = controller.call('result'),
                                push = $(job).find('body push');
                            result.addItem('Identificador', task);
                            result.addItem('Rótulo', push.attr('label'));
                            result.addItem('Consulta', push.find('data').text() || push.find('pushquery').text());
                            result.addItem('API', '').find('.value').append($('<a />').attr({
                                target: '_blank',
                                href: `https://irql.bipbop.com.br/?${qs.stringify({
                                    apiKey: push.find('apikey').text() || controller.serverCommunication.apiKey(),
                                    q: 'SELECT FROM \'PUSH\'.\'JOB\'',
                                    id: task,
                                })}`
                            }).text('Visualização API'));
                            result.addItem('API', '').find('.value').append($('<a />').attr({
                                target: '_blank',
                                href: `https://irql.bipbop.com.br/?${qs.stringify({
                                    apiKey: push.find('apikey').text() || controller.serverCommunication.apiKey(),
                                    q: 'SELECT FROM \'PUSH\'.\'DOCUMENT\'',
                                    id: task,
                                })}`
                            }).text('Documento'));
                            items.push(result.element());
                        },
                        complete: () => callback()
                    });
                }, 5);

                q.drain = () => {
                    cb(items);
                };

                q.push(currentIds);
                skip += MAX_RESULTS;
            });
            moreResults.appendTo(report.results());
            moreResults.show();
        });

        let dataQuerys = _.groupBy(data, a => a._id.query),
            colors = harmonizer.harmonize('#cdfd9f', [...Array(_.keys(dataQuerys).length).keys()].map(i => i * 10)),
            iterator = 0;
        let dataset = _.sortBy(_.map(dataQuerys, (element, query) => {
            let color = new Color(colors[iterator++]),
                counter = _.reduce(_.pluck(_.pluck(element, 'value'), 'count'), (a, b) => a + b),
                label = query;

            return {
                value: counter,
                color: color.hsl().string(),
                label: label,
                highlight: color.lighten(0.1).hsl().string(),
                colorInstance: color
            };
        }), 'value');

        let canvas = report.canvas(250, 250);
        new ChartJS(canvas.getContext('2d')).Doughnut(reduceDataset(dataset));

        for (let item of dataset) {
            report.label(`${item.label}: ${item.value}`).css({
                'background-color': item.color,
                color: item.colorInstance.light() ? '#000' : '#fff',
            });
        }

        $('.app-content').append(report.element());
        $('html, body').animate({
            scrollTop: report.element().offset().top
        }, 2000);
    };

    let generateReport = (data, title, subtitle, paragraph, filter = null) => {

        if (filter) {
            data = _.filter(data, item => item._id.query == filter);
        }

        let ids = _.pluck(data, '_id'),
            queryNames = _.pluck(ids, 'query'),
            querys = _.uniq(queryNames),
            report = controller.call('report', title, subtitle, paragraph);

        report.button('Filtrar por Consulta', () => {
            let modal = controller.call('modal');
            modal.title('Filtro de Relatório Push');
            modal.subtitle('Filtre os resultados para obter detalhes mais precisos.');
            modal.paragraph('Você é capaz de filtrar as consultas pela expressão Juristek ou BIPBOP.');

            let queryList = _.object(querys, querys);
            let form = modal.createForm(),
                inputQueryType = form.addSelect('field', 'Consulta a ser realizada', queryList);

            form.element().submit(e => {
                e.preventDefault();
                generateReport(data, title, subtitle, paragraph, inputQueryType.val());
                modal.close();
            });

            form.addSubmit('send', 'Filtrar');
            modal.createActions().cancel();
        });

        report.newContent();

        let dataTrys = _.groupBy(data, a => a._id.trys);
        let dataset = _.sortBy(_.map(dataTrys, (element, trys) => {
            let color = new Color(trys < 3 ? colors.success[trys] :
                    (trys < 6 ? colors.warning[trys - 3] : colors.error[trys - 6])),
                label = `${trys} ${trys == 1 ? 'tentativa' : 'tentativas'}`;

            return {
                value: _.reduce(_.pluck(_.pluck(element, 'value'), 'count'), (a, b) => a + b),
                color: color.hsl().string(),
                trys: trys,
                label: label,
                highlight: color.lighten(0.1).hsl().string(),
                colorInstance: color,
                element: element
            };
        }), 'trys');

        let canvas = report.canvas(250, 250);
        new ChartJS(canvas.getContext('2d')).Doughnut(dataset);

        for (let item of dataset) {
            report.label(`${item.label}: ${item.value}`).css({
                'background-color': item.color,
                cursor: 'pointer',
                color: item.colorInstance.light() ? '#000' : '#fff',
            }).click(e => {
                e.preventDefault();
                generateDatabaseReport(item.element, title, subtitle, paragraph);
            });
        }

        $('.app-content').append(report.element());
        if (filter) {
            $('html, body').animate({
                scrollTop: report.element().offset().top
            }, 2000);
        }
    };

});
