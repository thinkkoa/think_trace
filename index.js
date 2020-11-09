/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2017 - <richenlin(at)gmail.com>
 * @license    MIT
 * @version    17/4/29
 */
const lib = require('think_lib');
const logger = require('think_logger');

/**
 * 
 * 
 * @param {*} app
 * @param {*} ctx
 * @param {*} options
 * @param {*} body
 * @returns
 */
const htmlRend = async function (app, ctx, options, body) {
    let contentType = 'text/html';
    if (options.encoding !== false && contentType.indexOf('charset=') === -1) {
        contentType = `${contentType}; charset=${options.encoding}`;
    }
    ctx.type = contentType;
    if (ctx.status < 400) {
        ctx.body = body || ' ';
        return null;
    }
    let res = '', stack = '';
    const resBody = {
        code: ctx.status,
        message: ctx.message,
    };
    if (lib.isError(body)) {
        resBody.message = body.message;
        stack = body.stack;
    }

    if (options.error_path) {
        if (ctx.compile) {
            ctx._assign = resBody;
            logger.info('auto render the error template.');
            res = await ctx.compile(`${options.error_path}/${ctx.status}.html`, ctx._assign || {});
        } else {
            logger.warn('`think_view `middleware is not included, so it only outputs file content.');
            res = await lib.readFile(`${options.error_path}/${ctx.status}.html`, 'utf-8');
        }
    } else {
        res = `<!DOCTYPE html><html><head><title>Error - ${resBody.code}</title><meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0">
            <style>body {padding: 50px 80px;font: 14px 'Microsoft YaHei','微软雅黑',Helvetica,Sans-serif;}h1, h2 {margin: 0;padding: 10px 0;}h1 {font-size: 2em;}h2 {font-size: 1.2em;font-weight: 200;color: #aaa;}pre {font-size: .8em;}</style>
            </head><body><div id="error"><h1>Error</h1><p>Oops! Your visit is rejected!</p><h2>Message:</h2><pre><code>${resBody.message || ''}</code></pre>`;
        // if (app.app_debug || body.expose) {
        if (app.app_debug) {
            res = `${res}<h2>Stack:</h2><pre><code>${stack || ''}</code></pre>`;
        }
        res = `${res}</div></body></html>`;
    }
    return ctx.res.end(res);
};

/**
 *
 *
 * @param {*} app
 * @param {*} ctx
 * @param {*} options
 * @param {*} body
 * @returns
 */
const jsonRend = function (app, ctx, options, body) {
    let contentType = 'application/json';
    if (options.encoding !== false && contentType.indexOf('charset=') === -1) {
        contentType = `${contentType}; charset=${options.encoding}`;
    }
    ctx.type = contentType;
    if (ctx.status < 400) {
        // body = (body || {});
        if (lib.isJSONObj(body)) {
            ctx.body = {
                code: lib.isTrueEmpty(body.status) ? ctx.status : body.status,
                message: body.message || ctx.message || '',
                data: body
            };
        } else {
            ctx.body = {
                code: ctx.status,
                message: ctx.message || '',
                data: body
            };
        }
        return null;
    }
    let message = ctx.message;
    if (lib.isError(body)) {
        message = body.message;
    }
    return ctx.res.end(`{"code": ${ctx.status},"message":"${message || ''}"}`);
};

/**
 *
 *
 * @param {*} app
 * @param {*} ctx
 * @param {*} options
 * @param {*} body
 * @returns
 */
const textRend = function (app, ctx, options, body) {
    let contentType = 'text/plain';
    if (options.encoding !== false && contentType.indexOf('charset=') === -1) {
        contentType = `${contentType}; charset=${options.encoding}`;
    }
    ctx.type = contentType;
    if (ctx.status < 400) {
        ctx.body = body || ' ';
        return null;
    }
    let message = ctx.message;
    if (lib.isError(body)) {
        message = body.message;
    }
    return ctx.res.end(`Error: ${message || ''} `);
};

/**
 *
 *
 * @param {*} app
 * @param {*} ctx
 * @param {*} options
 * @param {*} body
 * @returns {*}
 */
const defaultRend = function (app, ctx, options, body) {
    if (ctx.status < 400) {
        ctx.body = body || ' ';
        return null;
    }
    let { message } = ctx;
    if (lib.isError(body)) {
        message = body.message;
    }
    return ctx.res.end(`Error: ${message || ''} `);
};

/**
 *
 *
 * @param {*} app
 * @param {*} ctx
 * @param {*} options
 * @param {*} body
 * @returns
 */
const responseBody = async function (app, ctx, options, body) {
    try {
        const contentType = parseResContentType(ctx);
        // accepted types
        switch (contentType) {
            case 'json':
                await jsonRend(app, ctx, options, body);
                break;
            case 'html':
                await htmlRend(app, ctx, options, body);
                break;
            case 'text':
                await textRend(app, ctx, options, body);
                break;
            default:
                await defaultRend(app, ctx, options, body);
                break;
        }
    } catch (err) {
        logger.error(err);
    }
    return null;
};

/**
 * parse response content-type
 *
 * @param {*} ctx
 * @returns {*} 
 */
const parseResContentType = function (ctx) {
    if (ctx.response.type === '') {
        return ctx.accepts('json', 'html', 'text');
    }
    let type = ctx.response.is('json', 'html', 'text');
    if (type) {
        return type;
    }
    return '';
};

/**
 * error catcher
 * 
 * @param {any} app 
 * @param {any} ctx 
 * @param {any} options
 * @param {any} err 
 */
const catcher = async function (app, ctx, options, err) {
    if (!app.isPrevent(err)) {
        app.emit('error', err, ctx);
        ctx.status = (err && typeof err.status === 'number') ? err.status : (options.error_code || 500);
        return responseBody(app, ctx, options, err);
    }
    return null;
};

/**
 * default options
 */
const defaultOptions = {
    timeout: 10, //http服务超时时间,单位s
    error_code: 500, //发生错误输出的状态码
    error_path: '', //错误模板目录配置.该目录下放置404.html、502.html等,框架会自动根据status进行渲染(支持模板变量,依赖think_view中间件;如果think_view中间件未加载,仅输出模板内容)
};

module.exports = function (options, app) {
    options = options ? lib.extend(defaultOptions, options, true) : defaultOptions;

    if (options.error_path && (options.error_path).startsWith('./')) {
        options.error_path = (options.error_path).replace('./', `${process.env.ROOT_PATH}/`);
    }
    // ms
    options.timeout = (options.timeout || 30) * 1000;
    options.encoding = app.config('encoding') || 'utf-8';

    return async function (ctx, next) {
        //set ctx start time
        lib.define(ctx, 'startTime', Date.now());
        //http version
        lib.define(ctx, 'version', ctx.req.httpVersion);
        //originalPath
        lib.define(ctx, 'originalPath', ctx.path);
        //auto send security header
        ctx.set('X-Powered-By', 'ThinkKoa');
        ctx.set('X-Content-Type-Options', 'nosniff');
        ctx.set('X-XSS-Protection', '1;mode=block');

        // response finish
        ctx.res.once('finish', function () {
            let times = '';
            if (process.env.APP_DEBUG) {
                times = `${(Date.now() - ctx.startTime) || 0} ms`;
            }
            logger[(ctx.status >= 400 ? 'error' : 'success')](` ${ctx.method} ${ctx.status} ${ctx.originalPath || '/'} ${times}`);
            ctx = null;
        });

        // try /catch
        try {
            ctx.res.timeout = null;
            // promise.race
            const res = await Promise.race([new Promise((resolve, reject) => {
                const err = new Error('Request Timeout');
                err.status = 408;
                ctx.res.timeout = setTimeout(reject, options.timeout, err);
                return;
            }), next()]);
            if (res && ctx.status !== 304) {
                ctx.body = res;
            }
            if (ctx.body !== undefined && ctx.status === 404) {
                ctx.status = 200;
            }
            // error
            if (ctx.status >= 400) {
                ctx.throw(ctx.status, ctx.url);
            }
            return null;
        } catch (err) {
            return catcher(app, ctx, options, err);
        } finally {
            clearTimeout(ctx.res.timeout);
        }
    };
};

