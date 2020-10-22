/* eslint-disable no-undef */
import {
    CPF
} from 'cpf_cnpj';
import {
    CNPJ
} from 'cpf_cnpj';
import async from 'async';
import _ from 'underscore';

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

    controller.registerCall('blockedOperation', (tag) => {
        const {modal, form} = controller.call('alert', {
            title: 'Infelizmente voce não tem permissão para isso!',
            subtitle: 'Clique em um dos botões abaixo.',
            okText: 'Eita, preciso dessa consulta!',
        }, () => controller.serverCommunication.call("SELECT FROM 'SubAccount'.'AskPermission'",  controller.call('loader::ajax', {
            data: {tag},
            success(response) {
                return toastr.success('Foi enviada uma solicitação ao administrador da conta, para liberar acesso à funcionalidade solicitada.')
            }
        })));
        const okBtn = form.addSubmit('ok-entendi', 'Ok, entendi!')

        okBtn.on('click', ev => {
            ev.preventDefault();
            modal.close();
        })
    });

    controller.registerCall('remove::duplicated::separators', () => {
        $('.separator').filter((i, separator) => !$(separator).text().length).each((i, separator) => $(separator).remove())
    });

    controller.registerCall('remove::duplicated::containers', () => {
        $('.container').filter((i, container) => !$(container).text().length).each((i, container) => $(container).remove())
    });

    controller.registerCall('minimizar::categorias', (result) => {
        const hideElement = ($element) => {
            const containers = $element.parent();

            if(containers[containers.length - 1] === $element) return;

            let provisoryElement = $element.next();

            if (!provisoryElement.length || provisoryElement.hasClass('.separator')) return;

            provisoryElement.hide();

            hideElement(provisoryElement);
        }

        const showElement = ($element) => {
            const containers = $element.parent();

            if(containers[containers.length - 1] === $element) return;

            let provisoryElement = $element.next();

            if (!provisoryElement.length || provisoryElement.hasClass('.separator')) return;

            provisoryElement.show();

            showElement(provisoryElement);
        }

        controller.call('remove::remove::duplicated::separators');
        controller.call('remove::duplicated::containers');

        $(result).find('.separator').each((i, separator) => {
            const $elementsContainer = $(separator);
            const $action = $elementsContainer.find('.actions');
            const $button = $('<i>').addClass('fa fa-minus-square-o');

            if ($action.find('i').filter((index, i) => $(i).is('.fa-minus-square-o, .fa-plus-square-o')).length) return;

            $button.on('click', () => {
                if ($button.hasClass('fa-minus-square-o')) {
                    hideElement($elementsContainer);
                    //$elementsContainer.next().hide();
                    $button.removeClass().addClass('fa fa-plus-square-o');
                } else {
                    $button.removeClass().addClass('fa fa-minus-square-o');
                    //$elementsContainer.next().show();
                    showElement($elementsContainer);
                }
            });


            $action.append($('<li>').addClass('action-resize').append($button));
        });
    });

    controller.registerTrigger('ccbusca::finished', 'minimizarCategorias', ({result, doc, jdocument}, cb) => controller.call('minimizar::categorias', result));

    /*controller.registerCall('ccbusca', (val, callback, ...args) => {
        if (!$('.consulta-temporaria').length) $('body').append($('<div>').attr('id', 'consulta-temporaria').css('visibility', 'hidden'));

        let ccbuscaQuery = {
            documento: val,
            apiKey: controller.server.apiKey(),
            cache: 'DISABLED'
        };

        let ccbuscaQueryRFB = $.extend({}, ccbuscaQuery);

        if(CNPJ.isValid(val)) {
            ccbuscaQueryRFB['q[0]'] = 'SELECT FROM \'FINDER\'.\'BILLING\'';
            ccbuscaQueryRFB['q[1]'] = 'SELECT FROM \'RFB\'.\'CERTIDAO\'';
        } else {
            ccbuscaQueryRFB['q'] = 'SELECT FROM \'FINDER\'.\'BILLING\'';
        }

        /*controller.serverCommunication.call('USING \'CCBUSCA\' SELECT FROM \'FINDER\'.\'BILLING\'',
            controller.call('error::ajax', controller.call('loader::ajax', {
                data: ccbuscaQuery,
                success(ret) {
                    controller.call('ccbusca::parse', ret, val, callback, ...args);
                }
            })));
        const getRandom = (max, min) => parseInt(Math.random() * (max - min) + min);
        let loader = controller.call('ccbusca::loader');
        let finderRFBParams = new URLSearchParams();
        Object.keys(ccbuscaQueryRFB).forEach(key => finderRFBParams.append(key, ccbuscaQueryRFB[key]));
        let ccfParams = new URLSearchParams();
        Object.keys(ccbuscaQuery).forEach(key => ccfParams.append(key, ccbuscaQuery[key]));

        loader.setActiveStatus('Consultando Robôs Investigadores');
        loader.progressBarChange(getRandom(5, 8));

        setTimeout(function(){
            loader.setStatusSuccess('Consulta nos Robôs Investigadores Concluída');
            loader.setActiveStatus('Consultando RFB');
            loader.progressBarChange(getRandom(10, 18));
            axios.get('https://irql.icheques.com.br', {
                params: finderRFBParams
            }).then(dataRFB => {
                loader.progressBarChange(getRandom(25, 33));
                loader.setStatusSuccess('Consulta RFB Concluída');
                $('#consulta-temporaria').append(dataRFB.data);
                $('LocalizePessoaFisica').length ?
                    $('LocalizePessoaFisica', $('#consulta-temporaria')).replaceWith('<xml>' + $('LocalizePessoaFisica').html() +'</xml>') :
                    $('LocalizePessoaJuridica', $('#consulta-temporaria')).replaceWith('<xml>' + $('LocalizePessoaJuridica').html() +'</xml>');
                let rfb = $('rfb', $('#consulta-temporaria'));
                let xml = $('xml', $('#consulta-temporaria'));
                if(CNPJ.isValid(val)) {
                    $('bpql').append($('<body>').append(rfb).append(xml));
                } else {
                    $('bpql').append($('<body>').append(xml));
                }
            }).catch(() => {
                loader.progressBarChange(getRandom(20, 33));
                loader.setStatusFailed('Consulta RFB Falhou');
            }).finally(() => {
                loader.setActiveStatus('Consultando CCF');
                ccfParams.append('q', 'SELECT FROM \'SEEKLOC\'.\'CCF\'');
                axios.get('https://irql.icheques.com.br', {
                    params: ccfParams
                }).then(dataCCF => {
                    loader.progressBarChange(getRandom(65, 80));
                    loader.setStatusSuccess('Consulta CCF Concluída');
                    $('#consulta-temporaria body').append($('data', dataCCF.data));
                }).catch(() => {
                    loader.progressBarChange(getRandom(65, 80));
                    loader.setStatusSuccess('Consulta CCF Falhou');
                    $('#consulta-temporaria body').append($('ccf-failed'));
                }).finally(() => {
                    loader.setActiveStatus('Consultando Protestos');
                    ccfParams.set('q', 'SELECT FROM \'IEPTB\'.\'WS\'');
                    axios.get('https://irql.icheques.com.br', {
                        params: ccfParams,
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
        }, 3000);

    });*/

    controller.registerCall('ccbusca::parse', (ret, val, callback, ...args) => {
        const tags = (controller.confs.user || {}).tags || [];
        const sectionDocumentGroup = controller.call('section', 'Busca Consolidada',
            'Informações agregadas do CPF ou CNPJ',
            'Registro encontrado', ...args);

        if($('section.group-type').length) sectionDocumentGroup[0].css('border-bottom', '20px solid #fff')

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
            if(!(tags.indexOf('no-ccf') === -1)) {
                appendMessage('consulta de cheque sem fundo está desativada');
                return;
            }
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
            if(!(tags.indexOf('no-protesto') === -1)) {
                appendMessage('consulta de protesto está desativada');
                return;
            }
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

        controller.call('remove::duplicated::separators');
        controller.call('remove::duplicated::containers');

        controller.trigger('ccbusca::finished', {
            result: sectionDocumentGroup[1],
            doc: $(ret).find('entrada').text(),
            jdocument: $(ret)
        });
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
        const $cardContainer = $('<div>').addClass('ccbusca-loader').css({
            position: 'fixed',
            right: '0em',
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
                this.apiQuantity = 4;
                this.apiCompleted = 0;
                this.cardContainer = this.card();
                this.progressBar();
            }

            increaseProgress() {
                this.apiCompleted += 1;
                const porcentage = (this.apiCompleted / this.apiQuantity) * 100;
                this.progressBarChange(porcentage);
            }

            /**
             * Monta o card do loader.
             */
            card = () => {
                const cardContainer = this.controller.call('ccbusca::card-right');
                let loadDot = '<span class="saving"><span> .</span><span>.</span><span>.</span></span>';
                const loaderLength = $('.ccbusca-loader').length

                if (loaderLength) cardContainer.css({right: `${21*loaderLength}em`});

                $('.app-content').append(cardContainer).show('slow');
                $('.mdl-card__title-text', cardContainer).css('margin', 'auto').html($('<span>').addClass('card-title').text('Consulta CPF/CNPJ'));
                $('.mdl-card__supporting-text', cardContainer).html('Status: <span class=\'status\'></span>' + loadDot + '<br>');

                return cardContainer;
            }

            /**
             * Adiciona a barra de progresso.
             */
            progressBar = () => {
                const bar = this.controller.interface.widgets.radialProject($('.card-progress', this.cardContainer), 0);

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
            setText = (seletor, text, append = '') => $(seletor, this.cardContainer).text(text).append(append);

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
            setStatusSuccess = (status) => {
                const s = $('<span>').text(status).css('color', '#009903');
                $('.mdl-card__supporting-text', this.cardContainer).append('<br>').append(s);

                return s;
            }

            /**
             * Define o status de uma consulta mal sucedida.
             */
            setStatusFailed = (status) => {
                const s = $('<span>').text(status).css('color', '#ff4500');
                $('.mdl-card__supporting-text', this.cardContainer).append('<br>').append(s);

                return s;
            };

            /**
             * Define o status atual da pesquisa como concluído e remove o Loader.
             */
            searchCompleted = () => {
                $('.saving', this.cardContainer).remove();
                this.setActiveStatus('Todas as consultas foram Concluídas!');
                this.sleep(3000).then(() => this.cardContainer.fadeOut(3000, function () {
                    $(this).remove();
                    let count = 0;
                    $('.ccbusca-loader').each((i, loader) => {
                        $(loader).css('right', `${count}em`)
                        count += 21
                    });
                    count = 0;
                }));
            };
        }

        return new Loader(controller);
    });
};
