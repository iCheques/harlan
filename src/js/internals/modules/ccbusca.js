/* eslint-disable no-undef */
import {
    CPF
} from 'cpf_cnpj';
import {
    CNPJ
} from 'cpf_cnpj';
import async from 'async';

module.exports = controller => {

    controller.registerCall('ccbusca::enable', () => {
        controller.registerTrigger('mainSearch::submit', 'ccbusca', (val, cb) => {
            cb();
            if (!CNPJ.isValid(val) && !CPF.isValid(val)) {
                return;
            }
            controller.call('credits::has', 1500, () => {
                controller.call('ccbusca', val);
            });
        });
    });

    controller.registerCall('ccbusca', (val, callback, ...args) => {
        if (!$('.consulta-temporaria').length) $('body').append($('<div>').attr('id', 'consulta-temporaria').css('visibility', 'hidden'));

        let ccbuscaQuery = {
            documento: val,
            apiKey: controller.server.apiKey(),
            cache: 'DISABLED'
        };

        let ccbuscaQueryRFB = ccbuscaQuery;

        ccbuscaQueryRFB['q[0]'] = 'USING \'CCBUSCA\' SELECT FROM \'FINDER\'.\'BILLING\'';
        ccbuscaQueryRFB['q[1]'] = 'SELECT FROM \'RFB\'.\'CERTIDAO\' WHERE \'CACHE\' = \'+1 year\'';

        /*controller.serverCommunication.call('USING \'CCBUSCA\' SELECT FROM \'FINDER\'.\'BILLING\'',
            controller.call('error::ajax', controller.call('loader::ajax', {
                data: ccbuscaQuery,
                success(ret) {
                    controller.call('ccbusca::parse', ret, val, callback, ...args);
                }
            })));*/
        const getRandom = (max, min) => parseInt(Math.random() * (max - min) + min);
        controller.confs.loader = loader;
        let loader = controller.call('ccbusca::loader');
        let finderRFBParams = new URLSearchParams();
        Object.keys(ccbuscaQueryRFB).forEach(key => finderRFBParams.append(key, ccbuscaQueryRFB[key]));
        let ccfParams = new URLSearchParams();
        Object.keys(ccbuscaQuery).forEach(key => ccfParams.append(key, ccbuscaQuery[key]));

        loader.setActiveStatus('Consultando RFB');
        loader.progressBarChange(getRandom(5, 12));
        axios.get('https://irql.icheques.com.br', {
            params: finderRFBParams
        }).then(dataRFB => {
            loader.progressBarChange(getRandom(20, 33));
            loader.setStatusSuccess('Consulta RFB Concluída');
            $('#consulta-temporaria').append(dataRFB.data);
            let rfb = $('rfb', $('#consulta-temporaria'));
            let xml = $('xml', $('#consulta-temporaria'));
            $('bpql').append($('<body>').append(rfb).append(xml));
        }).then(() => {
            loader.setActiveStatus('Consultando CCF');
            ccfParams.append('q', 'SELECT FROM \'SEEKLOC\'.\'CCF\'');
            axios.get('https://irql.icheques.com.br', {
                params: ccfParams
            }).then(dataCCF => {
                loader.progressBarChange(getRandom(65, 80));
                loader.setStatusSuccess('Consulta CCF Concluída');
                $('#consulta-temporaria body').append($('data', dataCCF.data));
            }).then(() => {
                loader.setActiveStatus('Consultando Protestos');
                ccfParams.set('q', 'SELECT FROM \'IEPTB\'.\'WS\'');
                axios.get('https://irql.icheques.com.br', {
                    params: ccfParams
                }).then(dataProtestos => {
                    loader.progressBarChange(100);
                    loader.setStatusSuccess('Consulta Protestos Concluída');
                    $('#consulta-temporaria body').append($('consulta', dataProtestos.data));
                    controller.call('ccbusca::parse', $('#consulta-temporaria'), val, callback, ...args);
                    loader.searchCompleted();
                    $('#consulta-temporaria').remove();
                }).catch(() => {
                    loader.progressBarChange(100);
                    loader.setStatusFailed('Consulta Protestos Falhou');
                    $('#consulta-temporaria body').append($('<ieptb-failed>'));
                    controller.call('ccbusca::parse', $('#consulta-temporaria')[0], val, callback, ...args);
                    loader.searchCompleted();
                    $('#consulta-temporaria').remove();
                });
            });
        });
    });

    controller.registerCall('ccbusca::parse', (ret, val, callback, ...args) => {
        const sectionDocumentGroup = controller.call('section', 'Busca Consolidada',
            'Informações agregadas do CPF ou CNPJ',
            'Registro encontrado', ...args);

        let subtitle = $('.results-display', sectionDocumentGroup[0]);
        let messages = [subtitle.text()];
        let appendMessage = message => {
            messages.push(message);
            subtitle.text(messages.join(', '));
        };

        if (!callback) {
            $('.app-content').prepend(sectionDocumentGroup[0]);
        } else {
            callback(sectionDocumentGroup[0]);
        }

        controller.call('tooltip', sectionDocumentGroup[2], 'Download PDF').append($('<i />').addClass('fa fa-download')).click(e => {
            e.preventDefault();
            const html = sectionDocumentGroup[0].html();
            harlan.call('relatorioAnalitico::print', html, true);
        });

        controller.call('tooltip', sectionDocumentGroup[2], 'Imprimir').append($('<i />').addClass('fa fa-print')).click(e => {
            e.preventDefault();
            const html = sectionDocumentGroup[0].html();
            /*
            const printWindow = window.open('about:blank', '', '_blank');
            if (!printWindow) return;
            printWindow.document.write($('<html />')
                .append($('<head />'))
                .append($('<body />').html(html)).html());
            printWindow.focus();
            printWindow.print();*/
            harlan.call('relatorioAnalitico::print', html);
        });

        const juntaEmpresaHTML = controller.call('xmlDocument', ret, 'CCBUSCA', 'DOCUMENT');
        juntaEmpresaHTML.find('.container').first().addClass('xml2html')
            .data('document', $(ret))
            .data('form', [{
                name: 'documento',
                value: val
            }]);
        sectionDocumentGroup[1].append(juntaEmpresaHTML);

        ((() => {
            if ($('ccf-failed', ret).length) {
                appendMessage('consulta de cheque sem fundo falhou');
                return;
            }

            let totalRegistro = parseInt($(ret).find('BPQL > body > data > resposta > totalRegistro').text());
            if (!totalRegistro) {
                appendMessage('sem cheques devolvidos');
                return;
            }
            let qteOcorrencias = $(ret).find('BPQL > body > data > sumQteOcorrencias').text();
            let v1 = moment($('dataUltOcorrencia', ret).text(), 'DD/MM/YYYY');
            let v2 = moment($('ultimo', ret).text(), 'DD/MM/YYYY');
            appendMessage(`total de registros CCF: ${qteOcorrencias} com data da última ocorrência: ${(v1.isAfter(v2) ? v1 : v2).format('DD/MM/YYYY')}`);
            sectionDocumentGroup[1].append(controller.call('xmlDocument', ret, 'SEEKLOC', 'CCF'));
        }))();

        ((() => {
            if ($('ieptb-failed', ret).length) {
                appendMessage('consulta de protesto falhou');
                return;
            }
            if ($(ret).find('BPQL > body > consulta > situacao').text() != 'CONSTA') {
                appendMessage('sem protestos');
                return;
            }
            let totalProtestos = $('protestos', ret)
                .get()
                .map(p => parseInt($(p).text()))
                .reduce((a, b) => a + b, 0);
            appendMessage(`total de protestos: ${totalProtestos}`);
            sectionDocumentGroup[1].append(controller.call('xmlDocument', ret, 'IEPTB', 'WS'));
        }))();
    });

    controller.registerCall('ccbusca::card-right', () => {
        const $card = $('<div>').addClass('mdl-card mdl-shadow--2dp').css('border-radius', '15px 15px 0px 0px');
        const $title = $('<div>').addClass('mdl-card__title').append($('<h2>').addClass('mdl-card__title-text').append($('<span>').addClass('status')));
        const $subtitle = $('<div>').addClass('mdl-card__supporting-text');
        const $cardProgress = $('<div>').addClass('card-progress').css({
            padding: '16px 16px 20px 16px',
            margin: 'auto'
        });
        $card.append([$title, $subtitle, $cardProgress]);
        const $cardContainer = $('<div>').css({
            position: 'fixed',
            right: 0,
            bottom: 0,
            zIndex: 1030
        });

        $cardContainer.append($card);

        return $cardContainer;
    });

    controller.registerCall('ccbusca::loader', () => {
        class Loader {
            constructor(controllerReference) {
                this.controller = controllerReference;
                this.progress;
                this.card();
                this.progressBar();
            }

            /**
             * Monta o card do loader.
             */
            card = () => {
                const cardContainer = this.controller.call('ccbusca::card-right');
                let loadDot = '<span class="saving"><span> .</span><span>.</span><span>.</span></span>';
                $('.app-content').append(cardContainer).show('slow');
                $('.mdl-card__title-text').css('margin', 'auto').html($('<span>').addClass('card-title').text('Consulta CPF/CNPJ'));
                $('.mdl-card__supporting-text').html('Status: <span class=\'status\'></span>' + loadDot + '<br>');
            }

            /**
             * Adiciona a barra de progresso.
             */
            progressBar = () => {
                const bar = this.controller.interface.widgets.radialProject($('.card-progress'), 0);

                this.progress = bar.change;
            }

            /**
             * Executa uma ação após determinado número de tempo em 'ms'.
             *
             * @param {jQuery} time A promisse será executada após esse 'time' em ms.
             * @param {sleepCallback} resolve - Função de callback a ser executada.
             */
            sleep = time => new Promise(resolve => setTimeout(resolve, time))

            /**
             * Altera a porcentagem da barra de progresso
             *
             * @param {int} progress - Porcentagem a ser definida.
             */
            progressBarChange = (progress) => this.progress(progress);

            /**
             * Altera o texto de um determinado elemento.
             */
            setText = (seletor, text, append = '') => $(seletor).text(text).append(append);

            /**
             * Define o titulo do loader.
             */
            setTitle = (title) => this.setText('.mdl-card__title-text .card-title', title);

            /**
             * Define o status atual da pesquisa.
             */
            setActiveStatus = (status) => this.setText('.mdl-card__supporting-text .status', status);

            /**
             * Define o status de uma consulta bem sucedida.
             */
            setStatusSuccess = (status) => $('.mdl-card__supporting-text').append('<br>').append($('<span>').text(status).css('color', '#009903'));

            /**
             * Define o status de uma consulta mal sucedida.
             */
            setStatusFailed = (status) => $('.mdl-card__supporting-text').append('<br>').append($('<span>').text(status).css('color', '#ff4500'));

            /**
             * Define o status atual da pesquisa como concluído e remove o Loader.
             */
            searchCompleted = () => {
                $('.saving').remove();
                this.setActiveStatus('Consulta concluída!');
                this.sleep(3000).then(() => $('.mdl-card').parent().fadeOut(3000, function () {
                    $('.mdl-card').parent().remove();
                }));
            };
        }

        return new Loader(controller);
    });
};
