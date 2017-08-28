### 通用二代身份证读卡
----
在widnows客户端实现通过二代身份证机具读取二代身份证信息
- 使用通过dll驱动实现对多数机具的读取
- 通过node-ffi实现访问dll接口。gyp需要编译为32位

#### 安装依赖
`npm install node-gyp -g`
- gyp安装比较麻烦，可以先安装 windows-build-tools 来自动安装相关开发工具

#### 安装
`npm install idcard-reader`


#### 使用
```js
const idcr = require('idcard-reader');
const settings = {
    dllTxt: 'c:/sdtapi.dll',
    dllImage: 'c:/wltrs.dll',   // 可空 空则不处理头像
};

idcr.init(settings).then((inited) => {
    if ( ! inited) {
        return;
    }
    const device = idcr.find_device();

    if (device.port) {
        idcr.fetch_data(device).then(data => {
            console.log(data);
        });
    }
});
```

#### 命令行调用
```js
// 全局安装
npm install idcard-reader -g
// 执行
idc-reader
```


#### 读取数据结构
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
}

```

### License
The MIT License (MIT)

