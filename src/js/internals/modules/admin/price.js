import _ from 'underscore';
import sprintf from 'sprintf';
import { CPF, CNPJ } from 'cpf_cnpj';
import Promise from 'bluebird';
import { compareTwoTexts } from 'text-sound-similarity';

const LIMIT_RESULTS = 10;

module.exports = controller => {

    const onCancel = () => {
        controller.call('price::list');
    };

    function drawList({ modal, list, data, skip, pageActions, text, pagination, observation }) {
        const { back, next } = pageActions;
        if (text) {
            data = data.filter(x => (compareTwoTexts(x.name, text) > 0.85));
        }

        observation.text(`Foram localizados ${numeral(data.length).format('0,0')} resultados.`);

        const pages = Math.ceil((data.length / LIMIT_RESULTS) + 1);
        if (pages > 1) {
            pagination.show();
            pagination.text(`Página ${Math.ceil((skip / LIMIT_RESULTS) + 1)} de ${pages}.`);
        } else {
            pagination.hide();
        }

        const b = data.slice(skip, skip + LIMIT_RESULTS);

        list.empty();
        for (const item of b) {
            list.add('fa-edit', [item.name, numeral(item.price/100.).format('$ 0,0.00'), item.key]).click((e) => {
                e.preventDefault();
                modal.close().call('price::update', item);
            });
        }

        back[skip <= 0 ? 'hide' :  'show']();
        next[skip + LIMIT_RESULTS >= data.length ? 'hide' :  'show']();

        return data;
    }

    const formDescription = {
        title: 'Configuração de Preços',
        subtitle: 'Preencha os campos abaixo para configurar um preço no sistema.',
        paragraph: 'Os preços configurados entram em operação imediatamente.',
        gamification: 'star',
        screens: [{
            magicLabel: true,

            fields: [
                [{
                    name: 'name',
                    type: 'text',
                    placeholder: 'Nome da Bilhetagem',
                    labelText: 'Nome da Bilhetagem',
                    optional: false
                }, {
                    name: 'key',
                    type: 'text',
                    placeholder: 'chave.de.bilhetagem',
                    labelText: 'Chave de Bilhetagem',
                    optional: false
                }],
                {
                    name: 'description',
                    type: 'textarea',
                    placeholder: 'Descrição da Consulta (Markdown)',
                    optional: false,
                    labelText: 'Descrição'
                },
                [{
                    name: 'persist',
                    optional: true,
                    type: 'select',
                    placeholder: 'Estado',
                    list: {
                        '': 'Sem intervalo',
                        d: 'Diária',
                        m: 'Semanal',
                        w: 'Mensal',
                        y: 'Anual',
                    }
                }, {
                    name: 'price',
                    type: 'text',
                    placeholder: 'Valor (R$)',
                    labelText: 'Valor (R$)',
                    mask: '000.000.000.000.000,0000',
                    maskOptions: {
                        reverse: true
                    },
                    numeral: true
                }],
                [{
                    name: 'username',
                    type: 'text',
                    placeholder: 'Usuário (opcional)',
                    optional: true,
                    labelText: 'Usuário'
                }, {
                    name: 'priceTable',
                    type: 'text',
                    placeholder: 'Grupo de Preço (opcional)',
                    labelText: 'Grupo de Preço (opcional)',
                    optional: true
                }],
            ]
        }]
    };

    const register = data => controller.server.promise('INSERT INTO \'PRICETABLE\'.\'PRODUCT\'', {
        dataType: 'json',
        data
    }).catch(e => toastr.error(e.push ? String(e) : 'Não foi possível configurar o preço, tente novamente mais tarde.'));

    controller.registerCall('price::create', () =>
        controller.promise('form::callback', formDescription, onCancel).then(register)
            .then(data => controller.call('alert', {
                icon: 'moneyBag',
                title: `Cobrança adicionada com sucesso para ${data.name}. - <small>${data.key}</small>`,
                subtitle: 'O preço foi configurado e passar a surtir efeito desde já.',
            }))
            .then(() => controller.call('price::list')));

    controller.registerCall('price::update', (priceData) =>
        controller.promise('form::callback', formDescription, priceData, onCancel).then(register)
            .then(data => controller.call('alert', {
                icon: 'moneyBag',
                title: `Cobrança adicionada com sucesso para ${data.name}. - <small>${data.key}</small>`,
                subtitle: 'O preço foi configurado e passar a surtir efeito desde já.',
            })).then(() => controller.call('price::list')));

    controller.registerCall('price::list', () => controller.serverCommunication.call('SELECT FROM \'PRICETABLE\'.\'PRODUCTS\'',
        controller.call('error::ajax', { dataType: 'json' })).then((response) => {
        const data = _.values(response);
        const modal = controller.call('modal');
        modal.title('Gestão de Preços');
        modal.subtitle('Crie e Modifique Preços');
        modal.addParagraph('A gestão de preços permite você administrar todos os preços registrados no sistema.');

        const form = modal.createForm();

        const search = form.addInput('price', 'text', 'Preço que você procura');
        const list = form.createList();
        list.element().addClass('list-price');

        let skip = 0;
        let text = null;

        const actions = modal.createActions();

        actions.cancel();

        actions.add('Criar Preço').click((e) => {
            e.preventDefault();
            modal.close().call('price::create');
        });

        const pagination = actions.observation();
        const observation = actions.observation();

        const drawObject = { modal, list, data, skip: 0, pageActions: {
            next: actions.add('Próxima Página').click(() => {
                drawObject.skip += LIMIT_RESULTS;
                drawList(drawObject);
            }).hide(),

            back: actions.add('Página Anterior').click(() => {
                drawObject.skip -= LIMIT_RESULTS;
                drawList(drawObject);
            }).hide()
        }, text: null, pagination, observation };

        controller.call('instant::search', search, (query, autocomplete, callback) => {
            drawObject.text = query;
            skip = 0;
            drawList(drawObject);
        });

        drawList(drawObject);
    }));

};
