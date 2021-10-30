/*
 * @Author: zhang peng
 * @Date: 2021-08-30 10:46:31
 * @LastEditTime: 2021-08-30 18:30:55
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp2\test\ggcTest.js
 *
 * test 的 test。。。。
 * 为了简化代码，
 *
 */
const $ = require('gogocode')
var htmlParseOptions = { parseOptions: { language: 'html' } }


/**
 * 为了简化测试，少写代码，特写了这个js函数
 * @param {*} source     源代码
 * @param {*} target     目标代码
 * @param {*} transformFun   转换函数
 * @param {*} isHtml         是否html文件
 * @param {*} isPretty       是否格式化代码
 * @returns
 */
function ggcTest (source, target, transformFun, isHtml = false, isPretty = true) {
    if (!source || !target || !transformFun) {
        return {
            source: source,
            target: target
        }
    }

    var parseOptions = isHtml ? htmlParseOptions : {}

    var sourceAst = $(source, parseOptions)
    transformFun(sourceAst)

    var sourceCodeStr = sourceAst.generate({ isPretty: isPretty })
    var targetCodeStr = $(target, parseOptions).generate({ isPretty: isPretty })
    return {
        sourceCode: sourceCodeStr,
        targetCode: targetCodeStr
    }
}

module.exports = { ggcTest }
