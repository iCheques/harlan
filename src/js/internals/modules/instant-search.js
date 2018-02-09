module.exports = controller => {

    controller.registerCall('instant::search', (input, callback, autocomplete = controller.call('autocomplete', input)) => {
        let searchLength;
        let searchId;

        input.keyup(() => {
            const search = input.val();
            const newLength = search.length;

            if (newLength === searchLength)
                return;

            autocomplete.empty();
            searchLength = newLength;

            if (searchId) {
                clearTimeout(searchId);
            }

            searchId = setTimeout(() => {
                input.addClass('loading');
                callback(search, autocomplete, () => {
                    input.removeClass('loading');
                });
            }, controller.confs.instantSearchDelay);
        });
    });
};
