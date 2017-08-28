export interface Init {
    dllTxt: string; // path of sdtapi.dll
    dllImage: string;   // path of wltrs.dll
    findCardRetryTimes?: number;    // 找卡重试数量，间隔1sec
}

export const init: Init = {
    dllTxt: '',
    dllImage: '',
    findCardRetryTimes: 5,
};

export interface h {
    SDT_OpenPort(port: number): number; // 查找设备并打开端口
    SDT_ClosePort(port: number): number;  // 关闭端口
    SDT_StartFindIDCard(port: number, pucIIN: Buffer, iIfOpen: number): number; // 找卡
}

export interface Device {
    port: number;   // device connect port
    useUsb: boolean;    // device access mode usb or serial
    openPort: number;   // port reopen during call function every time
}

