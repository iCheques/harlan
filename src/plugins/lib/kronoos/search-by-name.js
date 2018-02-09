import _ from 'underscore';
import pad from 'pad';
import {
    CPF,
    CNPJ
} from 'cpf_cnpj';

module.exports = controller => {

    const INPUT = $('#kronoos-q');
    const KRONOOS_ACTION = $('#kronoos-action');

    controller.registerCall('kronoos::search::by::name', () => {
        controller.alert({
            title: 'Risco de Homônimos',
            subtitle: 'Verifique se não é possível realizar a pesquisa por CPF ou CNPJ.',
            paragraph: `Recomendamos fortemente que as pesquisas de dossiê no Kronoos sejam realizadas
            através de um documento como CPF ou CNPJ. Isso porque as <strong>grafias de nomes podem se repetir</strong>.
            Você será direcionado a uma tela onde tentaremos dirimir homônimos através de um questionário.`
        }, () => controller.call('kronoos::search::by::name::first::form'));
    });

    controller.registerCall('kronoos::search::by::name::capture', (formatDocument, name, modal) => {
        controller.server.call('SELECT FROM \'CCBUSCA\'.\'CONSULTA\'', controller.call('error::ajax', controller.call('loader::ajax', {
            method: 'GET',
            data: {
                documento: formatDocument,
                'q[0]': 'SELECT FROM \'CCBUSCA\'.\'CONSULTA\'',
                'q[1]': 'SELECT FROM \'CBUSCA\'.\'CONSULTA\''
            },
            success: data => {
                let umodal = controller.call('modal');
                umodal.title(`Informações do documento ${formatDocument}`);
                umodal.subtitle(`Relacionadas ao nome ${name}`);
                umodal.paragraph('Verifique as informações destacadas abaixo para realizar sua consulta.');
                let form = umodal.createForm();

                let showData = (fieldName, label, query, value) => form.addInput(fieldName, 'text', label).attr({
                    value: value || (query ? $(query, data).text() : null) || 'Não consta',
                    disabled: 'disabled',
                    readonly: 'readonly'
                });

                let nasctext = $('cadastro > dtnascimento', data).text();
                let nasc = nasctext ? moment(nasctext, 'YYYYMMDD') : null;

                showData('name', 'Nome', 'cadastro > nome');
                showData('birthday', 'Data de Nascimento', null, nasc ? nasc.format('DD/MM/YYYY') : null);
                showData('age', 'Idade', null, nasc ? `${moment().diff(nasc, 'years', false)} anos` : null);
                showData('mother', 'Nome da Mãe', 'cadastro > nomemae');

                form.addSubmit('submit', 'Pesquisa Kronoos');
                form.element().submit(e => {
                    e.preventDefault();
                    umodal.close();
                    modal.close();
                    INPUT.val(formatDocument);
                    KRONOOS_ACTION.submit();
                });
                umodal.createActions().cancel();
            }
        })), true);
    });

    controller.registerCall('kronoos::search::by::name::response', data => {
        if (!data.length) {
            controller.alert({
                title: 'Incapaz de inferir documentos.',
                subtitle: 'Não foi possível localizar documentos com base nos dados informados.',
                paragraph: 'Tente novamente com outros tipos de filtro.'
            }, () => controller.call('kronoos::search::by::name::first::form'));
            return;
        }
        let peoples = _.mapObject(_.groupBy(data, i => i.values.cpfCnpj), i => _.pick(i[0].values, 'nome', 'cidade', 'estado'));
        let modal = controller.call('modal');
        modal.title('Lista de Homônimos');
        modal.subtitle('Relação de documentos localizados com base nos dados informados.');
        modal.paragraph('Clique sobre o resultado para maiores informações.');
        let form = modal.createForm();
        let list = form.createList();
        for (let document in peoples) {
            let formatDocument = pad(document.length > 11 ? 14 : 11, document, '0');
            formatDocument = (CPF.isValid(formatDocument) ? CPF : CNPJ).format(formatDocument);
            let element = list.item('fa-vcard-o', [formatDocument,
                peoples[document].nome, `${peoples[document].cidade || 'Indefinido'} / ${peoples[document].estado || 'Indefinido'}`
            ])
                .click(controller.click('kronoos::search::by::name::capture', formatDocument, peoples[document].nome, modal));
            let ediv = element.find('div');
            ediv.eq(0).css('width', '150px');
            ediv.eq(1).css('width', '150px');
        }
        modal.createActions().cancel();
    });

    controller.registerCall('kronoos::search::by::name::first::form', () => {
        var form = controller.call('form', (inputQuery) => {
            controller.server.call('SELECT FROM \'CBUSCA\'.\'FILTRO\'',
                controller.call('error::ajax', controller.call('loader::ajax', {
                    method: 'POST',
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify(_.mapObject(_.pick(inputQuery, x => !!x), y => y.toUpperCase())),
                    success: data => controller.call('kronoos::search::by::name::response', data)
                })));

        });
        form.configure({
            title: 'Pesquisa por Nome',
            subtitle: 'Pesquisa por nome com filtragem de homônimos.',
            paragraph: 'Preencha os campos abaixo para que possamos realizar uma pesquisa segura, sem a presença de homônimos.',
            gamification: 'magicWand',
            magicLabel: true,
            screens: [{
                fields: [{
                    optional: true,
                    name: 'equal-nome',
                    type: 'text',
                    placeholder: 'Nome Completo',
                    labelText: 'Nome Completo'
                },
                [{
                    optional: true,
                    name: 'equal-primeiro-nome',
                    type: 'text',
                    placeholder: 'Primeiro Nome',
                    labelText: 'Primeiro Nome'
                }, {
                    optional: true,
                    name: 'equal-sobrenome2',
                    type: 'text',
                    placeholder: 'Nome do Meio',
                    labelText: 'Nome do Meio'
                }, {
                    name: 'equal-sobrenome',
                    type: 'text',
                    optional: true,
                    placeholder: 'Sobrenome',
                    labelText: 'Sobrenome'
                }],
                [{
                    name: 'equal-endereco',
                    optional: true,
                    type: 'text',
                    placeholder: 'Endereço ',
                    labelText: 'Endereço'
                }, {
                    name: 'equal-cep',
                    type: 'text',
                    placeholder: 'CEP',
                    optional: true,
                    labelText: 'CEP',
                    mask: '00000-000'
                },
                {
                    name: 'equal-numero',
                    optional: true,
                    type: 'text',
                    numeral: true,
                    placeholder: 'Número',
                    labelText: 'Número'
                }], [{
                    name: 'equal-complemento',
                    type: 'text',
                    optional: true,
                    placeholder: 'Complemento',
                    labelText: 'Complemento'
                },
                {
                    name: 'equal-cidade',
                    optional: true,
                    type: 'text',
                    placeholder: 'Cidade',
                    labelText: 'Cidade'
                }, {
                    name: 'equal-estado',
                    optional: true,
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
                }],
                [{
                    name: 'equal-email',
                    optional: true,
                    type: 'text',
                    placeholder: 'E-mail do Responsável',
                    labelText: 'E-mail do Responsável'
                }, {
                    name: 'equal-fone1',
                    optional: true,
                    type: 'text',
                    placeholder: 'Telefone do Responsável',
                    labelText: 'Telefone do Responsável',
                    mask: '(00) 0000-00009'
                }]
                ]
            }]
        });
    });
};
