module.exports = controller => {

    let getPicture = (successCallback, errorCallback) => {

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            errorCallback('No multimedia resource available');
        }

        navigator.mediaDevices.getUserMedia({
            video: true
        }).then(stream => {
            let videoContainer = $('<div />').addClass('video-container');
            let container = $(controller.confs.container);

            let [height, width] = [
                container.outerHeight(),
                container.outerWidth()
            ];

            let video = $('<video />').attr({
                height,
                width,
                autoplay: 'autoplay'
            }).appendTo(videoContainer);

            $('<div />')
                .addClass('drop-button')
                .append($('<i />').addClass('fa fa-times'))
                .appendTo(videoContainer)
                .click(e => {
                    e.preventDefault();
                    videoContainer.remove();
                    if (stream) stream.getTracks()[0].stop();
                    errorCallback();
                });

            let snap = $('<div />')
                .addClass('snap-button')
                .append($('<i />').addClass('fa fa-camera'))
                .appendTo(videoContainer)
                .click(e => {
                    e.preventDefault();

                    let [videoHeight, videoWidth] = [video.get(0).videoHeight,
                        video.get(0).videoWidth];

                    let canvas = $('<canvas />').attr({
                        width: videoWidth,
                        height: videoHeight,
                    });

                    canvas.appendTo(videoContainer);
                    let context = canvas.get(0).getContext('2d');
                    context.drawImage(video.get(0), 0, 0, videoWidth, videoHeight);

                    stream.getTracks()[0].stop();
                    stream = null;
                    video.remove();
                    snap.remove();
                    let image = canvas.get(0).toDataURL('image/jpeg').replace(/^data\:image\/jpeg\;base64\,/, '');
                    videoContainer.remove();
                    successCallback(image);
                });

            $(controller.confs.container).append(videoContainer);

            video.get(0).src = window.URL.createObjectURL(stream);
            video.get(0).play();
        }).catch(errorCallback);
    };

    navigator.camera = navigator.camera || {};
    navigator.camera.getPicture = navigator.camera.getPicture || getPicture;
    controller.registerCall('take::picture', getPicture);

};
