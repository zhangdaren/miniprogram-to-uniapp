/*
 * @Author: zhang peng
 * @Date: 2021-08-17 20:16:00
 * @LastEditTime: 2021-10-30 16:56:11
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/test/page/template/template-transformer.test.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")

var appRoot = "../../.."
const {
    transformEventDynamicCode
} = require(appRoot + '/src/page/template/template-transformer')


var parseOptions = { parseOptions: { language: 'html' } }


test('transformEventDynamicCode 1 ', () => {

    var sorce = `<input @input="test" />`
    var target = `<input @input="test" />`

    var ast = $(sorce, parseOptions)
    transformEventDynamicCode(ast)
    var sourceCode = ast.generate({ isPretty: true })
    var targetCode = $(target, parseOptions).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})


test('transformEventDynamicCode 2 ', () => {

    var sorce = `<input @input="value = true" />`
    var target = `<input @input="value = true" />`

    var ast = $(sorce, parseOptions)
    transformEventDynamicCode(ast)
    var sourceCode = ast.generate({ isPretty: true })
    var targetCode = $(target, parseOptions).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})

test('transformEventDynamicCode 3 ', () => {

    var sorce = `<view @tap="openId==undefined?'denglu':'hy_to'">立即{{ hyinfo.banli }}</view>`
    var target = `<view @tap="parseEventDynamicCode(openId==undefined?'denglu':'hy_to')">立即{{ hyinfo.banli }}</view>`

    var ast = $(sorce, parseOptions)
    transformEventDynamicCode(ast)
    var sourceCode = ast.generate({ isPretty: true })
    var targetCode = $(target, parseOptions).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})


test('transformEventDynamicCode 4 ', () => {

    var sorce = `<input @input="'bindCustomfrom' + (index+1)"/>`
    var target = `<input @input="parseEventDynamicCode('bindCustomfrom' + (index+1))"/>`

    var ast = $(sorce, parseOptions)
    transformEventDynamicCode(ast)
    var sourceCode = ast.generate({ isPretty: true })
    var targetCode = $(target, parseOptions).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})

