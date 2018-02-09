const RISK = ['BAIXISSIMO RISCO', 'BAIXO', 'MEDIO', 'ALTO', 'ALTISSIMO'];

export default class CognitiveDossier {

    /*
     * O Parser é o primeiro filtro de dados, ele captura todas as requisições do dossiê,
     * aqui dentro todas as informações são compreendidas
     */
    constructor(parser) {
        this.parser = parser;
    }

    recuperaPessoaFisica(callback) {
        if (!this.parser.cpf) return;
        this.parser.serverCall('SELECT FROM \'RECUPERA\'.\'LocalizadorPerfilSocioDemograficoPF\'', {
            data: {
                documento: this.parser.cpf
            },
            success: data => {
                let riskText = $('SCORE_RISCO', data).text();
                let risk = RISK.indexOf(riskText);
                let text = $('DESCRICAO_CLUSTER', data).text();
                if (risk === -1 || !text) return;
                callback('Risco de Crédito', (risk * 0.25), text);
            }
        });
    }

    generateOutput(callback) {
        this.parser.controller.trigger('kronoos::congitive::dossier', [callback, this]);
        this.recuperaPessoaFisica(callback);
    }

}

export { CognitiveDossier };

/* https://www.letras.mus.br/the-naked-and-famous/1701151/traducao.html */
