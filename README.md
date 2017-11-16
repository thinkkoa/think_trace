# 介绍
-----

[![npm version](https://badge.fury.io/js/think_trace.svg)](https://badge.fury.io/js/think_trace)
[![Dependency Status](https://david-dm.org/thinkkoa/think_trace.svg)](https://david-dm.org/thinkkoa/think_trace)

HTTP error intercept processing for ThinkKoa.

# 安装
-----

```
npm i think_trace
```

# 使用
-----

1、trace中间件为thinkkoa内置中间件,无需在项目中创建引用。该中间件默认开启

2、项目中间件配置 config/middleware.js:
```
config: { //中间件配置
    ...,
    trace: {
        timeout: 30, //http请求超时时间,单位s
        error_code: 500, //报错时的状态码
        error_no_key: 'errno', //错误号的key
        error_msg_key: 'errmsg', //错误消息的key
    }
}
```