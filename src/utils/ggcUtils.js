/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2023-04-30 10:51:06
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/utils/ggcUtils.js
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

const multiAssetsFileReg = /['"]?((\/|\.+\/)*[^'+]*\.(jpe?g|gif|svg|png|mp3|mp4|ttf|eot|woff))['"]?/gi

const urlReg = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i

const pageExpList = [
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
        exp: [
            `($_$2, $_$3.VantComponent)($_$)`,
            "VantComponent($_$)"
        ],
        keywordList: [
            "VantComponent",
            "($_$2, $_$3.VantComponent)"
        ]
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
 * @param {*} fileKey
 * @returns
 */
function getAstType ($ast, fileKey) {
    let result = pageExpList.find(function (obj) {
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

    // global.log("fileKey: ----- ", fileKey, result && result.type || "")
    return result && result.type || ""
}

/**
 * 获取ast里面定义的变量名数组，如果找不到则返回空数组
 * 可能中间有很多个，这里返回数组
 * @param {*} $ast           ast
 * @param {*} type           ast节点类型
 * @param {*} defaultName    默认的变量名，或一般的变量名
 * @param {*} value          变量的初始值
 * @returns
 */
function getVarNameList ($ast, selector, value) {
    var res = []

    //这里多了一个参数 ，后面处理一下
    $ast
        .find(selector)
        .each(function (item) {
            //TODO： 可选链优化
            var name = item[0].nodePath.node.id.name || value
            res.push(name)
        })
    return res
}


/**
 * 当取当前ast作用域里面的this，是否有别名
 * @param {*} $ast
 * @returns
 */
function getThisNameList ($ast) {
    var selector = { type: "VariableDeclarator", init: t.thisExpression() }
    return getVarNameList($ast, selector, "this")
}

/**
 * 替换app.xxx --> app.globalData.xxx
 * 仅用于singleJS-transformer.js
 * @param {*} $ast
 */
function transformAppDotGlobalData ($ast) {
    //1.找到 var app = getApp(); 的变量名
    //2.开始替换

    var appName = "app"
    var selector = { type: "VariableDeclarator", init: { callee: { name: "getApp" } } }
    var nameList = getVarNameList($ast, selector, "app")
    //TODO：这里仅用第一个，严格来说还是会漏掉一些场景，后续再议
    if (nameList.length) {
        appName = nameList[0] || "app"
    }

    $ast
        .find({ type: "MemberExpression", object: { name: appName } })
        .each(function (item) {
            // global.log(item)
            var nodePath = item[0].nodePath
            var node = nodePath.node
            var property = node.property
            var info = nodePath.scope.lookup(appName)
            //TODO: 如果一个js里面一个函数内使用了app，但整个文件都没有地方定义它时，则info为空。。。
            var isGlobal = info && info.isGlobal || false

            /**
             * 注意！！！
             * 如果在外面 var t = getApp()
             * 而在函数里面也有t
             * var t = [ this.data.selectNum, this.data.spec, 0 ], e = t[0], a = t[1], i = t[2];
             * 这里必须要判断这个t是否为global的，不然会误替换！
             *
             * //总感觉这里判断不完全
             */
            if (!isGlobal) {
                // return
            }

            if (t.isIdentifier(property, { name: "globalData" })) {
                //
            } else {
                var firstMeExp = t.memberExpression(t.identifier(appName), t.identifier("globalData"))
                var meExp = t.memberExpression(firstMeExp, property)
                item.replaceBy(meExp)
            }
        }).root()

    return $ast
}



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
            // global.log(item)

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
 * 如item是否为this对象或this的别名，则返回this或this的别名，否则返回null
 * item应该是使用selector:`$_$this.data`搜索出来的
 * @param {*} item
 * @param {*} selectorName  this在选择器里的名，默认为this
 * @returns
 */
function getThisExpressionName (item, selectorName = 'this') {
    var result = null

    if (!item) return null
    if (item.match[selectorName] && item.match[selectorName][0] && item['0']) {
        var thisNode = item.match[selectorName][0].node
        var nodePath = item['0'].nodePath
        if (thisNode.type === 'ThisExpression') {
            //是this本身
            result = 'this'
        } else if (t.isMemberExpression(thisNode) && t.isThisExpression(thisNode.object)) {
            result = 'this'
        } else {
            var objectName = thisNode.name
            var res = nodePath.scope.lookup(objectName)
            if (res && res.bindings[objectName]) {
                var scopeNode = res.bindings[objectName][0]
                var scopeParentNode = scopeNode.parentPath
                if (
                    scopeParentNode.node.type === 'VariableDeclarator' &&
                    scopeParentNode.node.init &&
                    scopeParentNode.node.init.type === 'ThisExpression'
                ) {
                    //是this的别名
                    result = objectName
                }
            }
        }
    }
    return result
}

/**
 * 处理this.data = {} 这种场景，转换后为：this.setData({})
 * this.data = {
 *    style:"",
 *    value:"",
 * }
 * @param {*} $ast
 */
function transformThisDotData ($ast) {
    if (!$ast) return
    $ast
        .find('$_$this.data = $_$value')
        .each(function (item) {

            var thisNode = item.match["this"][0].node
            var valueNode = item.match["value"][0].node

            var thisName = getThisExpressionName(item, 'this')
            if (thisName) {
                var valueStr = $(valueNode).generate()
                item.replaceBy(`${ thisName }.setData(${ valueStr })`)
            }
        })
        .root()
}


/**
 * 处理this.properties = {a:1, b:2} 这种场景，作提示，需手动处理
 * @param {*} $ast
 * @param {*} fileKey
 */
function transformThisDotProperties ($ast, fileKey) {
    if (!$ast) return
    $ast
        .find('$_$this.properties = $_$value')
        .each(function (item) {
            var thisName = getThisExpressionName(item, 'this')
            if (thisName) {
                var code = $(item).generate()
                global.log(`[ERROR]代码：${ code }写法不适应uni-app，需转换后手动调整。  file:${ fileKey }`)
            }
        })
        .root()
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
 * @param {*} fileKey
 * @returns
 */
function transformThisDotKeywordExpression ($ast, keyword = "data", globalDataProperties = [], fileKey) {
    if (keyword === "data") {
        transformThisDotData($ast)
    } else if (keyword === "properties") {
        transformThisDotProperties($ast, fileKey)
    }

    var globalDataNameList = globalDataProperties.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    //未在globalData里面定义的变量数组
    var undefinedNameList = new Set()
    // { type: "MemberExpression", property: { name: keyword } }


    $ast
        //这个selector有问题，有时拿不到scope
        // .find({ type: "MemberExpression", property: { name: keyword } })
        // .find([
        //     `$_$.globalData`,
        //     `$_$['globalData']`
        // ])
        .find([
            `$_$.${ keyword }`,
            `$_$['${ keyword }']`
        ])
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
 * @param {*} value       添加进去的值
 * @returns
 */
function getLifecycleNode ($ast, pageType, name, isGenerate, type = "Object", value) {
    if (!$ast) return

    if (!name) throw "Error: getLifecycleNode函数的name不能为空"
    var nodePath = null
    $ast.find(`${ pageType }({$$$})`).each(function (item) {
        var list = item.match["$$$$"]
        nodePath = list.find(function (obj) {
            return obj.key && (obj.key.name === name || obj.key.value === name)
        })
        if (!nodePath && isGenerate) {
            var valueNode = t.objectExpression([])
            switch (type) {
                case "Object":
                    //默认object
                    break
                case "Array":
                    valueNode = value ? t.arrayExpression([value]) : t.arrayExpression([])
                    break
                case "Function":
                    valueNode = t.functionExpression(null, [], t.blockStatement([]))
                    break
                default:
                    break
            }
            nodePath = t.objectProperty(t.identifier(name), valueNode)

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
 * 获取当前页面标签个数
 * @param {*} $ast
 * @param {*} name 默认支付
 * @returns
 */
function getTagCount ($ast, tagName) {
    if (!$ast) return 0
    var count = $ast.find(`<${ tagName }></${ tagName }>`).length
    $ast.root()
    return count || 0
}

/**
 * 获取当前页面vant标签信息
 * @param {*} $wxmlAst
 * @returns
 */
function getVanTagList ($wxmlAst) {
    var list = []
    if (!$wxmlAst) return list
    $wxmlAst.find(`<$_$tag></$_$tag>`).each(item=>{
        var tagName = item.attr('content.name')
        if(tagName.startsWith("van-")){
            list.push(tagName)
        }
    }).root()

    //去重
    list = utils.duplicateRemoval(list)
    return list
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

// 页面结构对象
const pageStructureMap = {}

/**
 * 获取data、props或methods列表
 * @param {*} $jsAst
 * @param {*} type      类型：DATA、PROPS、METHODS、WATCH、COMPONENTS、COMPUTED
 * @param {*} fileKey   用于缓存
 * @param {*} isCreate  是否创建
 * @returns
 */
function getDataOrPropsOrMethodsList ($jsAst, type, fileKey, isCreate = false) {
    if (!$jsAst) return []

    if (!fileKey) global.log("getDataOrPropsOrMethodsList fileKey不能为空！")

    //如果有缓存，直接拿缓存（据说拿缓存有问题，不再拿缓存）
    // if (pageStructureMap[fileKey] && pageStructureMap[fileKey][type]) return pageStructureMap[fileKey][type]

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
        if (t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) {
            if (type === propTypes.WATCH) {
                //TODO: 这里的判断可能有问题？？？？？
                list = getDataOrPropsOrMethodsList($jsAst, type, fileKey, isCreate)
            } else {
                //TODO: 直接抛异常会有问题的
                global.log("结构有问题！！！！", $jsAst.generate())

                //这里需设置为true，list也需赋值，不然会死循环
                isCreate = true
                list = node.body.body
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
        // global.log("type", type)
        $jsAst.replace(replaceSelector, replaceMap[type])

        list = getDataOrPropsOrMethodsList($jsAst, type, fileKey, isCreate)
    }

    //缓存
    if (!pageStructureMap[fileKey]) {
        pageStructureMap[fileKey] = {}
    }
    pageStructureMap[fileKey][type] = list || []

    return list || []
}



/**
 * ObjectMethod 转换为FunctionExpression对象
 * @param {*} path
 * @returns
 */
function objectMethod2FunctionExpression (path) {
    if (!path) global.log("objectMethod2FunctionExpression 参数错误")
    return t.functionExpression(path.id, path.params, path.body)
}

/**
 * 获取components ast里面的props列表
 * @param {*} $jsAst
 */
function getComponentPropsList ($jsAst, fileKey) {
    var propList = getDataOrPropsOrMethodsList($jsAst, propTypes.PROPS, fileKey)

    var propList = propList.reduce(function (list, item) {
        var keyName = item.key && (item.key.name || item.key.value)
        if (item.value) {
            var typeList = []
            var properties = item.value.properties
            if (properties) {
                //属性的类型可以为 String Number Boolean Object Array 其一，也可以为 null 表示不限制类型。
                //TODO: 这里的null暂未处理

                //type: 单个属性
                var typeNode = properties.find(obj => obj.key && (obj.key.name || obj.key.value) === "type")
                if (typeNode) typeList.push(typeNode.value.name)

                //optionalTypes: 属性的类型（可以指定多个）
                var optionalTypes = properties.find(obj => obj.key && (obj.key.name || obj.key.value) === "optionalTypes")
                if (optionalTypes && t.isArrayExpression(optionalTypes.value)) {
                    var optionalTypeList = optionalTypes.value.elements.map(obj => (obj.name || obj.value))
                    typeList.push(...optionalTypeList)
                }
            } else {
                // properties: {
                //     myProperty: { // 属性名
                //         type: String,
                //         value: ''
                //     },
                //     myProperty2: String // 简化的定义方式
                // },
                var type = item.value.name || item.value.value || ""
                if (type) typeList.push(type)
            }
            if (!typeList.length) return list

            list.push({
                name: keyName,
                type: typeList
            })
        }
        return list
    }, [])

    propList = utils.uniqueArray(propList, "name")
    return propList
}

/**
 * 检查某个组件里面的prop的类型，是否为引用类型
 * @param {*} fileKey
 * @param {*} propName
 */
function checkPropReferenceType (fileKey, propName) {
    var propTypeList = global.props[fileKey]
    if (propTypeList) {
        let curPropNode = propTypeList.find(item => item.name === propName)
        //TODO：可能这个name是在data里！！！！！！
        let isReferenceType = false
        if (curPropNode) {
            let typeList = curPropNode.type
            let reg = /number|boolean|string/i
            let isBasicType = typeList.every(type => reg.test(type))
            isReferenceType = !isBasicType
        } return isReferenceType
    } else {
        return false
    }
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
            global.log("properties " + observerNode.value.value + "函数不存在")
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
            if (properties) {
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


/**
 * 强制替换ast对象，避免ast结构异常情况出现
 * //引自：https://github.com/thx/gogocode/blob/main/packages/gogocode-plugin-element/utils/scriptUtils.js#L62
 * forceReplace($, fAst, `mode:'history'`, `history: VueRouter.createWebHistory()`);
 * @param {*} $
 * @param {*} ast
 * @param {*} selector
 * @param {*} replacer
 */
function forceReplace ($, ast, selector, replacer) {
    ast.replaceBy($(ast.generate()).replace(selector, replacer))
}



module.exports = {
    getThisNameList,
    getThisExpressionName,
    staticAssetsReg,
    assetsFileReg,
    multiAssetsFileReg,
    urlReg,



    transformAppDotGlobalData,
    transformGetApp,
    transformThisDotKeywordExpression,
    getAstType,
    getLifecycleNode,

    getApiCount,
    getTagCount,
    getVanTagList,

    getDataOrPropsOrMethodsList,
    getWxmlAstModuleList,
    propTypes,

    getScopeVariableInitValue,
    objectMethod2FunctionExpression,
    getComponentPropsList,

    createObjectProperty,
    addWatchHandlerItem,
    getPropTypeByPropList,

    checkWeUI,

    forceReplace,

    pageExpList,

    checkPropReferenceType,

}
