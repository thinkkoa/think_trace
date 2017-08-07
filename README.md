# 介绍
-----

[![npm version](https://badge.fury.io/js/think_trace.svg)](https://badge.fury.io/js/think_trace)
[![Dependency Status](https://david-dm.org/thinkkoa/think_trace.svg)](https://david-dm.org/thinkkoa/think_trace)

Trace for ThinkKoa..

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

        log: true, //是否存储日志
        log_path: think.root_path + '/logs', //存储日志文件目录
        log_level: ['warn', 'error'], //日志存储级别, 'info', 'warn', 'error', 'success'
        
        cookie: {
            domain: '',  // cookie所在的域名
            path: '/',       // cookie所在的路径
            maxAge: -1, // cookie有效时长
            httpOnly: true,  // 是否只用于http请求中获取
            overwrite: false,  // 是否允许重写
            //expires: new Date('2017-02-15')  // cookie失效时间
        }
    }
}
```