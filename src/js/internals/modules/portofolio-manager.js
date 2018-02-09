export default controller => {

    let webSocket;

    controller.registerCall('portofolio::manager::init', () => {
        webSocket = controller.serverCommunication.webSocket();
        controller.interface.helpers.activeWindow('.portofolio');
    });

};
