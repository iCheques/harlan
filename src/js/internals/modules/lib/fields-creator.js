export default class FieldsCreator {
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
