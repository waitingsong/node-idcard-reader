import * as ffi from 'ffi';
import * as ref from 'ref';
import {tmpdir} from 'os';

const tmpDir = tmpdir();
const dllCard = __dirname + '/../../lib/sdtapi.dll';
const dllImage = __dirname + '/../../lib/wltrs.dll';
console.log(tmpDir);


interface h {
    SDT_OpenPort(port: number): number; // 查找设备并打开端口
    SDT_ClosePort(port: number): number;  // 关闭端口
}

const h: h = ffi.Library(dllCard, {
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
