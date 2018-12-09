import { Observable } from 'rxjs'
import { mapTo, tap } from 'rxjs/operators'
// import run from 'rxrunscript'
import { run } from 'rxrunscript'

import {
  join, normalize, unlinkAsync,
} from '../shared/index'

import {
  config,
} from './config'
import {
  CompositeOpts, DataBase,
} from './model'


/**
 * Convert avatar bmp to png with transparent background
 * Return avatar path
 */
export function handleAvatar(path: string): Observable<string> {
  // magick avatar.bmp -resize x353 -fuzz 9% -transparent '#FEFEFE' avatar.png
  const target = join(config.tmpDir, 'avatar-' + Math.random() + '.png')
  const cmd = `magick "${path}" -resize x353 -fuzz 9% -transparent "#FEFEFE" "${target}"`
  const ret = run(cmd).pipe(
    mapTo(target),
  )

  return ret
}


/**
 * Fill base info text
 */
export function handleBaseInfo(data: DataBase, avatarPath: string, options: CompositeOpts): Observable<string> {
  /* istanbul ignore else */
  if (! data) {
    throw new TypeError('base value invalid')
  }
  /* istanbul ignore else */
  if (! options.fontHwxhei || ! options.fontOcrb || ! options.fontSimhei) {
    throw new TypeError('font value invalid')
  }

  const assetsDir = join(config.appDir, 'assets')
  const tpl = join(assetsDir, 'tpl.png')
  const target = join(options.compositeDir, 'composite-' + Math.random() + `.${options.compositeType}`)

  const txtColor = options.textColor
  const hwxhei = normalize(options.fontHwxhei)
  const orcb = normalize(options.fontOcrb)
  const simhei = normalize(options.fontSimhei)
  const ps = [
    genParamName(data.name, txtColor, hwxhei),
    genParamGender(data.genderName, txtColor, hwxhei),
    genParamNation(data.nationName, txtColor, hwxhei),
    genParamBirth(data.birth, txtColor, hwxhei),
    genParamIdc(data.idc, txtColor, orcb),
    genParamAddress(data.address, txtColor, hwxhei),
    genParamRegOrg(data.regorg, txtColor, simhei),
    genParamValidDate(data.startdate, data.enddate, txtColor, hwxhei),
  ]

  const cmd = `magick ${tpl} ` + ps.join(' ') +
    ` -compose src-over "${avatarPath}" -geometry +619+125 -quality ${options.compositeQuality} -composite "${target}"`
  const ret = run(cmd).pipe(
    mapTo(target),
    tap(() => unlinkAsync(avatarPath)),
  )

  return ret
}


function genParamName(value: DataBase['name'], txtColor: string, font: string): string {
  value = value ? value.trim() : ''
  /* istanbul ignore else */
  if (! value) {
    throw new TypeError('value invalid')
  }
  return `-fill "${txtColor}" -font "${font}" -pointsize 42 -draw "text 208,146 '${value}'"`
}

function genParamGender(value: DataBase['genderName'], txtColor: string, font: string): string {
  value = value ? value.trim() : ''
  /* istanbul ignore else */
  if (!value) {
    throw new TypeError('value invalid')
  }
  return `-fill "${txtColor}" -font "${font}" -pointsize 34 -draw "text 208,220 '${value}'"`
}

function genParamNation(value: DataBase['nationName'], txtColor: string, font: string): string {
  value = value ? value.trim() : ''
  /* istanbul ignore else */
  if (!value) {
    throw new TypeError('value invalid')
  }
  return `-fill "${txtColor}" -font "${font}" -pointsize 34 -draw "text 395,220 '${value}'"`
}

function genParamBirth(value: DataBase['birth'], txtColor: string, font: string): string {
  value = value ? value.trim() : ''
  /* istanbul ignore else */
  if (!value) {
    throw new TypeError('value invalid')
  }

  const year = value.slice(0, 4)
  let month = value.slice(4, 6)
  let day = value.slice(6, 8)

  /* istanbul ignore else */
  if (month[0] === '0') {
    month = ' ' + month[1]
  }

  /* istanbul ignore else */
  if (day[0] === '0') {
    day = ' ' + day[1]
  }

  let ret = `-fill "${txtColor}" -font "${font}" -pointsize 33 -kerning 1 -draw "text 210,295 '${year}'"`
  ret += ` -fill "${txtColor}" -font "${font}" -pointsize 33 -draw "text 350,295 '${month}'"`
  ret += ` -fill "${txtColor}" -font "${font}" -pointsize 33 -draw "text 435,295 '${day}'"`

  return ret
}


function genParamIdc(value: DataBase['idc'], txtColor: string, font: string): string {
  value = value ? value.trim() : ''
  /* istanbul ignore else */
  if (!value) {
    throw new TypeError('value invalid')
  }
  return `-fill "${txtColor}" -font "${font}" -pointsize 45 -kerning 1 -draw "text 355,561 '${value}'"`
}

function genParamAddress(value: DataBase['address'], txtColor: string, font: string): string {
  value = value ? value.trim() : ''
  /* istanbul ignore else */
  if (!value) {
    throw new TypeError('value invalid')
  }

  const len = value.length
  let ret = ''
  let pos = 0
  let line = ''
  let lineY = 368
  const lineHeight = 50

  do {
    line = retrieveAddressLine(value, pos)
    if (line.length) {
      ret += ` -fill "${txtColor}" -font "${font}" -pointsize 33 -kerning 3 -draw "text 208,${lineY} '${line}'"`
      pos += line.length
      lineY += lineHeight
    }
    else {
      break
    }
  }
  while (pos <= len)

  return ret
}

/* 11 Chinese every line */
function retrieveAddressLine(value: DataBase['address'], startPos: number): string {
  /* istanbul ignore else */
  if (value.length <= startPos) {
    return ''
  }
  const txt = value.slice(startPos)

  /* istanbul ignore else */
  if (txt.length > 10) {
    if (/[\d\w-]/.test(txt.slice(11, 12))) {  // p11 is number or letter
      const p12 = txt.slice(12, 13)

      if (p12 && /[\d\w-]/.test(p12)) {
        return txt.slice(0, 10)
      }
    }
  }

  return txt.slice(0, 11)
}

function genParamRegOrg(value: DataBase['regorg'], txtColor: string, font: string): string {
  value = value ? value.trim() : ''
  /* istanbul ignore else */
  if (!value) {
    throw new TypeError('value invalid')
  }
  return `-fill "${txtColor}" -font "${font}" -pointsize 32 -kerning 3 -draw "text 413,1138 '${value}'"`
}

function genParamValidDate(
  start: DataBase['startdate'],
  end: DataBase['enddate'],
  txtColor: string,
  font: string,
): string {

  start = start ? start.trim() : ''
  /* istanbul ignore else */
  if (!start) {
    throw new TypeError('value invalid')
  }
  return `-fill "${txtColor}" -font "${font}" -pointsize 32 -kerning 1.6 -draw "text 413,1215 '${start}-${end}'"`
}
