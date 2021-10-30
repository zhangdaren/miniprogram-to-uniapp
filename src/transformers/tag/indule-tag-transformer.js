/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:00:05
 * @LastEditTime: 2021-10-29 11:20:50
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\tag\indule-tag-transformer.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const clone = require("clone")



var appRoot = require('app-root-path').path
if(appRoot !== __dirname){
    appRoot = __dirname.split(/[\\/]miniprogram-to-uniapp/)[0] + "/miniprogram-to-uniapp"
}

const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')


function transformIncludeTag (wxmlAst, wxmlFile, allPageData) {
    if (!wxmlAst) {
        return
    }
    wxmlAst.find(`<include src="$_$src"></include>`)
        .each((item) => {
            var match = item.match["src"]
            var src = match[0].value

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
                console.log("[Error]include没有找到这个wxml   fileKey: " + templateFileKey)
                return
            }
            var templatePageData = allPageData[templateFileKey]["data"]
            transformIncludeTag(templatePageData.wxmlAst, templatePageData.wxmlFile, allPageData)

            item.before(`<!-- parse ${item.generate()} -->`)
            item.replaceBy(templatePageData.wxmlAst)
        }).root()
}


module.exports = { transformIncludeTag }
