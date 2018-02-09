module.exports = controller => {

    let xhr;

    const onDocumentSuccess = (sectionDocumentGroup, current_id, element) => ret => {
        const append = controller.call('xml::document', ret);
        append.data('on-remove', element);
        append.data('save-id', current_id);
        sectionDocumentGroup[1].append(append);
    };

    controller.registerTrigger('find::document::show', 'find::document::show', (args, callback) => {
        callback();

        const name = args[0];
        const description = args[1];
        const ids = args[2];
        const element = $(args[3]);

        controller.call('loader::register');

        let running = ids.length;
        const sectionDocumentGroup = controller.call('section', name, description,
            (ids.length === 1 ?
                'Um registro armazenado' :
                `${ids.length.toString()} registros armazenados`));
        const doneCallback = () => {
            if (!--running) {
                controller.call('loader::unregister');
                $('.app-content').prepend(sectionDocumentGroup[0].addClass('saved'));
            }
        };

        for (const i in ids) {
            const current_id = ids[i];

            controller.serverCommunication.call('SELECT FROM \'HARLAN\'.\'DOCUMENT\'', {
                data: {
                    id: current_id
                },
                success: onDocumentSuccess(sectionDocumentGroup, current_id, element),
                complete: doneCallback
            });
        }
    });

    const items = [];
    controller.registerTrigger('find::database::instant::search', 'findDocument::instant::search', (args, callback) => {
        if (xhr && xhr.readyState != 4) {
            xhr.abort();
        }

        for (const i in items) {
            items[i].remove();
        }

        if (!/^[a-z]{2,}[a-z\s*]/i.test(args[0])) {
            callback();
            return;
        }

        xhr = controller.serverCommunication.call('SELECT FROM \'HARLAN\'.\'SEARCH\'', {
            data: {
                data: args[0]
            },
            success(ret) {
                $(ret).find('result > node').each((idx, node) => {
                    const jnode = $(node);

                    const codes = jnode.find('code node');
                    const length = codes.length;
                    const description = `${length === 1 ? 'Armazenado um (1) resultado' : `Armazenados ${length.toString()} resultado`} para este nome e descrição.`;

                    const title = jnode.find('_id name').text();
                    const subtitle = jnode.find('_id description').text();
                    items.push(args[1].item(title,
                        subtitle,
                        description, null, null, true).addClass('saved').click(function () {
                        controller.trigger('find::document::show', [title, subtitle, $.map(codes, code => $(code).text()), this]);
                    }));
                });
            },
            complete() {
                callback();
            }
        });
    });

    controller.registerCall('find::document::autocomplete', args => {
        const fieldName = args[0];
        const fieldDescription = args[1];
        let searchId;
        let searchLength;
        let xhr;

        const autocomplete = controller.call('autocomplete', fieldName);

        fieldName.keyup(() => {
            const search = fieldName.val();
            const newLength = search.length;
            if (newLength === searchLength)
                return;

            autocomplete.empty();
            searchLength = newLength;

            if (searchId)
                clearTimeout(searchId);

            searchId = setTimeout(() => {
                if (xhr) {
                    xhr.abort();
                }
                xhr = controller.serverCommunication.call('SELECT FROM \'HARLAN\'.\'SEARCH\'', {
                    data: {
                        data: search
                    },
                    success(ret) {
                        $(ret).find('result > node').each((idx, node) => {
                            const jnode = $(node);

                            const codes = jnode.find('code node');
                            const length = codes.length;
                            const description = `${length === 1 ? 'Armazenado um (1) resultado' : `Armazenados ${length.toString()} resultado`} para este nome e descrição.`;

                            const title = jnode.find('_id name').text();
                            const subtitle = jnode.find('_id description').text();

                            items.push(autocomplete.item(title,
                                subtitle,
                                description, null, null, true).addClass('saved').click(() => {
                                fieldName.val(title);
                                fieldDescription.val(subtitle);
                            }));
                        });
                    }
                });

            }, controller.confs.instantSearchDelay);
        });

        return autocomplete;
    });

};