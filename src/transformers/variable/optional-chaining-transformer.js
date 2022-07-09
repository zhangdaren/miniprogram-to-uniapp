/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:00:05
 * @LastEditTime: 2022-06-07 18:27:38
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\variable\optional-chaining-transformer.js
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const clone = require("clone")
var appRoot = "../../.."
const utils = require(appRoot + '/src/utils/utils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')


/**
 * template标签里的多级变量处理
 * @param {*} $wxmlAst
 * @param {*} fileKey
 * @returns
 */
function transformOptionalChaining ($wxmlAst, fileKey) {
    if (!$wxmlAst) {
        return
    }

    $wxmlAst
        .find('<$_$tag></$_$tag>')
        .each(function (item) {
            let children = item.attr("content.children")

            //处理标签内容
            if (children && children.length === 1) {
                var contentNode = children[0].content.value
                if (!contentNode) return
                var content = contentNode.content
                if (content && content.includes('{{')) {

                }
            }
        }).root()
}

module.exports = {
    transformOptionalChaining
}


