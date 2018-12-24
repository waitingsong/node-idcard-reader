export type Options = Partial<DeviceOpts> & Partial<CompositeOpts>

export interface Config {
  appDir: string  // base directory of this module
  tmpDir: string
}

export interface DeviceOpts {
  /* path of sdtapi.dll */
  dllTxt: string
  /* path of wltrs.dll 空则不处理头像 */
  dllImage: string
  /* 找卡重试数量，间隔1sec */
  findCardRetryTimes: number
  /* 头像图片保存目录 空则使用 系统临时目录/idcard-reader */
  imgSaveDir: string
  debug: boolean
  /* search all available device , stop searching at first device found if false */
  searchAll: boolean
}

export interface CompositeOpts {
  /* whether composeite image. Default false */
  useComposite: boolean,
  /* 合成图片保存目录. 默认 系统临时目录/idcard-reader */
  compositeDir: string
  /* 1-100 (percent) Default 35 */
  compositeQuality: number
  /* output image full path name. Default jpg */
  compositeType: 'bmp' | 'gif' | 'jpg' | 'png' | 'webp'
  /* CSS style. Default: #303030 */
  textColor: string
  /* font path */
  fontHwxhei: string
  fontOcrb: string
  fontSimhei: string
}

/* sdtapi.dll 接口方法类型 */
export interface DllFuncsModel {
  SDT_OpenPort(port: number): number // 查找设备并打开端口
  SDT_ClosePort(port: number): number  // 关闭端口
  SDT_StartFindIDCard(port: number, pucIIN: Buffer, iIfOpen: number): number // 找卡
  SDT_SelectIDCard(port: number, pucSN: Buffer, iIfOpen: number): number // 选卡
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

/* WltRS.dll 接口方法类型 */
export interface WltRsModel {
  /* 读取头像照片 */
  GetBmp(fileName: string, intf: number): number
}


// 读卡设置
export interface Device {
  /* device connect port */
  port: number
  /* device access mode usb or serial */
  useUsb: boolean
  /* port reopen during call function every time */
  openPort: number
  /* device in use */
  inUse: boolean
  /* SAM id */
  samid: string
  options: DeviceOpts
  compositeOpts: CompositeOpts
  apib: DllFuncsModel
  apii: WltRsModel | null
}

export interface RawData {
  /* 读取错误标识 0表示读取成功 */
  err: number
  /* 读卡结果码 */
  code: number
  /* 文本信息 */
  text: Buffer
  /* 头像图片信息 需要解码 */
  image: Buffer
  /* 头像图片文件地址 */
  imagePath: string
}

// tslint:disable-next-line: interface-name
export interface IDData {
  /* base info */
  base: DataBase | null
  /* avatar image file path */
  imagePath: string
  /* SAM id */
  samid: string
  /* 合成图片文件路径 */
  compositePath: string
}

export interface DataBase {
  /** 姓名 */
  name: string
  /** 1男，2女 */
  gender: number
  genderName: string
  /** 民族代码 */
  nation: string
  /** 民族中文 */
  nationName: string
  /** 出生日期 */
  birth: string
  /** 住址 */
  address: string
  /** 身份证号 */
  idc: string
  /** 签发机关 */
  regorg: string
  /** 有效期开始 */
  startdate: string
  /** 有效期结束 日期或者'长期' */
  enddate: string
}


export type FnCallParams = string[] | never[] // calling params
export type FnParams = [string, FnCallParams] // def for ffi [returnType, [calling param, ...]]
export interface DllFuncs {
  [fn: string]: FnParams
}
