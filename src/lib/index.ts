/// <reference types="node" />

import * as ffi from 'ffi';
import * as path from 'path';
import * as fs from 'fs';
import * as config from '../config/config';
import {tmpdir} from 'os';

const tmpDir = tmpdir();
let apit: config.ApiTxt;
// console.log(tmpDir);


export function init(args: config.Init): Promise<boolean> {
    Object.assign(config.init, args);

    if (typeof config.init.dllTxt === 'undefined' || ! config.init.dllTxt) {
        return Promise.reject('dllTxt defined or blank');
    }
    if (typeof config.init.dllImage === 'undefined' || ! config.init.dllImage) {
        return Promise.reject('dllImage defined or blank');
    }
    config.init.dllTxt = path.normalize(config.init.dllTxt);
    config.init.dllImage = path.normalize(config.init.dllImage);
    console.log(config.init);

    if (typeof config.init.findCardRetryTimes === 'undefined' || isNaN(config.init.findCardRetryTimes) || config.init.findCardRetryTimes < 0) {
        config.init.findCardRetryTimes = 5;
    }

    return validate_dll_files(config.init).then(err => {
        if ( ! err) {
            apit = ffi.Library(config.init.dllTxt, config.apiTxtDll);
            // console.log(apit)
        }
        return Promise.resolve(err ? false : true);
    });

}

function validate_dll_files(settings: config.Init): Promise<string | void> {
    return new Promise((resolve, reject) => {
        fs.stat(settings.dllTxt, (err, stats) => {
            if (err && err.code === 'ENOENT') {
                return reject('File not exists: ' + settings.dllTxt);
            }
            resolve();
        });
    }).then(() => {
        fs.stat(settings.dllImage, (err, stats) => {
            if (err && err.code === 'ENOENT') {
                return Promise.reject('File not exists: ' + settings.dllImage);
            }
            return Promise.resolve();
        });
    }).catch(ex => {
        console.error(ex);
        return Promise.resolve('not');
    });
}


export function find_device(): config.Device {
    const res = {
        port: 0,
        useUsb: true,
        openPort: 0,
    };

    // 必须先检测usb端口
    for (let i = 1000; i <= 1016; i++) {
        if (apit.SDT_OpenPort(i) === 144) {
            res.port = i;
            res.useUsb = true;
            console.log(`Found device at usb port: ${i}`);
            disconnect_device(res.port);
            break;
        }
    }
    if (res.port) {
        return res;
    }
    // 检测串口
    for (let i = 1; i <= 16; i++) {
        if (apit.SDT_OpenPort(i) === 144) {
            res.port = i;
            res.useUsb = false;
            console.log(`Found device at serial port: ${i}`);
            disconnect_device(res.port);
            break;
        }
    }
    return res;
}

export function connect_device(opts: config.Device): void  {
        if (apit.SDT_OpenPort(opts.port) === 144) {
            opts.openPort = 1;
        }
        else {
            opts.port = 0;
            opts.openPort = 0;
        }
}

export function disconnect_device(port: number): boolean {
    const res = apit.SDT_ClosePort(port);

    console.log(`disconnect device at port: ${port} ` + (res === 144 ? 'succeed' : 'failed'));
    return res === 144 ? true : false;
}

// 找卡
export function find_card(opts: config.Device): Promise<string | void> {
    console.time('find_card.elps');

    return new Promise((resolve, reject) => {
        if (_find_card(opts) === 159) {
            console.timeEnd('find_card.elps');
            resolve('succeed');
            return;
        }

        if (typeof config.init.findCardRetryTimes !== 'undefined' && config.init.findCardRetryTimes > 0) {
            let c = 0;
            const intv = setInterval(() => {
                if (c >= <number> config.init.findCardRetryTimes) {
                    clearInterval(intv);
                    console.timeEnd('find_card.elps');
                    reject(`find_card fail over ${c}times`);
                    return;
                }

                const res = _find_card(opts);

                if (res === 159) {
                    clearInterval(intv);
                    console.timeEnd('find_card.elps');
                    setTimeout(resolve, 4000, 'succeed');  // 移动中读取到卡 延迟执行选卡
                    return;
                }
                c += 1;
            }, 1000);
        }
        else {
            reject('No found card');
        }
    });
}

function _find_card(opts: config.Device): number {
    try {
        const buf = Buffer.alloc(4);

        return apit.SDT_StartFindIDCard(opts.port, buf, opts.openPort);
    }
    catch(ex) {
        console.error(ex);
        return 0;
    }
}


// 选卡
export function select_card(device: config.Device): boolean {
    const buf = Buffer.alloc(4);
    const res = apit.SDT_SelectIDCard(device.port, buf, device.openPort);

    return res === 144 ? true : false;
}


export function read_card(device: config.Device): config.RawData {
    const opts = {
        pucCHMsg:  Buffer.alloc(1024),
        puiCHMsgLen: Buffer.from([1024]),
        pucPHMsg: Buffer.alloc(1024),
        puiPHMsgLen: Buffer.from([1024]),
    };

    // console.log(opts)

    const data: config.RawData = {
        err: 1,
        code: 0,
        text: opts.pucCHMsg,
        image: opts.pucPHMsg,
    };

    try {
        const res = apit.SDT_ReadBaseMsg(device.port, opts.pucCHMsg,  opts.puiCHMsgLen, opts.pucPHMsg, opts.puiPHMsgLen, device.openPort);

        data.code = res;
        data.err = res === 144 ? 0 : 1;
        // console.log(opts.pucCHMsg.toString())

        return data;
    }
    catch(ex) {
        console.error(ex);
        return data;
    }
}


export function retrive_data(data: config.RawData): config.IDData {
    const res = <config.IDData> {};

    try {
        res.base = _retrive_text(data.text);
        return res;
    }
    catch(ex) {
        console.error('retrive_data()', ex);
        return res;
    }
}

function _retrive_text(data: Buffer): config.DataBase  {
    const s: string = data && data.byteLength ? data.toString('ucs2') : '';
    const i: config.DataBase = {
        name: '',
        gender: 0,
        genderName: '',
        nation: '00',
        nationName: '',
        birth: '',
        address: '',
        idc: '',
        regorg: '',
        startdate: '',
        enddate: '',
    };

    if ( ! s || ! s.length) {
        return i;
    }

    i.name = s.slice(0, 15).trim();
    i.gender = +s.slice(15, 16);
    i.nation = s.slice(16, 18); // 民族
    i.birth = s.slice(18, 26);  // 16
    i.address = s.slice(26, 61).trim();   // 70
    i.idc = s.slice(61, 79);  // 身份证号
    i.regorg = s.slice(79, 94).trim();   // 签发机关
    i.startdate = s.slice(94, 102);
    i.enddate = s.slice(102, 110);

    format_base(i);
    console.log(i);

    return i;
}

function format_base(base: config.DataBase): void {
    switch (base.gender) {
        case 1:
            base.genderName = '男';
            break;
        case 2:
            base.genderName = '女';
            break;
        default:
            base.genderName = '未知';
            break;
    }
    const s = config.nationMap.get(base.nation);

    base.nationName = s ? s.trim() : '未知';
}
