/*
 * @Author: zhang peng
 * @Date: 2021-09-07 17:25:27
 * @LastEditTime: 2021-09-26 17:39:27
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp2\src\page\script\JavascriptParser.js
 *
 */
const parse = require('@babel/parser').parse
const generate = require('@babel/generator').default
const traverse = require('@babel/traverse').default


/**
 * babel解析ast
 */
class JavascriptParser {
    constructor () {

    }

    /**
     * 文本内容解析成AST
     * @param {*} scriptText
     * @param {*} fileKey
     * @param {*} isVueFile
     */
    parse (scriptText, fileKey, isVueFile) {
        let ast = null
        try {
            ast = parse(scriptText, {
                sourceType: 'module',
                // Note that even when this option is enabled, @babel/parser could throw for unrecoverable errors.
                // errorRecovery: true,  //没啥用，碰到let和var对同一变量进行声明时，当场报错！还会中断转换进程
                plugins: [
                    "asyncGenerators",
                    "classProperties",
                    "decorators-legacy", //"decorators",
                    "doExpressions",
                    "dynamicImport",
                    "exportExtensions",
                    "flow",
                    "functionBind",
                    "functionSent",
                    "jsx",
                    "objectRestSpread",
                ]
            })
        } catch (error) {
            //页面的js报错就暂停转换，其余js不管
            if (isVueFile) {
                throw new Error(`小程序js代码解析失败(babel)，请根据错误信息修复后，再重新进行转换。file: ${ fileKey }.js :>> ` + error)
            } else {
                console.log(`[Error]小程序js代码解析失败(babel)，请根据错误信息修复后，再重新进行转换。file: ${ fileKey }.js :>> ` + error)
            }
        }

        return ast
    }

    /**
     * AST树遍历方法
     * @param astObject
     * @returns {*}
     */
    traverse (astObject) {
        return traverse(astObject)
    }

    /**
     * 模板或AST对象转文本方法
     * @param astObject
     * @param code
     * @returns {*}
     */
    generate (astObject, code) {
        // const newScript = generate(astObject)
        const newScript = generate(astObject, { retainFunctionParens: false }, code)
        return newScript.code
    }
}
module.exports = JavascriptParser
