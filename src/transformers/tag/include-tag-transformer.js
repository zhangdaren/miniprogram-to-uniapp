/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:00:05
 * @LastEditTime: 2023-04-10 20:37:32
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/tag/include-tag-transformer.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const clone = require("clone")




var appRoot = "../../.."
const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')


function transformIncludeTag (wxmlAst, wxmlFile, allPageData) {
    if (!wxmlAst) {
        return
    }
    wxmlAst.find(`<include src="$_$src" $$$></include>`)
        .each((item) => {
            var match = item.match["src"]
            var src = match[0].value
            var attrs = item.match['$$$$']

            var fullPath = ""
            if (src && src[0] === "/") {
                fullPath = path.join(global.miniprogramRoot, src)
            } else {
                let pFolderName = path.dirname(wxmlFile)
                fullPath = path.join(pFolderName, src)
            }

            var templateFileKey = pathUtils.getFileKey(fullPath)

            if (!allPageData[templateFileKey]) {
                item.before("<!-- include没有找到这个wxml，已注释 -->")
                item.replaceBy(`<!-- ${ item.generate() } -->`)
                global.log("[ERROR]include没有找到这个wxml   fileKey: " + templateFileKey)
                return
            }
            var templatePageData = allPageData[templateFileKey]["data"]
            transformIncludeTag(templatePageData.wxmlAst, templatePageData.wxmlFile, allPageData)

            //解析attr，并在外面包一层block，将attr放上去
            var attrList = attrs.map(obj => {
                return obj.value ? `${ obj.key.content }="${ obj.value.content }"` : `${ obj.key.content }`
            })

            var attrStr = attrList.join(" ")
            var newAst = $(`<block ${ attrStr }></block>`, { parseOptions: { language: 'html' } })
            newAst.replace(`<block $$$></block>`, `<block $$$>${ templatePageData.wxmlAst.generate() }</block>`)

            //添加注释，并替换
            item.before(`<!-- parse ${ item.generate() } -->`)
            item.replaceBy(newAst)
        }).root()
}


module.exports = { transformIncludeTag }
