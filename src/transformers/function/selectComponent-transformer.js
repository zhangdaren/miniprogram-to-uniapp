/*
 * @Author: zhang peng
 * @Date: 2021-08-16 11:59:58
 * @LastEditTime: 2021-11-19 17:19:31
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\function\selectComponent-transformer.js
 */

const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")

var appRoot = "../../../.."
// const ggcUtils = require(appRoot + "/src/utils/ggcUtils")

/**
 * selectComponent函数处理
 * this.selectcomponent('#diy') --> this.$mp.page.selectComponent('#diy')
 * @param {*} $ast
 * @param {*} fileKey
 */
function transformSelectComponent ($jsAst, fileKey) {
    if (!$jsAst) return

    $jsAst
        .replace([`$_$.selectComponent($$$)`,`$_$.selectComponent()`], (match, nodePath) => {
            var hasParams = match["$$$$"]
            if (hasParams) {
                return `$_$.$mp.page.selectComponent($$$)`
            } else {
                return `$_$.$mp.page.selectComponent()`
            }
        })
}

module.exports = { transformSelectComponent }
