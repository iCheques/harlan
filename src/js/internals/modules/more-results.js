/*jshint -W083 */

const MoreResults = function (maxItems) {
    const footer = $('<footer />').addClass('load-more');
    const container = $('<div />').addClass('container');
    const content = $('<div />').addClass('content').text('Mais Resultados');
    let items = [];
    let callit = null;

    footer.append(container.append(content)).hide();

    this.close = () =>  {
        footer.remove();
    };

    footer.click(e => {
        e.preventDefault();
        this.show();
    });

    this.show = (complete, i = 0) => {
        const onComplete = (...p) => {
            if (complete) complete(...p);
            footer.show();
        };

        footer.hide();

        let item;
        for (; i < maxItems; i++) {

            item = items.shift();

            if (!item && callit) {
                callit((newItems) => {
                    if (!newItems || !newItems.length) {
                        this.close();
                        onComplete(i, items);
                        return;
                    }
                    items = newItems;
                    this.show(onComplete, i);
                });
                return this;
            }

            if (!item) {
                break;
            }

            item.insertBefore(footer);
        }

        if (!items.length && callit) {
            callit((newItems) => {
                if (!newItems || !newItems.length) {
                    this.close();
                } else {
                    items = newItems;
                    onComplete(i, items);
                }
            });
        } else {
            if (!items.length) this.close();
            onComplete(i, items);
        }

        return this;
    };

    this.callback = callback =>  {
        callit = callback;
        return this;
    };

    this.append = element =>  {
        items.push(element);
        return this;
    };

    this.appendTo = element =>  {
        footer.appendTo(element);
        return this;
    };

    this.element = () =>  footer;

    return this;
};

module.exports = controller => {
    controller.registerCall('more::results', (maxItems) =>  new MoreResults(maxItems));
};
