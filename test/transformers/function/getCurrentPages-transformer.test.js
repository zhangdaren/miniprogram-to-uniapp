const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")

var appRoot = "../../.."
const {
    transformGetCurrentPages
} = require(appRoot + '/src/transformers/function/getCurrentPages-transformer')


test('transformGetCurrentPages 1 ', () => {

    var ast = $(`var pages = getCurrentPages();
    var prevPage = pages[pages.length - 1];
    prevPage.setData(); `)

    transformGetCurrentPages(ast)

    var sourceCode = ast.generate({ isPretty: true })
    var targetCode = $(`var pages = getCurrentPages();
     var prevPage = pages[pages.length - 1].$vm;
     prevPage.setData();`).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})


test('transformGetCurrentPages 2 ', () => {
    var ast = $(`var e = getCurrentPages()[getCurrentPages().length - 1]; e.onShow();`)

    transformGetCurrentPages(ast)

    var sourceCode = ast.generate({ isPretty: true })
    var targetCode = $(`var e = getCurrentPages()[getCurrentPages().length - 1].$vm; e.onShow();`).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})

test('transformGetCurrentPages 3 ', () => {
    var ast = $(`var o = getCurrentPages().pop();
     o.setData({
         warrant: !0
     })`)

    transformGetCurrentPages(ast)

    var sourceCode = ast.generate({ isPretty: true })
    var targetCode = $(`var o = getCurrentPages().pop().$vm;
    o.setData({
        warrant: !0
    })`).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})
