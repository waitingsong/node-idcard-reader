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
    SDT_ReadBaseMsg(port: number, pucCHMsg: Buffer, puiCHMsgLen: Buffer, pucPHMsg: Buffer, puiPHMsgLen: Buffer, iIfOpen: number): number;
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

export interface RawData {
    err: number;    // 读取错误标识 0表示读取成功
    code: number;    // 读卡结果码
    text: Buffer;   // 文本信息
    image: Buffer;  // 图片信息 需要解码
}

export interface IDData {
    base: DataBase;
    image: string;
}

export interface DataBase {
    name: string;       // 姓名
    gender: number; // 1男，2女
    genderName: string;
    nation: string; // 民族代码
    birth: string;  // 出生日期
    address: string;   // 住址
    idc: string;  // 身份证号
    regorg: string;   // 签发机关
    startdate: string;  // 有效期开始
    enddate: string;    // 有效期结束
}
