module.exports = controller => {

    controller.registerCall('authentication::logout', () => {
        delete sessionStorage.apiKey;

        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage(null);
        }
        if (controller.confs.isCordova) {
            controller.call('authentication::unsetSessionId', () => {
                controller.trigger('authentication::logout::end');
                if (navigator.serviceWorker && navigator.serviceWorker.controller)
                    navigator.serviceWorker.controller.postMessage(null);
                location.reload(true); /* prevent information leak */
            });
        } else {
            window.location = `http://www.${window.location.hostname.replace('painel.','')}/`;
        }
    });

};
