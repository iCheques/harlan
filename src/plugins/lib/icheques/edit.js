import {
    CMC7Parser
} from './cmc7-parser.js';

module.exports = controller => {

    controller.registerCall('icheques::item::add::time', check => {
        controller.call('confirm', {
            icon: 'reload',
            title: 'Mais um mês de monitoramento.',
            subtitle: 'Confirme que deseja adicionar mais um mês ao monitoramento.',
            paragraph: 'Ao custo de R$ 0,30 (trinta centavos!) monitore por mais 30 dias seu cheque e fique seguro na hora de depositar.'
        }, () => {
            controller.call('credits::has', 30, () => {
                controller.serverCommunication.call('UPDATE \'ICHEQUES\'.\'ONEMONTH\'',
                    controller.call('error::ajax', controller.call('loader::ajax', {
                        data: check,
                        success: () => {
                            /* websocket updates =p */
                            toastr.success('Um mês adicionado ao vencimento com sucesso.', 'Dados atualizados com sucesso.');
                        }
                    }, true)));
            });
        });
    });

    controller.registerCall('icheques::item::photo', ({cmc}) => {
        controller.server.call('SELECT FROM \'ICHEQUES\'.\'PHOTO\'', {
            dataType: 'json',
            data: {
                cmc
            },
            error: () => controller.alert({
                title: 'Impossível localizar foto do cheque.',
                subtitle: 'Não há o registro fotográfico deste documento.',
                paragraph: 'Não consta no banco de dados registro fotográfico para este cheque.'
            }),
            success: image => {
                controller.confirm({
                    title: 'Essa foto do seu cheque ficou realmente legal?',
                    subtitle: 'Deseja manter essa imagem do cheque?',
                    paragraph: 'Fotos de cheques de baixa qualidade, rasurados ou muito amassados serão descartadas.'
                },
                () => {},
                () => controller.server.call('DELETE FROM \'ICHEQUES\'.\'PHOTO\'',
                    controller.call('error::ajax', {
                        dataType: 'json',
                        data: {
                            cmc
                        },
                        success: () => toastr.success('Registro fotográfico removido com sucesso.', 'Não há mais registro fotográfico do cheque no banco de dados.')
                    })), (modal, form) => {
                    $('<img />', {
                        src: `data:image/jpeg;base64,${image}`,
                        style: 'max-width: 100%; display: block; margin: 14px auto;'
                    }).insertBefore(form.element());
                });
            }
        });
    });

    controller.registerCall('icheques::item::edit', (check, callback, optionalAmmount = true, edit = null, confirm = true) => {
        let xhr;
        const cmc7Data = new CMC7Parser(check.cmc);

        const form = controller.call('form', parameters => {
            if (xhr) xhr.abort();
            parameters.cmc = check.cmc;
            parameters.ammount = Math.floor(parameters.ammount * 100);
            let dispachEvent = () => {
                controller.serverCommunication.call('UPDATE \'ICHEQUES\'.\'CHECKDATA\'',
                    controller.call('error::ajax', controller.call('loader::ajax', {
                        data: parameters,
                        error() {
                            if (callback) callback('ajax failed', check);
                        },
                        success: () => {
                            /* websocket updates =p */
                            check.ammount = parameters.ammount;
                            check.observation = parameters.observation;
                            toastr.success('Os dados do cheque foram atualizados com sucesso.', 'Dados atualizados com sucesso.');
                            if (callback) callback(null, check);
                        }
                    }, true)));
            };
            if (confirm) controller.confirm({}, dispachEvent, () => controller.call('icheques::item::edit', check, callback, optionalAmmount, edit));
            else dispachEvent();
        }, () => {
            if (xhr) xhr.abort();
            if (callback) callback('can\'t edit', check);
        });

        form.onClose = () => {
            if (xhr) xhr.abort();
        };
        form.configure({
            title: 'Edição de Cheque',
            subtitle: 'Correção e inserção de dados do cheque.',
            gamification: 'magicWand',
            paragraph: `É muito importante que os dados do cheque <strong class="break">${check.cmc}</strong> estejam corretos para que seja mantido um cadastro saneado.`,
            screens: [{
                nextButton: 'Alterar Dados',
                magicLabel: true,
                actions: [
                    ['Fotografar', modal => {
                        modal.close();
                        controller.call('icheques::cheque::picture', image => {
                            if (!image) return;
                            controller.serverCommunication.call('UPDATE \'ICHEQUES\'.\'PHOTO\'',
                                controller.call('error::ajax', {
                                    dataType: 'json',
                                    data: {
                                        image,
                                        cmc: check.cmc
                                    },
                                    method: 'POST',
                                    success: () => toastr.success('Foto alterada com sucesso', 'O registro foi alterado no banco de dados')
                                }));
                        }, true);
                    }]
                ],
                fields: [
                    [{
                        name: 'document',
                        type: 'text',
                        placeholder: 'Documento',
                        labelText: 'Documento',
                        disabled: true,
                        optional: true,
                        value: check.cpf || check.cnpj,
                    }, {
                        name: 'name',
                        type: 'text',
                        placeholder: 'Nome',
                        labelText: 'Nome do Titular',
                        optional: true,
                        disabled: true
                    }],
                    [{
                        name: 'check-number',
                        type: 'text',
                        placeholder: 'Número do Cheque',
                        labelText: 'Número do Cheque',
                        disabled: true,
                        optional: true,
                        value: cmc7Data.number,
                    }, {
                        name: 'ammount',
                        type: 'text',
                        placeholder: 'Valor do Cheque',
                        labelText: 'Valor do Cheque',
                        value: check.ammount,
                        mask: '000.000.000.000,00',
                        optional: optionalAmmount,
                        maskOptions: {
                            reverse: true
                        },
                        numeral: true

                    }], {
                        name: 'observation',
                        type: 'textarea',
                        placeholder: 'Observação',
                        labelText: 'Observação',
                        optional: true,
                        value: check.observation
                    }
                ]
            }]
        });

        if (edit) {
            edit(form);
        }

        xhr = controller.server.call('SELECT FROM \'BIPBOPJS\'.\'CPFCNPJ\'', {
            data: {
                documento: check.cpf || check.cnpj
            },
            success: ret => {
                form.setValue('name', $('BPQL > body nome', ret).text());
            }
        });
    });

    controller.registerCall('icheques::item::set::ammount', (check, callback, edit = null) => {
        controller.call('icheques::item::edit', check, callback, false, edit);
    });

};
