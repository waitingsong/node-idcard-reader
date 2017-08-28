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
    const device = idcr.find_device();

     if (device.port) {
         idcr.connect_device(device);
         console.log('device:', device);

         idcr.find_card(device).then(msg => {
             console.log('Found card ' + msg);

             const res = idcr.select_card(device);

             console.log('Select card ' + (res ? 'succeed' : 'failed'));

             if (res) {
                 const data = idcr.read_card(device);

                 if ( ! data.err) {
                     console.log('Read card succeed');
                 }
             }

             idcr.disconnect_device(device.port);
         }).catch(ex => {
             console.log(ex);
             idcr.disconnect_device(device.port);
         });
     }
});

