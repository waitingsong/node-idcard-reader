/// <reference types="node" />

import * as ffi from 'ffi';
import * as path from 'path';
import * as fs from 'fs';
import * as config from '../config/config';
import {tmpdir} from 'os';

const tmpDir = tmpdir();
let apib: config.ApiBase;
// console.log(tmpDir);


export function init(args: config.Init): Promise<boolean> {
    Object.assign(config.init, args);

    if (typeof config.init.dllTxt === 'undefined' || ! config.init.dllTxt) {
        return Promise.reject('dllTxt defined or blank');
    }
    config.init.dllTxt = path.normalize(config.init.dllTxt);
    config.init.dllImage = config.init.dllImage ? path.normalize(config.init.dllImage) : '';
    console.log(config.init);

    if (typeof config.init.findCardRetryTimes === 'undefined' || isNaN(config.init.findCardRetryTimes) || config.init.findCardRetryTimes < 0) {
        config.init.findCardRetryTimes = 5;
    }

    return validate_dll_files(config.init).then(err => {
        if ( ! err) {
            apib = ffi.Library(config.init.dllTxt, config.apiTxtDll);
            // console.log(apib)
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
        return new Promise<string | void>((resolve, reject) => {
            if (typeof settings.dllImage === 'string' && settings.dllImage) {
                fs.stat(settings.dllImage, (err, stats) => {
                    if (err) {
                        console.error(err);
                        return reject('File not exists: ' + settings.dllImage);
                    }
                    return resolve();
                });
            }
            else {
                // 未指定照片解码dll 允许
                return resolve();
            }
        });
    }).catch(ex => {
        return Promise.resolve('not');
    });
}

export function find_device_list(all: boolean = true): config.Device[] {
    const arr: config.Device[] = [];

    // 必须先检测usb端口
    for (let i = 1000; i <= 1016; i++) {
        if (apib.SDT_OpenPort(i) === 144) {
            const res = {
                port: i,
                useUsb: true,
                openPort: 1,
                samid: '',
            };

            console.log(`Found device at usb port: ${i}`);
            get_samid(res);
            res.openPort = 0;
            disconnect_device(res.port);

            arr.push(res);
            if ( ! all) {
                break;
            }
        }
    }

    // 检测串口
    for (let i = 1; i <= 16; i++) {
        if (apib.SDT_OpenPort(i) === 144) {
            const res = {
                port: i,
                useUsb: false,
                openPort: 1,
                samid: '',
            };

            console.log(`Found device at serial port: ${i}`);
            get_samid(res);
            res.openPort = 0;
            disconnect_device(res.port);

            arr.push(res);
            if ( ! all) {
                break;
            }
        }
    }
    return arr;
}

export function find_device(): config.Device {
    const res = {
        port: 0,
        useUsb: true,
        openPort: 0,
        samid: '',
    };

    // 必须先检测usb端口
    for (let i = 1000; i <= 1016; i++) {
        if (apib.SDT_OpenPort(i) === 144) {
            res.port = i;
            res.useUsb = true;
            res.openPort = 1;
            console.log(`Found device at usb port: ${i}`);
            get_samid(res);
            res.openPort = 0;
            disconnect_device(res.port);
            break;
        }
    }
    if (res.port) {
        return res;
    }
    // 检测串口
    for (let i = 1; i <= 16; i++) {
        if (apib.SDT_OpenPort(i) === 144) {
            res.port = i;
            res.useUsb = false;
            console.log(`Found device at serial port: ${i}`);
            res.openPort = 1;
            get_samid(res);
            res.openPort = 0;
            disconnect_device(res.port);
            break;
        }
    }
    return res;
}

export function connect_device(opts: config.Device): void  {
        if (apib.SDT_OpenPort(opts.port) === 144) {
            opts.openPort = 1;
        }
        else {
            opts.port = 0;
            opts.openPort = 0;
        }
}

export function disconnect_device(port: number): boolean {
    const res = apib.SDT_ClosePort(port);

    console.log(`disconnect device at port: ${port} ` + (res === 144 ? 'succeed' : 'failed'));
    return res === 144 ? true : false;
}

// 找卡
export function find_card(opts: config.Device): Promise<string> {
    console.time('find_card.elps');

    return new Promise<string>((resolve, reject) => {
        if (_find_card(opts) === 159) {
            console.timeEnd('find_card.elps');
            return resolve('succeed');
        }

        if (typeof config.init.findCardRetryTimes !== 'undefined' && config.init.findCardRetryTimes > 0) {
            let c = 0;
            const intv = setInterval(() => {
                if (c >= <number> config.init.findCardRetryTimes) {
                    clearInterval(intv);
                    console.timeEnd('find_card.elps');
                    return reject(`find_card fail over ${c}times`);
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
    }).catch(ex => {
        console.error(ex);
        return Promise.resolve('No found card');
    });
}

function _find_card(device: config.Device): number {
    try {
        const buf = Buffer.alloc(4);

        return apib.SDT_StartFindIDCard(device.port, buf, device.openPort);
    }
    catch(ex) {
        console.error(ex);
        return 0;
    }
}


// 选卡
export function select_card(device: config.Device): boolean {
    const buf = Buffer.alloc(4);
    const res = apib.SDT_SelectIDCard(device.port, buf, device.openPort);

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
        imagePath: '',
    };

    try {
        data.code = apib.SDT_ReadBaseMsg(device.port, opts.pucCHMsg,  opts.puiCHMsgLen, opts.pucPHMsg, opts.puiPHMsgLen, device.openPort);
    }
    catch(ex) {
        console.error(ex);
    }

    if (data.code === 144) {
        data.err = 0;
    }

    return data;
}


// 若device参数空或者未设置config.init.dllImage值 则不读取处理头像
export function retrive_data(data: config.RawData, device?: config.Device): Promise<config.IDData> {
    const res = <config.IDData> {};

    try {
        res.samid = device ? device.samid : '';
        res.base = _retrive_text(data.text);
        if (device && config.init.dllImage) {
            return decode_image(device, data.image).then(str => {
                res.imagePath = str ? str : '';
                return res;
            });
        }
        else {
            res.imagePath = '';
        }
    }
    catch(ex) {
        console.error('retrive_data()', ex);
    }

    return Promise.resolve(res);
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
    // console.log(i);

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

    base.startdate && (base.startdate.trim());
    base.enddate && (base.enddate.trim());

    base.nationName = s ? s.trim() : '未知';
}


function decode_image(device: config.Device, buf: Buffer): Promise<string> {
    // console.log(buf.slice(0, 10));
    const name = path.join(tmpDir, _gen_image_name('idcrimage_'));
    const tmpname = name + '.wlt';
    if ( ! config.init.dllImage) {
        return Promise.resolve('');
    }
    const apii = ffi.Library(config.init.dllImage, config.apiImgDll);

    if ( ! apii) {
        return Promise.resolve('');
    }

    return new Promise<string>((resolve, reject) => {
        fs.writeFile(tmpname, buf, (err) => {
            if (err) {
                fs.unlink(tmpname, err => {
                    console.error('unlink tmp image file failure', err);
                });
                return reject(err);
            }
            console.log('image tmp has been saved:' + tmpname);

            const res = apii.GetBmp(tmpname, device.useUsb);
            const ipath = path.normalize(name + '.bmp');
            console.log('resolve image res:' + res, ipath);

            resolve(ipath);
        });
    }).catch((ex: NodeJS.ErrnoException) => {
        console.error(ex);
        return '';
    });
}

function _gen_image_name(prefix: string): string {
    const d = new Date();
    const mon = d.getMonth();
    const day = d.getDate();
    const rstr = Math.random().toString().slice(-8);

    return `${prefix}${ d.getFullYear() }${(mon > 9 ? mon : '0' + mon)}${( day > 9 ? day : '0' + day )}_${rstr}`;
}

export function fetch_data(device: config.Device): Promise<config.IDData | boolean> {
    if (device.port) {
        connect_device(device);
        console.log('device:', device);

        return find_card(device).then((msg) => {
            console.log('Found card ' + msg);

            const res = select_card(device);

            console.log('Select card ' + (res ? 'succeed' : 'failed'));
            if (res) {
                const rdata = read_card(device);

                if ( ! rdata.err) {
                    console.log('Read card succeed');
                    return Promise.resolve(rdata);
                }
                else {
                    return Promise.reject('rea_card() failed');
                }
            }

            return Promise.reject('select card failed');
        })
            .then(rdata => {
                return retrive_data(rdata, device).then(data => {
                    console.log('Retrive data succeed');
                    disconnect_device(device.port);

                    return data;
                });
            })
            .catch(ex => {
                console.error(ex);
                disconnect_device(device.port);
                return Promise.resolve(false);
            });
    }
    else {
        return Promise.resolve(false);
    }
}

export function get_samid(device: config.Device): void {
    const buf = Buffer.alloc(40);
    const res = apib.SDT_GetSAMIDToStr(device.port, buf, device.openPort);

    if (res === 144) {
        device.samid = buf.toString('utf8').trim().replace(/\u0000/g, '');
    }
}
