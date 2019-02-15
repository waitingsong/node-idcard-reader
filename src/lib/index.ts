import {
  createDirAsync,
  createFileAsync,
  isDirExists,
  isFileExists,
  join,
  normalize,
} from '@waiting/shared-core'
import * as ffi from 'ffi'
import {
  of,
  range,
  timer,
} from 'rxjs'
import {
  concatMap,
  filter,
  mapTo,
  mergeMap,
  take,
  tap,
} from 'rxjs/operators'

import { handleAvatar, handleBaseInfo } from './composite'
import {
  dllFuncs,
  dllImgFuncs,
  initialOpts,
  nationMap,
  GetBmpResMap,
} from './config'
import {
  CompositeOpts,
  DataBase,
  Device,
  DeviceOpts,
  DllFuncsModel,
  IDData,
  Options,
  RawData,
} from './model'



export async function init(args: Options): Promise<Device[]> {
  const opts = <typeof initialOpts> { ...initialOpts, ...args }
  const deviceOpts = <DeviceOpts> {}
  const compositeOpts = <CompositeOpts> {}

  if (! opts.dllTxt) {
    return Promise.reject('params dllTxt undefined or blank')
  }
  deviceOpts.dllTxt = normalize(opts.dllTxt)
  deviceOpts.dllImage = opts.dllImage ? normalize(opts.dllImage) : ''
  deviceOpts.imgSaveDir = opts.imgSaveDir && typeof opts.imgSaveDir === 'string'
    ? normalize(opts.imgSaveDir)
    : initialOpts.imgSaveDir
  deviceOpts.debug = !!opts.debug
  deviceOpts.searchAll = !!opts.searchAll
  deviceOpts.findCardRetryTimes = +opts.findCardRetryTimes

  if (isNaN(deviceOpts.findCardRetryTimes) || deviceOpts.findCardRetryTimes < 0) {
    deviceOpts.findCardRetryTimes = initialOpts.findCardRetryTimes
  }

  compositeOpts.useComposite = opts.dllImage && opts.useComposite
    ? true
    : initialOpts.useComposite
  compositeOpts.compositeDir = opts.compositeDir && typeof opts.compositeDir === 'string'
    ? normalize(opts.compositeDir)
    : initialOpts.compositeDir
  compositeOpts.compositeQuality = typeof opts.compositeQuality === 'number' &&
    opts.compositeQuality >= 1 && opts.compositeQuality <= 100
      ? opts.compositeQuality
      : initialOpts.compositeQuality
  compositeOpts.textColor = opts.textColor ? opts.textColor : initialOpts.textColor

  if (opts.compositeType) {
    if (! ['bmp', 'gif', 'jpg', 'png', 'webp'].includes(opts.compositeType)) {
      throw new TypeError('compositeType value invalid')
    }
    compositeOpts.compositeType = opts.compositeType
  }
  else {
    compositeOpts.compositeType = initialOpts.compositeType
  }
  compositeOpts.fontHwxhei = opts.fontHwxhei
  compositeOpts.fontOcrb = opts.fontOcrb
  compositeOpts.fontSimhei = opts.fontSimhei


  logger(opts, opts.debug)

  await validateDllFiles(deviceOpts)
  const apib = ffi.Library(opts.dllTxt, dllFuncs)
  const devices = findDeviceList(deviceOpts, apib, compositeOpts)

  if (devices && devices.length) {
    return devices
  }
  else {
    return Promise.reject('未找到读卡设备')
  }
}

// read card data
export async function read(device: Device): Promise<IDData | void> {
  if (device.port) {
    connectDevice(device)
    logger(['device:', device], device.options.debug)

    try {
      await findCard(device)
      const res = selectCard(device)
      logger('Select card ' + (res ? 'succeed' : 'failed'), device.options.debug)

      if (res) {
        const raw = readCard(device)

        if (!raw.err) {
          const iddata = retriveData(raw, device)
          disconnectDevice(device)

          return iddata.then(async data => {
            data.compositePath = data && device.options.dllImage && device.compositeOpts.useComposite === true
              ? await composite(data, device.compositeOpts)
              : ''
            return data
          })
        }
      }
    }
    catch (ex) {
      disconnectDevice(device)
      throw ex
    }
  }
}


/* Composite image with data. Return result path */
export async function composite(data: IDData, options: CompositeOpts): Promise<string> {
  if (! data || ! data.base) {
    throw new TypeError('data value invalid')
  }
  const ret = handleAvatar(data.imagePath).pipe(
    concatMap(avatar => {
      return handleBaseInfo(<DataBase> data.base, avatar, options)
    }),
  )

  return ret.toPromise()
}


async function validateDllFiles(opts: DeviceOpts): Promise<void> {
  if (! await isFileExists(opts.dllTxt)) {
    throw new Error('File not exists: ' + opts.dllTxt)
  }
  // 允许 未指定照片解码dll
  if (opts.dllImage && ! await isFileExists(opts.dllImage)) {
    throw new Error('File not exists: ' + opts.dllImage)
  }

  return testWrite(opts.imgSaveDir)
}


async function testWrite(dir: string | void): Promise<void> {
  if (!dir) {
    throw new Error('value of imgSaveDir empty')
  }
  if (! await isDirExists(dir)) {
    await createDirAsync(dir)
    await createFileAsync(join(dir, '.test'), 'idctest') // 创建测试文件
  }
  // logger('imgSaveDir: ' + dir)
}

function findDeviceList(options: Device['options'], apib: DllFuncsModel, compositeOpts: CompositeOpts): Device[] {
  const arr: Device[] = []

  // 必须先检测usb端口
  for (let i = 1000; i <= 1016; i++) {
    if (apib.SDT_OpenPort(i) === 144) {
      const device: Device = {
        port: i,
        useUsb: true,
        openPort: 1,
        inUse: true,
        samid: '',
        options,
        compositeOpts,
        apib,
        apii: null,
      }

      logger(`Found device at usb port: ${i}`, options.debug)
      getSamid(device)
      device.openPort = 0
      disconnectDevice(device)

      arr.push(device)
      if (!options.searchAll) {
        break
      }
    }
  }

  if (!options.searchAll && arr.length) {
    return arr
  }

  // 检测串口
  for (let i = 1; i <= 16; i++) {
    if (apib.SDT_OpenPort(i) === 144) {
      const device: Device = {
        port: i,
        useUsb: false,
        openPort: 1,
        inUse: true,
        samid: '',
        options,
        compositeOpts,
        apib,
        apii: null,
      }

      logger(`Found device at serial port: ${i}`, options.debug)
      getSamid(device)
      device.openPort = 0
      disconnectDevice(device)

      arr.push(device)
      if (!options.searchAll) {
        break
      }
    }
  }

  return arr
}


function connectDevice(device: Device): void {
  if (device && device.inUse) {
    logger('connectDevice() device in use', true)
    return
  }

  if (device.apib.SDT_OpenPort(device.port) === 144) {
    device.openPort = 1
    device.inUse = true
  }
  else {
    device.port = 0
    device.openPort = 0
    device.inUse = false
  }
}

function disconnectDevice(device: Device): boolean {
  const res = device.apib.SDT_ClosePort(device.port)

  logger(`disconnect device at port: ${device.port} ` + (res === 144 ? 'succeed' : 'failed'), device.options.debug)
  device.inUse = false
  return res === 144 ? true : false
}


export function findCard(device: Device): Promise<void> {
  const findCardRetryTimes = device.options.findCardRetryTimes
  const findRet$ = range(0, findCardRetryTimes > 0 ? findCardRetryTimes + 1 : 1).pipe(
    concatMap((value, index: number) => {
      if (index > 0 && index >= findCardRetryTimes) {
        throw new Error(`findCard fail over ${findCardRetryTimes} times`)
      }

      // 移动中读取到卡 延迟执行选卡
      const delay$ = timer(index === 0 ? 0 : 2000)
      return delay$.pipe(
        mergeMap(() => of(_findCard(device))),
      )
    }),
  )
  const ret$ = findRet$.pipe(
    tap(ret => {
      logger(`findStatus: ${ret}`, device.options.debug)
    }),
    filter(ret => ret === 159),
    take(1),
    mapTo(void 0),
  )

  return ret$.toPromise()
}

function _findCard(device: Device): number {
  try {
    const buf = Buffer.alloc(4)

    return device.apib.SDT_StartFindIDCard(device.port, buf, device.openPort)
  }
  catch (ex) {
    logger(ex, true)
    return 0
  }
}


// 选卡
export function selectCard(device: Device): boolean {
  const buf = Buffer.alloc(4)
  const res = device.apib.SDT_SelectIDCard(device.port, buf, device.openPort)

  return res === 144 ? true : false
}

// pick fields from origin text
export function pickFields(text: string): DataBase {
  const ret: DataBase = {
    name: '',
    gender: 0,
    genderName: '',
    nation: '00',
    nationName: '',
    birth: '',
    address: '',
    idc: '',
    regorg: '',
    startdate: '',
    enddate: '',
  }

  if (!text || !text.length) {
    return ret
  }

  ret.name = text.slice(0, 15).trim()
  ret.gender = +text.slice(15, 16)
  ret.nation = text.slice(16, 18) // 民族
  ret.birth = text.slice(18, 26)  // 16
  ret.address = text.slice(26, 61).trim()   // 70
  ret.idc = text.slice(61, 79)  // 身份证号
  ret.regorg = text.slice(79, 94).trim()   // 签发机关
  ret.startdate = text.slice(94, 102)
  ret.enddate = text.slice(102, 110)

  formatBase(ret)

  return ret
}

function readCard(device: Device): RawData {
  const opts = {
    pucCHMsg: Buffer.alloc(1024),
    puiCHMsgLen: Buffer.from([1024]),
    pucPHMsg: Buffer.alloc(1024),
    puiPHMsgLen: Buffer.from([1024]),
  }
  // console.log(opts)

  const data: RawData = {
    err: 1,
    code: 0,
    text: opts.pucCHMsg,
    image: opts.pucPHMsg,
    imagePath: '',
  }

  try {
    data.code = device.apib.SDT_ReadBaseMsg(
      device.port,
      opts.pucCHMsg,
      opts.puiCHMsgLen,
      opts.pucPHMsg,
      opts.puiPHMsgLen,
      device.openPort)
  }
  catch (ex) {
    console.error(ex)
  }

  if (data.code === 144) {
    data.err = 0
  }

  return data
}


// 若device参数空或者未设置config.init.dllImage值 则不读取处理头像
function retriveData(data: RawData, device: Device): Promise<IDData> {
  const ret = <IDData> {}
  const opts = device.options

  ret.samid = device ? device.samid : ''
  ret.base = _retriveText(data.text)

  if (opts.dllImage) {
    device.apii = ffi.Library(opts.dllImage, dllImgFuncs)

    return decodeImage(device, data.image).then(str => {
      ret.imagePath = str ? str : ''
      return ret
    })
  }
  else {
    ret.imagePath = ''
    return Promise.resolve(ret)
  }
}

function _retriveText(data: Buffer): DataBase {
  return pickFields(data && data.byteLength ? data.toString('ucs2') : '')
}

function formatBase(base: DataBase): void {
  switch (base.gender) {
    case 1:
      base.genderName = '男'
      break
    case 2:
      base.genderName = '女'
      break
    default:
      base.genderName = '未知'
      break
  }
  const s = nationMap.get(base.nation)

  base.startdate && (base.startdate.trim())
  base.enddate && (base.enddate.trim())
  base.nationName = s ? s.trim() : '未知'
}


async function decodeImage(device: Device, buf: Buffer): Promise<string> {
  // console.log(buf.slice(0, 10))
  const name = join(device.options.imgSaveDir, _genImageName('idcrimage_'))
  const tmpname = name + '.wlt'
  const opts = device.options

  if (!opts.dllImage) {
    return ''
  }

  if (! device.apii) {
    return ''
  }
  await createFileAsync(tmpname, buf)

  // covert wlt file to bmp
  const res = device.apii.GetBmp(tmpname, device.useUsb ? 2 : 1)
  logger(['resolve image res:', res], device.options.debug)

  if (res === 1) {
    const ipath = normalize(name + '.bmp')
    logger('image tmp has been saved:' + ipath, device.options.debug)

    return ipath
  }
  else {
    logger(['decode wlt to bmp res:', GetBmpResMap.get(res)], true)
    return ''
  }
}


function _genImageName(prefix: string): string {
  const d = new Date()
  const mon = d.getMonth()
  const day = d.getDate()
  const rstr = Math.random().toString().slice(-8)

  return `${prefix}${d.getFullYear()}${(mon > 9 ? mon : '0' + mon)}${(day > 9 ? day : '0' + day)}_${rstr}`
}

function getSamid(device: Device): void {
  const buf = Buffer.alloc(128)
  const res = device.apib.SDT_GetSAMIDToStr(device.port, buf, device.openPort)

  if (res === 144) {
    let samid = buf.toString('utf8')
    const pos = samid.indexOf('\0')

    if (pos >= 0) {
      samid = samid.slice(0, pos)
    }
    device.samid = samid
  }
}

function logger(data: any, debug: boolean | void) {
  // tslint:disable-next-line
  debug && console.log(data)
}
