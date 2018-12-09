/// <reference types="mocha" />

import { basename } from 'path'
import * as assert from 'power-assert'

import * as idcr from '../src/index'
import { Options } from '../src/lib/model'


const filename = basename(__filename)

describe(filename, () => {

  it('Should read() works', async () => {
    const opts: Options = {
      dllTxt: 'c:/sdtapi.dll',
      dllImage: 'c:/wltrs.dll',
      debug: false,
      compositeImg: true,
      fontHwxhei: 'c:/Windows/Fonts/hwxhei.ttf',
      fontOcrb: 'c:/Windows/Fonts/ocrb10bt.ttf',
      fontSimhei: 'c:/Windows/Fonts/simhei.ttf',
    }

    try {
      const devices = await idcr.init(opts)

      if (! devices.length) {
        assert(false, 'No device found')
        return
      }
      const ret = await idcr.read(devices[0])

      console.info(ret)
      assert(!! ret, 'IDData invalid')
      assert(ret && ret.base && ret.base.name, 'name of IDData empty')
      assert(ret && ret.base && ret.base.idc, 'idc of IDData empty')
      assert(ret && ret.base && ret.compositePath, 'composite image path empty')
    }
    catch (ex) {
      assert(false, ex)
    }
  })
})
