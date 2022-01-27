/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2022-01-07 16:21:19
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\utils\ggcUtils.js
 *
 */
const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const utils = require("./utils")
const pathUtils = require("./pathUtils")
const restoreJSUtils = require("./restoreJSUtils")

//静态资源后缀名正则
const staticAssetsReg = /^\.(jpe?g|gif|svg|png|mp3|mp4|ttf|eot|woff)$/i

//支持的文件的正则，用于替换引入路径
const assetsFileReg = /^((\/|\.+\/)*[^'+]*\.(jpe?g|gif|svg|png|mp3|mp4|ttf|eot|woff))$/i

const multiSssetsFileReg = /['"]?((\/|\.+\/)*[^'+]*\.(jpe?g|gif|svg|png|mp3|mp4|ttf|eot|woff))['"]?/gi

const expList = [
    {
        type: "App",
        exp: "App($_$)",
    },
    {
        type: "Page",
        exp: "Page($_$)",
    },
    {
        type: "Component",
        exp: "Component($_$)",
    },
    {
        type: "Webpack",
        exp: [
            `(global["webpackJsonp"]=global["webpackJsonp"]||[])`,
            `($_$1["webpackJsonp"]=$_$1["webpackJsonp"]||[])`,
            `(global.webpackJsonp=global.webpackJsonp||[])`
        ]
    },
    {
        type: "VantComponent",
        exp: "VantComponent($_$)",
    },
    {
        type: "Behavior",
        exp: "Behavior($_$)",
    },
    {
        type: "CustomPage",
        exp: "CustomPage($_$)",
    }
]

/**
 * 通过ast获取对应的ast类型
 * @param {*} $ast
 * @param {*} filekey
 * @returns
 */
function getAstType ($ast, filekey) {
    let result = expList.find(function (obj) {
        let match = $ast.find(obj.exp)
        if (obj.type === "Webpack" || obj.type === "Behavior") {
            return match && match.length
        } else {
            if (match && match.length) {
                // 判断是父级是否是ExpressionStatement，一般是这种。
                // 注意！！！！
                // 如果 `t.requirejs("jquery"),Page({...})` 这种情况, 在js的预处理时，已经处理了!!!
                // 为兼容以后，下面也已经作了判断！
                // 为了排除这种情况：
                // (function(n) {
                //     return App(A(n));
                // })
                var parentNode = match[0].nodePath.parentPath.node
                return (t.isExpressionStatement(parentNode) || t.isSequenceExpression(parentNode))
            }
        }
    })

    // console.log("filekey: ----- ", filekey, result && result.type || "")
    return result && result.type || ""
}

/**
 * 获取ast里面定义的变量名，如果找不到则返回默认变量名
 * @param {*} $ast           ast
 * @param {*} type           ast节点类型
 * @param {*} defaultName    默认的变量名，或一般的变量名
 * @param {*} value          变量的初始值
 * @returns
 */
function getVarName ($ast, selector, value) {

    //这里多了一个参数 ，后面处理一下
    var name = value
    $ast
        .find(selector)
        .each(function (item) {
            name = item[0].nodePath.node.id.name
        })
    return name
}


/**
 * 当取当前ast作用域里面的this，是否有别名
 * @param {*} $ast
 * @returns
 */
function getThisName ($ast) {
    var selector = { type: "VariableDeclarator", init: t.thisExpression() }
    return getVarName($ast, selector, "this")
}

/**
 * 替换app.xxx --> app.globalData.xxx
 * @param {*} $ast
 */
// function transformAppDotGlobalData ($ast) {
//     //1.找到 var app = getApp(); 的变量名
//     //2.开始替换

//     var appName = "app"
//     var selector = { type: "VariableDeclarator", init: { callee: { name: "getApp" } } }
//     appName = getVarName($ast, selector, "app")

//     console.log("$ast", $ast.generate())
//     $ast
//         .find({ type: "MemberExpression", object: { name: appName } })
//         .each(function (item) {
//             // console.log(item)
//             var nodePath = item[0].nodePath
//             var node = nodePath.node
//             var property = node.property
//             var isGlobal = nodePath.scope.lookup(appName).isGlobal

//             /**
//              * 注意！！！
//              * 如果在外面 var t = getApp()
//              * 而在函数里面也有t
//              * var t = [ this.data.selectNum, this.data.spec, 0 ], e = t[0], a = t[1], i = t[2];
//              * 这里必须要判断这个t是否为global的，不然会误替换！
//              *
//              * //总感觉这里判断不完全
//              */
//             if (!isGlobal) {
//                 // return
//             }

//             if (t.isIdentifier(property, { name: "globalData" })) {
//                 //
//             } else {
//                 var firstMeExp = t.memberExpression(t.identifier(appName), t.identifier("globalData"))
//                 var meExp = t.memberExpression(firstMeExp, property)
//                 item.replaceBy(meExp)
//             }
//         }).root()

//     return $ast
// }



/**
 * getApp().xxx -- > getApp().globalData.xxx
 * @param {*} $ast
 */
function transformGetApp ($ast) {
    //1.找到 getApp().xxx
    //2.开始替换  getApp().xxx -- > getApp().globalData.xxx


    //TODO: 也许，将来可以不将那些字段放入global里了

    var selector = { type: "MemberExpression", object: { callee: { name: "getApp" } } }

    $ast
        .find(selector)
        .each(function (item) {
            // console.log(item)

            var node = item[0].nodePath.node
            var object = node.object
            var property = node.property

            if (!t.isIdentifier(property, { name: "globalData" })) {
                var firstMeExp = t.memberExpression(object, t.identifier("globalData"))
                var meExp = t.memberExpression(firstMeExp, property)
                item.replaceBy(meExp)
            }
        }).root()

    return $ast
}


/**
 * 两个作用：
 * this.data.xxx --> this.xxx
 * that.data.xxx --> that.xxx
 * this.properties.xxx --> this.xxx
 *
 * 另一个是如果globalData某变量没定义，那就进行定义
 * @param {*} $ast
 * @param {*} keyword
 * @param {*} globalDataProperties
 * @returns
 */
function transformThisDotKeywordExpression ($ast, keyword = "data", globalDataProperties = []) {

    var globalDataNameList = globalDataProperties.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    //未在globalData里面定义的变量数组
    var undefinedNameList = new Set()

    $ast
        .find({ type: "MemberExpression", property: { name: keyword } })
        .each(function (item) {
            var nodePath = item["0"].nodePath
            var object = nodePath.node.object

            if (t.isThisExpression(object)) {
                item.replaceBy(object)
            } else if (t.isIdentifier(object)) {
                var objectName = object.name
                var init = getScopeVariableInitValue(nodePath.scope, objectName)
                if (t.isThisExpression(init)) {
                    //确定是this的别名
                    item.replaceBy(object)
                }
            }

            if (keyword === "globalData" && t.isMemberExpression(nodePath.parentPath.node)) {
                var property = nodePath.parentPath.node.property
                var propertyName = (property.name || property.value) || ""
                if (propertyName && !globalDataNameList.includes(propertyName)) {
                    undefinedNameList.add(propertyName)
                }
            }
        }).root()


    //如果globalData里不存在这个变量，那就创建一个放进去。
    if (keyword === "globalData") {
        //JavaScript的Set只有键名，或者是说键和值一样
        undefinedNameList.forEach(function (key, name) {
            var item = t.objectProperty(t.identifier(name), t.stringLiteral(""))
            globalDataProperties.push(item)
        })
    }

    return $ast
}




/**
 * 寻找页面第一级函数、生命周期或变量
 * @param {*} $ast
 * @param {*} pageType    页面类型, 默认:Page
 * @param {*} name        函数或变量名称
 * @param {*} isGenerate  如果没找到，是否需要创建并加入ast(默认为methods使用)
 * @param {*} type        如果需要创建，需指定默认类型，默认Object, TODO:未实现(默认为methods使用)
 * @returns
 */
function getLifecycleNode ($ast, pageType, name, isGenerate, type = "Object") {
    if (!$ast) return

    if (!name) throw "Error: getLifecycleNode函数的name不能为空"
    var nodePath = null
    $ast.find(`${ pageType }({$$$})`).each(function (item) {
        var list = item.match["$$$$"]
        nodePath = list.find(function (obj) {
            return obj.key && (obj.key.name === name || obj.key.value === name)
        })
        if (!nodePath && isGenerate) {
            nodePath = t.objectProperty(t.identifier(name), t.objectExpression([]))
            var args = item.attr("arguments.0")
            args.properties.push(nodePath)
        }
    }).root()
    return nodePath
}




/**
 * 获取变量初始值
 * @param {*} scope
 * @param {*} name
 * @returns
 */
function getScopeVariableInitValue (scope, name) {
    if (!scope || !name) return null

    var lookupNode = scope.lookup(name)
    //有可能在当前作用域找不到这个变量
    if (!lookupNode) return null

    var bindings = lookupNode.bindings
    var initValue = null
    if (bindings[name]) {
        var nodePath = bindings[name][0]
        if (t.isIdentifier(nodePath.node)) {
            var parentPath = nodePath.parentPath
            if (t.isVariableDeclarator(parentPath.node)) {
                initValue = parentPath.node.init
            }
        }
    }
    return initValue
}

///////////////////////////////////////////////下面的还没有用上////////////////////////////////////



/**
 * 获取当前页面api函数调用次数
 * @param {*} $ast
 * @param {*} name 默认支付
 * @returns
 */
function getApiCount ($ast, name = "requestPayment") {
    if (!$ast) return 0
    var count = $ast.find({
        type: "CallExpression",
        callee: {
            type: "MemberExpression",
            property: {
                name: name
            }
        }
    }).length

    $ast.root()
    return count || 0
}


/**
 * 为防单词拼错，建议使用这里的常量
 */
const propTypes = {
    DATA: "DATA",
    PROPS: "PROPS",
    METHODS: "METHODS",
    WATCH: "WATCH",
    COMPONENTS: "COMPONENTS",
    BEHAVIORS: "BEHAVIORS",
    COMPUTED: "COMPUTED"
}

/**
 * 获取wxs的module name 列表
 * @param {*} $wxmlAst
 * @returns
 */
function getWxmlAstModuleList ($wxmlAst) {
    if (!$wxmlAst) return []

    var list = []
    $wxmlAst.find(`<script module="$_$1"></script>`).each(function (item) {
        var node = item.match[1]
        var moduleName = node[0].value
        list.push(moduleName)
    })
    return list
}

/**
 * 获取data、props或methods列表
 * @param {*} $jsAst
 * @param {*} type      类型：DATA、PROPS、METHODS、WATCH、COMPONENTS、COMPUTED
 * @param {*} isCreate  是否创建
 * @returns
 */
function getDataOrPropsOrMethodsList ($jsAst, type, isCreate = false) {
    if (!$jsAst) return []

    var exportSelector = `export default {}`

    var selector = {
        DATA: `export default {
                    data() {
                        return $_$list
                    }
                }`,
        PROPS: `export default {
                    props: $_$list
                }`,
        METHODS: `export default {
                    methods: $_$list
                }`,
        WATCH: `export default {
                    watch: $_$list
                }`,
        COMPONENTS: `export default {
                    components: $_$list
                }`,
        BEHAVIORS: `export default {
                    mixins: $_$list
                }`,
        COMPUTED: `export default {
                    computed: $_$list
                }`
    }

    var list = null
    var res = $jsAst.find(selector[type])

    if (res && res.length) {
        var node = res.match['list'][0].node
        if (t.isArrowFunctionExpression(node)) {
            // 可能它本身就是：
            //E:\zpWork\Project_self\miniprogram-to-uniapp\demo\wechatProject_meifumx_health\miniprogram\components\appbar
            // observers: (newVal, oldVal)=> {
            //     if(newVal.title!=oldVal.title||newVal.location!=oldVal.location)
            //     {
            //       this.setData({
            //         defaultData:newVal
            //       })
            //     }
            // },
            // 暂时只发现这一例是这么写的。
            if (type === propTypes.WATCH) {
                // res.match['list'][0].node = {
                //     "**": res.match['list'][0].value
                // }
                // var op = t.objectProperty(t.identifier("**"), node)
                // var oe = t.objectExpression([op])
                // res.match['list'][0].node = oe
                // list = oe.properties || oe.elements

                //TODO: 看这里要不要直接干掉算了，目前的一例来说，加这个毫无必要
                // $jsAst.replace(`export default {$$$, watch: $_$list }`, `export default {$$$, watch: { } }`)

                $jsAst.replace(`export default {$$$, watch: $_$list }`, `export default {$$$, watch: { "**": $_$list } }`)

                list = getDataOrPropsOrMethodsList($jsAst, type, isCreate)
            } else {
                //TODO: 直接抛异常会有问题的
                throw new Error("结构有问题！！！！", $jsAst.generate())
            }
        } else {
            list = node.properties || node.elements
        }
    } else {
        res = $jsAst.find(exportSelector)
        if (res.length === 0) {
            return []
        }
    }

    //没找到时，那就创建它
    if (!list && isCreate) {
        var replaceSelector = `export default {
                $$$list
            }`
        var replaceMap = {
            DATA: `export default {
                    data() {
                        return {}
                    },
                    $$$list
                }`,
            PROPS: `export default {
                    props:{},
                    $$$list
                }`,
            METHODS: `export default {
                    $$$list,
                    methods:{}
                }`,
            WATCH: `export default {
                    $$$list,
                    watch:{}
                }`,
            COMPONENTS: `export default {
                    components: {},
                    $$$list
                }`,
            BEHAVIORS: `export default {
                    mixins: [],
                    $$$list
                }`,
            COMPUTED: `export default {
                    $$$list,
                    computed: {}
                }`
        }
        // console.log("type", type)
        $jsAst.replace(replaceSelector, replaceMap[type])

        list = getDataOrPropsOrMethodsList($jsAst, type, isCreate)
    }

    return list || []
}



/**
 * ObjectMethod 转换为FunctionExpression对象
 * @param {*} path
 * @returns
 */
function objectMethod2FunctionExpression (path) {
    if (!path) throw new Error("objectMethod2FunctionExpression 参数错误")
    return t.functionExpression(path.id, path.params, path.body)
}

/**
 * 获取components ast里面的props列表
 * @param {*} $jsAst
 */
function getCompoentPropsList ($jsAst) {
    var propList = getDataOrPropsOrMethodsList($jsAst, propTypes.PROPS)

    var propList = propList.reduce(function (list, item) {
        var keyName = item.key && (item.key.name || item.key.value)
        if (item.value && item.value.properties) {
            var typeNode = item.value.properties.find(obj => obj.key && (obj.key.name === "type" || obj.key.value === "type"))
            if (!typeNode) return list

            var type = typeNode.value.name
            if (!type) return list

            var obj = {
                name: keyName,
                type: type
            }
            list.push(obj)
        }
        return list
    }, [])

    propList = utils.uniqueArray(propList, "name")
    return propList
}


/**
 * 创建指定name的objectproperty
 * @param {*} name
 * @param {*} boolean 默认为true
 * @returns
 */
function createObjectProperty (name, boolean = true) {
    return t.objectProperty(t.identifier(name), t.booleanLiteral(boolean))
}

/**
 * 根据methodName获取methods下面的方法
 * @param {*} $ast
 * @param {*} methodName
 * @returns
 */
function getObjectMethod ($ast, methodName) {
    var selector = `export default {methods:{${ methodName }:$_$1}}`
    var res = $ast.find(selector)
    if (res.length) {
        return res.match[1][0].node
    }
    return null  //没获取到返回null
}


/**
 * 将observers改造成handler引用方式，并添加到watch里
 *
 * @param {*} $jsAst
 * @param {*} watchList
 * @param {*} propItemName
 * @param {*} propType
 * @param {*} observerNode   funExp
 */
function addWatchHandlerItem ($jsAst, watchList, propItemName, propType, observerNode) {
    let objProp = null
    let op_value = null
    if (t.isStringLiteral(observerNode.value)) {
        //如果是这种形式
        // properties: {
        //     actions: {
        //       type: Array,
        //       value: [],
        //       observer: '_groupChange'
        //     }
        //   },
        var methodNode = getObjectMethod($jsAst, observerNode.value.value)
        if (methodNode) {
            op_value = objectMethod2FunctionExpression(methodNode)
        } else {
            console.log("properties " + observerNode.value.value + "函数不存在")
            return
        }
    } else {
        //observer移到watch
        //
        if (t.isObjectProperty(observerNode)) {
            op_value = observerNode.value
        } else if (t.isObjectMethod(observerNode)) {
            op_value = t.functionExpression(
                null,
                observerNode.params,
                observerNode.body
            )
        } else {
            op_value = observerNode.value
        }
    }

    let objExp_handle = t.objectProperty(t.identifier("handler"), op_value)
    //对齐微信小程序，开启首次赋值监听
    let objExp_immediate = createObjectProperty("immediate")

    let newProperties = [objExp_handle, objExp_immediate]

    if (propType == "Array" || propType == "Object") {
        //Array和Object换成深度监听
        let objExp_deep = createObjectProperty("deep")
        newProperties.push(objExp_deep)
    }

    let objExp = t.objectExpression(newProperties)
    objProp = t.objectProperty(t.identifier(propItemName), objExp)

    watchList.push(objProp)
}


/**
 * 从propList里面找到指定keyName的类型
 * @param {*} keyName
 */
function getPropTypeByPropList (propList, keyName) {
    if (!propList) return ""

    var type = ""
    propList.map(function (item) {
        var propName = item.key && (item.key.name || item.key.value) || ""
        if (propName === keyName) {
            var properties = item.value.properties
            if(properties){
                properties.find(function (subItem) {
                    var name = subItem.key.name || subItem.key.value
                    if (name === "type") {
                        type = subItem.value.name
                    }
                })
            }
        }
    })
    return type
}


/**
 * 检测ast是否为weui的js文件
 * @param {*} $jsAst
 * @returns
 */
function checkWeUI ($jsAst, $wxmlAst) {
    var isWeUIJS = false
    var isWeUIWxml = false
    if ($jsAst) {
        var check1 = $jsAst.find(`var globalThis = this, self = this;`).length
        var check2 = $jsAst.find(`module.exports = require($_$)([{$$$}])`).length
        var check3 = $jsAst.find(`function __webpack_require__(moduleId) {}`).length

        isWeUIJS = check1 || check2 || check3
    }
    if ($wxmlAst) {
        isWeUIWxml = $wxmlAst.find(`<view class="weui-$_$1"></view>`).length > 0
    }
    return isWeUIJS || isWeUIWxml
}



module.exports = {
    getThisName,
    staticAssetsReg,
    assetsFileReg,
    multiSssetsFileReg,
    // transformAppDotGlobalData,
    transformGetApp,
    transformThisDotKeywordExpression,
    getAstType,
    getLifecycleNode,

    getApiCount,

    getDataOrPropsOrMethodsList,
    getWxmlAstModuleList,
    propTypes,

    getScopeVariableInitValue,
    objectMethod2FunctionExpression,
    getCompoentPropsList,

    createObjectProperty,
    addWatchHandlerItem,
    getPropTypeByPropList,

    checkWeUI

}
