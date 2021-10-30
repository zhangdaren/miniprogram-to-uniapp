/*
 * @Author: zhang peng
 * @Date: 2021-08-02 11:46:21
 * @LastEditTime: 2021-09-15 14:41:58
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp2\src\utils\mustacheUtils.js
 *
 */

///痛哭，居然还有这神器。。。。。。。
const { parse, render } = require('mustache')


/**
 * 获取模板字符串的tokens
 * @param {*} expr
 * @returns
 */
function getMustacheTokens (expr) {
    return parse(expr)
}


/**
 * 小程序变量绑定写法转换为uniapp写法
 *
 * 示例：
 * <view hidden="{{flag ? true : false}}"> Hidden </view>
 * "{{flag ? true : false}}" -->  "flag ? true : false"
 *
 * @param {*} expr
 * @param {*} identifier
 * @returns
 */
function parseMustache (expr, identifier = false) {
    if (!expr) {
        return ''
    }
    // console.log("expr", expr)
    const tokens = parse(expr)
    const isIdentifier = tokens.length === 1

    return tokens.map(token => {
        if (token[0] === 'text') {
            if (identifier) {
                return token[1]
            }
            return `'${ token[1] }'`
        } else if (token[0] === '!') { // {{ !loading }}
            return `(!${ token[1] })`
        } else if (token[0] === 'name') {
            if (isIdentifier) {
                return token[1]
            }
            return `(${ token[1] })`
        }
    }).join('+')
}



/**
 * 将mustache.parse获得的tokens还原为绑定字符串
 *
 * "weui-toptips {{className}} {{!extClass}} {{show ? 'weui-toptips_show' :  ''}}"
 * parse后：
 * 0:(4) ['text', 'weui-toptips ', 0, 13]
 * 1:(4) ['name', 'className', 13, 26]
 * 2:(4) ['text', ' ', 26, 27]
 * 3:(4) ['!', 'extClass', 27, 40]
 * 4:(4) ['text', ' ', 40, 41]
 * 5:(4) ['name', 'show ? 'weui-toptips_show' :  ''', 41, 77]
 *
 * 还原后：
 * "weui-toptips {{className}} {{!extClass}} {{show ? 'weui-toptips_show' :  ''}}"
 *
 * @param {*} tokens
 * @returns
 */
function stringifyMustache (tokens) {
    return tokens.map(token => {
        if (token[0] === 'text') {
            return token[1]
        } else if (token[0] === '!') { // {{ !loading }}
            return `{{!${ token[1] }}}`
        } else if (token[0] === 'name') {
            return `{{${ token[1] }}}`
        }
    }).join('')
}


module.exports = {
    getMustacheTokens,
    parseMustache,
    stringifyMustache
}
