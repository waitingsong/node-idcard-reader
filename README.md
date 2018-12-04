# 通用二代身份证读卡
----
在widnows客户端实现通过二代身份证机具读取二代身份证信息
- 使用通过 `sdtapi.dll` 驱动实现对多数机具的读取  
- 通过 `node-ffi` 实现访问dll读卡接口
- [通用dll下载地址](https://www.cnblogs.com/name-lh/archive/2006/01/28/324003.html)

## 安装依赖
`npm install node-gyp -g`
- gyp安装比较麻烦，可以先npm安装 windows-build-tools 模块来自动安装相关开发环境和工具

## 安装
`npm install idcard-reader`


## 使用
```ts
import * as idcr from '../lib/index'


const opts = {
    dllTxt: 'c:/sdtapi.dll',
    dllImage: 'c:/wltrs.dll',   // 可空 空则不处理头像
    imgSaveDir: '',             // 头像图片生成保存目录 空则使用系统临时目录
}

idcr.init(opts)
  .then((devices) => {
    // 使用第一个机具进行读取
    return idcr.read(devices[0])
      .then(data => {
        console.log(data)
      })
  })
  .catch(console.error)
```

## 命令行调用
```bash
// 全局安装
npm install -g idcard-reader
// 执行
idc-reader
```


## 读取数据结构
```
{
    base: {
        name: string;       // 姓名
        gender: number;     // 性别 1，2
        genderName: string; // 性别 男,女
        nation: string;     // 民族代码
        nationName: string; // 民族中文
        birth: string;      // 出生日期
        address: string;    // 住址
        idc: string;        // 身份证号
        regorg: string;     // 签发机关
        startdate: string;  // 有效期开始
        enddate: string;    // 有效期结束 日期或者"长期"
    }
    imagePath: string;      // 头像文件路径
    samid: string;          // 机具SAM序列号
}

```

## 注意事项
- 因保护设计，身份证成功读取后必须移出机具读取感应区或者取出插卡，否则下次连接硬件执行找卡会出现找卡失败情况
- 若系统无法识别 USB 接口的机具，请尝试切换机具到主板 USB2.0 接口
- 大头照解码可能需要配合机具厂商提供的 `WltRS.dll` 文件
- `gyp` 需要编译为与 dll 相同的 32/64 位版本（通常为32位）


## License
[MIT](LICENSE)
