import {
  CompositeOpts, DeviceOpts,
} from '@waiting/idcard-reader-base'


/** sdtapi.dll 接口方法类型 */
export interface DllFuncsModel {
  /** 查找设备并打开端口 */
  SDT_OpenPort(port: number): number
  /** 关闭端口 */
  SDT_ClosePort(port: number): number
  /** 找卡 */
  SDT_StartFindIDCard(port: number, pucIIN: Buffer, iIfOpen: number): number
  /** 选卡 */
  SDT_SelectIDCard(port: number, pucSN: Buffer, iIfOpen: number): number
  SDT_ReadBaseMsg(
    port: number,
    pucCHMsg: Buffer,
    puiCHMsgLen: Buffer,
    pucPHMsg: Buffer,
    puiPHMsgLen: Buffer,
    iIfOpen: number): number
  SDT_GetSAMIDToStr(port: number, pcSAMID: Buffer, ilfOpen: number): number
  // 读取追加信息 (端口号，指向读到的追加信息，指向读到的追加信息长度，ilfOpen) 返回值0x90-读取追加信息成功，其他-读取追加信息失败}
  SDT_ReadNewAppMsg(port: number, pucAppMsg: Buffer, puiAppMsgLen: Buffer, ilfOpen: number): number
  // SDT_ReadAllAppMsg(port: number, pucAppMsg: Buffer, puiAppMsgLen: Buffer, iIfOpen: number): number
}

/** WltRS.dll 接口方法类型 */
export interface WltRsModel {
  /** 读取头像照片 */
  GetBmp(fileName: string, intf: number): number
}


// 读卡设置
export interface Device {
  apib: DllFuncsModel
  apii: WltRsModel | null
  deviceOpts: DeviceOpts
  compositeOpts: CompositeOpts
  /** device in use */
  inUse: boolean
  /** device access mode usb or serial */
  useUsb: boolean
  openPort: number
  /** SAM id */
  // samid: string
}
