import oneTime from 'one-time';
import _ from 'underscore';

module.exports = controller => {
    if (!controller.confs.icheques.hosts.includes(document.location.hostname)) return;
    const failAlert = () => harlan.alert({
        subtitle: 'Não foi possível carregar um módulo da iCheques.',
        paragraph: 'Verifique se o endereço cdn.jsdelivr.net é liberado na sua rede interna.',
    });

    // const veiculosCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-icheques-veiculos/index.js').fail(failAlert));
    const veiculosCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-credithub-veiculos/index.js').fail(failAlert));

    const graficosAnaliticosCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-credithub-graficos-analiticos/index.js').fail(failAlert));

    const consultaSimplesCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-credithub-consulta-simples/index.js').fail(failAlert));

    const followCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-icheques-follow-document/index.js').fail(failAlert));

    const statuspageCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-icheques-statuspage/index.js').fail(failAlert));

    const pdfMonitoramento = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-credithub-monitoramento-pdf/index.js').fail(failAlert));

    const relatorioAnalitico = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-icheques-relatorio-analitico/index.js').fail(failAlert));

    const componenteVeiculosCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-credithub-componente-veiculos/index.js').fail(failAlert));

    const contactLikeDislikeCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-credithub-phone-like-dislike/index.js').fail(failAlert));

    const finderPhoneCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-credithub-finder-phone/index.js').fail(failAlert));

    const admSubconta = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-credithub-adm-subcontas/index.js').fail(failAlert));

    const refinCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-icheques-refin/index.js').fail(failAlert));

    const processosJuridicosCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-credithub-processos-juridicos/index.js').fail(failAlert));

    const consultaSimplesPorNomeCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-credithub-finder-name-address/index.js').fail(failAlert));

    const tutorialIntroJSCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-credithub-introjs/index.js').fail(failAlert));

    const notifyCall = oneTime(() => $.getScript('https://cdn.credithub.com.br/plugins-harlan/harlan-credithub-notify/index.js').fail(failAlert));

    controller.registerCall('harlanVersion', () => '1.1.9');

    controller.call('SafariError');
    controller.call('LocationError');

    controller.registerBootstrap('icheques::init::plataform', callback => $.getScript('/js/icheques.js').done(() => {
        callback();
        controller.registerTrigger('serverCommunication::websocket::authentication', 'loadingPlugin',  (data, callback) => {
            controller.server.call('SELECT FROM \'HarlanVersion\'.\'Version\'', {
                dataType: 'json',
                success: (dataVersion) => {
                    if (data.username === 'davidev' || data.username === 'rafaelnasser1@gmail.com') {
                        controller.interface.helpers.menu.add('Version', 'info').nodeLink.click(e => {
                            e.preventDefault();
                            toastr.success(`Versão Atual Local: ${controller.call('harlanVersion')}`);
                            toastr.success(`Versão Atual Servidor: ${dataVersion.version}`);
                        });
                    } else {
                        controller.interface.helpers.menu.add('Tutorial', 'info').nodeLink.click(e => {
                            e.preventDefault();
                            localStorage.introJsCompleted = false;
                            controller.call('credithub::introjs');
                        });
                    }
                    if (dataVersion.version == controller.call('harlanVersion')) return;

                    controller.call('harlanVersionError');
                }
            });

            controller.call('SafariError');
            controller.call('LocationError');

            controller.server.call('SELECT FROM \'SubAccount\'.\'IsSubAccount\'', {
                dataType: 'json',
                success: (isSubAccount) => {
                    if (isSubAccount) $('#action-subaccount').parent().hide();
                }
            });

            const tags = data.tags || [];
            const tagNaoExistir = (tag) => tags.indexOf(`no-${tag}`) === -1;
            refinCall();
            if (tagNaoExistir('monitore')) followCall();
            if (tagNaoExistir('consulta-veiculos')) {
                veiculosCall();
                componenteVeiculosCall();
            }
            statuspageCall();
            pdfMonitoramento();
            relatorioAnalitico();
            admSubconta();

            if (tagNaoExistir('protesto') && tagNaoExistir('ccf')) graficosAnaliticosCall();

            if (tagNaoExistir('consulta-simples-cpf-cnpj-telefone')) {
                consultaSimplesCall();
                finderPhoneCall();
                consultaSimplesPorNomeCall();
                contactLikeDislikeCall();
            }

            if(tagNaoExistir('consulta-processo-juridico') && tagNaoExistir('processos-juridicos')) processosJuridicosCall();

            tutorialIntroJSCall();

            notifyCall();

            callback();
        });
    }).fail(() => {
        callback();
        failAlert();
    }));
};
