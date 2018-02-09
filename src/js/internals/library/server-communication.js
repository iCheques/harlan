/**
 * Módulo de Comunicação com a BIPBOP
 * @author Lucas Fernando Amorim <lf.amorim@bipbop.com.br>
 */

import SHA256 from 'crypto-js/sha256';
import _ from 'underscore';

const BipbopError = Error.extend('BipbopError', 0);

export default function (controller) {

    Object.assign(bipbop, 
        _.pick(controller.confs, 'websocketAddress', 'webserviceAddress'),
        _.pick(controller.query, 'websocketAddress', 'webserviceAddress'));

    /**
     * Api Key
     * @type string
     */
    let bipbopApiKey = BIPBOP_FREE;

    /** O Harlan é assíncrono e o BIPBOP Loader bloqueante */
    $.bipbopDefaults.automaticLoader = false;

    /**
     * Default WebSocket Callback
     * @param {WebSocket Data} data
     * @returns {undefined}
     */
    const defaultCallback = (data, event) => {
        controller.trigger('server::communication::websocket::event', event);
        if (data.method) {
            controller.trigger(`serverCommunication::websocket::${data.method}`, data.data);
        }
    };

    /* BIPBOP WebSocket */
    this.webSocket = bipbop.webSocket(bipbopApiKey, defaultCallback, ws => {
        controller.trigger('server::communication::websocket::open', ws);
    });

    this.freeKey = () => bipbopApiKey === BIPBOP_FREE;

    this.userHash = () => SHA256(bipbopApiKey);

    /* BIPBOP API Key */
    this.apiKey = (apiKey) => {
        if (apiKey && bipbopApiKey !== apiKey) {
            bipbopApiKey = apiKey;
            if (navigator.serviceWorker && navigator.serviceWorker.controller)
                navigator.serviceWorker.controller.postMessage(controller.server.apiKey());
            this.webSocket(apiKey);
        }
        return bipbopApiKey;
    };

    /* Retorna o XHR da requisição AJAX */
    this.call = (query, configuration) => {
        let conf = Object.assign({method: 'POST'}, configuration);
        controller.trigger('server::communication::call', [query, conf]);
        return $.bipbop(query, bipbopApiKey, conf)
            .always((...args) => controller.trigger('server::communication::response::complete', [query, configuration, args]));
    };

    this.promise = (query, configuration) => Promise.resolve()
        .then(() => this.call(query, controller.call('error::ajax', Object.assign(configuration, {
            error() {
                throw new BipbopError('Não foi possível processar a sua requisição');
            },
            bipbopError(exceptionType, exceptionMessage, exceptionCode, push) {
                throw new BipbopError.extend(`BipbopError${exceptionType}`, exceptionCode)({
                    exceptionMessage,
                    exceptionCode,
                    push,
                    toString() {
                        return exceptionMessage;
                    }
                });
            }
        }), false)));

    /* ALIAS */
    this.request = this.call;

    return this;
};

export { BipbopError };
