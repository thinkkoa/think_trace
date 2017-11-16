/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2017 - <richenlin(at)gmail.com>
 * @license    MIT
 * @version    17/4/29
 */
const lib = require('think_lib');
const httpError = require('http-errors');
const logger = require('think_logger');

/**
 * error catcher
 * 
 * @param {any} app 
 * @param {any} ctx 
 * @param {any} options
 * @param {any} err 
 */
const catcher = function (app, ctx, options, err) {
    if (!app.isPrevent(err)) {
        ctx.status = typeof err.status === 'number' ? err.status : (options.error_code || 500);
        // accepted types
        switch (ctx.accepts('html', 'text', 'json')) {
            case 'json':
                ctx.type = 'application/json';
                ctx.res.end(`{"status": 0,"${options.error_no_key || 'errno'}": ${ctx.status},"${options.error_msg_key || 'errmsg'}":"${err.message || ''}","data":{}}`);
                break;
            case 'html':
                ctx.type = 'text/html';
                let body = `<!DOCTYPE html><html><head><title>Error - ${ctx.status}</title><meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0">
            <style>body {padding: 50px 80px;font: 14px 'Microsoft YaHei','微软雅黑',Helvetica,Sans-serif;}h1, h2 {margin: 0;padding: 10px 0;}h1 {font-size: 2em;}h2 {font-size: 1.2em;font-weight: 200;color: #aaa;}pre {font-size: .8em;}</style>
            </head><body><div id="error"><h1>Error</h1><p>Oops! Your visit is rejected!</p>`;
                // if (app.app_debug || err.expose) {
                if (app.app_debug) {
                    body += `<h2>Message:</h2><pre><code>${err.message || ''}</code></pre><h2>Stack:</h2><pre><code>${err.stack || ''}</code></pre>`;
                }
                body += '</div></body></html>';
                ctx.res.end(body);
                break;
            case 'text':
            default:
                ctx.type = 'text/plain';
                ctx.res.end(`Error: ${err.message || ''}`);
                break;
        }
        app.emit('error', err, ctx);
        return app.prevent();
    }
    return null;
};

/**
 * http timeout timer
 * 
 * @param {any} tmr 
 * @param {any} timeout 
 * @returns 
 */
const timer = function (tmr, timeout) {
    return new Promise((resolve, reject) => {
        /*eslint-disable no-return-assign */
        return tmr = setTimeout(reject, timeout, httpError(408));
    });
};

/**
 * default options
 */
const defaultOptions = {
    timeout: 30, //http请求超时时间,单位s
    error_code: 500, //报错时的状态码
    error_no_key: 'errno', //错误号的key
    error_msg_key: 'errmsg', //错误消息的key
};

module.exports = function (options, app) {
    options = options ? lib.extend(defaultOptions, options, true) : defaultOptions;
    
    let tmr;
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
            //
            let times = (Date.now() - ctx.startTime) || 0,
                // style = '\x1B[32m', 
                method = 'success';
            if (ctx.status >= 400) {
                // style = '\x1B[31m';
                method = 'error';
            }
            logger[method](` ${ctx.method.toUpperCase()}  ${ctx.status}  ${ctx.originalPath || '/'}  ${times}ms`);
            // console[method](` ${style}${ctx.method.toUpperCase()}  ${ctx.status}  ${ctx.originalPath || '/'}  ${times}ms\x1B[39m`);
        });

        // try /catch
        tmr = null;
        try {
            const timeout = (options.timeout || 30) * 1000;
            // promise.race
            await Promise.race([timer(tmr, timeout), next()]);
            //404 error
            if (ctx.status >= 400) {
                ctx.throw(ctx.status, ctx.url);
            }
            return null;
        } catch (err) {
            return catcher(app, ctx, options, err);
        } finally {
            tmr && clearTimeout(tmr);
        }
    };
};

