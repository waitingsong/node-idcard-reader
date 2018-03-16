import { chmod, close, copyFile, mkdir, open, readFile, stat, unlink, write, writeFile } from 'fs'
import { dirname, normalize, resolve as fresolve, sep } from 'path'
import { promisify } from 'util'

import { WriteFileOptions } from './model'

export const mkdirAsync = promisify(mkdir)
export const readFileAsync = promisify(readFile)
export const writeAsync = promisify(write)
export const writeFileAsync = promisify(writeFile)
export const unlinkAsync = promisify(unlink)
export const openAsync = promisify(open)
export const closeAsync = promisify(close)
export const copyFileAsync = promisify(copyFile)
export const chmodAsync = promisify(chmod)


export function isDirExists(path: string): Promise<boolean> {
  return path ? isDirFileExists(path, 'DIR') : Promise.resolve(false)
}


export function isFileExists(path: string): Promise<boolean> {
  return path ? isDirFileExists(path, 'FILE') : Promise.resolve(false)
}


function isDirFileExists(path: string, type: 'DIR' | 'FILE'): Promise<boolean> {
  return path
    ? new Promise(resolve => {
      stat(path, (err, stats) => (
        err ? resolve(false) : resolve(type === 'DIR' ? stats.isDirectory() : stats.isFile())
      ))
    })
    : Promise.resolve(false)
}


// create directories recursively
export async function createDir(path: string): Promise<void> {
  if (! path) {
    throw new Error('value of path param invalid')
  }
  else {
    path = normalize(path)
    if (!await isDirExists(path)) {
      await path.split(sep).reduce(async (parentDir, childDir) => {
        const curDir = fresolve(await parentDir, childDir)

        await isDirExists(curDir) || await mkdirAsync(curDir, 0o755)

        return curDir
      }, Promise.resolve(sep))
    }

  }
}


export async function createFile(file: string, data: any, options?: WriteFileOptions): Promise<void> {
  const path = dirname(file)

  /* istanbul ignore next */
  if (! path) {
    throw new Error('path empty')
  }
  if (! await isDirExists(path)) {
    await createDir(path)
  }

  /* istanbul ignore else */
  if (!await isFileExists(file)) {
    if (typeof data === 'object') {
      await writeFileAsync(file, JSON.stringify(data))
    }
    else {
      const opts: WriteFileOptions = options ? options : { mode: 0o640 }

      await writeFileAsync(file, data, opts)
    }
  }
}

