import {
  composite,
  formatBaseData,
  initialDataBase,
  initialIDData,
  parseCompositeOpts,
  parseDeviceOpts,
  testWrite,
  validateDllFile,
  DataBase,
  IDData,
  Options,
  RawData,
} from '@waiting/idcard-reader-base'
import { error, info } from '@waiting/log'
import {
  createFileAsync,
  fileExists,
  isFileExists,
  join,
  normalize,
} from '@waiting/shared-core'
import * as ffi from 'ffi'
import {
  combineLatest,
  iif,
  of,
  Observable,
} from 'rxjs'
import {
  catchError,
  map,
  mergeMap,
  shareReplay,
  tap,
  timeout,
} from 'rxjs/operators'

import {
  dllFuncs,
  dllImgFuncs,
} from './config'
import { disconnectDevice, findDeviceList, readDataBase } from './device'
import {
  Device,
} from './model'


export async function init(options: Options): Promise<Device[]> {
  const deviceOpts = parseDeviceOpts(options)
  const compositeOpts = parseCompositeOpts(options)

  const { debug } = deviceOpts

  if (debug) {
    info(compositeOpts)
    info(deviceOpts)
  }

  await validateDllFile(deviceOpts.dllTxt)
  // 不允许 未指定照片解码dll
  if (compositeOpts.useComposite) {
    if (! deviceOpts.dllImage) {
      throw new Error('Value of dellImage empty')
    }
    else if (! await isFileExists(deviceOpts.dllImage)) {
      throw new Error('File not exists: ' + deviceOpts.dllImage)
    }
  }
  await testWrite(deviceOpts.imgSaveDir)
  const apib = ffi.Library(deviceOpts.dllTxt, dllFuncs)
  const devices = findDeviceList(deviceOpts, compositeOpts, apib)

  if (devices && devices.length) {
    return devices
  }
  else {
    throw new Error('未找到读卡设备')
  }
}


/** Read card data */
export function read(device: Device): Promise<IDData> {
  if (device.openPort) {
    try {
      disconnectDevice(device)
    }
    catch (ex) {
      throw ex
    }

    // 读卡获取原始buffer数据
    const raw$: Observable<RawData> = readDataBase(device).pipe(
      shareReplay(1),
    )

    // 生成 base 数据
    const base$: Observable<DataBase> = raw$.pipe(
      tap(raw => {
        if (raw.err) {
          throw new Error('读卡失败：code:' + raw.code)
        }
      }),
      map(raw => {
        const base = pickFields(raw && raw.text.byteLength ? raw.text.toString('ucs2') : '')
        return base
      }),
      shareReplay(1),
    )

    // 解码头像
    const imagePath$: Observable<string> = raw$.pipe(
      mergeMap(raw => retriveAvatar(raw.image, device)),
      mergeMap(imagePath => {
        return fileExists(imagePath).pipe(
          tap(path => {
            if (!path) {
              error(`解码头像文件失败 path: "${imagePath}"`)
            }
          }),
        )
      }),
    )

    // 合成图片
    const imgsPath$ = iif(
      () => ! device.compositeOpts.useComposite,
      of({
        compositePath: '',
        imagePath: '',
      }),
      combineLatest(base$, imagePath$).pipe(
        mergeMap(([base, imagePath]) => {
          return composite(imagePath, base, device.compositeOpts).pipe(
            map(compositePath => {
              return {
                compositePath,
                imagePath,
              }
            }),
          )
        }),
      ),
    )

    const ret$: Observable<IDData> = combineLatest(base$, imgsPath$).pipe(
      tap(() => {
        disconnectDevice(device)
      }),
      map(([base, imgsPath]) => {
        const ret: IDData = {
          ...initialIDData,
          ...imgsPath,
          base,
        }
        return ret
      }),
      timeout(20000),
      catchError((err: Error) => {
        disconnectDevice(device)
        throw err
      }),
    )

    return ret$.toPromise()
  }
  else {
    throw new Error('设备端口未指定')
  }
}


/** pick fields from origin text */
export function pickFields(text: string): DataBase {
  const ret: DataBase = { ...initialDataBase }

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

  return formatBaseData(ret)
}


/**
 * 解码读取到的头像 Buffer，返回生成的图片路径
 */
export function retriveAvatar(image: Buffer, device: Device): Promise<string> {
  const opts = device.deviceOpts

  device.apii = ffi.Library(opts.dllImage, dllImgFuncs)

  return decodeImage(device, image)
}


async function decodeImage(device: Device, buf: Buffer): Promise<string> {
  // console.log(buf.slice(0, 10))
  const name = join(device.deviceOpts.imgSaveDir, _genImageName('idcrimage_'))
  const tmpname = name + '.wlt'

  if (! device.apii) {
    return ''
  }
  await createFileAsync(tmpname, buf)

  // covert wlt file to bmp
  const res = device.apii.GetBmp(tmpname, device.useUsb ? 2 : 1)
  device.deviceOpts.debug && info(['resolve image res:', res])

  if (res === 1) {
    const ipath = normalize(name + '.bmp')
    return ipath
  }
  else {
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
