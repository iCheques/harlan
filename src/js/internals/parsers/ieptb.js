import * as _ from 'underscore';
import moment from 'moment';

class FieldsCreator {
    constructor() {
        this.content = $('<div>').addClass('content protesto').css('padding' ,'0px 0');
        this.container = $('<div>').addClass('container').append(this.content);
    }

    addSeparator(name) {
        const header = $('<header />').addClass('separator');
        const container = $('<div />').addClass('container');
        const content = $('<div />').addClass('content');

        const h4 = $('<h4>').text(name);

        header.append(container.append(content.append(h4)));

        return header;
    }

    addItem(name, value, withBorder=false) {
        if (value === null) return null;

        const field = $('<div>').addClass('field');

        const $name = $('<div>').addClass('name').css({
            fontSize: '10px',
            fontWeight: 'bold',
        });

        const $value = $('<div>').addClass('value');

        field.append($name.text(name), $value.text(value));

        if (withBorder) return field;

        this.content.append(field);
    }

    addItemWithBorder(dateAndMoneyValue) {
        const { date, moneyValue } = dateAndMoneyValue;
        const fieldDate = this.addItem(date.name, date.value, true);
        const fieldMoneyValue = this.addItem(moneyValue.name, moneyValue.value, true);

        const fieldWithBorder = $('<div>').addClass('field field-content').css('border-right', '1px solid #575963');
        fieldWithBorder.append(fieldDate, fieldMoneyValue);

        this.content.append(fieldWithBorder);
    }

    element() {
        return this.container;
    }

    resetFields() {
        this.content = $('<div>').addClass('content protesto').css('padding' ,'0px 0');
        this.container = $('<div>').addClass('container').append(this.content);
    }
}

module.exports = controller => {

    const parserConsultasWS = document => {
        const result = controller.call('result');
        const jdocument = $(document);
        const fieldsCreator = new FieldsCreator();
        const totalDeRegistros = jdocument.find('BPQL > body > consulta > registros').text();
        let valorTotalDeProtestos = 0;
        const dates = [];

        _.each(jdocument.find('BPQL > body > consulta > conteudo > cartorio'), element => {
            const protestosDoCartorio = [];

            $('protesto', element).each((i, v) => {
                const data = $('data', v).text();
                const valor = parseFloat($('valor', v).text());
                if ((data && !/^\s*$/.test(data)) && (valor && !/^\s*$/.test(valor))) {
                    dates.push(moment(data, ['YYYY-MM-DD', 'DD-MM-YYYY']));
                    protestosDoCartorio.push(valor);
                }
            });

            if (protestosDoCartorio.length) {
                const valorTotal = protestosDoCartorio.reduce((a, b) => a + b);
                valorTotalDeProtestos += valorTotal;
            }
        });

        let data = dates.length ? moment.max(dates).format('DD/MM/YYYY') : 'Não Informado';
        valorTotalDeProtestos = valorTotalDeProtestos > 0 ? numeral(valorTotalDeProtestos).format('$0,0.00') : 'Não Informado';
        /*result.element().append(fieldsCreator.addSeparator('Resumo de Protestos'));
        fieldsCreator.addItem('Total de Protestos', totalDeRegistros);
        fieldsCreator.addItem('Última Ocorrência ', data);
        fieldsCreator.addItem('Valor Total de Protestos', valorTotalDeProtestos);

        result.element().append(fieldsCreator.element());
        fieldsCreator.resetFields();*/

        const separatorProtestosEmCartorio = result.addSeparator('Protestos em Cartório');

        if(parseInt(totalDeRegistros)) separatorProtestosEmCartorio.css('margin-top', '40px').css('background', 'url(images/textures/brilliant.png),linear-gradient(180deg,#f70808,#fff 160%)');

        _.each(jdocument.find('BPQL > body > consulta > conteudo > cartorio'), element => {
            const cartorioSeparator = result.addSeparator('Protestos em Cartório',
                $('nome', element).text(),
                $('endereco', element).text()).css('margin-top', '40px').css('background', 'url(images/textures/brilliant.png),linear-gradient(180deg,#f70808,#fff 160%)');
            cartorioSeparator.hide();
            cartorioSeparator.find('.container').remove();

            const nomeCartorio = result.addItem('Nome do Cartório', $('protestos', element).text());
            result.addItem('Endereço do Cartório', $('endereco', element).text());

            /*result.addItem('Protestos', $('protestos', element).text()).addClass('center');
            result.addItem('Telefone', $('telefone', element).text());
            let cidade = $('cidade', element).text();
            if (cidade) result.addItem('Cidade', cidade);*/
            const protestosDoCartorio = [];

            $('protesto', element).each((i, v) => protestosDoCartorio.push(parseFloat($('valor', v).text())));

            result.addItem('Protestos', $('protestos', element).text());

            if (protestosDoCartorio.length) {
                const valorTotal = protestosDoCartorio.reduce((a, b) => a + b);
                result.addItem('Valor Total no Cartório', numeral(valorTotal).format('$0,0.00'));
            } else {
                return;
            }

            let cidade = $('cidade', element).text();
            if (cidade) result.addItem('Cidade', cidade);

            $('protesto', element).each((i, v) => {
                let data = $('data', v).text();
                let valor = $('valor', v).text();

                if ((data && !/^\s*$/.test(data)) && (valor && !/^\s*$/.test(valor))) {
                    fieldsCreator.addItemWithBorder({
                        date: {
                            name: 'Data do protesto',
                            value: moment(data, ['YYYY-MM-DD', 'DD-MM-YYYY']).format('DD/MM/YYYY')
                        },
                        moneyValue: {
                            name: 'Valor do protesto',
                            value: numeral(valor.replace('.', ',')).format('$0,0.00')
                        }
                    });
                }

                /*result.addSeparator('Detalhes de Protesto',
                    'Informações a respeito de um dos títulos representados no cartório.',
                    'Verifique as informações a respeito de valor e data referentes a um protesto.');

                if (data && !/^\s*$/.test(data)) result.addItem('Data do protesto', moment(data, ['YYYY-MM-DD', 'DD-MM-YYYY']).format('DD/MM/YYYY'));
                if (valor && !/^\s*$/.test(valor)) result.addItem('Valor do protesto', numeral(valor.replace('.', ',')).format('$0,0.00'), 'valor');*/
            });

            fieldsCreator.element().css({
                borderBottom: '2px solid #2196F3'
            }).hide();

            const collapseBtn = $('<i>').addClass('fa fa-chevron-circle-down').css({ marginTop: '0.4em', cursor: 'pointer' });
            const botaoMostrarProcessos = $('<div>').css({
                backgroundColor: 'rgb(251, 65, 36)',
                color: '#fff',
                textAlign: 'center',
                padding: '5px',
                fontWeight: 'bold',
                marginBottom: '20px',
            }).text('Mostrar Protestos').append($('<br>'))
            .append(collapseBtn);

            const elementFields = fieldsCreator.element();

            result.element().append(elementFields);
            botaoMostrarProcessos.insertAfter(nomeCartorio.parents().eq(1));
            collapseBtn.on('click', (ev) => {
                ev.preventDefault();
                if (collapseBtn.hasClass('fa-chevron-circle-down')) {
                    collapseBtn.removeClass('fa-chevron-circle-down').addClass('fa-chevron-circle-up');
                    elementFields.show(500);
                } else {
                    collapseBtn.removeClass('fa-chevron-circle-up').addClass('fa-chevron-circle-down');
                    elementFields.hide(500);
                }
            });
            fieldsCreator.resetFields();
        });

        return result.element();
    };

    controller.registerBootstrap('parserIEPTB', callback => {
        callback();
        controller.importXMLDocument.register('IEPTB', 'WS', parserConsultasWS);
    });

};
