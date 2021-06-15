/*
 *
 * 处理template上面的参数
 *
 * 功能虽简单，但挺费时费力的……
 *
 * ps:费了老鼻子劲了
 *
 */
const t = require('@babel/types')
const generate = require('@babel/generator').default
const traverse = require('@babel/traverse').default
const JavascriptParser = require('../js/JavascriptParser')
const clone = require('clone')

const utils = require('../../utils/utils.js')
const babelUtil = require('../../utils/babelUtil.js')
const pathUtil = require('../../utils/pathUtil.js')

//初始化一个解析器
const javascriptParser = new JavascriptParser()


/**
 * 判断字符串是否是'true'或'false'
 * @param {*} name
 * @returns
 */
function isBool (name) {
    return name === "true" || name === "false"
}

/**
 * 判断变量是否在props里
 * @param {*} propsAstList
 * @param {*} name
 */
function isInProps (propsAstList, name) {
    if (!propsAstList) return false
    return propsAstList.some(function (path) {
        if (!t.isObjectProperty(path)) {
            console.log("异常：isInProps ", name)
        }
        return (t.isObjectProperty(path) && babelUtil.getKeyNameByObject(path) === name)
    })
}

/**
 * 判断变量是否在data里
 * @param {*} dataAstList
 * @param {*} name
 */
function isInData (dataAstList, name) {
    if (!dataAstList) return false
    return dataAstList.some(function (path) {
        if (!t.isObjectProperty(path)) {
            console.log("异常：isInData ", name)
        }
        return (t.isObjectProperty(path) && babelUtil.getKeyNameByObject(path) === name)
    })
}


/**
 * 有点绕~根据路径修改对象的内容
 * @param {*} dataPathList  data列表
 * @param {*} dataPath      要设置的变量的path对象
 * @param {*} pathList      设置的变量的路径如["a", "b", "c"] --> a.b.c
 * @param {*} type          最末节点的类型
 */
function setDataByPath (dataPathList, dataPath, pathList, type) {

    if (!t.isObjectProperty(dataPath) || pathList.length === 0) return

    var name = babelUtil.getKeyNameByObject(dataPath)
    // console.log("///" + name + "--" + pathList)

    var nextKey = pathList[0]
    nextKey = nextKey.replace(/\[0\]/, "")
    var properties = dataPath.node ? dataPath.node.value.properties : (dataPath.value ? dataPath.value.properties : dataPath.properties)
    if (properties && nextKey) {
        if (name === nextKey) {
            if (properties.length) {
                for (var i in properties) {
                    var subPath = properties[i]
                    if (t.isObjectExpression(subPath.value)) {
                        pathList.shift()
                        setDataByPath(dataPathList, subPath, pathList, type)
                    }
                }
            } else {
                // console.log("----------1----------")
                pathList.shift()
                var obj = createObjectByPathList(pathList, type)
                properties.push(obj)
            }

        } else {
            // console.log("----------2----------")

            var dataPath = findDataPathByName(properties, nextKey)
            if (!dataPath) {
                var newType = type
                if (pathList.length === 1) {
                    dataPath = t.objectProperty(t.identifier(nextKey), getTypeDefaultAst(newType))
                    properties.push(dataPath)
                } else {
                    // newType = "Object"
                    pathList.shift()
                    dataPath = t.objectProperty(t.identifier(nextKey), getTypeDefaultAst(newType))
                    properties.push(dataPath)
                    setDataByPath(dataPathList, dataPath, pathList, type)
                }
            }
        }
    } else {
        // console.log("异常： 可能已经有变量存在了，并且变量类型不统一    value: ", pathList.join("."))
    }

}

/**
 * 根据path list创建对象
 * @param {*} pathList
 * @param {*} type
 */
function createObjectByPathList (pathList, type) {
    var lastItem = null
    const reg = /\[0\]/
    for (let i = pathList.length - 1;i >= 0;i--) {
        let objName = pathList[i]
        let isArrayObject = objName.indexOf("[") > -1
        objName = objName.replace(reg, "")
        if (i === pathList.length - 1) {
            //最后一个判断类型，因倒序循环，现在是第一个

            let newType = ""
            if (type) {
                newType = type
            } else {
                newType = guessValueTypeByName(objName)
            }

            lastItem = t.objectProperty(t.identifier(objName), getTypeDefaultAst(newType))

        } else {
            if (isArrayObject) {
                //weather.daily_data[0].min
                let subObjectPath = t.objectExpression([lastItem])
                let valuePath = t.arrayExpression([subObjectPath])
                lastItem = t.objectProperty(t.identifier(objName), valuePath)
            } else {
                lastItem = t.objectProperty(t.identifier(objName), t.objectExpression([lastItem]))
            }
        }
    }
    return lastItem
}


/**
 * 根据name从data列表里找到path对象，并返回
 * @param {*} dataAstList
 * @param {*} name
 * @returns
 */
function findDataPathByName (dataAstList, name) {
    if (!dataAstList) return null
    return dataAstList.find(function (path) {
        if (!t.isObjectProperty(path)) {
            //异常是path为null
            // console.log("异常：isInData ", name, dataAstList)
        }
        return (t.isObjectProperty(path) && babelUtil.getKeyNameByObject(path) === name)
    })
}


/**
 * 判断变量是否在data里，如果不存在就添加
 * @param {*} jsData         jsData
 * @param {*} name           需要添加的变量
 * @param {*} type           最后一个节点的类型
 */
function addValueToData (jsData, name, type) {
    // if (jsData.dataAstList) {

    if (!jsData) return

    // TODO: 'comment_item[0][0].username'  //这种先过滤吧
    if(name.indexOf("][")>-1) return;

    const reg = /\./
    var list = name.split(".")

    var valueName = name
    if (reg.test(name)) {
        valueName = list[0]
    }

    //item、index、idx等变量将直接返回
    //忽略：<view class="cu-card case">{{util.beautifyTime(item.end_date)[0]}} 已结束</view>的处理
    if (utils.exceptNameReg.test(valueName)) return

    var isArrayObject = valueName.indexOf("[0]") > -1
    valueName = valueName.replace(/\[0\]/, '')

    //获取第一层对象
    var dataPath = findDataPathByName(jsData.dataAstList, valueName)

    if (list[list.length - 1] === "length") {
        list.pop()
        type = "Array"
    }

    if (list.length === 1 && list[0].indexOf("[") === -1) {
        //单个变量：flag
        // console.log("增加单个变量: ", valueName, type)

        if (jsData.dataAstList && !isInData(jsData.dataAstList, valueName) && !isInProps(jsData.propsAstList, valueName)) {
            //TODO: 三元再三元，先忽略：
            //{{ (checked ? activeColor : inactiveColor) ? 'background-color: ' + (checked ? activeColor : inactiveColor ) : '' }}
            if (/[\?:]/.test(valueName)) return

            var obj = t.objectProperty(t.identifier(valueName), getTypeDefaultAst(type))
            jsData.dataAstList.push(obj)
        }
    } else {
        if (dataPath) {
            //已经找到第一层对象，因此需删除第一层
            list.shift()

            if (!list.length) return

            //单独fix setData为变量名的情况
            if (t.isArrayExpression(dataPath.value) && (type === "" || list.length) && !isArrayObject) {
                dataPath.value = t.objectExpression([])
            }

            //处理已存在对象的情况：
            // <view> 你送了一个{{secIcons[actItem].name}}</view>
            // 已定义: secIcons: []
            let subObjectPath = dataPath
            if (isArrayObject) {
                if (list.length > 1) {
                    subObjectPath = t.objectProperty(t.identifier(list[0]), t.objectExpression([]))
                } else {
                    let objName = list[0]
                    let newType = type || guessValueTypeByName(objName)
                    subObjectPath = t.objectProperty(t.identifier(objName), getTypeDefaultAst(newType))
                }

                if (t.isArrayExpression(dataPath.value)) {
                    let elements = dataPath.value.elements
                    if (elements.length) {
                        if (t.isObjectExpression(elements[0])) {
                            elements[0].properties.push(subObjectPath)
                        }
                    } else {
                        let objExp = t.objectExpression([subObjectPath])
                        elements.push(objExp)
                    }
                }
            }

            //变量已存在
            setDataByPath(jsData.dataAstList, dataPath, list, type)
        } else {
            if (jsData.dataAstList && !isInProps(jsData.propsAstList, valueName)) {
                // console.log("增加多层级变量: ", name, type)
                //a.b.c这种变量形式

                let valuePath = t.objectExpression([])
                let subObjectPath = null
                if (isArrayObject) {
                    list.shift()

                    let objExp = null
                    if (list[0]) {
                        subObjectPath = t.objectProperty(t.identifier(list[0]), t.objectExpression([]))
                        objExp = t.objectExpression([subObjectPath])
                        valuePath = t.arrayExpression([objExp])
                    } else {
                        //已经是数组最后一个
                        valuePath = t.arrayExpression([])
                    }
                }
                var obj = t.objectProperty(t.identifier(valueName), valuePath)
                jsData.dataAstList.push(obj)

                if (!subObjectPath) {
                    subObjectPath = obj
                }
                if (list.length) {
                    setDataByPath(jsData.dataAstList, subObjectPath, list, type)
                }
            }
        }
    }
    // }
}

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
 * 解析attrib
 * @param {*} attr
 * @param {*} propsAstList
 * @param {*} dataAstList
 * @returns
 */
function parseAttrib (attr, jsData) {
    var reg = /\[(.*?)\]/g
    var quotationReg = /['"]/  //引号

    //切掉 [ 后面的字段，暂时不支持这种对象
    //TODO: 后续，可以在数组里创建一个空对象
    const reg_array = /\[/
    if (reg_array.test(attr.exp)) {
        //暂时只按数组来处理，非要弄成对象的话，后面再说。
        // attr.exp = attr.exp.split(reg_array)[0]
        // attr.exp = attr.exp.replace(replaceReg, "[0]")

        //goodsData['is_open_sku'] --> goodsData.is_open_sku
        //arr["1"].name --> arr[0].name
        //arr[10].name --> arr[0].name


        attr.exp = attr.exp.replace(reg, function (match, exp) {
            if (quotationReg.test(exp)) {
                exp = exp.replace(/['"]/g, "")
                if (utils.isNumberString(exp)) {
                    return "[0]"
                } else if (utils.isValueName(exp)) {
                    return "." + exp
                } else {
                    //可能是一个数组实例
                    //'['未服务','已服务','已取消']'
                    //['所有','待付款','已付款','已完成']
                    //<view wx:for="{{['未服务','已服务','已取消']}}"></view>
                    // console.error("异常---------------------------------------", attr.exp)
                }
            } else {
                //secIcons[actItem].name
                //arr[1].xxx
                //一律算数组处理
                return "[0]"
            }
        })
        // attr.type = "Array"
    }

    // console.log(attr.exp)

    var code = attr.exp.trim()

    //可能for是一个数据，比如：<swiper-item wx:for="{{['http://www.baidu.com']}}" wx:key></swiper-item>
    if (!code || code === 'undefined'){
        return
    }

    var key = attr.key
    var originalType = attr.type
    var isSetDataKey = attr.isSetDataKey

    //item、index、idx等变量将直接返回
    if (utils.exceptNameReg.test(code)) return

    var reg = /\b[\w\._]+\b/
    //单个变量
    if (utils.isSingleWord(code) && !utils.isNumberString(code)) {
        if (isBool(code)) {
            //忽略{{true}}
        } else {
            if (jsData.propsAstList && isInProps(jsData.propsAstList, code)) {
                //变量在prop里
            } else {
                addValueToData(jsData, code, originalType)
            }
        }
        return
    }

    //对象：a.b.c
    // if(reg.test(code)){
    //     addValueToData(dataAstList, code, "Array")
    //     return;
    // }

    let javascriptAst = null
    let isParseError = false //标识是否解析报错
    try {
        //解析成AST
        javascriptAst = javascriptParser.parse(code)
    } catch (error) {
        isParseError = true
    } finally {
        if (isParseError) {

        } else {
            traverseJsAst(javascriptAst, jsData, originalType)
        }
    }
    return javascriptAst
}

/**
 * @description: 遍及并处理 ast 树
 * @date 2021/5/18
 * @param {JavascriptParser} javascriptAst ast 树
 * @param {*} jsData 转换 jsData
 * @param {String} originalType 原视类型
 */
function traverseJsAst (javascriptAst, jsData,originalType) {
    traverse(javascriptAst, {
        ConditionalExpression(path) {

            //     //这里不用判断了
            const test = path.get("test")
            const consequent = path.get("consequent")
            const alternate = path.get("alternate")

            if (t.isIdentifier(test)) {
                let valuePath = `${generate(test.node).code}`
                addValueToData(jsData, valuePath, "Boolean")
                path.skip()
            }
            // expPathHandle(consequent, dataAstList)
            // expPathHandle(alternate, dataAstList)
        },
        MemberExpression(path) {
            // if (t.isCallExpression(path.parentPath)) {
            //     //略过解析：<view class="cycle {{parse.getStatusColor(item.live_status)}}"></view>
            // } else {
            //     let valuePath = `${ generate(path.node).code }`
            //     if (valuePath) {
            //         addValueToData(jsData, valuePath, originalType)
            //     }
            // }
            memberExpressionHandle(path, jsData, originalType)
            path.skip()
        },
        ExpressionStatement(path) {
            // const expression = path.get("expression")
            // if (expression.node.name) expression.node.name = replaceField(expression.node.name, replacePropsMap)
            // utils.log("ExpressionStatement-", expression.node.name)
        },
        UnaryExpression(path) {
            // const expression = path.get("expression")
            // if (expression.node.name) expression.node.name = replaceField(expression.node.name, replacePropsMap)
            // utils.log("ExpressionStatement-", expression.node.name)
        },
        BinaryExpression(path) {
            const left = path.get("left")
            const right = path.get("right")
            const operator = path.node.operator

            if (t.isMemberExpression(left)) {
                let type = getTypeByOperator(operator, right) || originalType
                memberExpressionHandle(left, jsData, type)
            } else {
                binaryExpressionHandle(path, left, right, operator, jsData)
            }

            if (t.isMemberExpression(right)) {
                let type = getTypeByOperator(operator, left) || originalType
                memberExpressionHandle(right, jsData, type)
            } else {
                binaryExpressionHandle(path, right, left, operator, jsData)
            }
            path.skip()
        },
    })
}

/**
 *
 * @param {*} path
 * @param {*} jsData
 * @param {*} originalType
 */
function memberExpressionHandle (path, jsData, originalType) {
    if (t.isCallExpression(path.parentPath)) {
        //略过解析：<view class="cycle {{parse.getStatusColor(item.live_status)}}"></view>
    } else {
        let valuePath = `${ generate(path.node).code }`
        if (valuePath) {
            addValueToData(jsData, valuePath, originalType)
        }
    }
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

    switch (operator) {
        case "+":
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
 * binaryExpression表达式处理
 * @param {*} left
 * @param {*} right
 * @param {*} operator
 */
function binaryExpressionHandle (path, left, right, operator, jsData) {
    // 数字和bool型没必要继续了
    // BinaryExpression类型也不继续了(后期有时间再弄吧，这种需递归)
    // serviceId.indexOf(item.id) 也不继续了(可能是wxs里面的函数)
    if (t.isNumericLiteral(left)
        || t.isBooleanLiteral(left)
        || t.isStringLiteral(left)
        || t.isBinaryExpression(left)
        || t.isUnaryExpression(left)
        || t.isCallExpression(left)
    ) return

    let valuePath = `${ generate(left.node).code }`
    if (valuePath) {
        // console.log("valuePath ", valuePath, type)

        //含有三元表达式的情况, 则继续进行转换
        const ternaryReg = /([^?]*)\?([^:]*):([^;]*)/
        if (ternaryReg.test(valuePath)) {
            valuePath.replace(ternaryReg, function (match, $1, $2, $3) {
                const node1 = javascriptParser.parse($1)
                const node2 = javascriptParser.parse($2)
                const node3 = javascriptParser.parse($3)
                // TODO: 待优化逻辑。目前功能已实现， 暂不支持，嵌套三元
                traverseJsAst(node1, jsData, getTypeByOperator(node1.operator, node1))
                addValueToData(jsData, $2, getTypeByOperator(node2.operator, node2))
                addValueToData(jsData, $3, getTypeByOperator(node3.operator, node3))
            })
            return;
        }

        var type = getTypeByOperator(operator, right)
        addValueToData(jsData, valuePath, type)
    }

}

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

    var obj = regList.find(function (o) {
        return o.reg.test(name)
    })

    if (obj) {
        type = obj.type
    }

    if (otherWords.indexOf(name) > -1) {
        type = "String"
    }

    // console.log("猜猜猜 value: " + name + "  猜得类型：" + type)
    return type
}

/**
 * 处理template标签上面的属性
 * @param {*} obj
 * @param {*} jsData
 * @param {*} fileKey
 */
function attribHandle (obj, jsData, fileKey) {
    /**
     * 这里面的exp都已处理过，仅存在单{{}}，并且已去掉{{}}
     */

    if (!jsData) return  //居然为null!!!!!!!!

    var exp = obj.exp
    if (exp) {
        // console.log("exp: ", obj.exp)
        // console.log("key: ", obj.key)
        // console.log("type: ", obj.type)
        parseAttrib(obj, jsData)
    }
}

module.exports = attribHandle
