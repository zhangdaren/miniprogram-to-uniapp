const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")

var appRoot = "../../.."
const {
    transformWxParse,
    transformWxParseScript,
    transformWxParseTemplate,
} = require(appRoot + '/src/transformers/component/wxparse-transformer')


test('transformWxParseScript 1 ', () => {
    var ast = $(`WxParse.wxParse('editors.editor' + item.id, 'html', item.content.fulltext, this)`)

    transformWxParseScript(ast)

    var sourceCode = ast.generate({ isPretty: true })
    var targetCode = $(`this["editors.editor" + item.id] = this.escape2Html(item.content.fulltext)`).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})



test('transformWxParseScript 2 ', () => {
    var ast = $(`a.WxParse.wxParse("richtext." + o, "html", i[o].params.content, e, 5)`)

    transformWxParseScript(ast)

    var sourceCode = ast.generate({ isPretty: true })
    var targetCode = $(`e["richtext." + o] = e.escape2Html(i[o].params.content)`).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})

test('transformWxParseScript 3 ', () => {
    var ast = $(`WxParse.wxParse("goodsDetail", "html", cont, self);`)

    transformWxParseScript(ast)

    var sourceCode = ast.generate({ isPretty: true })
    var targetCode = $(`self.article_goodsDetail = self.escape2Html(cont)`).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})


