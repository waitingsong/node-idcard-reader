import {
  RawData,
} from '@waiting/idcard-reader-base'
import { error, info } from '@waiting/log'
import { dirname } from '@waiting/shared-core'
import { of, range, timer, Observable } from 'rxjs'
import { concatMap, defaultIfEmpty, filter, map, mapTo, mergeMap, take, tap } from 'rxjs/operators'

import { Device } from './model'


export function connectDevice(device: Device, port: number): number {
  if (device && device.inUse) {
    device.deviceOpts.debug && info('Cautiton: connectDevice() device in use')
    return 0
  }

  const openRet = device.apib.SDT_OpenPort(port)
  device.deviceOpts.debug && info(`open device port ret: ${openRet}`)

  return openRet === 144 ? port : 0
}

export function disconnectDevice(device: Device): boolean {
  const ret = device.apib.SDT_ClosePort(device.openPort)

  device.deviceOpts.debug && info(`disconnectDevice at port: ${device.openPort}, ret: ${ret} `)
  device.inUse = false
  return ret === 144 ? true : false
}


export function findDeviceList(
  deviceOpts: Device['deviceOpts'],
  compositeOpts: Device['compositeOpts'],
  apib: Device['apib'],
): Device[] {
  const arr: Device[] = []

  if (deviceOpts.port > 0) {
    // 仅USB接口
    const device = findDevice(deviceOpts.port, deviceOpts, compositeOpts, apib, true)
    if (device.openPort > 0) {
      arr.push(device)
    }
  }
  else {
    // 必须先检测usb端口
    for (let i = 1000; i <= 1016; i++) {
      const device = findDevice(i, deviceOpts, compositeOpts, apib, true)

      if (device.openPort > 0) {
        // device.simid = getSamid(device)
        arr.push(device)
        if (!deviceOpts.searchAll) {
          break
        }
      }
    }

    if (! deviceOpts.searchAll && arr.length) {
      return arr
    }

    // 检测串口
    for (let i = 1; i <= 16; i++) {
      const device = findDevice(i, deviceOpts, compositeOpts, apib, false)

      if (device.openPort > 0) {
        arr.push(device)
        if (!deviceOpts.searchAll) {
          break
        }
      }
    }
  }

  return arr
}

export function findDevice(
  openPort: Device['openPort'],
  deviceOpts: Device['deviceOpts'],
  compositeOpts: Device['compositeOpts'],
  apib: Device['apib'],
  useUsb: Device['useUsb'],
): Device {

  const device: Device = {
    apib,
    apii: null,
    deviceOpts,
    compositeOpts,
    inUse: false,
    openPort: 0,
    useUsb,
  }

  const port = connectDevice(device, openPort)
  if (port > 0) {
    device.inUse = true
    device.openPort = port
    deviceOpts.debug && info(`Found device at serial/usb port: ${port}`)
    disconnectDevice(device)
  }

  return device
}


/** 读取二代证基础信息 */
export function readDataBase(device: Device): Observable<RawData> {
  const path = dirname(device.deviceOpts.dllTxt)
  process.env.PATH = `${process.env.PATH};${path}`

  // const srcDir = path.replace(/\\/g, '/') + '/'
  // const targetPath = normalize(device.deviceOpts.imgSaveDir + '/').replace(/\\/g, '/')

  if (device.deviceOpts.debug) {
    info('starting reading readCard ret')
    // info('IDCard_GetInformation() src path:' + srcDir)
    // info('IDCard_GetInformation() target path:' + targetPath)
  }

  connectDevice(device, device.openPort)

  const cardReady$ = findCard(device).pipe(
    map(() => selectCard(device)),
    tap(ready => {
      if (! ready) {
        throw new Error('二代证无效，请确保证件处于机具读卡区域内')
      }
    }),
  )

  const ret$ = cardReady$.pipe(
    map(() => readCard(device)),
    tap(raw => {
      if (device.deviceOpts.debug) {
        // info(`readDataBase bufLen: ${buf.byteLength}`)
        info('readDataBase ret')
        info(raw)
      }
    }),
  )

  return ret$
}


/** 检测卡是否可读取状态 */
export function findCard(device: Device): Observable<boolean> {
  const findCardRetryTimes = device.deviceOpts.findCardRetryTimes
  const findRet$ = range(0, findCardRetryTimes > 0 ? findCardRetryTimes + 1 : 1).pipe(
    concatMap((value, index: number) => {
      if (index > 0 && index >= findCardRetryTimes) {
        throw new Error(`findCard fail over ${findCardRetryTimes} times`)
      }

      // 移动中读取到卡 延迟执行选卡
      const delay$ = timer(index === 0 ? 0 : 1000)
      return delay$.pipe(
        mergeMap(() => of(_findCard(device))),
      )
    }),
  )
  const ret$ = findRet$.pipe(
    tap(ret => {
      device.deviceOpts.debug && info(`findStatus: ${ret}`)
    }),
    filter(ret => ret === 159),
    take(1),
    mapTo(true),
    defaultIfEmpty(false),
  )

  return ret$
}

function _findCard(device: Device): number {
  try {
    const buf = Buffer.alloc(4)
    return device.apib.SDT_StartFindIDCard(device.openPort, buf, 1)
  }
  catch (ex) {
    device.deviceOpts.debug && error(ex)
    return 0
  }
}


/** 选卡 */
export function selectCard(device: Device): boolean {
  const buf = Buffer.alloc(4)
  const res = device.apib.SDT_SelectIDCard(device.openPort, buf, 1)

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
    data.code = device.apib.SDT_ReadBaseMsg(
      device.openPort,
      opts.pucCHMsg,
      opts.puiCHMsgLen,
      opts.pucPHMsg,
      opts.puiPHMsgLen,
      1,
    )
  }
  catch (ex) {
    console.error(ex)
  }

  if (data.code === 144) {
    data.err = 0
  }

  return data
}

export function getSamid(device: Device): string {
  const buf = Buffer.alloc(128)
  const res = device.apib.SDT_GetSAMIDToStr(device.openPort, buf, 1)
  let samid = ''

  if (res === 144) {
    samid = buf.toString('utf8')
    const pos = samid.indexOf('\0')

    if (pos >= 0) {
      samid = samid.slice(0, pos)
    }
  }

  return samid
}
