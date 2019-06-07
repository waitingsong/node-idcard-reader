import { Device as DeviceBase } from '@waiting/idcard-reader-base'
import { FModel as FM } from 'win32-def'

/** sdtapi.dll 接口方法类型 */
export interface DllFuncsModel extends FM.DllFuncsModel {
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
    pucCHMsg: Buffer, // 文字信息
    puiCHMsgLen: Buffer, // 文字信息长度
    pucPHMsg: Buffer, // 照片信息
    puiPHMsgLen: Buffer, // 照片信息长度
    iIfOpen: number): number
  SDT_GetSAMIDToStr(port: number, pcSAMID: Buffer, ilfOpen: number): number
  // 读取追加信息 (端口号，指向读到的追加信息，指向读到的追加信息长度，ilfOpen) 返回值0x90-读取追加信息成功，其他-读取追加信息失败}
  SDT_ReadNewAppMsg(port: number, pucAppMsg: Buffer, puiAppMsgLen: Buffer, ilfOpen: number): number
  // SDT_ReadAllAppMsg(port: number, pucAppMsg: Buffer, puiAppMsgLen: Buffer, iIfOpen: number): number

  SDT_ResetSAM(port: number, iIfOpen: number): number
}

/** WltRS.dll 接口方法类型 */
export interface WltRsModel extends FM.DllFuncsModel {
  /** 读取头像照片 */
  GetBmp(fileName: string, intf: number): number
}

export interface Device extends DeviceBase {
  apib: DllFuncsModel
  apii: WltRsModel | null
}
