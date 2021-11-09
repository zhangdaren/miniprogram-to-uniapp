/*
 * @Author: zhang peng
 * @Date: 2021-08-16 09:56:46
 * @LastEditTime: 2021-10-29 19:03:19
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\behavior\behavior-transformer.js
 *
 */


const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")


const babelUtils = require("../../utils/babelUtils")
const ggcUtils = require("../../utils/ggcUtils")




/**
 * behavior 里面的文本字段处理
 * 'wx://form-field' --> 'uni://form-field'
 * @param {*} $jsAst
 * @returns
 */
function transformBehaviorProp ($jsAst) {
    if (!$jsAst) return

    let reg = /^wx:\/\//
    var behaviorList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.BEHAVIORS)
    behaviorList.map(function (item) {
        if (t.isStringLiteral(item)) {
            if (reg.test(item.value)) {
                item.value = item.value.replace(reg, "uni://")
            } else {
                //TODO: 可能是路径，应该要对应的进行处理
            }
        }
    })
    return $jsAst
}


/***
 *
 *https://developers.weixin.qq.com/miniprogram/dev/extended/utils/computed.html
 *
 *https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/relations.html#relations%20%E5%AE%9A%E4%B9%89%E6%AE%B5
 *https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/extend.html#%E4%BD%BF%E7%94%A8%E6%89%A9%E5%B1%95
 *https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/behaviors.html

https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/lifetimes.html#%E5%AE%9A%E4%B9%89%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E6%96%B9%E6%B3%95
https://developers.weixin.qq.com/miniprogram/dev/reference/api/Behavior.html

 */
function transformBehavior ($jsAst, fileKey) {
    // console.log("fileKey", fileKey)

    transformBehaviorProp($jsAst)

    return $jsAst
}


module.exports = { transformBehavior }
