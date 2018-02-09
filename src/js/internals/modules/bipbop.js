import documentValidator from 'cpf_cnpj';

import async from 'async';

const validateCPF = ({element}) => documentValidator.CPF.isValid(element.val());

const validateCNPJ = ({element}) => {
    const value = element.val();
    if (value === null) {
        return true;
    }
    return documentValidator.CNPJ.isValid(value);
};

module.exports = controller => {

    const bipbopRequestCNPJ = ({cnpj}, callback) => {
        controller.serverCommunication.call('SELECT FROM \'BIPBOPJS\'.\'NOME\'',
            controller.call('error::ajax', {
                data: {
                    q: 'SELECT FROM \'BIPBOPJS\'.\'CPFCNPJ\'',
                    documento: cnpj
                },
                success() {
                    callback();
                },
                error(err) {
                    callback('failed');
                }
            }));
    };

    const bipbopRequestCPFCEP = ({cpf, cep, nascimento}, form, callback) => {
        controller.serverCommunication.call('SELECT FROM \'BIPBOPJS\'.\'NOME\'',
            controller.call('error::ajax', {
                data: {
                    'q[0]': 'SELECT FROM \'BIPBOPJS\'.\'CPFCNPJ\'',
                    'q[1]': 'SELECT FROM \'BIPBOPJS\'.\'CEP\'',
                    documento: cpf,
                    cep: cep,
                    nascimento: nascimento
                },
                success(ret) {
                    form.setValue('nome', $('body > nome', ret).text());
                    form.setValue('endereco', $('cep > lograduro', ret).text());
                    form.setValue('cidade', $('cep > cidade', ret).text());
                    form.setValue('estado', $('cep > uf', ret).text());
                    callback();
                },
                error() {
                    callback('failed');
                }
            }));
    };

    const bipbopRequest = (callback, configuration, screen, form) => {
        form.defaultScreenValidation(function (ret) {
            if (!ret) {
                return callback(false);
            }

            const formValues = form.readValues();
            const unregister = $.bipbopLoader.register();
            async.parallel([
                bipbopRequestCNPJ.bind(this, formValues),
                bipbopRequestCPFCEP.bind(this, formValues, form)
            ], err => {
                unregister();
                callback(!err);
            });
        }, configuration, screen);
    };

    controller.registerCall('bipbop::create::account::submit', (formData, creditCard) => {
        controller.call('confirm', {
            icon: 'wizard',
            title: 'Você aceita as condições de serviço?',
            subtitle: 'Para criar a conta é necessário aceitar a licença do software.',
            paragraph: 'Verifique as condições gerais do <a href=\'https://api.bipbop.com.br/bipbop-contrato-v1.pdf\' target=\'blank\'>contrato de licença de software e outras avenças</a> para continuar.',
            confirmText: 'Aceitar'
        }, () => {
            const unregister = $.bipbopLoader.register();
            controller.serverCommunication.call('SELECT FROM \'BIPBOP\'.\'CHECKOUT\'', controller.call('error::ajax', {
                method: 'POST',
                data: {
                    parameters: $.param(Object.assign({}, formData, creditCard))
                },
                success() {
                    controller.call('alert', {
                        icon: 'pass',
                        title: 'Parabéns! Agora você tem uma conta BIPBOP.',
                        subtitle: 'Enviamos um e-mail com as informações de acesso.',
                        paragraph: 'Verifique seu e-mail para adquirir a senha de acesso. Caso não encontre aguarde alguns instantes e verifique novamente sua caixa de entrada e lixo eletrônico.'
                    });
                },
                complete() {
                    unregister();
                }
            }));
        });
    });

    controller.registerCall('bipbop::create::account', email => {

        const form = controller.call('form', formData => {
            controller.call('get::credit::card', creditCard => {
                controller.call('bipbop::create::account::submit', formData, {
                    'cc-nome': `${creditCard.first_name} ${creditCard.last_name}`,
                    cc: creditCard.number,
                    'cc-exp': `${creditCard.month} / ${creditCard.year}`,
                    'cc-cvv': creditCard.verification_value
                });
            }, {
                title: 'Configurar Método de Pagamento',
                subtitle: 'Configure seu método de pagamento para continuar.',
                paragraph: 'É necessário que você informe seu cartão de crédito para poder criar a conta.',
                submit: 'Configurar Cartão'
            });
        });

        form.configure({
            title: 'Criar uma Conta BIPBOP',
            subtitle: 'Tenha acesso ao melhor do Harlan.',
            paragraph: 'Com uma única conta BIPBOP você pode acessar vários de nossos serviços.',
            gamification : 'magicWand',
            screens: [
                {
                    magicLabel: true,
                    validate: bipbopRequest,
                    fields: [
                        [{
                            name: 'email',
                            optional: false,
                            type: 'text',
                            placeholder: 'Endereço de E-mail',
                            labelText: 'E-mail',
                            value: email
                        }, {
                            name: 'cpf',
                            optional: false,
                            type: 'text',
                            placeholder: 'Número do CPF',
                            labelText: 'CPF',
                            mask: '000.000.000-00',
                            validate: validateCPF
                        }],
                        [{
                            name: 'cep',
                            optional: false,
                            type: 'text',
                            placeholder: 'CEP',
                            labelText: 'CEP',
                            mask: '00000-000'
                        }, {
                            name: 'telefone',
                            optional: false,
                            type: 'text',
                            placeholder: 'Número Telefone',
                            labelText: 'Telefone',
                            mask: '(00) 90000-0000'

                        }],
                        [{
                            name: 'nascimento',
                            optional: false,
                            type: 'text',
                            placeholder: 'Data de Nascimento',
                            pikaday: true,
                            mask: '00/00/0000',
                            getValue({element}) {
                                return moment(element.val(),
                                    controller.i18n.pikaday.format).isValid() ? element.val() : null;
                            }
                        }, {
                            name: 'cnpj',
                            optional: false,
                            type: 'text',
                            placeholder: 'CNPJ',
                            mask: '00.000.000/0000-00',
                            validate: validateCNPJ
                        }]
                    ]}, {
                    magicLabel: true,
                    fields: [
                        {
                            name: 'nome',
                            optional: false,
                            type: 'text',
                            placeholder: 'Nome Completo'
                        },
                        {
                            name: 'endereco',
                            optional: false,
                            type: 'text',
                            placeholder: 'Endereço'
                        },
                        [{
                            name: 'numero',
                            optional: false,
                            type: 'text',
                            numeral: true,
                            placeholder: 'Número'
                        },
                        {
                            name: 'complemento',
                            type: 'text',
                            optional: true,
                            placeholder: 'Complemento'
                        }],
                        [{
                            name: 'cidade',
                            optional: false,
                            type: 'text',
                            placeholder: 'Cidade'
                        },
                        {
                            name: 'estado',
                            optional: false,
                            type: 'select',
                            placeholder: 'Estado',
                            list: {
                                '': 'Escolha um estado',
                                AC: 'Acre',
                                AL: 'Alagoas',
                                AM: 'Amazonas',
                                AP: 'Amapá',
                                BA: 'Bahia',
                                CE: 'Ceará',
                                DF: 'Distrito Federal',
                                ES: 'Espírito Santo',
                                GO: 'Goiás',
                                MA: 'Maranhão',
                                MT: 'Mato Grosso',
                                MS: 'Mato Grosso do Sul',
                                MG: 'Minas Gerais',
                                PA: 'Pará',
                                PB: 'Paraíba',
                                PR: 'Paraná',
                                PE: 'Pernambuco',
                                PI: 'Piauí',
                                RJ: 'Rio de Janeiro',
                                RN: 'Rio Grande do Norte',
                                RO: 'Rondônia',
                                RS: 'Rio Grande do Sul',
                                RR: 'Roraima',
                                SC: 'Santa Catarina',
                                SE: 'Sergipe',
                                SP: 'São Paulo',
                                TO: 'Tocantins'
                            }
                        }]
                    ]
                }
            ]
        });
    });
};
