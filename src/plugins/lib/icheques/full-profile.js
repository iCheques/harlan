import { paramCase } from 'change-case';

module.exports = controller => {
    /**
    * Este é o formulário para antecipar cheques
    */
    controller.registerCall('icheques::form::company', callback => {
        const form = controller.call('form', formData => {
            controller.serverCommunication.call('INSERT INTO \'ICHEQUESPROFILE\'.\'PROFILE\'', controller.call('error::ajax', {
                method: 'post',
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success() {
                    if (callback) {
                        controller.confirm({
                            icon: 'pass',
                            title: 'Parabéns, cadastro atualizado!',
                            subtitle: 'Seu cadastro foi atualizado com sucesso.',
                            paragraph: 'Os dados cadastrais foram atualizados com sucesso.',
                            confirmText: 'Continuar'
                        }, callback);
                    } else {
                        controller.alert({
                            icon: 'pass',
                            title: 'Parabéns, cadastro atualizado!',
                            subtitle: 'Seu cadastro foi atualizado com sucesso.',
                            paragraph: 'Os dados cadastrais foram atualizados com sucesso.',
                            confirmText: 'Compreendi'
                        });
                    }
                }
            }));
        });

        let lastData = {};
        controller.call('billing::information::force', () => {
            controller.server.call('SELECT FROM \'ICHEQUESPROFILE\'.\'PROFILE\'', {
                dataType: 'json',
                success: ret => {
                    lastData = ret;
                },
                complete: () => {
                    form.configure({
                        title: 'Cadastro Completo',
                        subtitle: 'Realize o cadastro completo de sua empresa.',
                        paragraph: 'O cadastro completo permite a realização de operações de crédito.',
                        gamification: 'star',
                        screens: [{
                            magicLabel: true,
                            fields: [{
                                name: 'name',
                                type: 'text',
                                placeholder: 'Nome do Responsável',
                                labelText: 'Nome do Responsável'
                            }, {
                                name: 'email',
                                type: 'text',
                                placeholder: 'E-mail do Responsável',
                                labelText: 'E-mail do Responsável'
                            }, {
                                name: 'phone',
                                type: 'text',
                                placeholder: 'Telefone do Responsável',
                                labelText: 'Telefone do Responsável',
                                mask: '(00) 0000-00009'
                            }]
                        }, {
                            magicLabel: true,
                            fields: [[{
                                name: 'revenue',
                                type: 'text',
                                placeholder: 'Faturamento Mensal (R$)',
                                labelText: 'Faturamento Mensal (R$)',
                                mask: '000.000.000.000.000,00',
                                maskOptions: {
                                    reverse: true
                                },
                                numeral: true
                            }, {
                                name: 'activity-branch',
                                type: 'text',
                                placeholder: 'Ramo de Atividade',
                                labelText: 'Ramo de Atividade',
                            }],
                            [{
                                name: 'medium-term-sale',
                                type: 'text',
                                placeholder: 'Prazo Médio de Venda (dias)',
                                labelText: 'Prazo Médio de Venda (dias)',
                                hoverHelp : 'Quantidade de dias, em média, para receber o total faturado.',
                                mask: '999',
                                numeral: true
                            }, {
                                name: 'check-liquidity',
                                type: 'text',
                                placeholder: 'Liquidez dos Cheques (%)',
                                labelText: 'Liquidez dos Cheques (%)',
                                hoverHelp : 'Qual a porcentagem dos que cheques liquidam.',
                                numeralFormat : '0.00%',
                                mask: '##0,99%',
                                maskOptions: {
                                    reverse: true
                                },
                                numeral: true
                            }],
                            [{
                                name: 'pre-billing',
                                type: 'text',
                                placeholder: '* Pré-Faturamento (R$)',
                                labelText: '* Pré-Faturamento (R$)',
                                hoverHelp : 'Emissão da NFe + Recebimento do valor antes da produção e entrega da mercadoria.',
                                optional: true,
                                mask: '000.000.000.000.000,00',
                                maskOptions: {
                                    reverse: true
                                },
                                numeral: true
                            }, {
                                name: 'pre-billing-days',
                                type: 'text',
                                placeholder: '* Quantos dias?',
                                labelText: '* Quantos dias?',
                                optional: true,
                                mask: '999',
                                numeral: true
                            }]
                            ]
                        }, {
                            magicLabel: true,
                            fields: [
                                [{
                                    name: 'number-employees',
                                    type: 'text',
                                    placeholder: 'Total de Funcionários',
                                    labelText: 'Total de Funcionários',
                                    mask: '000.000.000.000.000',
                                    maskOptions: {
                                        reverse: true
                                    },
                                    numeral: true
                                }, {
                                    name: 'total-payroll',
                                    type: 'text',
                                    placeholder: 'Total da Folha de Pagto. (R$)',
                                    labelText: 'Total da Folha de Pagto. (R$)',
                                    hoverHelp : 'Valor total do salário dos funcionarios.',
                                    numeral: true,
                                    mask: '000.000.000.000.000,00',
                                    maskOptions: {
                                        reverse: true
                                    }
                                }], {
                                    name: 'own-property',
                                    type: 'select',
                                    labelText: 'Imóvel Próprio ou Alugado?',
                                    optional: false,
                                    list: ['Próprio', 'Alugado']
                                }, {
                                    name: 'location-value',
                                    type: 'text',
                                    placeholder: '* Valor da Locação (R$)',
                                    labelText: '* Valor da Locação (R$)',
                                    optional: true,
                                    numeral: true,
                                    mask: '000.000.000.000.000,00',
                                    maskOptions: {
                                        reverse: true
                                    }
                                }
                            ]
                        }, {
                            magicLabel: true,
                            fields: [{
                                name: 'month-check-ammount',
                                type: 'text',
                                placeholder: 'Quanto Antecipa ao Mês (R$)',
                                numeral: true,
                                optional: true,
                                labelText: 'Quanto Antecipa ao Mês (R$)',
                                mask: '000.000.000.000.000,00',
                                maskOptions: {
                                    reverse: true
                                }
                            }, {
                                name: 'bulk',
                                type: 'select',
                                labelText: 'Cheques concentrados ou pulverizados?',
                                optional: false,
                                hoverHelp : 'Cheques acima de 3 mil reais são considerados concentrados; abaixo pulverizados.',
                                list: ['Concentrados', 'Pulverizados', 'Mistura de ambos']
                            }, {
                                name: 'avg-check-ammount',
                                type: 'text',
                                placeholder: 'Valor Médio do Cheque (R$)',
                                labelText: 'Valor Médio do Cheque (R$)',
                                numeral: true,
                                optional: false,
                                mask: '000.000.000.000.000,00',
                                maskOptions: {
                                    reverse: true
                                }
                            }, {
                                name: 'own-send',
                                type: 'select',
                                labelText: 'Transportadora',
                                optional: true,
                                list: ['Não Possuo', 'Própria', 'Terceirizada', 'Própia e Terceirizada']
                            }]
                        }]
                    });
                    let data = Object.assign({}, lastData);
                    for (let idx in lastData) {
                        switch (idx) {
                        case 'preBilling':
                        case 'totalPayroll':
                        case 'locationValue':
                        case 'monthCheckAmmount':
                        case 'avgCheckAmmount':
                        case 'revenue':
                            data[idx] *= 100;
                            break;
                        }
                        form.setValue(paramCase(idx), data[idx]);
                    }
                }
            });
        }, 'Próximo');
    });
};
