/*
 * @Author: zhang peng
 * @Date: 2021-08-16 11:44:02
 * @LastEditTime: 2022-11-13 22:58:36
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
const utils = require(appRoot + "/src/utils/utils")

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
                content = `var $_$1 = $_$this.clone(newVal)`
            } else if (t.isIdentifier(thisNode)) {
                var objectName = thisNode.name
                var init = ggcUtils.getScopeVariableInitValue(nodePath.scope, objectName)
                if (t.isThisExpression(init)) {
                    //确定是this的别名
                    content = `var $_$1 = $_$this.clone(${ propItemName })`
                }
            }
            return content
        })

    return ast.node
}

/**
 * 检查prop默认值是否与定义的类型一致
 * @param {*} propItemName
 * @param {*} typeName
 * @param {*} valueNode
 * @param {*} fileKey
 */
function checkPropDefaultValueType (propItemName, typeName, valueNode, fileKey) {
    // 这种不提示
    // properties: {
    //     color:{
    //         type:String,
    //         value: i.GRAY
    //     }
    // },
    if(valueNode.type === "MemberExpression") return


    var valueType = valueNode.type
    var valueContent = valueNode.value

    var typeReg = /number|boolean|string/i

    const typeMap = {
        BooleanLiteral: "Boolean",
        Boolean: "Boolean",
        StringLiteral: "String",
        String: "String",
        NumericLiteral: "Number",
        Number: "Number",
    }

    if (typeReg.test(typeName) && typeMap[valueType] !== typeMap[typeName]) {
        global.log(`[ERROR]prop ${ propItemName } 的默认值 ${ valueContent } 与类型 ${ typeName } 不一致。    fileKey: ${ fileKey }`)
    }
}

/**
 * properties 转换
 * @param {*} $ast
 * @param {*} fileKey
 */
function transformProperties ($jsAst, fileKey) {
    if (!$jsAst) return

    var watchList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, "WATCH", fileKey, true)

    $jsAst.find("export default {props:{$$$}}")
        .each(function (item) {
            var list = item.match["$$$$"]
            list.forEach(function (node) {
                // global.log(node)
                if (t.isObjectExpression(node.value)) {
                    var propItemName = node.key.name || node.key.value
                    var properties = node.value.properties
                    var typeNode = properties.find(o => o.key && o.key.name === "type")
                    var observerNode = properties.find(o => o.key && o.key.name === "observer")
                    var valueNode = properties.find(o => o.key && o.key.name === "value")

                    if (typeNode) {
                        // 应对properties里type是一个数组，并且是一个字符串的情况
                        // properties: {
                        //     jobsList: {
                        //         type: ['Array', 'Object'],
                        //         default: []
                        //     }
                        // }
                        if (t.isArrayExpression(typeNode.value)) {
                            let elements = typeNode.value.elements
                            elements.map((item, index) => {
                                if (t.isStringLiteral(item)) {
                                    elements[index] = t.identifier(item.value)
                                }
                            })
                        } else if (t.isStringLiteral(typeNode.value)) {
                            // 应对properties里type是一个字符串的情况
                            // properties: {
                            //     jobsList: {
                            //         type: 'Array',
                            //         default: []
                            //     }
                            // }
                            typeNode.value = t.identifier(typeNode.value.value)
                        }
                    }

                    if (valueNode && valueNode.value && typeNode && typeNode.value) {
                        //检查类型
                        checkPropDefaultValueType(propItemName, typeNode.value.name, valueNode.value, fileKey)
                    }


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

                    if (observerNode && typeNode && typeNode.value) {
                        ggcUtils.addWatchHandlerItem($jsAst, watchList, propItemName, typeNode.value.name, observerNode)

                        //删除observer节点
                        node.value.properties = properties.filter(o => o.key && o.key.name !== "observer")

                        //深拷贝变量
                        transformPropReference($jsAst, propItemName)
                    }

                    //注：此处代码，应该在上面的默认值判断逻辑之后执行
                    //属性的类型可以为 String Number Boolean Object Array 其一，也可以为 null 表示不限制类型。
                    //optionalTypes: 属性的类型（可以指定多个）
                    var optionalTypes = properties.find(obj => obj.key && (obj.key.name || obj.key.value) === "optionalTypes")
                    if (optionalTypes && t.isArrayExpression(optionalTypes.value)) {
                        if (typeNode) {
                            let elements = optionalTypes.value.elements
                            let arrayExp = t.arrayExpression([typeNode.value, ...elements])
                            if (t.isArrayExpression(typeNode.value)) {
                                arrayExp = t.arrayExpression([...typeNode.value.elements, ...elements])
                            }
                            //去重
                            arrayExp.elements = utils.uniqueArray(arrayExp.elements, "name")
                            typeNode.value = arrayExp
                        }

                        //删除optionalTypes节点
                        node.value.properties = properties.filter(o => o.key && o.key.name !== "optionalTypes")
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
