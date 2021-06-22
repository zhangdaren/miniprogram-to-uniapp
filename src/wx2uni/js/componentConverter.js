const t = require("@babel/types")
const nodePath = require("path")
const generate = require("@babel/generator").default
const traverse = require("@babel/traverse").default
const Vistor = require("./Vistor")
const clone = require("clone")
const utils = require("../../utils/utils")
const pathUtil = require("../../utils/pathUtil")
const babelUtil = require("../../utils/babelUtil")
//

let vistors = {}

//外部定义的变量
let declareNodeList = []
//当前处理的js文件路径
let file_js = ""
//当前文件所在目录
let fileDir = ""

//key
let fileKey = ""

/*
 *
 * 注：为防止深层遍历，将直接路过子级遍历，所以使用enter进行全遍历时，孙级节点将跳过
 *
 */
const componentVistor = {
    IfStatement (path) {
        babelUtil.getAppFunHandle(path)
    },
    ExpressionStatement (path) {
        const parent = path.parentPath.parent
        babelUtil.otherRequirePathHandle(path, fileDir)
        if (path.node) {
            if (t.isCallExpression(path.node.expression)) {
                const calleeName = t.isIdentifier(path.node.expression.callee)
                    ? path.node.expression.callee.name.toLowerCase()
                    : ""
                if (
                    t.isFile(parent) &&
                    calleeName != "app" &&
                    calleeName != "page" &&
                    calleeName != "component" &&
                    calleeName != "vantcomponent"
                ) {
                    //定义的外部函数

                    declareNodeList.push(path)
                    path.skip()
                }
                // } else if (t.isAssignmentExpression(path.node.expression)) {
            } else {
                if (t.isFile(parent)) {
                    if (t.isAssignmentExpression(path.node.expression)) {
                        const callee = path.get("expression.right.callee")
                        if (t.isIdentifier(callee.node, { name: "Behavior" })) {
                            // utils.log("Behavior文件")
                        } else {
                            //path.node 为AssignmentExpression类型，所以这里区分一下
                            //定义的外部函数

                            declareNodeList.push(path)
                        }
                    } else {
                        //path.node 为AssignmentExpression类型，所以这里区分一下
                        //定义的外部函数

                        declareNodeList.push(path)
                    }
                }
            }
        }
    },
    ClassDeclaration (path) {
        const parent = path.parentPath.parent
        if (t.isFile(parent)) {
            //定义的外部Class
            declareNodeList.push(path);;
        }
    },
    ImportDeclaration (path) {
        let specifiers = path.get("specifiers")
        let local = ""
        if (specifiers.length) {
            local = path.get("specifiers.0.local")
        }
        if (local && t.isIdentifier(local) && /wxparse/i.test(local.node.name)) {
            //判断是import wxParse from '../../../wxParse/wxParse.js';
        } else {
            //定义的导入的模块
            //处理import模板的路径，转换当前路径以及根路径为相对路径
            let filePath = path.node.source.value
            //去掉js后缀名
            //排除例外：import {SymbolIterator} from "./methods/symbol.iterator";
            //import Im from '../../lib/socket.io';
            let extname = nodePath.extname(filePath)
            if (extname == ".js") {
                filePath = nodePath.join(
                    nodePath.dirname(filePath),
                    pathUtil.getFileNameNoExt(filePath)
                ) //去掉扩展名
            }
            filePath = pathUtil.relativePath(
                filePath,
                global.miniprogramRoot,
                fileDir
            )
            path.node.source.value = filePath

            //定义的外部函数
            babelUtil.otherRequirePathHandle(path, fileDir)
            declareNodeList.push(path)
            path.skip()
        }
    },
    VariableDeclaration (path) {
        const parent = path.parentPath.parent
        if (t.isFile(parent)) {
            //将require()里的地址都处理一遍

            //定义的外部函数
            babelUtil.otherRequirePathHandle(path, fileDir)
            declareNodeList.push(path)
            path.skip()
        }
    },
    NewExpression (path) {
        babelUtil.getAppHandleByNewExpression(path)
    },
    FunctionDeclaration (path) {
        const parent = path.parentPath.parent
        if (t.isFile(parent)) {
            babelUtil.getAppFunHandle(path)

            //定义的外部函数
            babelUtil.otherRequirePathHandle(path, fileDir)
            declareNodeList.push(path)
            path.skip()
        }
    },
    ObjectMethod (path) {
        var name = ""
        var keyNode = path.node.key
        if (t.isIdentifier(keyNode)) {
            name = keyNode.name
        } else if (t.isStringLiteral(keyNode)) {
            name = keyNode.value
        }
        lifeCycleHandle(path)
    },
    ObjectProperty (path) {
        var name = ""
        var keyNode = path.node.key
        if (t.isIdentifier(keyNode)) {
            name = keyNode.name
        } else if (t.isStringLiteral(keyNode)) {
            name = keyNode.value
        }

        // utils.log("name", path.node.key.name)
        // utils.log("name", path.node.key.name)
        lifeCycleHandle(path)
    }
}

/**
 * 组件里生命周期函数处理
 * 这样修改的原因是：
 * lifetimes下面的函数有两种写法attached(){}和lifetimes:{}
 * @param {*} path
 */
function lifeCycleHandle (path) {
    const name = path.node.key.name
    switch (name) {
        case "data":
            var properties = path.node.value.properties
            if (properties) {
                properties.forEach(function (item) {
                    if (item && item.key && item.key.name) {
                        //还有问题，先不更新!!!
                        // item.key.name = utils.getFunctionAlias(item.key.name);
                        vistors[name].handle(item)
                    }
                })
            }
            path.skip()
            break
        case "mixins":
            //mixins仍然放入生命周期
            vistors.lifeCycle.handle(path.node)
            break
        case "computed":
        case "watch":
            var value = path.node.value
            if (t.isObjectExpression(value)) {
                var properties = path.node.value.properties
                if (properties) {
                    properties.forEach(function (item) {
                        // if(item.key.name === "data") item.key.name="pData";
                        vistors[name].handle(item)
                    })
                }
                path.skip()
            } else {
                utils.log("【异常】：computed或watch异常  代码是：" + `${ generate(path.node).code }`)
            }
            break
        case "observers":
            var value = path.node.value
            if (t.isObjectExpression(value)) {
                observersHandle(path)
                ///////////////////////////////////
                //TODO: observers需要处理成深度监听，但还得判断data/prop里是使用类型的
                //判断data是否有prop一致的，还需要分割,进行

                path.skip()
            } else {
                utils.log("【异常】：observers异常  代码是：" + `${ generate(path.node).code }`)
            }
            break
        case "props": // VantComponent组件
        case "properties":
            propertiesHandle(path)
            path.skip()
            break
        case "attached":
            //组件特有生命周期: attached-->beforeMount
            let newPath_a = clone(path)
            newPath_a.node.key.name = "beforeMount"
            vistors.lifeCycle.handle(newPath_a.node)
            path.skip()
            break
        case "detached":
            //组件特有生命周期: detached-->destroyed
            let newPath_d = clone(path)
            newPath_d.node.key.name = "destroyed"
            vistors.lifeCycle.handle(newPath_d.node)
            path.skip()
            break
        case "ready":
            //组件特有生命周期: ready-->mounted
            let newPath_r = clone(path)
            newPath_r.node.key.name = "mounted"
            vistors.lifeCycle.handle(newPath_r.node)
            path.skip()
            break
        case "moved":
            //组件特有生命周期: moved-->moved  //这个vue没有对应的生命周期
            let newPath_m = clone(path)
            newPath_m.node.key.name = "moved"
            vistors.lifeCycle.handle(newPath_m.node)
            path.skip()
            break
        case "pageLifetimes":
            //组件所在页面的生命周期函数pageLifetimes，原样放入生命周期内
            // show -- > onPageShow
            // hide -- > onPageHide
            // size -- > onPageResize
            var properties = path.node.value.properties
            if (properties) {
                properties.forEach(function (item) {
                    let name = item.key.name
                    switch (item.key.name) {
                        case "show":
                            name = "onPageShow"
                            break
                        case "hide":
                            name = "onPageHide"
                            break
                        case "resize":
                            name = "onPageResize"
                            break
                    }
                    item.key.name = name
                    vistors.lifeCycle.handle(item)
                })
            }
            path.skip()
            break
        case "behaviors":
            //组件的behaviors，重名为mixins，放入生命周期
            let newPath_b = clone(path)
            newPath_b.node.key.name = "mixins"
            vistors.lifeCycle.handle(newPath_b.node)
            path.skip()
            break
        case "lifetimes":
            //组件特有生命周期组lifetimes，不处理
            break
        case "externalClasses":
        //组件的externalClass自定义组件样式
        case "relations":
            //组件特有: relations  // 组件间关系
            const logStr = `[Tip] 组件间关系 relations 在Uniapp上不支持，请转换后尝试修复、或先注释、或先不管~    file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
            //存入日志，方便查看，以防上面那么多层级搜索出问题
            utils.log(logStr)
            global.log.push(logStr)
        case "options":
            //组件的options
            vistors.lifeCycle.handle(path.node)
            path.skip()
            break
        case "methods":
            //组件特有生命周期: methods
            var properties = path.node.value.properties
            if (properties) {
                properties.forEach(function (item) {
                    vistors.methods.handle(item)
                })
            }
            path.skip()
            break

        default:
            vistors.lifeCycle.handle(path.node)
            path.skip()
            break
    }
}


/**
 * 已有observers处理
 * 特别针对同时监听多个变量的处理
 * 并，增加deep和immediate参数
 *
 * @param {*} path
 */
function observersHandle (path) {
    var properties = path.node.value.properties
    if (properties) {
        properties.forEach(function (item) {
            var keyName = item.key.value
            var value = item.value
            if (keyName.indexOf(",") > -1) {
                if (t.isFunctionExpression(value)) {
                    //清除空格
                    keyName = keyName.replace(/\s/g, "")

                    var funExp = value
                    var funExpBody = funExp.body.body

                    //将函数的参数替换为 function(newValue, oldValue){}
                    funExp.params = [t.identifier("newValue"), t.identifier("oldValue")]

                    //在函数的第一行添加 const {a, b} = newValue;
                    var keyList = keyName.split(",")
                    var objList = []
                    keyList.forEach(function (name) {
                        name = name.trim()
                        objList.push(t.objectProperty(t.identifier(name), t.identifier(name), false, true))
                    })
                    var objectPattern = t.objectPattern(objList)
                    var varPath = t.variableDeclaration("const", [t.variableDeclarator(objectPattern, t.identifier("newValue"))])
                    funExpBody.unshift(varPath)

                    //
                    let objExp_handle = t.objectProperty(
                        t.identifier("handler"),
                        funExp
                    )
                    //对齐微信小程序，开启首次赋值监听
                    let objExp_immediate = createObjectProperty("immediate")

                    //Array和Object换成深度监听
                    let objExp_deep = createObjectProperty("deep")

                    let subProperties = [objExp_handle, objExp_immediate, objExp_deep]
                    var newKeyName = keyName.replace(/\s/g, "").replace(/,/g, "_")

                    let objExp = t.objectExpression(subProperties)
                    objProp = t.objectProperty(t.identifier(newKeyName), objExp)
                    //
                    vistors["watch"].handle(objProp)

                    //
                    addComputedItem(keyName)
                } else {
                    vistors["watch"].handle(item)
                }
            } else {
                vistors["watch"].handle(item)
            }
        })
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
 * 用于observers多变量时的处理
 * 生成一个对象放入computed里
 *
 *  numberA_numberB() {
 *	   const { numberA, numberB } = this
 *	   return { numberA,numberB }
 *  }
 */
function addComputedItem (keyName) {
    var keyList = keyName.split(",")
    var objList = []
    keyList.forEach(function (name) {
        name = name.trim()
        objList.push(t.objectProperty(t.identifier(name), t.identifier(name), false, true))
    })
    var objectPattern = t.objectPattern(objList)
    var varPath = t.variableDeclaration("const", [t.variableDeclarator(objectPattern, t.thisExpression())])
    var returnPath = t.returnStatement(t.objectExpression(objList))
    var body = t.blockStatement([varPath, returnPath])
    var newKeyName = keyName.replace(/,/g, "_")
    var objectMethod = t.objectMethod("method", t.identifier(newKeyName), [], body)

    vistors["computed"].handle(objectMethod)
}


/**
 * propertiest和props处理
 * 如果是复杂类型就增加deep和immediate参数
 *
 * @param {*} path
 */
function propertiesHandle (path) {
    //组件特有生命周期: properties-->props
    var properties = path.get("value.properties")
    if (properties && properties.length > 0) {
        properties.forEach(function (item) {
            ///////////////////////////////
            // proE: {
            // 	type: Array,
            // 	value: []
            // }
            //-->
            // proE: {
            // 	type: Array,
            // 	default: () => []
            // }
            ///////////////////////////////
            // proE: {
            // 	type: Object,
            // 	value: {}
            // }
            //-->
            // proE: {
            // 	type: Object,
            // 	default: () => ({})
            // }

            let propItemName = item.node.key.name || item.node.key.value
            //20200418->减少侵入，也因为修复不完全，不再进行重名！
            // propItemName = utils.getPropsAlias(propItemName);

            //
            const props = item.get("value.properties")
            let typeItem = null
            let defaultItem = null
            let observerItem = null
            if (props && props.length > 0) {
                props.forEach(function (subItem) {
                    const name = subItem.node.key.name
                    switch (name) {
                        case "value":
                            subItem.node.key.name = "default"
                            defaultItem = subItem
                            break
                        case "type":
                            typeItem = subItem
                            break
                        case "observer":
                            observerItem = subItem
                            break
                    }
                })
            }
            if (typeItem && defaultItem) {

                //提示type与value类型对不上的情况，先提示，后续再处理
                //TODO: 处理type与value值对不上的情况，，，我……太难了
                // Component({
                //     properties: {
                //         footerindex: {
                //             type: String,
                //             value: 0
                //         },
                //         footer: {
                //             type: Object,
                //             value: ""
                //         },
                //         js_footerindex: {
                //             type: String,
                //             value: 0
                //         },
                //     },
                // });

                //https://developers.weixin.qq.com/miniprogram/dev/reference/api/Component.html
                var type = typeItem.node.value.name
                var value = defaultItem.node.value
                var logStr = ""
                var propName = item.node.key.name
                switch (type) {
                    case "String":
                        if (!t.isStringLiteral(value)) {
                            logStr = `[Error] props: ${ propName } 的默认值与type所定义的类型 String 不一致，需转换后手动调整    file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                        }
                        break
                    case "Object":
                        if (!t.isObjectExpression(value)) {
                            logStr = `[Error] props: ${ propName } 的默认值与type所定义的类型 Object 不一致，需转换后手动调整    file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                        }
                        break
                    case "Array":
                        if (!t.isArrayExpression(value)) {
                            logStr = `[Error] props: ${ propName } 的默认值与type所定义的类型 Array 不一致，需转换后手动调整    file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                        }
                        break
                    case "Number":
                        //排除例外:
                        // num: {
                        //     type: Number,
                        //     value: Number.MAX_VALUE
                        // }
                        if (!t.isNumericLiteral(value) && (t.isMemberExpression(value) && value.object.name !== "Number")) {
                            logStr = `[Error] props: ${ propName } 的默认值与type所定义的类型 Number 不一致，需转换后手动调整    file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                        }
                        break
                    case "Boolean":
                        if (!t.isBooleanLiteral(value)) {
                            logStr = `[Error] props: ${ propName } 的默认值与type所定义的类型 Boolean 不一致，需转换后手动调整    file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                        }
                        break
                }
                if (logStr) {
                    utils.log(logStr)
                    global.log.push(logStr)
                }


                if (
                    typeItem.node.value.name == "Array" ||
                    typeItem.node.value.name == "Object"
                ) {
                    if (defaultItem && defaultItem.node) {
                        if (t.isObjectProperty(defaultItem)) {
                            var value = defaultItem.node.value
                            if (t.isObjectExpression(value) || t.isArrayExpression(value)) {
                                /**
                                 * shopConfig: {
                                 *    type: Object,
                                 *    value: {},
                                 * }
                                 */
                                var body = t.blockStatement([])
                                if (t.isArrayExpression(value)) {
                                    body = defaultItem.node.value
                                }
                                let afx = t.arrowFunctionExpression([], body)
                                let op = t.ObjectProperty(defaultItem.node.key, afx)
                                defaultItem.replaceWith(op)
                            } else if (t.isFunctionExpression(value)) {
                                /**
                                 * shopConfig: {
                                 *    type: Object,
                                 *    value:function() {
                                 *      return {};
                                 *  }
                                 */
                            }
                        } else if (t.isObjectMethod(defaultItem)) {
                            /**
                             * shopConfig: {
                             *    type: Object,
                             *    value() {
                             *      return {};
                             *  }
                             */
                        } else {
                            utils.log("异常信息：---- defaultItem.node.value 怪异类型 ", defaultItem)
                        }
                    } else {
                        utils.log("异常信息：---- defaultItem.node.value 为Undefined ", defaultItem)
                    }
                }
            }
            if (observerItem) {
                let objProp
                //observer换成watch
                let op_value = null
                //
                if (t.isObjectProperty(observerItem.node)) {
                    op_value = observerItem.node.value
                } else if (t.isObjectMethod(observerItem.node)) {
                    op_value = t.functionExpression(
                        null,
                        observerItem.node.params,
                        observerItem.node.body
                    )
                } else {
                    op_value = observerItem.node.value
                }

                let objExp_handle = t.objectProperty(
                    t.identifier("handler"),
                    op_value
                )
                //对齐微信小程序，开启首次赋值监听
                let objExp_immediate = createObjectProperty("immediate")

                let properties = [objExp_handle, objExp_immediate]

                if (
                    typeItem.node.value.name == "Array" ||
                    typeItem.node.value.name == "Object"
                ) {
                    //Array和Object换成深度监听
                    let objExp_deep = createObjectProperty("deep")
                    properties.push(objExp_deep)
                }

                let objExp = t.objectExpression(properties)
                //如果observer的属性名是字符串，那就进行命名的修正
                //20200418->减少侵入，也因为修复不完全，不再进行重名！
                // if (t.isStringLiteral(objExp))
                //     objExp.value = utils.getPropsAlias(objExp.value);
                objProp = t.objectProperty(t.identifier(propItemName), objExp)

                //
                vistors.watch.handle(objProp)
                observerItem.remove()
            }
            //20200418->减少侵入，也因为修复不完全，不再进行重名！
            // item.node.key.name = utils.getPropsAlias(item.node.key.name);
            vistors.props.handle(item.node)
        })
    }
}





/**
 * 转换
 * @param {*} ast               ast
 * @param {*} _file_js          当前转换的文件路径
 * @param {*} isVueFile         是否为vue文件
 */
const componentConverter = function (ast, _file_js, isVueFile) {
    //清空上次的缓存
    declareNodeList = []
    //
    file_js = _file_js
    fileDir = nodePath.dirname(file_js)
    fileKey = pathUtil.getFileKey(_file_js)

    //
    vistors = {
        props: new Vistor(),
        data: new Vistor(),
        events: new Vistor(),
        computed: new Vistor(),
        components: new Vistor(),
        watch: new Vistor(),
        methods: new Vistor(),
        lifeCycle: new Vistor()
    }

    traverse(ast, componentVistor)

    return {
        convertedJavascript: ast,
        vistors: vistors,
        declareNodeList //定义的变量和导入的模块声明
    }
}

module.exports = componentConverter
