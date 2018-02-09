module.exports = controller => {
    if (controller.confs.kronoos.isKronoos) {
        controller.unregisterTrigger('authentication::authenticated', 'welcomeScreen::authenticated');
        controller.unregisterTrigger('server::communication::websocket::authentication', 'account::overview');
    }
};
