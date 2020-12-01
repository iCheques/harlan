import oneTime from 'one-time';
import _ from 'underscore';

module.exports = controller => {
    if (!controller.confs.icheques.hosts.includes(document.location.hostname)) return;
    const failAlert = () => harlan.alert({
        subtitle: 'Não foi possível carregar um módulo da iCheques.',
        paragraph: 'Verifique se o endereço cdn.jsdelivr.net é liberado na sua rede interna.',
    });

    // const veiculosCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-veiculos/index.js').fail(failAlert));
    const veiculosCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-veiculos@1.1.24/index.js').fail(failAlert));
    const graficosAnaliticosCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-graficos-analiticos@1.0.15/index.js').fail(failAlert));
    const consultaSimplesCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-consulta-simples@1.0.7/index.js').fail(failAlert));
    const followCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-follow-document@1.3.34/index.js').fail(failAlert));
    const statuspageCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-statuspage@latest/index.js').fail(failAlert));
    const pdfMonitoramento = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-monitoramento-pdf@latest/index.js').fail(failAlert));
    const relatorioAnalitico = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-relatorio-analitico@1.0.48/index.js').fail(failAlert));
    const componenteVeiculosCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-componente-veiculos@1.0.10/index.js').fail(failAlert));
    const contactLikeDislikeCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-phone-like-dislike@1.0.3/index.js').fail(failAlert));
    const finderPhoneCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-finder-phone@1.0.6/index.js').fail(failAlert));
    const admSubconta = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-adm-subcontas@1.0.6/index.js').fail(failAlert));
    const refinCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-refin@1.0.62/index.js').fail(failAlert));
    const processoJuridicoCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-processos-juridicos@1.0.20/index.js').fail(failAlert));

    controller.registerCall('harlanVersion', () => {
        return '1.0.4'
    });

    controller.registerBootstrap('icheques::init::plataform', callback => $.getScript('/js/icheques.js').done(() => {
        callback();
        controller.registerTrigger('serverCommunication::websocket::authentication', 'loadingPlugin',  (data, callback) => {
            controller.server.call("SELECT FROM 'HarlanVersion'.'Version'", {
                dataType: 'json',
                success: (data) => {
                    if (data.version == controller.call('harlanVersion')) return;

                    controller.call('harlanVersionError');
                }
            });

            controller.call('SafariError');
            controller.call('LocationError');

            controller.server.call("SELECT FROM 'SubAccount'.'IsSubAccount'", {
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
                contactLikeDislikeCall();
            }
            if(tagNaoExistir('consulta-processo-juridico') && tagNaoExistir('processos-juridicos')) processoJuridicoCall();
            callback();
        });
    }).fail(() => {
        callback();
        failAlert();
    }));
};
