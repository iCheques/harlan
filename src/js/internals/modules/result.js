import assert from 'assert';
import _ from 'underscore';

const IS_EMPTY = /^\s*$/;

module.exports = controller =>  {

    const Result = function (inputContainer, inputContent, inputResult)  {
        let container = inputContainer || $('<div />').addClass('container');
        let content = inputContent || $('<div />').addClass('content');
        const result = inputResult || $('<div />').addClass('result');

        if (!inputResult)
            result.append(container.append(content));

        this.addSeparator = (title, subtitle, description, items) =>  {
            items = items || {};
            items.container = $('<div />').addClass('container');
            items.result = {
                oldContainer: container,
                oldContent: content
            };
            items.content = $('<div />').addClass('content');
            items.headerContainer = $('<div />').addClass('container');
            items.headerContent = $('<div />').addClass('content');
            items.headerTitle = $('<h4 />').text(title);
            items.headerSubtitle = $('<h5 />').text(subtitle);
            items.menu = $('<ul >').addClass('actions');
            items.resultsDisplay = $('<div />').addClass('results-display').text(description);

            items.headerContainer.append(items.headerContent);
            items.headerContent.append(items.menu);
            items.headerContent.append(items.headerTitle);
            items.headerContent.append(items.headerSubtitle);
            items.headerContent.append(items.resultsDisplay);

            items.addItem = icon =>  {
                const item = $('<li />').addClass('action-resize').extend($('<i />').addClass(`fa fa-${icon}`));
                items.menu.append(item);
                return item;
            };

            const header = $('<header />')
                .addClass('separator')
                .append(items.headerContainer);

            result.append(header);

            container = $('<div />').addClass('container');
            content = $('<div />').addClass('content');
            result.append(container.append(content));

            return header;
        };

        this.block = () =>  {
            const ret = $('<div />');
            content.append(ret);
            return ret;
        };

        const generateAlert = (radial, percent, context) =>  {
            context = context || {
                60: 'attention',
                80: 'warning'
            };
            let styleDefinition = null;

            radial.element.removeClass(_.toArray(context).join(' '));

            for (const minPerc in context) {
                if (percent < parseInt(minPerc)) {
                    break;
                }
                styleDefinition = context[minPerc];
            }

            if (styleDefinition) {
                radial.element.addClass(styleDefinition);
            }

            return radial;
        };

        this.generateRadial = (name, percent, context) =>  {
            const item = this.addItem(name, '').addClass('center');
            const itemValue = item.find('.value');

            const widget = controller.interface.widgets.radialProject(itemValue, percent);

            const radial =  generateAlert(widget, percent, context);

            const change = radial.change;
            radial.change = percent =>  {
                change(percent);
                generateAlert(radial, percent, context);
            };

            return radial;
        };

        this.addNonEmptyItem = (name, value, tagname) => {
            if (IS_EMPTY.test(value)) {
                return null; /* avoid empty */
            }
            return this.addItem(name, value, tagname);
        };

        this.addDateItem = (name, value, fromFormat, toFormat, tagname) => {
            if (IS_EMPTY.test(value)) {
                return null; /* avoid empty */
            }
            return this.addItem(name, moment(value, fromFormat).format(toFormat), tagname);
        };

        this.addIcon = (name, icon, action) => {
            const node = $('<div />').addClass('field icon');

            node.append($('<div />').addClass('value')
                .append($('<i />').addClass(`fa ${icon}`))).click(e => {
                e.preventDefault();
                if (action) action();
            });

            node.append($('<div />').addClass('name').text(name));
            content.append(node);

            return node;
        };

        this.addItem = (name, value, tagname, after) =>  {
            const node = $('<div />').addClass('field');

            if (typeof tagname !== typeof undefined) {
                node.attr('data-tagname', tagname);
            }

            if (typeof value !== typeof undefined) {
                node.append($('<div />').addClass('value').html(value));
            }

            if (typeof name !== typeof undefined) {
                node.append($('<div />').addClass('name').text(name));
            }

            content.append(node);

            if(after == true) {
                content.append($('<br>'));
            }

            return node;
        };

        this.addNetwork = (nodesArray, edgesArray, options = {})=> {
            let elem = $('<div />').addClass('result-network');

            let network = new vis.Network(elem.get(0), {
                nodes: nodesArray,
                edges: edgesArray
            }, options);

            content.append(elem);
            return [network, elem];
        };

        this.content = () =>  content;

        this.element = () =>  result;

        return this;
    };

    controller.registerCall('result', () =>  new Result());

    controller.registerCall('result::import', result =>  {
        assert.ok(result.hasClass('result'));

        const container = result.find('.container').first();
        assert.ok(container.length > 0);

        const content = container.find('.content');
        assert.ok(content.length > 0);

        return new Result(container, content, result);
    });

};
