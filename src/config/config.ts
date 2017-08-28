export interface Init {
    dllTxt: string; // path of sdtapi.dll
    dllImage?: string | undefined;   // path of wltrs.dll 可空则不读取头像
    findCardRetryTimes?: number;    // 找卡重试数量，间隔1sec
}

// 初始化参数
export const init: Init = {
    dllTxt: '',
    dllImage: '',
    findCardRetryTimes: 5,
};

// dll接口方法
export interface ApiTxt {
    SDT_OpenPort(port: number): number; // 查找设备并打开端口
    SDT_ClosePort(port: number): number;  // 关闭端口
    SDT_StartFindIDCard(port: number, pucIIN: Buffer, iIfOpen: number): number; // 找卡
    SDT_SelectIDCard(port: number, pucSN: Buffer, iIfOpen: number): number; // 选卡
    SDT_ReadBaseMsg(port: number, pucCHMsg: Buffer, puiCHMsgLen: Buffer, pucPHMsg: Buffer, puiPHMsgLen: Buffer, iIfOpen: number): number;
}

// ffi调用dll接口方法
export interface ApiDll {
    [fn: string]: [string, [string]];
}

export const apiTxtDll: ApiDll = {
    'SDT_OpenPort': ['int', ['int'] ],   // 查找设备端口
    'SDT_ClosePort': ['int', ['int'] ],  // 关闭端口
    'SDT_StartFindIDCard': ['int', ['int', 'pointer', 'int'] ],  // 找卡 port,0,0
    'SDT_SelectIDCard': ['int', ['int', 'pointer', 'int'] ], // 选卡
    'SDT_ReadBaseMsg': ['int', ['int', 'pointer', 'pointer', 'pointer', 'pointer', 'int'] ], // 读取基础信息
    'SDT_GetSAMStatus': ['int', ['int', 'int'] ],   // 对 SAM 进行状态检测
    'SDT_ResetSAM': ['int', ['int', 'int'] ],   // 重置SAM
};

export const apiImgDll: ApiDll = {
    'GetBmp': ['int', ['string', 'int'] ],   // 读取大头像
};



// 读卡设置
export interface Device {
    port: number;   // device connect port
    useUsb: boolean;    // device access mode usb or serial
    openPort: number;   // port reopen during call function every time
}

export interface RawData {
    err: number;    // 读取错误标识 0表示读取成功
    code: number;    // 读卡结果码
    text: Buffer;   // 文本信息
    image: Buffer;  // 图片信息 需要解码
    imagePath: string;  // 图片文件地址
}

export interface IDData {
    base: DataBase; // object
    imagePath: string;  // image file path
}

export interface DataBase {
    name: string;       // 姓名
    gender: number; // 1男，2女
    genderName: string;
    nation: string; // 民族代码
    nationName: string; // 民族中文
    birth: string;  // 出生日期
    address: string;   // 住址
    idc: string;  // 身份证号
    regorg: string;   // 签发机关
    startdate: string;  // 有效期开始
    enddate: string;    // 有效期结束 日期或者"长期"
}

export const nationMap: Map<string, string> = new Map([
    ['01', '汉'],
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
]);
