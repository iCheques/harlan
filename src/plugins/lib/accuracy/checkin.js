import {
    DistanceMeter
} from './distance-meter';
import uuid from 'uuid';
import basename from 'basename';

module.exports = controller => {

    let cameraResume = null;
    document.addEventListener('resume', ({pendingResult}) => {
        if (pendingResult && pendingResult.pluginStatus === 'OK' &&
            pendingResult.pluginServiceName === 'Camera') {
            cameraResume = pendingResult.result;
        }
    }, false);

    controller.registerCall('accuracy::checkin::picture', (obj, callback, cameraErrorCallback) => {
        if (!navigator.camera || !navigator.camera.getPicture) {
            callback(obj);
            return;
        }

        let successCallback = imageURI => {
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (dirEntry) => {
                window.resolveLocalFileSystemURL(imageURI, (fileEntry) => {
                    fileEntry.copyTo(dirEntry, obj[0].file, (photoEntry) => {
                        obj[0].uri = photoEntry.toURL();
                        callback(obj);
                    }, () => cameraErrorCallback('Não foi possível persistir a imagem'));
                }, () => cameraErrorCallback('Não foi possível abrir a imagem'));
            }, () => cameraErrorCallback('Não foi possível capturar o diretório de dados'));
        };

        if (cameraResume) {
            successCallback(cameraResume);
            cameraResume = null;
        }

        navigator.camera.getPicture(successCallback, cameraErrorCallback, {
            quality: 50,
            targetWidth: 600,
            targetHeight: 600,
            sourceType: Camera.PictureSourceType.CAMERA,
            destinationType: Camera.DestinationType.FILE_URI,
            saveToPhotoAlbum: false,
            correctOrientation: true
        });
    });

    controller.registerCall('accuracy::checkin::send::image', (cb, obj) => {
        let formdata = new FormData();
        controller.accuracyServer.upload('saveImages', {
            token: obj[0].file,
            employee_id: obj[0].employee_id
        }, {
            file: obj[0].uri,
            fileKey: 'file',
            fileName: `${obj[0].file}.jpg`,
            mimeType: 'image/jpeg',
            success: () => cb(),
            error: () => cb('O envio fracassou, verifique sua conexão com a internet e entre em contato com o suporte')
        });
    });

    controller.registerCall('accuracy::checkin::send', (cb, obj) => {
        controller.accuracyServer.call('saveAnswer', obj, {
            success: () => {
                cb();
                if (obj[0].uri) {
                    controller.sync.job('accuracy::checkin::send::image', null, obj);
                }
            },
            error: () => cb('O envio fracassou, verifique sua conexão com a internet e entre em contato com o suporte')
        });
    });

    controller.registerCall('accuracy::checkin::object', (
        campaign,
        {coordinates, id},
        callback,
        geolocationErrorCallback,
        type = 'checkIn'
    ) => {
        let blockui = controller.call('blockui', {
            icon: 'fa-location-arrow',
            message: 'Aguarde enquanto capturamos sua localização.'
        });

        let timeout = setTimeout(() => {
            blockui.message.text('Estamos demorando para capturar sua localização. Experimente ir para um local aberto, certifique de ativar o Wi-Fi, dados e GPS.');
        }, 6000);

        controller.call('accuracy::authentication::data', authData =>
            navigator.geolocation.getCurrentPosition(({coords}) => {
                clearTimeout(timeout);
                blockui.mainContainer.remove();
                let distance = DistanceMeter(coordinates, coords);
                callback([{
                    type: type,
                    time: moment().format('HH:mm'),
                    created_date: moment().format('DD/MM/YYYY'),
                    store_id: id,
                    campaign_id: campaign.id,
                    employee_id: authData[0].id,
                    token: uuid.v4(),
                    file: uuid.v4(),
                    questions: [],
                    verifyCoordinates: {
                        local: `${coords.latitude},${coords.longitude}`,
                        store: coordinates
                    },
                    approved: coordinates ? (distance >
                        controller.confs.accuracy.geofenceLimit ? 'N' : 'Y') : 'Y'
                }]);
            }, (...args) => {
                clearTimeout(timeout);
                blockui.mainContainer.remove();
                geolocationErrorCallback(...args);
            }));
    });

};
