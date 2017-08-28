#!/usr/bin/env node
import * as idcr from '../lib/index';

const settings = {
    dllTxt: 'd:/sdtapi.dll',
    dllImage: 'd:/wltrs.dll',
};

idcr.init(settings).then((inited) => {
    if ( ! inited) {
        return;
    }
    const config = idcr.find_device();

     if (config.port) {
         idcr.connect_device(config);
         console.log('config:', config);

         idcr.find_card(config).then(res => {
             console.log('found card', res);

             idcr.disconnect_device(config.port);
         }).catch(ex => {
             console.log(ex);
             idcr.disconnect_device(config.port);
         });
     }
});

