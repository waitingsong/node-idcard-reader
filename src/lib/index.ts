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

