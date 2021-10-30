/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2021-10-19 12:57:40
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp2\src\utils\babelUtils.js
 *
 */
const t = require("@babel/types")
const clone = require("clone")
const nodePath = require("path")
const parse = require("@babel/parser").parse
const generate = require("@babel/generator").default
const traverse = require("@babel/traverse").default
const pathUtil = require("./pathUtils")
const utils = require('./utils')


/**
 * 将ast属性数组组合为ast对象
 * @param {*} pathAry
 */
function arrayToObject (pathAry) {
    return t.objectExpression(pathAry)
}



/**
 * 替换ast里指定关键字(如wx或qq)为uni
 * @param {*} ast
 */
function renameToUni (ast, name = 'wx') {
    traverse(ast, {
        Program (path) {
            if (Array.isArray(name)) {
                name.forEach((n) => {
                    // path.scope.rename(n, 'uni')
                    renameKeyword(path, n)
                })
            } else {
                // path.scope.rename(name, 'uni')
                renameKeyword(path, name)
            }
        },
        VariableDeclarator (path) {
            if (
                t.isStringLiteral(path.node.init, {
                    value: 'replace-tag-375890534@qq.com',
                })
            ) {
                path.remove()
                path.stop()
            }
        },
    })
}


/**
 * fix(transformer): babel-generator 把中文字符生成为 unicode
 * https://github.com/NervJS/taro/commit/9bbb39972b404f5b06164414cdcce53d5016a158
 * @param {*}
 * @returns
 */
function decodeUnicode (s) {
    return unescape(s.replace(/\\(u[0-9a-fA-F]{4})/gm, '%$1'))
}

/**
 * generate增强版，防止中文转换为转义符
 */
function generateExt (pathNode) {
    return decodeUnicode(generate(pathNode, { retainFunctionParens: true }).code)
}

module.exports = {
    renameToUni,
}
