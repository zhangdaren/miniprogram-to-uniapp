/*
 * @Author: zhang peng
 * @Date: 2021-10-16 11:03:33
 * @LastEditTime: 2021-11-25 15:23:34
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
    //给函数添加注释时，需找父级
    var parent = item.parent({ type: 'ExpressionStatement' })

    var str = item.generate()
    var newAst = $(str).replace('$_$this.animate($$$List)', '$_$this.$scope.animate($$$List)')

    parent.before(`// #ifdef MP-WEIXIN \n ${newAst.generate()}\n // #endif \n`)

    parent.before('// #ifndef MP-WEIXIN \n').after('\n// #endif')
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
