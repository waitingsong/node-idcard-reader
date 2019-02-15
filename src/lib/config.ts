import {
  join,
  tmpdir,
} from '@waiting/shared-core'

import {
  CompositeOpts,
  Config,
  DllFuncs,
  IDData,
  Options,
} from './model'


export const config: Config = {
  appDir: '',  // update by entry point index.js
  tmpDir: join(tmpdir(), 'idcard-reader'),
}

export const initialCompositeOpts: CompositeOpts = {
  useComposite: false,
  compositeDir: config.tmpDir,
  compositeQuality: 35,
  compositeType: 'jpg',
  textColor: '#303030',
  fontHwxhei: '',
  fontOcrb: '',
  fontSimhei: '',
}

// 初始化参数
export const initialOpts: Required<Options> = {
  dllTxt: '',
  dllImage: '',
  findCardRetryTimes: 5,
  imgSaveDir: config.tmpDir,
  debug: false,
  searchAll: false,
  ...initialCompositeOpts,
}

export const idData: IDData = {
  base: null, // object
  imagePath: '',  // image file path
  samid: '',  // SAM id
  compositePath: '',
}

export {
  IDData,
  Options,
}


export const dllFuncs: DllFuncs = {
  SDT_OpenPort: ['int', ['int'] ],   // 查找设备端口
  SDT_ClosePort: ['int', ['int'] ],  // 关闭端口
  SDT_StartFindIDCard: ['int', ['int', 'pointer', 'int'] ],  // 找卡 port,0,0
  SDT_SelectIDCard: ['int', ['int', 'pointer', 'int'] ], // 选卡
  SDT_ReadBaseMsg: ['int', ['int', 'pointer', 'pointer', 'pointer', 'pointer', 'int'] ], // 读取基础信息
  SDT_GetSAMStatus: ['int', ['int', 'int'] ],   // 对 SAM 进行状态检测
  SDT_ResetSAM: ['int', ['int', 'int'] ],   // 重置SAM
  SDT_GetSAMIDToStr: ['int', ['int', 'pointer', 'int'] ], // 读取SAM_V的编号 返回值0x90-成功，其他-失败
  SDT_ReadNewAppMsg: ['int', ['int', 'pointer', 'pointer', 'int'] ], // 读取追加信息
  // SDT_ReadAllAppMsg: ['int', ['int', 'pointer', 'pointer', 'int'] ],
}

export const dllImgFuncs: DllFuncs = {
  /* 解码头像 */
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

export const nationMap: Map<string, string> = new Map([
  ['01', '汉'],
  ['02', '蒙古'],
  ['03', '回'],
  ['04', '藏'],
  ['05', '维吾尔'],
  ['06', '苗'],
  ['07', '彝'],
  ['08', '壮'],
  ['09', '布依'],
  ['10', '朝鲜'],
  ['11', '满'],
  ['12', '侗'],
  ['13', '瑶'],
  ['14', '白'],
  ['15', '土家'],
  ['16', '哈尼'],
  ['17', '哈萨克'],
  ['18', '傣'],
  ['19', '黎'],
  ['20', '傈僳'],
  ['21', '佤'],
  ['22', '畲'],
  ['23', '高山'],
  ['24', '拉祜'],
  ['25', '水'],
  ['26', '东乡'],
  ['27', '纳西'],
  ['28', '景颇'],
  ['29', '柯尔克孜'],
  ['30', '土'],
  ['31', '达翰尔'],
  ['32', '仫佬'],
  ['33', '羌'],
  ['34', '布朗'],
  ['35', '撒拉'],
  ['36', '毛南'],
  ['37', '仡佬'],
  ['38', '锡伯'],
  ['39', '阿昌'],
  ['40', '普米'],
  ['41', '塔吉克'],
  ['42', '怒'],
  ['43', '乌孜别克'],
  ['44', '俄罗斯'],
  ['45', '鄂温克'],
  ['46', '德昂'],
  ['47', '保安'],
  ['48', '裕固'],
  ['49', '京'],
  ['50', '塔塔尔'],
  ['51', '独龙'],
  ['52', '鄂伦春'],
  ['53', '赫哲'],
  ['54', '门巴'],
  ['55', '珞巴'],
  ['56', '基诺'],
  ['57', '其它'],
  ['98', '外国人入籍'],
])
