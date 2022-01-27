/*
 * @Author: zhang peng
 * @Date: 2021-08-30 17:07:30
 * @LastEditTime: 2022-01-10 16:12:29
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\utils\variableUtils.js
 *
 * 批量给data对象添加子节点
 * 用于template未定义的变量进行声明
 *
 */
const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")

const { util } = require('prettier')
var appRoot = "../.."
const utils = require(appRoot + '/src/utils/utils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')

const { parseMustache } = require(appRoot + "/src/utils/mustacheUtils")

/**
 * 根据type获取默认空节点
 * @param {*} type
 */
function getTypeDefaultAst (type) {
    var result = null
    switch (type) {
        case "String":
            result = t.stringLiteral("")
            break
        case "Number":
            result = t.numericLiteral(0)
            break
        case "Boolean":
            result = t.booleanLiteral(false)
            break
        case "Array":
            result = t.arrayExpression([])
            break
        case "Object":
            result = t.objectExpression([])
            break
        default:
            result = t.stringLiteral("")
            break
    }
    return result
}


/**
 * 根据type获取默认空节点
 * @param {*} node
 */
function getTypeByAstNode (node) {
    var result = ""
    switch (node.type) {
        case "StringLiteral":
            result = "String"
            break
        case "NumericLiteral":
            result = "Number"
            break
        case "BooleanLiteral":
            result = "Boolean"
            break
        case "ArrayExpression":
            result = "Array"
            break
        case "ObjectExpression":
            result = "Object"
            break
        default:
            result = "String"
            break
    }
    return result
}


/**
 * 给dataPath添加元素
 * @param {*} dataPath          目标对象
 * @param {*} key               key name
 * @param {*} valueType         类型
 * @param {*} isLast            是否最后一个
 * @param {*} isOnlyOne         是否是单个变量
 * @param {*} variableTypeInfo  页面所有单个单词的变量的类型信息
 * @returns
 */
function addNodePath (dataPath, key, valueType, isLast, isOnlyOne, variableTypeInfo) {
    if (!dataPath) return null

    //如果是纯数字，则返回
    if (utils.isNumberString(key)) {
        return null
    }

    //仅一个单词时候，重新调整类型
    if (isOnlyOne && variableTypeInfo) {
        valueType = variableTypeInfo[key] || valueType
    }

    var isArrayObject = key.includes("[0]")
    key = key.replace(/\[0\]/g, "")

    var properties = null
    if (t.isObjectExpression(dataPath) || t.isObjectProperty(dataPath)) {
        //手工创建的是elements这个节点
        properties = dataPath.properties || dataPath.value.properties || dataPath.value.elements
    } else {
        return null
    }

    if (dataPath.key && dataPath.key.name === "z1h2a3n4g5d6a7r8e9n") {
        dataPath.key.name = key
        if (isLast) {
            //最后一个时，要调整类型！！！！
            dataPath.value = getTypeDefaultAst(valueType)
        } else if (!isArrayObject) {
            //如果当前非数组，那重置为object
            dataPath.value = getTypeDefaultAst("Object")
        }
        return dataPath
    }

    var subDataPath = properties.find(o => o.key && (o.key.name === key || o.key.value === key))
    if (subDataPath) {
        if (isLast) {
            //注： 已经存在这个对象，并且，它是最后一个时，这里不进行替换了
            //不然可能会导致原有的属性的值被替换为{}
        } else {
            //TODO: 这个判断也有点存疑
            if (t.isStringLiteral(subDataPath.value)) {
                subDataPath.value = t.objectExpression([])
            }
            return subDataPath.value
        }
    } else {
        if (isLast) {
            //最后一个时，要调整类型！！！！

            //猜一下类型
            valueType = valueType || guessValueTypeByName(key)

            var obj = t.objectProperty(t.identifier(key), getTypeDefaultAst(valueType))
            var objExp = obj
            if (t.isArrayExpression(dataPath.value)) {
                objExp = t.objectExpression([obj])
            }
            properties.push(objExp)
        } else {
            if (isArrayObject) {
                subDataPath = t.objectProperty(t.identifier("z1h2a3n4g5d6a7r8e9n"), t.arrayExpression([]))

                var objExp = t.objectExpression([subDataPath])
                var valuePath = t.arrayExpression([objExp])

                var obj = t.objectProperty(t.identifier(key), valuePath)
                properties.push(obj)
            } else {
                subDataPath = t.objectProperty(t.identifier(key), getTypeDefaultAst("Object"))

                var objExp = subDataPath
                if (t.isArrayExpression(dataPath.value)) {
                    objExp = t.objectExpression([subDataPath])
                }
                properties.push(objExp)
            }
        }
    }
    return subDataPath
}

/**
 * 根据list给dataPath批量添加子节点
 * @param {*} dataPath
 * @param {*} list
 * @param {*} valueType  最后一个元素的类型
 * @param {*} variableTypeInfo  页面所有单个单词的变量的类型对象
 */
function setDataByPathList (dataPath, list, valueType, variableTypeInfo) {
    var lastDataPath = null
    var isOnlyOne = list.length === 1
    while (list.length) {
        var nextKey = list.shift()
        var isLast = list.length === 0
        lastDataPath = addNodePath(lastDataPath ? lastDataPath : dataPath, nextKey, valueType, isLast, isOnlyOne, variableTypeInfo)
    }
}


//////////////////////////////////// 以下为获取代码里面的表达式或变量 //////////////////////////////////////

/**
 * 正则列表
 */
const regList = [
    {
        reg: /list|array|arr|s$/i,
        type: "Array"
    },
    {
        reg: /index|num|top|left|bottom|top|idx|width|height|length/i,
        type: "Number"
    },
    {
        reg: /^(is|check)\w+|visible$/i,
        type: "Boolean"
    },
]

/**
 * 以s结尾的单词，用来排除复数
 */
const otherWords = ["bus", "class", "mass", "kiss", "his", "its", "guess", "miss", "success", "business", "happiness", "discuss", "toss", "pass", "plus", "piss", "abyss", "focus", "emboss", "address"]

/**
 * 根据变量名猜测变量类型
 * @param {*} name
 */
function guessValueTypeByName (name) {
    var type = ""

    //去除名称后面的数字
    name = name.replace(/(.*?)\d+$/, "$1")

    var obj = regList.find(function (o) {
        return o.reg.test(name)
    })

    if (obj) {
        type = obj.type
    }

    if (otherWords.includes(name) || /ss$/.test(name)) {
        type = "String"
    }

    // console.log("猜猜猜 value: " + name + "  猜得类型：" + type)
    return type
}
/**
 * 根据operator获取BinaryExpression左侧对象的类型type
 * @param {*} operator
 * @param {*} right BinaryExpression表达式的右侧对象（查右侧对象类型，传入左侧类型即可）
 */
function getTypeByOperator (operator, right) {
    var type = ""
    //  "+" | "-" | "/" | "%" | "*" | "**" | "&" | "|" | ">>" | ">>>" | "<<" | "^"
    // | "in" | "instanceof" | ">" | "<" | ">=" | "<="

    //+例外，不能判断一定是number
    switch (operator) {
        case "-":
        case "/":
        case "%":
        case "*":
        case "**":  //** 是取幂运算符，相当于 Math.pow
        case "&":
        case "|":
        case ">>":
        case ">>>":
        case "<<":
        case ">":
        case "<":
        case ">=":
        case "<=":
            type = "Number"
            break
        case "+":
        case "==":
        case "===":
        case "!=":
        case "!==":
            if (t.isNumericLiteral(right)) {
                type = "Number"
            } else if (t.isBooleanLiteral(right)) {
                type = "Boolean"
            } else if (t.isStringLiteral(right)) {
                type = "String"
            }
            break
        default:
            //还有两个，，理论上也用不上吧？
            // console.log("异常： operator = |" + operator + "|")
            break
    }
    return type
}

/**
 * 从BinaryExpression里面获取变量
 * @param {*} $jsAst
 * @param {*} originalType
 * @returns
 */
function getVariableByBinaryExpression ($jsAst, originalType) {
    if (!$jsAst) return []
    var expList = []

    if (t.isBinaryExpression($jsAst)) {
        var left = $jsAst.left
        var operator = $jsAst.operator
        var right = $jsAst.right
        //TODO: 这里要取两次，， t + 5 || 5 + t
        let typeLeft = getTypeByOperator(operator, right)
        let typeRight = getTypeByOperator(operator, left)

        if (operator == "in") {
            typeRight = "Array"
        }

        var list = getVariableByExpression(left, typeLeft)
        expList.push(...list)
        list = getVariableByExpression(right, typeRight)
        expList.push(...list)
    } else {
        $jsAst
            .find({ type: "BinaryExpression" }).each(function (item) {

                var left = item.attr("left")
                var operator = item.attr("operator")
                var right = item.attr("right")


                //TODO: 这里要取两次，， t + 5 || 5 + t
                let typeLeft = getTypeByOperator(operator, right)
                let typeRight = getTypeByOperator(operator, left)

                if (operator == "in") {
                    typeRight = "Array"
                }

                // console.log("typeLeft", typeLeft)
                // console.log("typeRight", typeRight)

                var type = typeLeft || typeRight
                var list = getVariableByExpression(left, typeLeft)
                expList.push(...list)
                list = getVariableByExpression(right, typeRight)
                expList.push(...list)
            })
    }
    return expList
}

/**
 * 从ConditionalExpression里面获取变量
 * @param {*} node
 * @param {*} originalType
 * @returns
 */
function getVariableByConditionalExpression (node, originalType) {
    if (!node) return []
    var expList = []

    if (t.isConditionalExpression(node)) {
        var item1 = node.test
        var item2 = node.consequent
        var item3 = node.alternate

        var list = getVariableByExpression(item1, "Boolean")
        expList.push(...list)
        list = getVariableByExpression(item2)
        expList.push(...list)
        list = getVariableByExpression(item3)
        expList.push(...list)

    } else {
        node
            .find({ type: "ConditionalExpression" }).each(function (item) {
                var item1 = item.attr("test")
                var item2 = item.attr("consequent")
                var item3 = item.attr("alternate")

                var list = getVariableByExpression(item1, "Boolean")
                expList.push(...list)
                list = getVariableByExpression(item2)
                expList.push(...list)
                list = getVariableByExpression(item3)
                expList.push(...list)
            }).root()
    }

    return expList
}

/**
 * 从LogicalExpression里面获取变量
 * @param {*} node
 * @param {*} originalType
 * @returns
 */
function getVariableByLogicalExpression (node, originalType) {
    if (!node) return []
    var expList = []

    if (t.isLogicalExpression(node)) {
        var left = node.left
        var operator = node.operator
        var right = node.right
        //TODO: 这里要取两次，， t + 5 || 5 + t
        let typeLeft = getTypeByOperator(operator, right)
        let typeRight = getTypeByOperator(operator, left)

        if (operator == "in") {
            typeRight = "Array"
        }

        var list = getVariableByExpression(left, typeLeft)
        expList.push(...list)
        list = getVariableByExpression(right, typeRight)
        expList.push(...list)
    } else {
        node
            .find({ type: "LogicalExpression" }).each(function (item) {
                var left = item.attr("left")
                var operator = item.attr("operator")
                var right = item.attr("right")
                //TODO: 这里要取两次，， t + 5 || 5 + t
                let typeLeft = getTypeByOperator(operator, right)
                let typeRight = getTypeByOperator(operator, left)

                if (operator == "in") {
                    typeRight = "Array"
                }

                var list = getVariableByExpression(left, typeLeft)
                expList.push(...list)
                list = getVariableByExpression(right, typeRight)
                expList.push(...list)
            })
    }

    return expList
}

/**
 * 根据表达式类型获取变量
 * @param {*} node
 * @param {*} originalType
 * @returns
 */
function getVariableByExpression (node, originalType) {
    if (!node) return []
    var expList = []


    if (t.isIdentifier(node)) {
        var type = originalType || "String"
        var varname = node.name
        expList.push({
            type: type,
            code: varname
        })
    } else if (t.isConditionalExpression(node)) {
        var ast = node.hasOwnProperty("find") ? node : $(node)
        var list = getVariableByConditionalExpression(ast, originalType)
        expList.push(...list)
    } else if (t.isBinaryExpression(node)) {
        var list = getVariableByBinaryExpression(node, originalType)
        expList.push(...list)
    } else if (t.isLogicalExpression(node)) {
        var list = getVariableByLogicalExpression(node, originalType)
        expList.push(...list)
    } else if (t.isUnaryExpression(node)) {
        var argument = node.argument
        var list = getVariableByExpression(argument, originalType)
        expList.push(...list)
    } else if (t.isMemberExpression(node)) {
        var type = originalType || "String"
        var varname = $(node).generate()
        expList.push({
            type: type,
            code: varname
        })
    } else {
        //过渡函数及参数
        // var ast = item.hasOwnProperty("find") ? item : $(item)
        // var l = getExpressionVariableByNode(ast)
        // list.push(...l)
    }
    return expList
}


/**
 * 从ast里面取出变量表达式
 * @param {*} jsAst
 * @param {*} originalType
 * @returns
 */
function getExpressionVariableByAst (jsAst, originalType) {

    var expList = []
    jsAst
        .find({ type: "ConditionalExpression" }).each(function (item) {
            var list = getVariableByConditionalExpression(item.node, originalType)
            expList.push(...list)
        }).root().replace({ type: "ConditionalExpression" }, "null")


    jsAst
        .find({ type: "LogicalExpression" }).each(function (item) {
            var list = getVariableByLogicalExpression(item.node, originalType)
            expList.push(...list)
        }).root().replace({ type: "LogicalExpression" }, "null")


    jsAst
        .find({ type: "BinaryExpression" }).each(function (item) {
            var list = getVariableByBinaryExpression(item, originalType)
            expList.push(...list)
        }).root().replace({ type: "BinaryExpression" }, "null")


    jsAst
        .find({ type: "UnaryExpression" }).each(function (item) {
            var argument = item.attr("argument")
            var list = getVariableByExpression(argument, originalType)
            expList.push(...list)
        }).root().replace({ type: "UnaryExpression" }, "null")

    jsAst
        .find({ type: "MemberExpression" }).each(function (item) {
            var parentType = item.parent().attr("type")
            if (parentType !== 'CallExpression') {
                var list = getVariableByExpression(item.node, originalType)
                expList.push(...list)
            }
        }).root().replace({ type: "MemberExpression" }, "null")

    return expList
}

/**
 * 根据attr获取它的值的类型
 *
 *
 * @param {*} attr
 */
function getTypeByAttr (attr, value) {
    var type = ""
    switch (attr) {
        case "v-if":
        case "v-else-if":
        case "v-else":
        case "v-show":
        case "hidden":
            // type = "Boolean"
            //TODO: 有问题，，不符合实际情况，，比如v-if ，不一定要bool才能判断！！
            break
        case "v-model":
            type = "String"
            break
        default:
            break
    }
    return type
}


/**
 * 根据template里面，标签上面的属性名，以及对应属性值，猜测里面的变量及表达式的变量类型
 * @param {*} attr    属性名
 * @param {*} value   属性值
 * @returns
 */
function getExpressionVariableList (attr, value) {

    // console.log("getExpressionVariableList value= " + value)
    // if(value.indexOf("{{") === 0){
    //     value = parseMustache(value, true)
    // }

    var $jsAst = $(value)
    if ($jsAst.error) return []

    var attrType = getTypeByAttr(attr, value) //获取属性的类型

    if (utils.isNumberString(value) || utils.isBooleanString(value)) {
        return []
    }

    if (utils.isVariableName(value)) {
        return [{
            type: attrType,
            code: value
        }]
    }

    // TODO: 判断是否在data，prop，是否是函数？？？还有{{}}的处理
    var expList = getExpressionVariableByAst($jsAst, attrType)

    //去重
    expList = utils.uniqueArray(expList, "code")

    //处理storeRecommand.length
    var reg = /\.length$/
    expList.map(obj => {
        var code = obj.code
        if (reg.test(code)) {
            obj.type = "Array"
            obj.code = code.replace(reg, '')
        }
    })

    // console.log("value", value)
    // console.log("expList", JSON.stringify(expList))
    return expList
}




module.exports = {
    getTypeByAstNode,
    getTypeDefaultAst,
    setDataByPathList,
    getExpressionVariableList,
    guessValueTypeByName,
}
