import async from 'async';

/**
 * Módulo responsável por listar as consultas do INFO.INFO na UX
 */
module.exports = controller => {

    let xhr;

    const parseWrapper = field => {
        const jField = $(field);
        const options = jField.find('option');
        const attributes = {
            name: jField.attr('name'),
            required: jField.attr('required') === 'true' ? true : false,
            placeholder: !options.length ? jField.attr('description') : null,
        };

        if (!options.length) {
            attributes['data-mask'] = jField.attr('mask');
        }

        const label = $('<label />').text(jField.attr('caption'));
        const input = $(!options.length ? '<input />' : '<select />').attr(attributes);

        options.each((idx, optNode) => {
            const jOptNode = $(optNode);
            input.append($('<option />').text(jOptNode.text()).attr('value', jOptNode.attr('value')));
        });

        return $('<div />')
            .addClass('input-wrapper')
            .append(label)
            .append(input);
    };

    const factoryShowForm = (section, button) => e => {
        e.preventDefault();
        const iButton = button.find('i');
        const flipElements = section.find('form, section, footer');
        if (iButton.hasClass('fa-minus-square-o')) {
            flipElements.hide();
            iButton.removeClass().addClass('fa fa-plus-square-o');
        } else {
            iButton.removeClass().addClass('fa fa-minus-square-o');
            flipElements.show();
        }
    };

    const parseFormContent = (tableJNode, databaseJNode, header, wrappers) => {
        let nFields = wrappers.length;
        if (nFields % 2)
            nFields += 1;

        const inputLines = [];

        for (let line = 0, idxField = 0; line < nFields / 2; line++, idxField += 2) {
            const inputLine = $('<div />').addClass('input-line').append(wrappers[idxField]);
            if (typeof wrappers[idxField + 1] !== 'undefined') {
                inputLine.append(wrappers[idxField + 1]);
            }
            inputLines.push(inputLine);
        }

        const contentFilters = $('<div />').addClass('content-filters');
        for (const idxLine in inputLines) {
            contentFilters.append(inputLines[idxLine]);
        }

        return $('<div />')
            .addClass('container filters')
            .append($('<div />').addClass('content').append(contentFilters));
    };

    const parseForm = (tableJNode, databaseJNode, header, section) => {
        const wrappers = [];

        const form = $('<form />').addClass('block-filters').attr({
            method: 'post',
            action: '#'
        });

        tableJNode.find('field').each((idx, field) => {
            wrappers.push(parseWrapper(field));
        });

        form.append(parseFormContent(tableJNode, databaseJNode, header, wrappers));

        const inputLine = $('<div />').addClass('input-line');
        if (tableJNode.attr('harlanSearch') === 'enabled')
            inputLine.append($('<div />').addClass('input-wrapper').append($('<input />').attr({
                value: 'Pesquisar',
                type: 'submit'
            }).addClass('submit')));

        form.find('.content-filters').append(inputLine);

        form.submit(controller.call('database::search::submit', [form, tableJNode, databaseJNode, section]));

        return form;
    };

    const factoryCloseSection = section => e => {
        e.preventDefault();
        section.remove();
    };

    const parseHeader = (tableJNode, databaseJNode, section) => {
        const header = $('<header />');
        const container = $('<div />').addClass('container');
        const content = $('<div />').addClass('content');
        const form = parseForm(tableJNode, databaseJNode, header, section);

        content.append($('<h2 />').text(databaseJNode.attr('label') || databaseJNode.attr('name')));
        content.append($('<h3 />').text(tableJNode.attr('label') || tableJNode.attr('name')));
        content.append($('<div />').addClass('results-display').text(tableJNode.attr('description')));

        const actions = $('<ul />').addClass('actions');
        actions.append($('<li />').addClass('display-loader').append($('<i />').addClass('fa fa-spinner fa-spin')));
        const maximizeButton = $('<li />').addClass('action-resize').append($('<i />').addClass('fa fa-minus-square-o'));
        const closeButton = $('<li />').addClass('action-close').append($('<i />').addClass('fa fa-times-circle'));
        maximizeButton.click(factoryShowForm(section, maximizeButton));
        closeButton.click(factoryCloseSection(section));
        actions.append(maximizeButton);
        actions.append(closeButton);
        content.prepend(actions);

        header.append(container.append(content)).append(form);
        section.append(header);
    };

    const parseSection = (tableJNode, databaseJNode, section) => {
        section.append($('<section />').addClass('results'));
    };

    const parseFooter = (tableJNode, databaseJNode, section) => {
        const footer = $('<footer />').addClass('load-more hide');
        const container = $('<div />').addClass('container');
        const content = $('<div />').addClass('content').text('Mais Resultados');
        section.append(footer.append(container.append(content)));
    };

    const parseTable = (tableJNode, databaseJNode) => {
        const section = $('<section />').addClass('group-type database');
        parseHeader(tableJNode, databaseJNode, section);
        parseSection(tableJNode, databaseJNode, section);
        parseFooter(tableJNode, databaseJNode, section);
        return section;
    };

    const loadExternalJavascript = (domTable, jElement) => {
        const scripts = jElement.find('harlanJSONP');
        if (!scripts.length)
            return false;

        async.each(scripts.toArray(),
            (element, callback) => $.getScript($(element).text(), () => callback()),
            () => $('.app-content').prepend(domTable));

        return true;
    };

    const items = [];

    const parseDocument = (jDocument, text, modal) => {

        text = text.toLowerCase();

        for (const idx in items) {
            items[idx].remove();
        }

        jDocument.find('database table[harlan="enabled"]').each((idx, element) => {
            const tableJNode = $(element);
            const databaseJNode = tableJNode.closest('database');

            const matchText = node => {
                const validAttrs = ['label', 'name', 'description'];
                for (const idx in validAttrs) {
                    if (node.attr(validAttrs[idx]).toLowerCase().includes(text))
                        return true;
                }
                return false;
            };

            if (!(matchText(databaseJNode) || matchText(tableJNode))) {
                return;
            }

            items.push(modal.item(databaseJNode.attr('label') || databaseJNode.attr('name'),
                tableJNode.attr('label') || tableJNode.attr('name'),
                tableJNode.attr('description'))
                .addClass('database')
                .click(() => {
                    const domTable = parseTable(tableJNode, databaseJNode);
                    controller.trigger(`findDatabase::table::${databaseJNode.attr('name').toUpperCase()}::${tableJNode.attr('name').toUpperCase()}`, {
                        dom: domTable,
                        about: tableJNode
                    });
                    if (!loadExternalJavascript(domTable, tableJNode)) {
                        $('.app-content').prepend(domTable);
                    }
                }));
        });
    };

    controller.registerTrigger('find::database::instant::search', 'find::database::instant::search', (args, callback) => {
        if (xhr && xhr.readyState != 4) {
            xhr.abort();
        }

        const text = args[0];
        const modal = args[1];

        if (!/^[a-z]{3,}[a-z\s*]/i.test(text)) {
            callback();
            return;
        }

        xhr = controller.serverCommunication.call('SELECT FROM \'INFO\'.\'INFO\'', {
            complete() {
                callback();
            },
            success(domDocument) {
                parseDocument($(domDocument), text, modal);
            },
            cache: true
        });
    });

    controller.registerBootstrap('databaseSearch', callback => {
        callback();
        $('.input-q').each((i, v) => {
            let inputDatabaseSearch = $(v);
            const autocomplete = controller.call('autocomplete', inputDatabaseSearch);

            let searchLength;
            let searchId;

            inputDatabaseSearch.keyup(() => {
                const search = inputDatabaseSearch.val();
                const newLength = search.length;

                if (newLength === searchLength)
                    return;

                autocomplete.empty();
                searchLength = newLength;

                if (searchId)
                    clearTimeout(searchId);

                searchId = setTimeout(() => {
                    $('.q').addClass('loading');
                    controller.trigger('find::database::instant::search', [search, autocomplete], (args, callback) => {
                        if (typeof callback === 'function') {
                            callback();
                        }
                        $('.q').removeClass('loading');
                    });
                }, controller.confs.instant::searchDelay);
            });
        });
    });
};
