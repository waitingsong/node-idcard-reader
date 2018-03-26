import {
  DllFuncs,
  IDData,
  Options,
} from './model'

// 初始化参数
export const initialOpts: Options = {
  dllTxt: '',
  dllImage: '',
  findCardRetryTimes: 5,
  debug: false,
}

export const idData: IDData = {
  base: null, // object
  imagePath: '',  // image file path
  samid: '',  // SAM id
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
  SDT_ReadAllAppMsg: ['int', ['int', 'pointer', 'pointer', 'int'] ],
}

export const dllImgFuncs: DllFuncs = {
  GetBmp: ['int', ['string', 'int'] ],   // 读取大头像
}


export const nationMap: Map<string, string> = new Map([
  ['01', '汉族'],
  ['02', '蒙古族'],
  ['03', '回族'],
  ['04', '藏族'],
  ['05', '维吾尔族'],
  ['06', '苗族'],
  ['07', '彝族'],
  ['08', '壮族'],
  ['09', '布依族'],
  ['10', '朝鲜族'],
  ['11', '满族'],
  ['12', '侗族'],
  ['13', '瑶族'],
  ['14', '白族'],
  ['15', '土家族'],
  ['16', '哈尼族'],
  ['17', '哈萨克族'],
  ['18', '傣族'],
  ['19', '黎族'],
  ['20', '傈僳族'],
  ['21', '佤族'],
  ['22', '畲族'],
  ['23', '高山族'],
  ['24', '拉祜族'],
  ['25', '水族'],
  ['26', '东乡族'],
  ['27', '纳西族'],
  ['28', '景颇族'],
  ['29', '柯尔克孜族'],
  ['30', '土族'],
  ['31', '达翰尔族'],
  ['32', '仫佬族'],
  ['33', '羌族'],
  ['34', '布朗族'],
  ['35', '撒拉族'],
  ['36', '毛南族'],
  ['37', '仡佬族'],
  ['38', '锡伯族'],
  ['39', '阿昌族'],
  ['40', '普米族'],
  ['41', '塔吉克族'],
  ['42', '怒族'],
  ['43', '乌孜别克族'],
  ['44', '俄罗斯族'],
  ['45', '鄂温克族'],
  ['46', '德昂族'],
  ['47', '保安族'],
  ['48', '裕固族'],
  ['49', '京族'],
  ['50', '塔塔尔族'],
  ['51', '独龙族'],
  ['52', '鄂伦春族'],
  ['53', '赫哲族'],
  ['54', '门巴族'],
  ['55', '珞巴族'],
  ['56', '基诺族'],
  ['57', '其它'],
  ['98', '外国人入籍'],
])
