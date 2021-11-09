/*
 * @Author: zhang peng
 * @Date: 2021-08-16 11:44:02
 * @LastEditTime: 2021-10-30 16:46:06
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/properties/properties-transformer.js
 *
 */


const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")


var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")


/**
 * 处理其他函数里，对prop变量的引用关系，统一对其使用深拷贝
 * @param {*} node
 * @returns
 */
function transformPropReference ($jsAst, propItemName) {
    var ast = $jsAst
        .replace([
            `let $_$1 = $_$this.${ propItemName }`,
            `var $_$1 = $_$this.${ propItemName }`,
        ], (match, nodePath) => {
            var thisNode = match['this'][0].node
            var content = null
            if (t.isThisExpression(thisNode)) {
                content = `var $_$1 = $_$this.deepClone(newVal)`
            } else if (t.isIdentifier(thisNode)) {
                var objectName = thisNode.name
                var init = ggcUtils.getScopeVariableInitValue(nodePath.scope, objectName)
                if (t.isThisExpression(init)) {
                    //确定是this的别名
                    content = `var $_$1 = $_$this.deepClone(${propItemName})`
                }
            }
            return content
        })

    return ast.node
}

/**
 * properties 转换
 * @param {*} $ast
 * @param {*} fileKey
 */
function transformProperties ($jsAst, fileKey) {
    if (!$jsAst) return

    var watchList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, "WATCH", true)

    $jsAst.find("export default {props:{$$$}}")
        .each(function (item) {
            var list = item.match["$$$$"]
            list.forEach(function (node) {
                // console.log(node)
                if (t.isObjectExpression(node.value)) {
                    var propItemName = node.key.name || node.key.value
                    var properties = node.value.properties
                    var typeNode = properties.find(o => o.key && o.key.name === "type")
                    var observerNode = properties.find(o => o.key && o.key.name === "observer")
                    var valueNode = properties.find(o => o.key && o.key.name === "value")

                    if (typeNode && (typeNode.value.name === "Array" || typeNode.value.name === "Object")) {
                        if (valueNode && (t.isObjectExpression(valueNode.value) || t.isArrayExpression(valueNode.value))) {
                            /**
                             * shopConfig: {
                             *    type: Object,
                             *    value: {},
                             * }
                             * 转换为：
                             * shopConfig: {
                             *    type: Object,
                             *    value: () => {},
                             * }
                             */

                            var body = valueNode.value
                            let afx = t.arrowFunctionExpression([], body)

                            valueNode.value = afx
                        }
                    }

                    if (observerNode) {
                        ggcUtils.addWatchHandlerItem($jsAst, watchList, propItemName, typeNode.value.name, observerNode)

                        //删除observer节点
                        node.value.properties = properties.filter(o => o.key && o.key.name !== "observer")

                        //深拷贝变量
                        transformPropReference($jsAst, propItemName)
                    }

                    if (valueNode) {
                        // value --> default
                        valueNode.key.name = "default"
                        valueNode.key.valuue = "default"
                    }
                }
            })
        }).root()

        //清除未添加内容的watch对象
        .replace("export default {$$$1, watch:{$$$2}}", (match, nodePath) => {
            if (match['$$$2'].length) {
                return null  //不修改原来的
            } else {
                return `export default {$$$1}`
            }
        })
}

module.exports = { transformProperties }
