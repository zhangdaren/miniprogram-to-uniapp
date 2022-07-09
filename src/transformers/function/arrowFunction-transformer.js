/*
 * @Author: zhang peng
 * @Date: 2021-08-16 11:44:02
 * @LastEditTime: 2022-05-16 14:38:53
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\function\arrowFunction-transformer.js
 *
 */


const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")


var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")

/**
 * arrowFunction 修复
 * methods里面的箭头函数都转为普通函数
 * {test:e=>{}} 转换为 {test:(e)=>{}}
 * @param {*} $ast
 */
function transformArrowFunction ($jsAst, fileKey) {
    if (!$jsAst) return

    var methodList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.METHODS)
    methodList.map((item, i) => {
        if (item.value && item.value.type === "ArrowFunctionExpression") {
            var value = item.value
            var objectMethod = t.objectMethod("method", item.key, value.params, value.body, item.computed, value.generator, value.async)
            methodList[i] = objectMethod
        }
    })
}

module.exports = { transformArrowFunction }
