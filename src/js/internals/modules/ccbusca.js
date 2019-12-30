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
        let ccbuscaQuery = {
            documento: val,
            cache: 'DISABLED'
        };

        if (CNPJ.isValid(val)) {
            ccbuscaQuery['q[0]'] = 'USING \'CCBUSCA\' SELECT FROM \'FINDER\'.\'BILLING\'';
            ccbuscaQuery['q[1]'] = 'SELECT FROM \'RFB\'.\'CERTIDAO\' WHERE \'CACHE\' = \'+1 year\'';
        }

        /*controller.serverCommunication.call('USING \'CCBUSCA\' SELECT FROM \'FINDER\'.\'BILLING\'',
            controller.call('error::ajax', controller.call('loader::ajax', {
                data: ccbuscaQuery,
                success(ret) {
                    controller.call('ccbusca::parse', ret, val, callback, ...args);
                }
            })));*/
        controller.serverCommunication.call('USING \'CCBUSCA\' SELECT FROM \'FINDER\'.\'BILLING\'',
            controller.call('ccbusca::loader', {
                data: ccbuscaQuery,
                success(ret) {
                    controller.call('ccbusca::parse', ret, val, callback, ...args);
                }
            }));
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
                $('.perc').attr('style', 'width: 85%').next().text('85%');
                $('.modal-content').append('<strong><h3 style="color: #ff0000">Consulta CCF falhou<h3/></strong>');
                appendMessage('consulta de cheque sem fundo falhou');
                return;
            }

            let totalRegistro = parseInt($(ret).find('BPQL > body > data > resposta > totalRegistro').text());
            if (!totalRegistro) {
                $('.perc').attr('style', 'width: 85%').next().text('85%');
                $('.modal-content').append('<strong><h3 style="color: #169000">Consulta CCF concluída.<h3/></strong>');
                appendMessage('sem cheques devolvidos');
                return;
            }
            let qteOcorrencias = $(ret).find('BPQL > body > data > sumQteOcorrencias').text();
            let v1 = moment($('dataUltOcorrencia', ret).text(), 'DD/MM/YYYY');
            let v2 = moment($('ultimo', ret).text(), 'DD/MM/YYYY');
            $('.perc').attr('style', 'width: 85%').next().text('85%');
            $('.modal-content').append('<strong><h3 style="color: #169000">Consulta CCF concluída.<h3/></strong>');
            appendMessage(`total de registros CCF: ${qteOcorrencias} com data da última ocorrência: ${(v1.isAfter(v2) ? v1 : v2).format('DD/MM/YYYY')}`);
            sectionDocumentGroup[1].append(controller.call('xmlDocument', ret, 'SEEKLOC', 'CCF'));
        }))();

        ((() => {
            if ($('ieptb-failed', ret).length) {
                $('.perc').attr('style', 'width: 95%').next().text('95%');
                $('.modal-content').append('<strong><h3 style="color: #ff0000">Consulta de protesto falhou.<h3/></strong>');
                $('.perc').attr('style', 'width: 100%').next().text('100%');
                $('.modal-content h2').text('Informações carregadas!');
                appendMessage('consulta de protesto falhou');
                return;
            }
            if ($(ret).find('BPQL > body > consulta > situacao').text() != 'CONSTA') {
                $('.perc').attr('style', 'width: 95%').next().text('95%');
                $('.modal-content').append('<strong><h3 style="color: #169000">Consulta de protestos concluída.<h3/></strong>');
                $('.perc').attr('style', 'width: 100%').next().text('100%');
                $('.modal-content h2').text('Informações carregadas!');
                appendMessage('sem protestos');
                return;
            }
            let totalProtestos = $('protestos', ret)
                .get()
                .map(p => parseInt($(p).text()))
                .reduce((a, b) => a + b, 0);
            $('.perc').attr('style', 'width: 95%').next().text('95%');
            $('.modal-content').append('<strong><h3 style="color: #169000">Consulta de protestos concluída.<h3/></strong>');
            appendMessage(`total de protestos: ${totalProtestos}`);
            sectionDocumentGroup[1].append(controller.call('xmlDocument', ret, 'IEPTB', 'WS'));
            $('.perc').attr('style', 'width: 100%').next().text('100%');
            $('.modal-content h2').text('Informações carregadas!');
        }))();
    });

    controller.registerCall('ccbusca::card-right', () => {
        const CardRight = () => {
            const $card = $('<div>').addClass('mdl-card mdl-shadow--2dp');
            const $title = $('<div>').addClass('mdl-card__title').append($('<h2>').addClass('mdl-card__title-text'));
            const $subtitle = $('<div>').addClass('mdl-card__supporting-text');
            const $cardProgress = $('<div>').addClass('card-progress').css('padding', '16px 16px 20px 16px');
            $card.append([$title, $subtitle, $cardProgress]);
            const $cardContainer = $('<div>').css({
                position: 'fixed',
                right: 0,
                bottom: 0,
                zIndex: 1030
            });

            $cardContainer.append($card);

            return this;
        };
    });

    controller.registerCall('ccbusca::loader', (dict) => {
        const modal = controller.call('modal');
        modal.title();
        $('.modal-content h2').html('Carregando Informações <span class="saving"><span>.</span><span>.</span><span>.</span></span>');
        modal.addProgress(0);
        const bar = $('.perc');
        const sleep = time => new Promise(resolve => setTimeout(resolve, time));
        sleep(2000).then(() => bar.attr('style', 'width: 20%').next().text('20%'));
        sleep(3000).then(() => bar.attr('style', 'width: 50%').next().text('50%'));
        sleep(4000).then(() => bar.attr('style', 'width: 80%').next().text('80%'));
        modal.createActions().add('Fechar').click((e) => {
            e.preventDefault();
            modal.close();
        });

        return dict;
    });
};
