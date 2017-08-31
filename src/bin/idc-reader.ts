#!/usr/bin/env node
import * as idcr from '../lib/index';


const settings: idcr.config.init = {
    dllTxt: 'c:/sdtapi.dll',
    dllImage: 'c:/wltrs.dll',
};

idcr.init(settings).then((inited) => {
    if ( ! inited) {
        return;
    }
    const devices = idcr.find_device_list();

    if (devices.length) {
        idcr.fetch_data(devices[0]).then(data => {
            console.log(data);
        });
    }
});

