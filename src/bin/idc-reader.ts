import * as IDCR from '../lib/index';

const settings = {
    dllTxt: 'd:/sdtapi.dll',
    dllImage: 'd:/wltrs.dll',
}

IDCR.init(settings).then((inited) => {
    if ( ! inited) {
        return;
    }
    const config: IDCR.DeviceConfig = IDCR.find_device();

     if (config.port) {
         IDCR.connect_device(config);
         console.log('config:', config);
     
         IDCR.find_card(config).then(res => {
             console.log('found card', res);
     
             IDCR.disconnect_device(config.port);
         }).catch(ex => {
             console.log(ex);
             IDCR.disconnect_device(config.port);
         });
     }
});

