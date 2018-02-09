import {CPF} from 'cpf_cnpj';
import {CNPJ} from 'cpf_cnpj';
import emailRegex from 'email-regex';
const PHONE_REGEX = /^[\(]?\d{2}[\)]?\s*\d{4}[\-]?\d{4,5}$/;

module.exports = controller => {

    controller.registerCall('accuracy::create::store', () => {
        const form = controller.call('form', opts => {
            let formdata = new FormData();
            for (let key in opts) formdata.append(key, opts[key]);
            controller.accuracyServer.call('saveStore', {}, {
                type: 'POST',
                data: formdata,
                cache: false,
                contentType: false,
                processData: false,
                success: ret => toastr.success('Loja criada com sucesso', 'Já está disponível a loja no dashboard de usuário para começar a realizar os check-ins.'),
                error: () => toastr.error('Não foi possível criar a loja', 'Verifique sua conexão com a internet e tente novamente mais tarde.')
            });
        });

        form.configure({
            title: 'Dados para Cadastro de Loja',
            subtitle: 'Uma vez cadastrada a loja você poderá realizar o check-in.',
            paragraph: 'É muito importante que os dados estejam preenchidos de maneira correta para que a loja seja criada corretamente.',
            screens: [{
                fields: [
                    {
                        name: 'name',
                        optional: false,
                        type: 'text',
                        placeholder: 'Nome Fantasia',
                    },
                    {
                        name: 'company',
                        optional: false,
                        type: 'text',
                        placeholder: 'Razão Social',
                    }, {
                        name: 'cnpj',
                        placeholder: 'CNPJ',
                        mask: '00.000.000/0000-00',
                        optional: false,
                    }, {
                        name: 'ie',
                        placeholder: 'Inscrição Estadual',
                        optional: true,
                    }, {
                        name: 'address',
                        optional: false,
                        type: 'text',
                        placeholder: 'Endereço',
                    }, {
                        name: 'zipcode',
                        type: 'text',
                        placeholder: 'CEP',
                        optional: false,
                        labelText: 'CEP',
                        mask: '00000-000'
                    }, {
                        name: 'complement',
                        type: 'text',
                        optional: true,
                        placeholder: 'Complemento'
                    }, {
                        name: 'neighborhood',
                        optional: true,
                        type: 'text',
                        placeholder: 'Bairro'
                    }, {
                        name: 'city',
                        optional: false,
                        type: 'text',
                        placeholder: 'Cidade'
                    }, {
                        name: 'state',
                        optional: false,
                        type: 'select',
                        placeholder: 'Estado',
                        list: {
                            '': 'Escolha um estado',
                            Acre: 'Acre',
                            Alagoas: 'Alagoas',
                            Amazonas: 'Amazonas',
                            Amapá: 'Amapá',
                            Bahia: 'Bahia',
                            Ceará: 'Ceará',
                            'Distrito Federal': 'Distrito Federal',
                            'Espírito Santo': 'Espírito Santo',
                            Goiás: 'Goiás',
                            Maranhão: 'Maranhão',
                            'Mato Grosso': 'Mato Grosso',
                            'Mato Grosso do Sul': 'Mato Grosso do Sul',
                            'Minas Gerais': 'Minas Gerais',
                            Pará: 'Pará',
                            Paraíba: 'Paraíba',
                            Paraná: 'Paraná',
                            Pernambuco: 'Pernambuco',
                            Piauí: 'Piauí',
                            'Rio de Janeiro': 'Rio de Janeiro',
                            'Rio Grande do Norte': 'Rio Grande do Norte',
                            Rondônia: 'Rondônia',
                            'Rio Grande do Sul': 'Rio Grande do Sul',
                            Roraima: 'Roraima',
                            'Santa Catarina': 'Santa Catarina',
                            Sergipe: 'Sergipe',
                            'São Paulo': 'São Paulo',
                            Tocantins: 'Tocantins'
                        }
                    },
                    {
                        name: 'email',
                        optional: true,
                        type: 'text',
                        placeholder: 'E-mail',
                        validate: ({element}) => emailRegex().test(element.val())
                    } ,{
                        name: 'phone',
                        optional: true,
                        type: 'text',
                        mask: '(00) 0000-00009',
                        placeholder: 'Telefone de Contato',
                        validate: ({element}) => PHONE_REGEX.test(element.val())
                    },{
                        name: 'cellphone',
                        optional: true,
                        type: 'text',
                        mask: '(00) 0000-00009',
                        placeholder: 'Celular de Contato',
                        validate: ({element}) => PHONE_REGEX.test(element.val())
                    },
                    {
                        name: 'region',
                        optional: false,
                        type: 'text',
                        placeholder: 'Região'
                    },
                    {
                        name: 'network',
                        optional: false,
                        type: 'text',
                        placeholder: 'Rede'
                    },
                    {
                        name: 'channel',
                        optional: false,
                        type: 'text',
                        placeholder: 'Canal'
                    },
                    {
                        name: 'manager',
                        optional: true,
                        type: 'text',
                        placeholder: 'Gerente'
                    },
                    {
                        name: 'note',
                        optional: true,
                        type: 'text',
                        placeholder: 'Nota'
                    },
                ]
            }]
        });
    });
};
