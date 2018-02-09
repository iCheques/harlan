const CONTRATO_VAREJISTA = '/legal/icheques/MINUTA___CONTRATO__VAREJISTA___revisão_1_jcb.pdf';
const CONTRATO_ANTECIPADOR = '/legal/icheques/MINUTA___CONTRATO__ANTECIPADORA_DE_CHEQUES.pdf';

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
module.exports = controller => {

    controller.registerTrigger('server::communication::websocket::authentication', 'icheques::contract::websocket::authentication', ({contractAccepted}, callback) => {
        callback();

        if (controller.serverCommunication.freeKey() || contractAccepted) {
            return;
        }

        let path = CONTRATO_VAREJISTA;

        controller.server.call('SELECT FROM \'ICHEQUESFIDC\'.\'STATUS\'', {
            method: 'GET',
            data: {
                'q[0]': 'SELECT FROM \'ICHEQUESAUTHENTICATION\'.\'ANNOTATIONS\'',
                'q[1]': 'SELECT FROM \'ICHEQUESFIDC\'.\'STATUS\''
            },
            success: ret => {
                if ($('BPQL > body > fidc > _id', ret).length ||
                    ['credit-anticipator', 'fidc'].includes($('BPQL > body > annotation > type', ret).text())) {
                    path = CONTRATO_ANTECIPADOR;
                }
                controller.call('confirm', {
                    title: 'Você aceita com o contrato de serviço?',
                    subtitle: 'Para continuar é necessário que você aceite o contrato de serviço desta ferramenta.',
                    paragraph: `O contrato de serviço está disponível <a target='_blank' href='${path}' title='contrato de serviço'>neste link</a>, após a leitura clique em confirmar para acessar sua conta. O aceite é fundamental para que possamos disponibilizar todos os nossos serviços e você assim desfrutar de todos os benefícios iCheques.`,
                    confirmText: 'Aceitar'
                }, () => {
                    controller.serverCommunication.call('SELECT FROM \'iCheques\'.\'contractAccepted\'');
                    controller.call('alert', {
                        icon: 'pass',
                        title: 'O contrato foi aceito com sucesso',
                        subtitle: 'Agora você já pode usufruir de todas as funcionalidades do iCheques.',
                        paragraph: `Adicionamos R$ ${numeral(controller.call('credits::get') / 100).format('0,0.00')} a sua conta para que você possa experimentar nosso produto.`
                    });
                }, () => {
                    controller.call('authentication::logout');
                });
            }
        });

    });
};

/* https://soundcloud.com/mikaaaa/the-xx-you-got-the-love */
