#!/usr/bin/env node
import * as idcr from '../lib/index';

const settings = {
    dllTxt: 'c:/sdtapi.dll',
    dllImage: 'c:/wltrs.dll',
};

idcr.init(settings).then((inited) => {
    if ( ! inited) {
        return;
    }
    const device = idcr.find_device();

    if (device.port) {
        idcr.fetch_data(device).then(data => {
            console.log(data);
        });
    }
});

