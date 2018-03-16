import * as ffi from 'ffi'
import * as path from 'path'

import {
  createDir,
  createFile,
  isDirExists,
  isFileExists,
} from './common'
import {
  apiImgDll,
  apiTxtDll,
  initialOpts,
  nationMap,
  tmpDir,
} from './config'
import {
  ApiBase,
  DataBase,
  Device,
  IDData,
  Options,
  RawData,
} from './model'


let imgSaveDir: string = ''
let apib: ApiBase


export async function init(args: Options): Promise<Device[]> {
  const opts = { ...initialOpts, ...args }

  if (typeof opts.dllTxt === 'undefined' || !opts.dllTxt) {
    return Promise.reject('params dllTxt undefined or blank')
  }
  opts.dllTxt = path.normalize(opts.dllTxt)
  opts.dllImage = opts.dllImage ? path.normalize(opts.dllImage) : ''
  opts.imgSaveDir = opts.imgSaveDir && typeof opts.imgSaveDir === 'string' ? path.normalize(opts.imgSaveDir) : path.join(tmpDir, 'idcard-reader')
  logger(opts, opts.debug)

  if (typeof opts.findCardRetryTimes === 'undefined' || isNaN(opts.findCardRetryTimes) || opts.findCardRetryTimes < 0) {
    opts.findCardRetryTimes = 5
  }

  await validateDllFiles(opts)
  apib = ffi.Library(opts.dllTxt, apiTxtDll)
  const devices = findDeviceList(opts)

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
      logger('Found card ', device.options.debug)
      const res = selectCard(device)
      logger('Select card ' + (res ? 'succeed' : 'failed'), device.options.debug)

      if (res) {
        const raw = readCard(device)

        if (!raw.err) {
          const ret = retriveData(raw, device)

          disconnectDevice(device)
          return ret
        }
      }
    }
    catch (ex) {
      disconnectDevice(device)
      throw ex
    }
  }
}


async function validateDllFiles(opts: Options): Promise<void> {
  if ( ! await isFileExists(opts.dllTxt)) {
    throw new Error('File not exists: ' + opts.dllTxt)
  }
  // 允许 未指定照片解码dll
  if (opts.dllImage && ! await isFileExists(opts.dllImage)) {
    throw new Error('File not exists: ' + opts.dllImage)
  }

  return testWrite(<string> opts.imgSaveDir)
}


async function testWrite(dir: string): Promise<void> {
  const dirExists = await isDirExists(dir)

  if ( ! dirExists) {
    await createDir(dir)
    await createFile(path.join(dir, '.test'), 'idctest') // 创建测试文件
  }

  imgSaveDir = dir
  // logger('imgSaveDir: ' + dir)
}

function findDeviceList(options: Options): Device[] {
  const arr: Device[] = []

  // 必须先检测usb端口
  for (let i = 1000; i <= 1016; i++) {
    if (apib.SDT_OpenPort(i) === 144) {
      const res: Device = {
        port: i,
        useUsb: true,
        openPort: 1,
        inUse: true,
        samid: '',
        imgSaveDir,
        options,
      }

      logger(`Found device at usb port: ${i}`, options.debug)
      getSamid(res)
      res.openPort = 0
      disconnectDevice(res)

      arr.push(res)
      if ( ! options.searchAll) {
        break
      }
    }
  }

  // 检测串口
  for (let i = 1; i <= 16; i++) {
    if (apib.SDT_OpenPort(i) === 144) {
      const res: Device = {
        port: i,
        useUsb: false,
        openPort: 1,
        inUse: true,
        samid: '',
        imgSaveDir,
        options,
      }

      logger(`Found device at serial port: ${i}`, options.debug)
      getSamid(res)
      res.openPort = 0
      disconnectDevice(res)

      arr.push(res)
      if ( ! options.searchAll) {
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

  if (apib.SDT_OpenPort(device.port) === 144) {
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
  const res = apib.SDT_ClosePort(device.port)

  logger(`disconnect device at port: ${device.port} ` + (res === 144 ? 'succeed' : 'failed'), device.options.debug)
  device.inUse = false
  return res === 144 ? true : false
}

// 找卡
export function findCard(device: Device): Promise<void> {
  console.time('findCard.elps')

  return new Promise((resolve, reject) => {
    if (_findCard(device) === 159) {
      console.timeEnd('findCard.elps')
      return resolve()
    }
    const opts = device.options

    if (typeof opts.findCardRetryTimes !== 'undefined' && opts.findCardRetryTimes > 0) {
      let c = 0
      const intv = setInterval(() => {
        if (c >= <number> device.options.findCardRetryTimes) {
          clearInterval(intv)
          console.timeEnd('findCard.elps')
          return reject(`findCard fail over ${c} times`)
        }
        const res = _findCard(device)

        if (res === 159) {
          clearInterval(intv)
          console.timeEnd('findCard.elps')
          setTimeout(resolve, 4000, 'succeed')  // 移动中读取到卡 延迟执行选卡
          return
        }
        c += 1
      }, 1000)
    }
    else {
      return reject('No found card')
    }
  })
}

function _findCard(device: Device): number {
  try {
    const buf = Buffer.alloc(4)

    return apib.SDT_StartFindIDCard(device.port, buf, device.openPort)
  }
  catch (ex) {
    logger(ex, true)
    return 0
  }
}


// 选卡
export function selectCard(device: Device): boolean {
  const buf = Buffer.alloc(4)
  const res = apib.SDT_SelectIDCard(device.port, buf, device.openPort)

  return res === 144 ? true : false
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
    data.code = apib.SDT_ReadBaseMsg(device.port, opts.pucCHMsg, opts.puiCHMsgLen, opts.pucPHMsg, opts.puiPHMsgLen, device.openPort)
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
  const s: string = data && data.byteLength ? data.toString('ucs2') : ''
  const i: DataBase = {
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

  if (!s || !s.length) {
    return i
  }

  i.name = s.slice(0, 15).trim()
  i.gender = +s.slice(15, 16)
  i.nation = s.slice(16, 18) // 民族
  i.birth = s.slice(18, 26)  // 16
  i.address = s.slice(26, 61).trim()   // 70
  i.idc = s.slice(61, 79)  // 身份证号
  i.regorg = s.slice(79, 94).trim()   // 签发机关
  i.startdate = s.slice(94, 102)
  i.enddate = s.slice(102, 110)

  formatBase(i)
  // console.log(i)

  return i
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


function decodeImage(device: Device, buf: Buffer): Promise<string> {
  // console.log(buf.slice(0, 10))
  const name = path.join(device.imgSaveDir, _genImageName('idcrimage_'))
  const tmpname = name + '.wlt'
  const opts = device.options

  if (!opts.dllImage) {
    return Promise.resolve('')
  }
  const apii = ffi.Library(opts.dllImage, apiImgDll)

  if (!apii) {
    return Promise.resolve('')
  }

  return createFile(tmpname, buf).then(() => {
    logger('image tmp has been saved:' + tmpname, device.options.debug)
    const res = apii.GetBmp(tmpname, device.useUsb)
    const ipath = path.normalize(name + '.bmp')
    logger(['resolve image res:' + res, ipath], device.options.debug)

    return ipath
  })
}

function _genImageName(prefix: string): string {
  const d = new Date()
  const mon = d.getMonth()
  const day = d.getDate()
  const rstr = Math.random().toString().slice(-8)

  return `${prefix}${d.getFullYear()}${(mon > 9 ? mon : '0' + mon)}${(day > 9 ? day : '0' + day)}_${rstr}`
}

function getSamid(device: Device): void {
  const buf = Buffer.alloc(40)
  const res = apib.SDT_GetSAMIDToStr(device.port, buf, device.openPort)

  if (res === 144) {
    device.samid = buf.toString('utf8').trim().replace(/\u0000/g, '')
  }
}

function logger(data: any, debug: boolean | void) {
  debug && console.log(data)
}
