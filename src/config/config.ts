export interface Init {
    dllTxt: string; // path of sdtapi.dll
    dllImage: string;   // path of wltrs.dll
    findCardRetryTimes?: number;    // 找卡重试数量，间隔1sec
}

// 初始化参数
export const init: Init = {
    dllTxt: '',
    dllImage: '',
    findCardRetryTimes: 5,
};

// dll接口方法
export interface ApiTxt {
    SDT_OpenPort(port: number): number; // 查找设备并打开端口
    SDT_ClosePort(port: number): number;  // 关闭端口
    SDT_StartFindIDCard(port: number, pucIIN: Buffer, iIfOpen: number): number; // 找卡
    SDT_SelectIDCard(port: number, pucSN: Buffer, iIfOpen: number): number; // 选卡
}

// ffi调用dll接口方法
export interface ApiTxtDll {
    [fn: string]: [string, [string]];
}

export const apiTxtDll: ApiTxtDll = {
    'SDT_OpenPort': ['int', ['int'] ],   // 查找设备端口
    'SDT_ClosePort': ['int', ['int'] ],  // 关闭端口
    'SDT_StartFindIDCard': ['int', ['int', 'pointer', 'int'] ],  // 找卡 port,0,0
    'SDT_SelectIDCard': ['int', ['int', 'pointer', 'int'] ], // 选卡
    'SDT_ReadBaseMsg': ['int', ['int', 'pointer', 'pointer', 'pointer', 'pointer', 'int'] ], // 读取基础信息
    'SDT_GetSAMStatus': ['int', ['int', 'int'] ],   // 对 SAM 进行状态检测
    'SDT_ResetSAM': ['int', ['int', 'int'] ],   // 重置SAM
};

// 读卡设置
export interface Device {
    port: number;   // device connect port
    useUsb: boolean;    // device access mode usb or serial
    openPort: number;   // port reopen during call function every time
}

