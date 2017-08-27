/// <reference types="node" />

import * as ffi from 'ffi';
import * as ref from 'ref';
import {tmpdir} from 'os';

const tmpDir = tmpdir();
const dllTxt = __dirname + '/../../lib/sdtapi.dll';
const dllImage = __dirname + '/../../lib/wltrs.dll';
// console.log(tmpDir);

export interface IDCRConfig {
    dllTxt: string;
    dllImage: string;
    findCardRetryTimes?: number | undefined;    // 找卡重试数量，间隔1sec
}

const config: IDCRConfig = {
    dllTxt: '',
    dllImage: '',
    findCardRetryTimes: 5,
};

export function init(args: IDCRConfig): Promise<string | void> {
    Object.assign(config, args);

    if ( ! config.dllTxt) {
        return Promise.reject('dllTxt defined or blank');
    }
    if ( ! config.dllImage) {
        return Promise.reject('dllImage defined or blank');
    }

    if (typeof config.findCardRetryTimes === 'undefined' || isNaN(config.findCardRetryTimes) || config.findCardRetryTimes < 0) {
        config.findCardRetryTimes = 5;
    }

    return Promise.resolve();
}

interface h {
    SDT_OpenPort(port: number): number; // 查找设备并打开端口
    SDT_ClosePort(port: number): number;  // 关闭端口
    SDT_StartFindIDCard(port: number, pucIIN: Buffer, iIfOpen: number): number; // 找卡
}

const h: h = ffi.Library(dllTxt, {
    'SDT_OpenPort': ['int', ['int'] ],   // 查找设备端口
    'SDT_ClosePort': ['int', ['int'] ],  // 关闭端口
    'SDT_StartFindIDCard': ['int', ['int', 'pointer', 'int'] ],  // 找卡 port,0,0
    'SDT_SelectIDCard': ['int', ['int', 'pointer', 'int'] ], // 选卡
    'SDT_ReadBaseMsg': ['int', ['int', 'pointer', 'pointer', 'pointer', 'pointer', 'int'] ], // 读取基础信息
    'SDT_GetSAMStatus': ['int', ['int', 'int'] ],   // 对 SAM 进行状态检测
    'SDT_ResetSAM': ['int', ['int', 'int'] ],   // 重置SAM
});

export interface DeviceConfig {
    port: number;   // device connect port
    useUsb: boolean;    // device access mode usb or serial
    openPort: number;   // port reopen during call function every time
}

export function find_device(): DeviceConfig  {
    const res = {
        port: 0,
        useUsb: true,
        openPort: 0,
    };

    // 必须先检测usb端口
    for (let i = 1000; i <= 1016; i++) {
        if (h.SDT_OpenPort(i) === 144) {
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
        if (h.SDT_OpenPort(i) === 144) {
            res.port = i;
            res.useUsb = false;
            console.log(`Found device at serial port: ${i}`);
            disconnect_device(res.port);
            break;
        }
    }
    return res;
}

export function connect_device(opts: DeviceConfig): void  {
        if (h.SDT_OpenPort(opts.port) === 144) {
            opts.openPort = 1;
        }
        else {
            opts.port = 0;
            opts.openPort = 0;
        }
}

export function disconnect_device(port: number): number {
    const res = h.SDT_ClosePort(port);

    console.log('disconnect device at port:' + port, res);
    return res;
}

// 找卡
export function find_card(opts: DeviceConfig): Promise<string | void> {
    console.time('find_card elps');

    return new Promise((resolve, reject) => {
        if (_find_card(opts) === 159) {
            console.timeEnd('find_card');
            resolve();
            return;
        }

        if (config.findCardRetryTimes && config.findCardRetryTimes > 0) {
            let c = 0;
            const intv = setInterval(() => {
                if (c >= <number> config.findCardRetryTimes) {
                    clearInterval(intv);
                    console.timeEnd('find_card elps');
                    reject(`find_card fail over ${c}times`);
                    return;
                }

                const res = _find_card(opts);

                if (res === 159) {
                    clearInterval(intv);
                    console.timeEnd('find_card');
                    setTimeout(resolve, 4000);  // 移动中读取到卡 延迟执行选卡
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

function _find_card(opts: DeviceConfig): number {
    try {
        const buf = Buffer.alloc(4);

        // buf.type = ref.types.int;
        return h.SDT_StartFindIDCard(opts.port, buf, opts.openPort);
    }
    catch(ex) {
        console.error(ex);
        return 0;
    }
}
