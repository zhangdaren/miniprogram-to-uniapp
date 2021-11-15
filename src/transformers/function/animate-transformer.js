/*
 * @Author: zhang peng
 * @Date: 2021-10-16 11:03:33
 * @LastEditTime: 2021-11-15 10:45:42
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\function\animate-transformer.js
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
    // TODO: 这里还有问题，gogocode不支持这么搞
    // item.before(item.clone().replace('$_$this.animate($$$List)', '$_$this.$scope.animate($$$List)').generate())

    //给函数添加注释时，需找父级
    var parent = item.parent({ type: 'ExpressionStatement' })

    // 曲线救国
    var str = item.generate()
    var mpAst = $(str).replace('$_$this.animate($$$List)', '$_$this.$scope.animate($$$List)')
    parent.before(mpAst)
    //添加小程序条件编译
    mpAst.before('\n// #ifdef MP-WEIXIN \n').after('\n// #endif\n\n')

    //添加非小程序条件编译
    parent.before('\n// #ifndef MP-WEIXIN \n').after('\n// #endif\n')
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
