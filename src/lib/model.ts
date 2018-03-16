export interface Options {
  dllTxt: string // path of sdtapi.dll
  dllImage?: string | undefined   // path of wltrs.dll 可空则不处理头像
  findCardRetryTimes?: number    // 找卡重试数量，间隔1sec
  imgSaveDir?: string            // 头像图片保存目录 空则使用 系统临时目录/idcard-reader
  debug?: boolean
  searchAll?: boolean // search all available device , stop searching at first device found if false
}

// dll接口方法
export interface ApiBase {
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
  SDT_ReadAllAppMsg(port: number, pucAppMsg: Buffer, puiAppMsgLen: Buffer, iIfOpen: number): number
}

// ffi调用dll接口方法
export interface ApiDll {
  [fn: string]: [string, string[]]
}

export interface DeviceOptions extends Options {
  dllImage: string   // path of wltrs.dll 可空则不处理头像
  findCardRetryTimes: number    // 找卡重试数量，间隔1sec
  imgSaveDir: string            // 头像图片保存目录 空则使用 系统临时目录/idcard-reader
  debug: boolean
  searchAll: boolean // search all available device , stop searching at first device found if false
}

// 读卡设置
export interface Device {
  port: number   // device connect port
  useUsb: boolean    // device access mode usb or serial
  openPort: number   // port reopen during call function every time
  inUse: boolean // device in use
  samid: string      // SAM id
  options: DeviceOptions
  apib: ApiBase
}

export interface RawData {
  err: number    // 读取错误标识 0表示读取成功
  code: number    // 读卡结果码
  text: Buffer   // 文本信息
  image: Buffer  // 图片信息 需要解码
  imagePath: string  // 图片文件地址
}

// tslint:disable-next-line
export interface IDData {
  base: DataBase | null // object
  imagePath: string  // image file path
  samid: string  // SAM id
}

export interface DataBase {
  name: string       // 姓名
  gender: number // 1男，2女
  genderName: string
  nation: string // 民族代码
  nationName: string // 民族中文
  birth: string  // 出生日期
  address: string   // 住址
  idc: string  // 身份证号
  regorg: string   // 签发机关
  startdate: string  // 有效期开始
  enddate: string    // 有效期结束 日期或者"长期"
}

export interface ExecFileOptions {
  cwd?: string
  env?: object
  encoding?: 'utf8' | string
  timeout?: 0 | number
  maxBuffer?: number
  killSignal?: string
  uid?: number
  gid?: number
  windowsHide?: boolean
  windowsVerbatimArguments?: boolean
}
// param options of fs.writeFile()
export interface WriteFileOptions {
  encoding?: string | null
  mode?: number
  flag?: string
}
