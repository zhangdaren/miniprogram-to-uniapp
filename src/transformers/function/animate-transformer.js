/*
 * @Author: zhang peng
 * @Date: 2021-10-16 11:03:33
 * @LastEditTime: 2021-10-30 16:47:53
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/function/animate-transformer.js
 *
 */

const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")

var appRoot = "../../.."

const ggcUtils = require(appRoot + "/src/utils/ggcUtils")


/**
 * animate函数处理
 * @param {*} item
 */
function animateFnHandle (item) {

    //TODO:未完
    // item.before('\n// #ifdef MP-WEIXIN \n')
    // console.log(item.clone().generate())


    // TODO: 这里还有问题，gogocode不支持这么搞
    // item.before(item.clone().replace('$_$this.animate($$$List)', '$_$this.$scope.animate($$$List)').generate())

    // 曲线救国
    // var str = item.generate()
    // var ast = $(str).replace('$_$this.animate($$$List)', '$_$this.$scope.animate($$$List)')
    // item.before(ast)


    // item.before('\n// #endif\n')

    // item.before("\n//before\n").after("\n//after\n")

    // item.before('\n// #ifndef MP-WEIXIN \n').after('\n// #endif\n')
}


/**
 *
 * @param {*} $ast
 * @param {*} fileKey
 */
function transformAnimate ($ast, fileKey) {
    if (!$ast) return

    $ast
        .find('$_$this.animate($$$List)')
        .each(function (item) {
            var thisNode = item.match['this'][0].node

            if (t.isThisExpression(thisNode)) {
                animateFnHandle(item)
            } else if (t.isIdentifier(thisNode)) {
                var nodePath = item[0].nodePath
                var objectName = thisNode.name
                var init = ggcUtils.getScopeVariableInitValue(nodePath.scope, objectName)
                if (t.isThisExpression(init)) {
                    //确定是this的别名
                    animateFnHandle(item)
                }
            }
        }).root()
}

module.exports = { transformAnimate }
