/*
 * @Author: zhang peng
 * @Date: 2021-08-16 11:44:02
 * @LastEditTime: 2022-11-02 21:25:38
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/function/arrowFunction-transformer.js
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

    var methodList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.METHODS, fileKey)
    methodList.map((item, i) => {
        if (item.value && item.value.type === "ArrowFunctionExpression") {
            var value = item.value
            var body = value.body
            if (!t.isBlockStatement(body)) {
                //针对:  {methods: zeroPadding: t => (t = t.toString())[1] ? t : "0" + t}
                var exp = t.ReturnStatement(body)
                body = t.blockStatement([exp])
            }
            var objectMethod = t.objectMethod("method", item.key, value.params, body, item.computed, value.generator, value.async)
            methodList[i] = objectMethod
        }
    })
}

module.exports = { transformArrowFunction }
