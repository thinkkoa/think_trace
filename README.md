# 介绍
-----

[![npm version](https://badge.fury.io/js/think_trace.svg)](https://badge.fury.io/js/think_trace)

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
        timeout: 10, //http服务超时时间,单位s
        error_code: 500, //发生错误输出的状态码
        error_key: 'code', //错误码的key
        error_msg: 'message', //错误消息的key
        error_path: '', //错误模板目录配置.该目录下放置404.html、502.html等,框架会自动根据status进行渲染(支持模板变量,依赖think_view中间件;如果think_view中间件未加载,仅输出模板内容)
    }
}
```