# 通用二代身份证读卡
----
在widnows客户端实现通过二代身份证机具读取二代身份证信息
- 使用通过dll驱动实现对多数机具的读取
- 通过node-ffi实现访问dll接口。gyp需要编译为32位

## 安装依赖
`npm i node-gyp -g`
- gyp安装比较麻烦，可以先安装 windows-build-tools 来自动安装相关开发工具

## 安装
`npm i idcard-reader`

## 使用
```js
const IDCR = require('idcard-reader');
```

# License
The MIT License (MIT)

