import {
  initialCompositeOpts,
  initialOpts,
  nationMap,
  Config,
  IDData,
  Options,
} from '@waiting/idcard-reader-base'
import {
  join,
  tmpdir,
} from '@waiting/shared-core'
import { FModel } from 'win32-api'


export {
  IDData,
  Options,
  initialCompositeOpts,
  initialOpts,
  nationMap,
}


export const config: Config = {
  appDir: '',  // update by entry point index.js
  tmpDir: join(tmpdir(), 'idcard-reader'),
}


export const dllFuncs: FModel.DllFuncs = {
  /** 查找设备端口 */
  SDT_OpenPort: ['int', ['int'] ],
  /** 关闭端口 */
  SDT_ClosePort: ['int', ['int'] ],
  /** 找卡 port,0,0 */
  SDT_StartFindIDCard: ['int', ['int', 'pointer', 'int'] ],
  /** 选卡 */
  SDT_SelectIDCard: ['int', ['int', 'pointer', 'int'] ],
  /** 读取基础信息 */
  SDT_ReadBaseMsg: ['int', ['int', 'pointer', 'pointer', 'pointer', 'pointer', 'int'] ],
  /** 对 SAM 进行状态检测 */
  SDT_GetSAMStatus: ['int', ['int', 'int'] ],
  /** 重置SAM */
  SDT_ResetSAM: ['int', ['int', 'int'] ],
  /** 读取SAM_V的编号 返回值0x90-成功，其他-失败 */
  SDT_GetSAMIDToStr: ['int', ['int', 'pointer', 'int'] ],
  /** 读取追加信息 */
  SDT_ReadNewAppMsg: ['int', ['int', 'pointer', 'pointer', 'int'] ],
  SDT_ReadAllAppMsg: ['int', ['int', 'pointer', 'pointer', 'int'] ],
}

export const dllImgFuncs: FModel.DllFuncs = {
  /** 解码头像 */
  GetBmp: ['int', ['string', 'int'] ],
}

export const GetBmpResMap = new Map([
  [0, '调用sdtapi.dll错误'],
  [1, '正常'],
  [-1, '相片解码错误'],
  [-2, 'wlt文件后缀错误'],
  [-3, 'wlt文件打开错误'],
  [-4, 'wlt文件格式错误'],
  [-5, 'WltRS.dll 文件与机具不匹配或软件未授权'],
  [-6, '设备连接错误'],
])
