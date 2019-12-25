import * as idcr from '../lib/index'


const opts = {
  dllTxt: 'c:/sdtapi.dll',
  dllImage: 'c:/wltrs.dll',
}

idcr.init(opts)
  .then((devices) => {
    return idcr.read(devices[0])
      .then((data) => {
        // tslint:disable-next-line
        console.log(data)
      })
  })
  .catch(console.error)
