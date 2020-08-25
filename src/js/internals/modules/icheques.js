import oneTime from 'one-time';

module.exports = controller => {
    if (!controller.confs.icheques.hosts.includes(document.location.hostname)) return;
    const failAlert = () => harlan.alert({
        subtitle: 'Não foi possível carregar um módulo da iCheques.',
        paragraph: 'Verifique se o endereço cdn.jsdelivr.net é liberado na sua rede interna.',
    });

    const refinCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-refin@1.0.49/index.js').fail(failAlert));
    // const veiculosCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-veiculos/index.js').fail(failAlert));
    const veiculosCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-veiculos@1.1.23/index.js').fail(failAlert));
    const graficosAnaliticosCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-graficos-analiticos@1.0.9/index.js').fail(failAlert));
    const consultaSimplesCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-consulta-simples@latest/index.js').fail(failAlert));
    const followCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-follow-document@1.3.23/index.js').fail(failAlert));
    const statuspageCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-statuspage@latest/index.js').fail(failAlert));
    const pdfMonitoramento = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-monitoramento-pdf@latest/index.js').fail(failAlert));
    const relatorioAnalitico = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-icheques-relatorio-analitico@1.0.43/index.js').fail(failAlert));
    const componenteVeiculosCall = oneTime(() => $.getScript('https://cdn.jsdelivr.net/npm/harlan-credithub-componente-veiculos@1.0.10/index.js').fail(failAlert));
    controller.registerBootstrap('icheques::init::plataform', callback => $.getScript('/js/icheques.js').done(() => {
        callback();
        const tags = (controller.confs.user || {}).tags || [];
        if (tags.indexOf('no-follow') === -1) followCall();
        if (tags.indexOf('no-refin') === -1) refinCall();
        if (tags.indexOf('no-veiculos') === -1) veiculosCall();
        statuspageCall();
        pdfMonitoramento();
        relatorioAnalitico();
        componenteVeiculosCall();
        graficosAnaliticosCall();
        consultaSimplesCall();
    }).fail(() => {
        callback();
        failAlert();
    }));
};
