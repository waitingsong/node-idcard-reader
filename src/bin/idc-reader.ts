#!/usr/bin/env node
import * as idcr from '../lib/index'
import { Options } from '../lib/model'


const opts: Options = {
  dllTxt: 'c:/sdtapi.dll',
  dllImage: 'c:/wltrs.dll',
}

idcr.init(opts)
  .then((devices) => {
    return idcr.read(devices[0])
      .then(data => {
        console.log(data)
      })
  })
  .catch(console.error)
