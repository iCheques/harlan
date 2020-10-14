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
    const graficosAnaliticosCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-graficos-analiticos@1.0.10/index.js').fail(failAlert));
    const consultaSimplesCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-consulta-simples@1.0.3/index.js').fail(failAlert));
    const followCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-follow-document@1.3.34/index.js').fail(failAlert));
    const statuspageCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-statuspage@latest/index.js').fail(failAlert));
    const pdfMonitoramento = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-monitoramento-pdf@latest/index.js').fail(failAlert));
    const relatorioAnalitico = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-relatorio-analitico@1.0.43/index.js').fail(failAlert));
    const componenteVeiculosCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-componente-veiculos@1.0.10/index.js').fail(failAlert));
    const contactLikeDislikeCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-phone-like-dislike@1.0.1/index.js').fail(failAlert));
    const finderPhoneCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-finder-phone@1.0.6/index.js').fail(failAlert));
    const admSubconta = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-adm-subcontas@1.0.5/index.js').fail(failAlert));
    const refinCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-refin@1.0.52/index.js').fail(failAlert));
    controller.registerBootstrap('icheques::init::plataform', callback => $.getScript('/js/icheques.js').done(() => {
        callback();
        const tags = (controller.confs.user || {}).tags || [];
        refinCall();
        followCall();
        if (tags.indexOf('no-veiculos') === -1) {
            veiculosCall();
            componenteVeiculosCall();
        }
        statuspageCall();
        pdfMonitoramento();
        relatorioAnalitico();
        admSubconta();

        graficosAnaliticosCall();

        if(tags.indexOf('no-consulta-simples-cpf-cnpj-telefone') === -1) {
            consultaSimplesCall();
            finderPhoneCall();
            contactLikeDislikeCall();
        }
    }).fail(() => {
        callback();
        failAlert();
    }));
};
