const t = require("@babel/types")
const clone = require("clone")
const nodePath = require("path")
const parse = require("@babel/parser").parse
const generate = require("@babel/generator").default
const traverse = require("@babel/traverse").default
const pathUtil = require("./pathUtil")
const utils = require('./utils')

let compiledProjectHandle = null
try {
    compiledProjectHandle = require('../wx2uni/plugins/compiledProjectHandle')
} catch (error) {
    // utils.log("加载失败，", error)
}


/**
 * App生命周期函数
 */
const lifeCycleFunction = {
    onLoad: true,
    onReady: true,
    onShow: true,
    onHide: true,
    onUnload: true,
    onPullDownRefresh: true,
    onReachBottom: true,
    onShareAppMessage: true,
    onShareTimeline: true,
    onLaunch: true,
    onError: true
}

/**
 * 判断当前变量是否存在于当前及父级函数的参数里
 * function(app){
 *    app.data = 5;
 * }
 * 即为存在
 * @param {*} path
 * @param {*} fileKey
 */
function findCurrentScopeByKey (path, fileKey) {
    let isExist = false
    path.findParent(function (funExp) {
        if (funExp.isFunctionExpression()) {
            if (funExp) {
                let params = funExp.get("params")
                params.forEach(element => {
                    if (
                        t.isIdentifier(element) &&
                        global.pagesData[fileKey] &&
                        global.pagesData[fileKey]["getAppNamelist"] &&
                        global.pagesData[fileKey]["getAppNamelist"][element.node.name]
                    ) {
                        isExist = true
                    }
                })
            }
        }
        return isExist
    })
    return isExist
}

/**
 * 判断path是否为MemberExpression，且property为data
 * 判断表达式app.globalData.data.xxx = "123";
 * @param {*} path
 */
function hasDataExp (path) {
    let property = path.get("property")
    return (
        path &&
        t.isMemberExpression(path) &&
        t.isIdentifier(property.node, { name: "data" })
    )
}

var useScopeList = {}
function getAppHandleByAst (ast) {
    traverse(ast, {
        VariableDeclarator (path) {
            getAppHandleByVariableDeclarator(path)
        },
        NewExpression (path) {
            getAppHandleByNewExpression(path)
        }
    })
}

function getAppHandleByVariableDeclarator (path) {
    if (t.isVariableDeclarator(path)) {
        let id = path.get("id")
        let init = path.get("init")
        if (t.isCallExpression(init)) {
            let callee = init.get("callee")
            if (t.isIdentifier(id) && t.isIdentifier(callee.node, { name: "getApp" })) {
                getAppHandle(path, id)
            }
        } else if (t.isNewExpression(init)) {
            let callee = init.get("callee")
            if (t.isIdentifier(callee.node, { name: "getApp" })) {
                getAppHandle(path, id, true)
            }
        }
    }
}

function getAppHandleByNewExpression (path) {
    if (t.isNewExpression(path)) {
        let callee = path.get("callee")
        if (t.isIdentifier(callee.node, { name: "getApp" })) {
            callee = t.callExpression(t.identifier("getApp"), [])
            path.replaceWith(callee)
        }
    }
}

/**
 * getApp() 处理
 * @param {*} path
 * @param {*} id
 * @returns
 */
function getAppHandle (path, id, isNewExpression) {
    let scope = path.parentPath.scope
    //判断二次声明app的骚写法
    /**
     * var app = getApp();
     * var app = getApp();
     * app.test();
     */
    // console.log("scope.uid", scope.uid)
    if (useScopeList[scope.uid] === true) {
        //已经遍历过
        path.remove()
        return
    }

    if (!useScopeList.hasOwnProperty(scope.uid)) {
        /**
         * 这里两种解决方案
         * 一、将变量所在引用替换为getApp的变量+globalData，如：var abc = getApp(); abc.globalData.xxx
         * 二、将变量替换一下即可，改动较小，但可能会遇到在vue加载前就加载了组件的情况。。。
         */

        //方案0：感觉更优雅一点

        //新增，将所有getApp的别名，统一修改成app
        let hasBindApp = path.scope.getBinding("app")
        if (!hasBindApp && id.node.name !== "app") {
            path.scope.rename(id.node.name, "app")
        }

        var oldIdName = id.node.name
        // 获取当前变量名的绑定关系
        const currentBinding = path.scope.getBinding(oldIdName)
        if (currentBinding) {
            currentBinding.referencePaths.forEach(function (p) {
                if (t.isMemberExpression(p.parentPath.node)) {
                    var meExp = p.parentPath.node
                    var object = meExp.object
                    var property = meExp.property
                    if (t.isIdentifier(object, { name: oldIdName }) && t.isIdentifier(property, { name: "globalData" })) {
                        //可能是var {xxx} = app.globalData;
                    } else {
                        //app.xxx替换为app.globalData.xxx;
                        object.name = oldIdName + ".globalData"
                    }
                }
            })
        }


        //方案一：
        // var oldIdName = id.node.name;
        // scope.rename(id.node.name, id.node.name + ".globalData");
        // path.node.id.name = oldIdName;
        // useScopeList[scope.uid] = true;

        //方案二：
        // let memExp = t.memberExpression(t.callExpression(t.identifier("getApp"), []), t.identifier("globalData"));
        // let varDec = t.variableDeclarator(id.node, memExp);
        // path.replaceWith(varDec);
        // path.skip();


        //如果是 var a = new getApp();
        if (isNewExpression && path) {
            var newPath = t.VariableDeclarator(t.identifier(id.node.name), t.callExpression(t.identifier("getApp"), []))
            path.replaceWith(newPath)
        }
    }
}




/**
 * 替换globalData
 * 1. app.globalData.xxx = "123";  -->  getApp().globalData.xxx = "123";
 * 2. app.xxx --> getApp().globalData.xxx
 * @param {*} path      ast节点
 * @param {*} fileKey   当前处理的文件路径
 */
function globalDataHandle (path, fileKey) {
    if (t.isMemberExpression(path)) {
        const object = path.object ? path.object : path.get("object")
        const property = path.property ? path.property : path.get("property")

        const objectNode = object.node ? object.node : object
        const propertyNode = property.node ? property.node : property

        const parentPath = path.parentPath

        if (
            t.isIdentifier(objectNode, { name: "app" }) ||
            t.isIdentifier(objectNode, { name: "App" })
        ) {
            let me = null
            if (t.isIdentifier(propertyNode, { name: "globalData" })) {
                // utils.log(property);
                if (hasDataExp(parentPath)) {
                    //app.globalData.data.xxx = "123";  -->   getApp().globalData.xxx = "123";
                    me = t.MemberExpression(
                        t.callExpression(t.identifier("getApp"), []),
                        propertyNode
                    )
                    parentPath.replaceWith(me)
                    parentPath.skip()
                } else {
                    //app.globalData.xxx = "123";  -->  getApp().globalData.xxx = "123";
                    me = t.MemberExpression(
                        t.callExpression(t.identifier("getApp"), []),
                        propertyNode
                    )
                    path.replaceWith(me)
                    path.skip()
                }
            } else if (!findCurrentScopeByKey(path, fileKey)) {
                let getApp = t.callExpression(t.identifier("getApp"), [])
                if (hasDataExp(parentPath)) {
                    //app.xxx --> getApp().globalData.xxx
                    me = t.MemberExpression(
                        t.MemberExpression(getApp, t.identifier("globalData")),
                        propertyNode
                    )
                    parentPath.replaceWith(me)
                    parentPath.skip()
                } else if (propertyNode.name === "data") {
                    //app.data.xx --> getApp().globalData.xx
                    let getApp = t.callExpression(t.identifier("getApp"), [])
                    let me = t.MemberExpression(getApp, t.identifier("globalData"))
                    path.replaceWith(me)
                    path.skip()
                } else {
                    //app.xxx --> getApp().globalData.xxx
                    me = t.MemberExpression(
                        t.MemberExpression(getApp, t.identifier("globalData")),
                        propertyNode
                    )
                    path.replaceWith(me)
                    path.skip()
                }
            }
        } else if (
            fileKey &&
            global.pagesData[fileKey] &&
            global.pagesData[fileKey] &&
            global.pagesData[fileKey]["getAppNamelist"] &&
            global.pagesData[fileKey]["getAppNamelist"][objectNode.name]
        ) {
            //var vv = getApp();
            //vv.data.xx --> getApp().globalData.xx
            if (propertyNode.name === "data") {
                let getApp = t.callExpression(t.identifier("getApp"), [])
                let me = t.MemberExpression(getApp, t.identifier("globalData"))
                path.replaceWith(me)
                path.skip()
            } else if (t.isIdentifier(propertyNode, { name: "globalData" })) {
                //t.globalData.approot;  --> t.approot;
                path.replaceWith(objectNode)
                path.skip()
            }
        } else if (
            t.isIdentifier(objectNode.callee, { name: "getApp" }) &&
            propertyNode.name !== "globalData"
        ) {
            //getApp().xxx --> getApp().globalData.xxx
            let getApp = t.callExpression(t.identifier("getApp"), [])
            let me = t.MemberExpression(
                t.MemberExpression(getApp, t.identifier("globalData")),
                propertyNode
            )
            path.replaceWith(me)
            path.skip()
        }
    }
}

/**
 * 给当前代码行上方添加注释
 * @param {*} path     path
 * @param {*} comment  注释内容
 */
function addComment (path, comment) {
    let pathLoc
    let start
    if (path.node) {
        pathLoc = path.node.loc
        start = path.node.start
    } else {
        pathLoc = path.loc
        start = path.start
    }

    const locStart = pathLoc.start
    const locEnd = pathLoc.end
    const commentObject = {
        loc: {
            start: {
                line: locStart.line - 1,
                column: locStart.column - 1
            },
            end: {
                line: locEnd.line - 1
            }
        },
        start: start,
        type: "CommentLine",
        value: comment
    }

    if (path.node) {
        if (!path.container.leadingComments) path.container.leadingComments = []
        path.container.leadingComments.push(commentObject)
    } else {
        if (!path.leadingComments) path.leadingComments = []
        path.leadingComments.push(commentObject)
    }
}

/**
 * 页面的类型，在这个里面才会被认定
 */
const astTypeList = {
    App: true,
    Page: true,
    Component: true,
    VantComponent: true,
    Behavior: true,
    Webpack: true
}

/**
 * 获取ast类型
 * 目前支持识别以下几种类型:
 * 1.App
 * 2.Page
 * 3.Component
 * 4.VantComponent
 * 5.Behavior  -->  mixins
 * 7.Webpack      //webpack编译后的代码
 * @param {*} ast
 */
function getAstType (ast, _file_js) {
    let type = ""
    traverse(ast, {

        ExpressionStatement (path) {
            const parent = path.parentPath.parent
            if (t.isFile(parent)) {
                const exp = path.get("expression")
                if (t.isCallExpression(exp)) {
                    if (t.isIdentifier(exp.node.callee)) {
                        let name = exp.node.callee.name
                        if (astTypeList[name]) {
                            type = name
                            path.stop() //完全停止遍历，目前还没有遇到什么奇葩情况~
                        }
                    } else if (t.isMemberExpression(exp.node.callee)) {
                        let callee = exp.node.callee
                        let object = callee.object
                        let property = callee.property
                        //判断是否含有：global["webpackJsonp"] = global["webpackJsonp"]
                        //仅对object.left进行值判断，right只进行类型判断，应该足够了。
                        if (
                            t.isAssignmentExpression(object) &&
                            t.isMemberExpression(object.left) &&
                            t.isLogicalExpression(object.right)
                        ) {
                            let me = object.left
                            if (
                                t.isIdentifier(me.object, { name: "global" }) &&
                                (t.isIdentifier(me.property, { name: "webpackJsonp" }) || t.isStringLiteral(me.property, { value: "webpackJsonp" })
                                )
                            ) {
                                type = "Webpack"
                                path.stop()
                            }
                        } else if (t.isIdentifier(property, { name: "VantComponent" })) {
                            type = "VantComponent"
                            path.stop()
                        }
                    }
                } else if (t.isAssignmentExpression(exp)) {
                    const right = exp.node.right
                    if (t.isCallExpression(right)) {
                        let name = right.callee.name
                        if (astTypeList[name]) {
                            type = name
                            path.stop() //完全停止遍历，目前还没有遇到什么奇葩情况~
                        }
                    }
                }
            }
        },
        ExportNamedDeclaration (path) {
            const declaration = path.node.declaration
            if (t.isVariableDeclaration(declaration)) {
                const variableDeclarator = declaration.declarations[0]
                const init = variableDeclarator.init
                if (t.isCallExpression(init) && init.callee.name === "Behavior") {
                    type = "Behavior"
                    path.stop() //完全停止遍历，目前还没有遇到什么奇葩情况~
                }
            }
        },
        ReturnStatement (path) {
            /**
             * 判断这种形式的代码：
             * export const transition = function (showDefaultValue) {
             *    return Behavior({})
             * }
             */
            const argument = path.node.argument
            if (t.isCallExpression(argument)) {
                let name = argument.callee.name
                if (name === "Behavior") {
                    type = "Behavior2"
                    path.stop() //完全停止遍历，目前还没有遇到什么奇葩情况~
                }
            }
        }, CallExpression (path) {
            //托底判断一下t.globalData.requirejs("jquery"), Page({});这种情况
            if (t.isIdentifier(path.node.callee)) {
                let name = path.node.callee.name
                if (astTypeList[name]) {
                    type = name
                    path.stop() //完全停止遍历，目前还没有遇到什么奇葩情况~
                }
            }
        }
    })
    // utils.log("文件类型: [ " + type + " ]       路径: " + _file_js);
    return type
}

/**
 * 遍历path下面的所有的MemberExpression，然后处理getApp()语法
 * @param {*} path
 */
function getAppFunHandle (path) {
    traverse(path.node, {
        noScope: true,
        MemberExpression (path) {
            globalDataHandle(path)
        }
    })
}

/**
 * 判断是否为vue文件，小程序项目里，有可能会有含vue语法的文件，如https://github.com/dmego/together/
 * @param {*} ast
 */
function checkVueFile (ast) {
    let isVueFile = false
    if (ast && ast.program && ast.program.body) {
        const body = ast.program.body
        for (const key in body) {
            const obj = body[key]
            if (t.isExportDefaultDeclaration(obj)) {
                isVueFile = true
            }
        }
    }
    return isVueFile
}

/**
 * 将ast属性数组组合为ast对象
 * @param {*} pathAry
 */
function arrayToObject (pathAry) {
    return t.objectExpression(pathAry)
}


/**
 * 根据name创建一个空的objectProperty，retrun name:{}
 * @param {*} name
 */
function createObjectProperty (name) {
    return t.objectProperty(t.identifier(name), t.objectExpression([]))
}

///////////////////////////////////////////////////////////////////////////////////////////

/**
 * 调整ast里指定变量或函数名引用的指向(已弃用)
 * @param {*} ast
 * @param {*} keyList  变量或函数名列表对象
 */
function repairValueAndFunctionLink (ast, keyList) {
    traverse(ast, {

        MemberExpression (path) {
            //this.uploadAnalysis = false --> this.$options.globalData.uploadAnalysis = false;
            //this.clearStorage() --> this.$options.globalData.clearStorage();
            const object = path.node.object
            const property = path.node.property
            const propertyName = property.name
            if (keyList.hasOwnProperty(propertyName)) {
                if (isThisExpressionPlus(object)) {
                    let subMe = t.MemberExpression(
                        t.MemberExpression(object, t.identifier("$options")),
                        t.identifier("globalData")
                    )
                    let me = t.MemberExpression(subMe, property)
                    path.replaceWith(me)
                    path.skip()
                }
            }
        }
    })
}

/**
 * 修复app.js函数和变量的引用关系(已弃用)
 * 1.this.uploadAnalysis = false --> this.$options.globalData.uploadAnalysis = false;
 * 2.this.clearStorage() --> this.$options.globalData.clearStorage();
 * @param {*} vistors
 */
function repairAppFunctionLink (vistors) {
    //当为app.js时，不为空；globalData下面的key列表，用于去各种函数里替换语法
    let globalDataKeyList = {}
    const liftCycleArr = vistors.lifeCycle.getData()
    const methodsArr = vistors.methods.getData()

    //获取globalData中所有的一级字段
    for (let item of liftCycleArr) {
        let name = item.key.name
        if (name == "globalData") {
            if (t.isObjectProperty(item)) {
                const properties = item.value.properties
                for (const op of properties) {
                    const opName = op.key.name
                    globalDataKeyList[opName] = opName
                }
            }
        }
    }

    //进行替换生命周期里的函数
    for (let item of liftCycleArr) {
        let name = item.key.name
        if (name !== "globalData")
            repairValueAndFunctionLink(item, globalDataKeyList)
    }

    //进行替换methods下面的函数, app.js已经不存在methods了
    // for (let item of methodsArr) {
    // 	let name = item.key.name;
    // 	repairValueAndFunctionLink(item, globalDataKeyList);
    // }
}

/**
 * 处理this.setData(已弃用)
 * @param {*} path
 * @param {*} isThis 区分前缀是this，还是that
 */
function handleSetData (path, isThis) {
    let parent = path.parent
    let nodeArr = []
    if (parent.arguments) {
        parent.arguments.forEach(function (obj) {
            if (obj.properties) {
                obj.properties.forEach(function (item) {
                    let left = item.key
                    //有可能key是字符串形式的
                    if (t.isStringLiteral(left)) left = t.identifier(left.value)
                    //
                    let node = null
                    if (isThis) {
                        node = t.expressionStatement(
                            buildAssignmentWidthThis(left, item.value)
                        )
                    } else {
                        let object = path.get("object")
                        node = t.expressionStatement(
                            buildAssignmentWidthThat(left, item.value, object.node.name)
                        )
                    }

                    nodeArr.push(node)
                })
            }
        })
        if (nodeArr.length > 0) {
            //将this.setData({})进行替换
            //!!!!!!!!这里找父级使用递归查找，有可能path的上一级会是CallExpression!!!!!
            parent = path.findParent(parent => parent.isExpressionStatement())
            if (parent) {
                parent.replaceWithMultiple(nodeArr)
            } else {
                utils.log(`异常-->代码为：${ generate(path.node).code }`)
            }
        }
    }
}

/**
 * 处理require()里的路径
 * @param {*} path      CallExpression类型的path，未做校验
 * @param {*} fileDir   当前文件所在目录
 */
function requirePathHandle (path, fileDir) {
    let callee = path.node.callee
    if (t.isIdentifier(callee, { name: "require" })) {
        //处理require()路径
        let arguments = path.node.arguments
        if (arguments && arguments.length) {
            if (t.isStringLiteral(arguments[0])) {
                let filePath = arguments[0].value

                //如果没有扩展名，默认加上.js，因为uni-app里，没加后缀名的表示不认识……
                let extname = nodePath.extname(filePath)
                if (!extname) filePath += ".js"

                //修复路径
                filePath = pathUtil.relativePath(
                    filePath,
                    global.miniprogramRoot,
                    fileDir
                )
                path.node.arguments[0] = t.stringLiteral(filePath)
            }
        }
    }
}

/**
 * 判断object是否为this或this的别名，如_this、that、self等
 * @param {*} path          当前object所在的path，可能是MeberexPression对象
 * @param {*} object        一般是MeberexPression对象的object
 */
function isThisExpressionPlus (path, object) {
    if (t.isThisExpression(object)) {
        return true
    }

    let name = object.node.name

    //判断t.data.xxx里的t是否为 this的别名，即var t = this;
    var isThisExpScope = false
    if (name && path.scope) {
        var scopePath = path.scope.getBinding(name)
        if (scopePath && t.isVariableDeclarator(scopePath.path.node) && t.isThisExpression(scopePath.path.node.init)) {
            isThisExpScope = true
        }
    }

    //理论上应该只判断scope就行了嘛，为啥还要判断名字呢？
    //对了，有可能这个this是从别的地方作为参数传进来的。
    return (
        isThisExpScope ||
        t.isIdentifier(object.node, { name: "that" }) ||
        t.isIdentifier(object.node, { name: "_this" }) ||
        t.isIdentifier(object.node, { name: "self" })
    )
}

/**
 * 替换ast里指定关键字(如wx或qq)为uni
 * @param {*} ast
 */
function renameToUni (ast, name = 'wx') {
    traverse(ast, {
        Program (path) {
            if (Array.isArray(name)) {
                name.forEach((n) => {
                    // path.scope.rename(n, 'uni')
                    renameKeyword(path, n)
                })
            } else {
                // path.scope.rename(name, 'uni')
                renameKeyword(path, name)
            }
        },
        VariableDeclarator (path) {
            if (
                t.isStringLiteral(path.node.init, {
                    value: 'replace-tag-375890534@qq.com',
                })
            ) {
                path.remove()
                path.stop()
            }
        },
    })
}

/**
 * 关键字重命名
 * 忽略微信小程序云函数的转换(wx.cloud.xxx)
 * @param {*} path
 * @param {*} name
 */
function renameKeyword (path, name) {
    // 获取当前变量名的绑定关系
    const currentBinding = path.scope.getBinding(name)
    currentBinding.referencePaths.forEach(function (p) {
        if (t.isMemberExpression(p.parentPath.node)) {
            var meExp = p.parentPath.node
            var object = meExp.object
            var property = meExp.property
            if (t.isIdentifier(object, { name: name }) && t.isIdentifier(property, { name: "cloud" })) {
            } else {
                //wx.xxx替换为uni.xxx;
                object.name = "uni"
            }
        }
    })
}


/**
 * 清理ast
 */
const cleanVisitor = {
    CallExpression (path) {
        let callee = path.get("callee")
        let args = path.get("arguments")

        let object = callee.get("object")
        let property = callee.get("property")

        if (t.isMemberExpression(callee)) {
            if (t.isIdentifier(object.node, { name: "Object" }) &&
                t.isIdentifier(property.node, { name: "defineProperty" }) &&
                args.length === 3 &&
                t.isStringLiteral(args[1].node, { value: "__esModule" })
            ) {
                //remove "Object.defineProperty(e, "__esModule", {value: !0}),"
                path.remove()
            } else if (t.isIdentifier(object.node, { name: "require" }) &&
                t.isIdentifier(property.node, { name: "r" }) &&
                args.length === 1 &&
                t.isIdentifier(args[0].node, { name: "exports" })) {
                //remove "require.r(exports),"
                path.remove()
            }
        }
        path.skip()
    },
    AssignmentExpression (path) {
        let left = path.get("left")
        let right = path.get("right")
        if (t.isMemberExpression(left) && t.isUnaryExpression(right)) {
            let obj = left.get("object")
            let property = left.get("property")
            let arg = right.get("argument")
            if (t.isIdentifier(obj.node, { name: "exports" }) && t.isIdentifier(property.node, { name: "default" }) && t.isNumericLiteral(arg.node, { value: 0 })) {
                //remove exports.default = void 0
                path.remove()
            }
        }
    }
}



/**
 * 非Page、Component或App里的require的路径修复
 * //放在非 CallExpression 下面使用
 * @param {*} path
 * @param {*} fileDir
 */
function otherRequirePathHandle (path, fileDir) {
    path.traverse({
        CallExpression (path2) {
            let callee = path2.get("callee")
            let property = path2.get("property")
            if (t.isIdentifier(callee.node, { name: "require" })) {
                //var t = require("amap-wx.js");
                requirePathHandle(path2, fileDir)

                let arguments = path2.node.arguments
                if (arguments && arguments.length) {
                    if (t.isStringLiteral(arguments[0])) {
                        let filePath = arguments[0].value

                        if (filePath.indexOf("/wxParse/") > -1) {
                            // babelUtil.addComment(path.parentPath, `${generate(path.node).code}`);  //没法改成注释，只能删除
                            try {
                                path.remove()  //这里居然会报错：报cannot read property buildError of undefined
                            } catch (err) {
                                console.log("-------err ", err)
                            }
                        } else {
                            filePath = pathUtil.relativePath(
                                filePath,
                                global.miniprogramRoot,
                                fileDir
                            )
                            path2.node.arguments[0] = t.stringLiteral(filePath)
                        }
                    }
                }
            }
        },
        NewExpression (path) {
            getAppHandleByNewExpression(path)
        },
        VariableDeclarator (path2) {
            getAppHandleByVariableDeclarator(path2)

            if (t.isCallExpression(path2.node && path2.node.init)) {
                //处理外部声明的require，如var md5 = require("md5.js");
                const initPath = path2.node.init
                let callee = initPath.callee

                if (t.isIdentifier(callee, { name: "require" })) {
                    let arguments = initPath.arguments
                    const wxParseReg = /\bwxParse\b/i
                    if (arguments && arguments.length) {
                        if (t.isStringLiteral(arguments[0])) {
                            let filePath = arguments[0].value
                            if (wxParseReg.test(filePath)) {
                                //删除var a = require("../js/wxParse.js");
                                path2.remove()
                            } else {
                                filePath = pathUtil.relativePath(
                                    filePath,
                                    global.miniprogramRoot,
                                    fileDir
                                )
                                initPath.arguments[0] = t.stringLiteral(filePath)
                            }
                        }
                    }
                }
                //删除var wxParse = require("../../../wxParse/wxParse.js");
                if (
                    path2.node &&
                    path2.node.id &&
                    path2.node.id.name &&
                    path2.node.id.name.toLowerCase() === "wxparse"
                ) {
                    // babelUtil.addComment(path.parentPath, `${generate(path.node).code}`);  //没法改成注释，只能删除
                    try {
                        path2.remove()  //这里居然会报错：报cannot read property buildError of undefined
                    } catch (err) {
                        console.log("-------err ", err)
                    }
                }
            }
        }
    })
}


/**
 * 三元表达式转if表达式，支持递归，无限嵌套
 * @param {*} path
 */
function conditionalExpToIfStatement (ast) {
    traverse(ast, {
        noScope: true,
        ExpressionStatement (path) {
            let exp = path.node.expression
            if (exp && t.isConditionalExpression(exp)) {
                //三元表达式转if表达式
                if (t.isConditionalExpression(exp.consequent)) {
                    conditionalExpToIfStatement(exp.consequent)
                }
                //组装if
                let consequentBlockStatement = t.blockStatement([t.expressionStatement(exp.consequent)], [])
                let alternateBlockStatement = t.blockStatement([t.expressionStatement(exp.alternate)], [])
                let ifStatement = t.ifStatement(exp.test, consequentBlockStatement, alternateBlockStatement)
                path.replaceWith(ifStatement)
            }
        },
        AssignmentExpression (path) {
            //TODO
            let left = path.node.left
            let right = path.node.right
            let operator = path.node.operator

            if (t.isConditionalExpression(right)) {
                let test = right.test
                let consequent = right.consequent
                let alternate = right.alternate

                var consequentAssignmentExp = t.assignmentExpression(operator, left, consequent)
                var alternateAssignmentExp = t.assignmentExpression(operator, left, alternate)

                let consequentBlockStatement = t.blockStatement([t.expressionStatement(consequentAssignmentExp)], [])
                let alternateBlockStatement = t.blockStatement([t.expressionStatement(alternateAssignmentExp)], [])
                let ifStatement = t.ifStatement(test, consequentBlockStatement, alternateBlockStatement)

                // console.log(`代码为：${ generate(ifStatement).code }`)
                path.replaceWith(ifStatement)
            }
        },
    })
}





/**
 * js修复
 *
 * 一行代码转多行代码 (还原http://lisperator.net/uglifyjs/压缩代码)
 * 1.用逗号连起来的：a = 5, this.fun1(), this.fun2();
 * 2.使用&&进行判断：a && a = 5, b = 6;
 * 3.if (1 == a.is_open_sku) o=4; else o=5; 改成多行展示
 * 4.for (var e = t.data.result.list, a = 0; a < e.length; a++) o.data.kino_list.push(e[a]); 改多行
 *
 * //逻辑变量展开
 * !0 ==> true;  !1 ==> false
 *
 * //十六进制转10进制
 * 3e8 ==> 1000
 *
 * success和fail回调函数的参数语义化(嵌套时有问题)
 * success ==> res; fail ==> err
 *
 *
 * if("" != r && void 0 != r){} ==> if(r){}
 *
 * getCurrentPages()处理
 * @param {*} path
 */
function repairJavascript (ast) {
    traverse(ast, {
        ExpressionStatement (path) {
            var exp = path.node.expression
            if (exp) {
                //判断是否为多行
                if (t.isSequenceExpression(exp)) {
                    //示例代码：a = 5, this.fun1(), this.fun2();
                    var expressions = exp.expressions
                    expressions.forEach(function (callExp) {
                        //组装ExpressionStatement
                        var newExp = t.expressionStatement(callExp)
                        //往前插，如果使用insertAfter会变成倒序
                        path.insertBefore(newExp)
                    })
                    path.remove()
                } else if (t.isLogicalExpression(exp)) {
                    var operator = exp.operator
                    if (operator === "&&") {
                        //示例代码：a === 0 && this.a = 5;
                        var consequentBlockStatement = exp.left
                        var alternateBlockStatement = t.blockStatement([t.expressionStatement(exp.right)], [])
                        var ifStatement = t.ifStatement(consequentBlockStatement, alternateBlockStatement)
                        path.replaceWith(ifStatement)
                    } else if (operator === "||") {
                        // 转换前： "" == str || /\d/.test(num) || console.log();
                        // 转换后： if(!("" == str || /\d/.test(num))) console.log();
                        // 判断条件需取反
                        var unaryExpression = t.unaryExpression("!", exp.left)
                        var alternateBlockStatement = t.blockStatement([t.expressionStatement(exp.right)], [])
                        var ifStatement = t.ifStatement(unaryExpression, alternateBlockStatement)
                        path.replaceWith(ifStatement)
                    }
                }
            }
        },

        //一行声明拆成多行声明
        VariableDeclaration (path) {
            var declarations = path.get("declarations")
            const parentPath = path.parentPath

            //跳过for里面的var
            //如：for (var e = t.data.result.list, a = 0; a < e.length; a++)
            if (t.isForStatement(parentPath)) return

            if (declarations.length > 1) {
                declarations.forEach(function (subPath) {
                    let varDec = t.variableDeclaration(path.node.kind || "let", [subPath.node])
                    path.insertBefore(varDec)
                })
                path.remove()
            }
        },

        UnaryExpression (path) {
            const { operator, argument } = path.node
            if (operator === "!" && t.isNumericLiteral(argument)) {
                var value = argument.value
                if (value === 1 || value === 0) {
                    path.replaceWith(t.booleanLiteral(value === 0))
                }
            }
        },
        NumericLiteral ({ node }) {
            // 1e3 --> 1000
            if (node.extra && node.extra.raw !== "" + node.extra.rawValue) {
                node.extra = undefined
            }
        },
        StringLiteral ({ node }) {
            if (node.extra && /\\[ux]/gi.test(node.extra.raw)) {
                node.extra = undefined
            }
        },
        ObjectProperty (path) {

            //嵌套函数，会有bug，都是重名的。
            // let key = path.get("key")
            // let value = path.get("value")
            // let name = ""
            // if (t.isIdentifier(key)) {
            //     name = key.node.name
            // } else if (t.isStringLiteral(key)) {
            //     name = key.node.value
            // }

            // if (t.isFunctionExpression(value)) {
            //     if (name === "success") {
            //         renameFunctionFirstParam(value, "res")
            //     } else if (name === "fail") {
            //         renameFunctionFirstParam(value, "err")
            //     }
            // }
        },
        CallExpression (path) {
            let callee = path.get("callee")
            let arguments = path.get("arguments")
            if (arguments.length === 1 && t.isMemberExpression(callee)) {
                let object = callee.object
                let property = callee.node.property
                if (t.isIdentifier(property, { name: "setData" }) && t.isMemberExpression(arguments[0])) {
                    let subPath = arguments[0]
                    let subObject = subPath.get("object")
                    let subProperty = subPath.get("property")
                    if (isThisExpressionPlus(path, subObject) && t.isIdentifier(subProperty.node, { name: "data" })) {
                        //处理 this.setData(this.data); 这种情况
                        //ps：因为是解析js后处理的，所以this.data还未处理
                        path.remove()
                    }
                }
            }
        },
        MemberExpression (path) {
            // before:
            // var pages = getCurrentPages();
            // var prevPage = pages[pages.length - 1];

            // after:
            // var pages = getCurrentPages();
            // var prevPage = pages[pages.length - 1].$vm;

            //经测试，增加$vm，可以通用于app、H5、微信小程序、支付宝小程序，其他未测
            //而无$vm时，只有H5 ok


            //搜集了这三种写法
            // 写法一：
            // var pages = getCurrentPages()
            // var prevPage = pages[pages.length - 1];
            // prevPage.setData() //不行

            // 写法二：
            // if (1 == n) l.Page.stat(t);
            // else {
            //     var e = getCurrentPages()[getCurrentPages().length - 1];
            //     e.onShow && (a = e.onShow, e.onShow = function() {
            //         l.Page.stat(t), a.call(this, arguments);
            //     });
            // }

            //写法三:
            // var o = getCurrentPages().pop();
            // o.setData({
            //     warrant: !0
            // });


            let object = path.get("object")
            let property = path.get("property")
            if (t.isIdentifier(object)) {
                let objectName = object.node.name
                var scopePath = path.scope.getBinding(objectName)
                if (scopePath && t.isVariableDeclarator(scopePath.path.node)) {
                    let init = scopePath.path.node.init
                    if (t.isCallExpression(init) && init.callee.name === "getCurrentPages") {
                        //写法一
                        let meExp = t.memberExpression(path.node, t.identifier("$vm"))
                        path.replaceWith(meExp)
                        path.skip()
                    }
                }
            } else if (t.isCallExpression(object)) {
                let callee = object.node.callee
                if (t.isIdentifier(callee, { name: "getCurrentPages" })) {
                    if (t.isBinaryExpression(property)) {
                        //写法二
                        let meExp = t.memberExpression(path.node, t.identifier("$vm"))
                        path.replaceWith(meExp)
                        path.skip()
                    } else if (t.isIdentifier(property.node, { name: "pop" })) {
                        //写法三
                        let meExp = t.memberExpression(t.callExpression(path.node, []), t.identifier("$vm"))
                        path.replaceWith(meExp)
                        path.skip()
                    }
                }
            }
        },
        IfStatement (path) {
            //if (1 == a.is_open_sku) o=4; else o=5; 改成多行展示

            var consequent = path.node.consequent
            var alternate = path.node.alternate

            if (alternate) {
                if (!t.isBlockStatement(consequent)) {
                    path.node.consequent = t.blockStatement([consequent])
                }

                if (!t.isBlockStatement(alternate)) {
                    path.node.alternate = t.blockStatement([alternate])
                }
            } else {
                //没有else
                if (!t.isBlockStatement(consequent)) {
                    path.node.consequent = t.blockStatement([consequent])
                }
            }
        },
        ForStatement (path) {
            //for (var e = t.data.result.list, a = 0; a < e.length; a++) o.data.kino_list.push(e[a]);
            //转换为：
            //for (var e = t.data.result.list, a = 0; a < e.length; a++) { that.kino_list.push(e[a]);  }
            const body = path.node.body
            if (!t.isBlockStatement(body)) {
                path.node.body = t.blockStatement([body])
            }
        },
        LogicalExpression (path) {
            let parentPath = path.parentPath
            if (t.isIfStatement(parentPath)) {
                let left = path.node.left
                let right = path.node.right
                if (t.isBinaryExpression(left) && t.isBinaryExpression(right)) {

                    /**
                     *
                     *  if ("" != r && void 0 != r) { }
                     *  替换为：
                     *  if (r) {
                     *
                     */
                    //
                    let leftSubLeft = left.left
                    let leftSubRight = left.right
                    let leftOperator = left.operator
                    //
                    let rightSubLeft = right.left
                    let rightSubRight = right.right
                    let rightOperator = right.operator

                    var bool1 = leftOperator === rightOperator

                    let bool2 = t.isIdentifier(leftSubRight)
                        && t.isIdentifier(rightSubRight)
                        && leftSubRight.name === rightSubRight.name


                    let bool3 = t.isStringLiteral(leftSubLeft, { value: "" }) &&
                        t.isUnaryExpression(rightSubLeft) &&
                        t.isNumericLiteral(rightSubLeft.argument, { value: 0 })

                    if (bool1 && bool2 && bool3) {
                        path.replaceWith(t.identifier(leftSubRight.name))
                    }
                }
            }
        },
        ReturnStatement (path) {
            let argument = path.node.argument
            if (t.isSequenceExpression(argument)) {
                let expressions = argument.expressions

                /**
                 * return a = 1, b = 2, c = 3, false;
                 *
                 * 转换为：
                 *
                 * a = 1;
                 * b = 2;
                 * c = 3;
                 * return false;
                 *
                 */


                // 注：
                // 1. 数据倒序遍历，并且是从倒数第 2 个开始！
                // 2. 暂未知这种情况是否可以优雅点用js数组操作方法？
                for (let i = expressions.length - 2;i >= 0;i--) {
                    const subPath = expressions[i]
                    let exp = t.expressionStatement(subPath)
                    path.insertBefore(exp)
                    expressions.splice(i, 1)
                }
            }
        }
    })
}



/**
 * 重名FunctionExpression第一个参数为newName
 * //前提，第一个参数仅为单个字符
 * @param {*} path
 * @param {*} newName
 */
function renameFunctionFirstParam (path, newName) {
    if (!t.isFunctionExpression(path)) return

    let params = path.get("params")
    if (params.length === 0) return

    var firstParam = params[0]
    if (t.isIdentifier(firstParam) && firstParam.node.name.length === 1) {
        path.scope.rename(firstParam.node.name, newName)
    }
}


/**
 *
 *  用于有函数里面调用onLoad刷新页面的情况，因为uniapp里面不能直接调用onLoad刷新的，
 *  因此为onload做了一个副本，将所有调用onLoad的地方都指向副本
 *
 * @param {*} onLoadFunPath
 */
function onLoadFunCloneHandle (ast, onLoadFunPath, vistors, fileKey) {
    traverse(ast, {
        MemberExpression (path) {
            let object = path.get("object")
            let property = path.get("property")

            if (isThisExpressionPlus(path, object)) {
                if (t.isIdentifier(property.node, { name: "onLoad" })) {
                    //this.onLoad() --> this.refreshPage3389()

                    var newFunName = "refreshPage3389"
                    property.node.name = newFunName

                    var clonePath = clone(onLoadFunPath)
                    clonePath.key.name = newFunName

                    //this.onLoad() ==> this.refreshPage3389({})
                    var parentPath = path.findParent(parent => parent.isCallExpression())
                    if (parentPath) {
                        let args = parentPath.node.arguments
                        if (args && args.length === 0) {
                            //增加一个空对象进去，不然会报错
                            var objExp = t.objectExpression([])
                            args.push(objExp)
                        }
                    }

                    if (!vistors.methods.check(newFunName)) {
                        vistors.methods.handle(clonePath)

                        /**
                         *   // 转换前
                         *   onLoad:function(a){
                         *   //do something
                         *   ……
                         *   },
                         *
                         *   // 转换后
                         *   onLoad:function(a){
                         *      this.refreshPage3389(a);
                         *   },
                         *   methods:(
                         *       refreshPage3389: function (a) {
                         *           //do something
                         *           ……
                         *      }
                         *   )
                         */
                        if (t.isObjectProperty(onLoadFunPath)) {

                            console.log("fileKey", fileKey)
                            //onLoad:function(a){}
                            var args = clone(onLoadFunPath.value.params)

                            // 处理这种情况
                            // onLoad: function(options = {}){}
                            args.forEach(function (obj, i) {
                                if (t.isAssignmentPattern(obj)) {
                                    args[i] = obj.left
                                }
                            })
                            var me = t.memberExpression(t.thisExpression(), t.identifier(newFunName))
                            var callExp = t.callExpression(me, args)
                            var expStatement = t.expressionStatement(callExp)
                            var blockStatement = t.blockStatement([expStatement])
                            var funExp = t.functionExpression(null, args, blockStatement)
                            onLoadFunPath.value = funExp
                        } else if (t.isObjectMethod(onLoadFunPath)) {
                            //onLoad(a){}
                            var args = onLoadFunPath.params
                            var me = t.memberExpression(t.thisExpression(), t.identifier(newFunName))
                            var callExp = t.callExpression(me, args)
                            var expStatement = t.expressionStatement(callExp)
                            var blockStatement = t.blockStatement([expStatement])
                            onLoadFunPath.body = blockStatement
                        }

                    }
                }
            }
        }
    })
}

/**
 * fix(transformer): babel-generator 把中文字符生成为 unicode
 * https://github.com/NervJS/taro/commit/9bbb39972b404f5b06164414cdcce53d5016a158
 * @param {*} s
 * @returns
 */
function decodeUnicode (s) {
    return unescape(s.replace(/\\(u[0-9a-fA-F]{4})/gm, '%$1'))
}

/**
 * generate增强版，防止中文转换为转义符
 */
function generateExt (pathNode) {
    return decodeUnicode(generate(pathNode, { retainFunctionParens: true }).code)
}

async function jsAstToString (jsData) {
    var codeText = ""

    if (!jsData) return ""

    if (jsData.onlyJSFile || !jsData.ast) {
        codeText = jsData.codeText
    } else {
        var convertedJavascript = jsData.ast
        var file_js = jsData.file_js
        var astType = jsData.astType
        var importList = jsData.importList

        let declareStr = jsData.declareNodeList.reduce((preValue, currentValue) => {
            //添加参数retainFunctionParens，以便解析代码：(function (t) { })()，默认会输出function(t){ }()，这是不对的。
            return preValue + `${ generateExt(currentValue.node) }\r\n`
        }, "")

        importList.forEach(function (node) {
            declareStr += `${ generateExt(node) }\r\n`
        })

        if (astType === "Behavior" || astType === "Behavior2") {
            codeText = `${ declareStr }\r\n${ generateExt(convertedJavascript) }`
        } else {
            codeText = `<script>\r\n${ declareStr }\r\n${ generateExt(convertedJavascript)
                }\r\n</script>\r\n`
        }

        if (astType === "Webpack") {
            //compiled page handle  SSS
            if (compiledProjectHandle) {
                var pFolderName = pathUtil.getParentFolderName(file_js)
                if (pFolderName === "common") {
                    if (fileKey === 'common/vendor') {
                        newFile = file_js.replace("vendor.js", "main.js")
                        fileData = fs.readFileSync(newFile, 'utf8')
                    } else if (fileKey === 'common/main') {
                        newFile = file_js.replace("main.js", "vendor.js")
                        fileData = fs.readFileSync(newFile, 'utf8')
                    }
                }
                codeText = await compiledProjectHandle.jsHandle(fileData, newFile)
                codeText = `<script>\r\n${ codeText }\r\n</script>\r\n`
            } else {
                codeText = `<script>\r\n${ fileData }\r\n</script>\r\n`;;
            }
        }
    }

    return codeText
}



/**
 * 处理js文件里面所有的符合条件的资源路径
 * @param {*} ast
 * @param {*} file_js
 */
function handleJSImage (ast, file_js) {
    traverse(ast, {

        StringLiteral (path) {
            let reg = /\.(jpg|jpeg|gif|svg|png)$/ //test时不能加/g

            //image标签，处理src路径
            var src = path.node.value

            //这里取巧一下，如果路径不是以/开头，那么就在前面加上./
            if (!/^\//.test(src)) {
                src = "./" + src
            }

            //忽略网络素材地址，不然会转换出错
            if (src && !utils.isURL(src) && reg.test(src)) {
                //static路径
                let staticPath = nodePath.join(global.miniprogramRoot, "static")

                //当前处理文件所在目录
                let jsFolder = nodePath.dirname(file_js)
                var pFolderName = pathUtil.getParentFolderName(src)
                var fileName = nodePath.basename(src)

                let filePath = nodePath.resolve(
                    staticPath,
                    "./" + pFolderName + "/" + fileName
                )
                let newImagePath = nodePath.relative(jsFolder, filePath)

                path.node = t.stringLiteral(newImagePath)
                // utils.log("newImagePath ", newImagePath);
            }
        }
    })
}


/**
 * 获取path的类型
 * @param {*} path
 * @returns
 */
function getPathType (path) {
    var type = ""

    switch (true) {
        case t.isNumericLiteral(path):
            type = "Number"
            break
        case t.isBooleanLiteral(path):
            type = "Boolean"
            break
        case t.isStringLiteral(path):
            type = "String"
            break
        case t.isArrayExpression(path):
            type = "Array"
            break
        case t.isObjectExpression(path):
            type = "Object"
            break
    }
    return type
}


/**
 * 获取ObjectProperty或ObjectMethod的key的name，支持获取{a:1; "b":1}这两种
 * @param {*} path
 */
function getKeyNameByObject (path) {
    var name = ""
    if (t.isObjectProperty(path) || t.isObjectMethod(path)) {
        var pathNode = path.node ? path.node : path
        var keyNode = pathNode.key
        if (t.isIdentifier(keyNode)) {
            name = keyNode.name
        } else if (t.isStringLiteral(keyNode)) {
            name = keyNode.value
        }
    }
    return name
}

/**
 * 修复前预操作 必须先执行，否则可能修改不完全!!!
 * //this声明合并，that重命名
 * //只针对作用域里第一级
 * @param {*} ast
 */
function repairThisExpression (ast) {
    traverse(ast, {
        FunctionExpression (path) {
            var list = path.get("body.body")
            var hasThis = false
            list.forEach(function (subPath) {
                if (t.isVariableDeclaration(subPath)) {
                    var declarations = subPath.node.declarations
                    if (declarations.length) {
                        //修改定义里面的变量
                        declarations.forEach(function (varPath, index) {
                            let id = varPath.id
                            let init = varPath.init
                            if (t.isThisExpression(init) && t.isIdentifier(id)) {
                                //重名为that
                                path.scope.rename(id.name, "that")

                                if (hasThis) {
                                    //合并this声明
                                    if (declarations.length > 1) {
                                        declarations.splice(index, 1)
                                    } else {
                                        subPath.remove()
                                    }
                                } else {
                                    hasThis = true
                                }
                            }
                        })
                    }
                }
            })
        },
    })
}

/**
 * this变量名语义化
 * @param {*} ast
 */
function renameThisName (ast) {
    traverse(ast, {
        VariableDeclarator (path) {
            //fix
            // var n = this; --> var that = this;
            //新增，将所有this的别名，统一修改成that
            let id = path.get("id")
            let init = path.get("init")
            if (t.isThisExpression(init) && t.isIdentifier(id)) {
                let hasBindThis = path.scope.getBinding("that")
                if (!hasBindThis && id.node.name.length === 1) {
                    path.scope.rename(id.node.name, "that")
                }
            }
        }
    })
}


/**
 * ast 反混淆
 * @param {*} ast
 */
function astAntiAliasing (ast) {
    //空语句
    // EmptyStatement(path)    {        path.remove();    }

    //修复前预操作, 必须先处理（先于repairJavascript），否则可能会漏掉！！！！
    repairThisExpression(ast)

    //然后再：
    //js 修复
    repairJavascript(ast)

    //this变量语义化
    renameThisName(ast)

    //后
    //三元表达式转if表达式
    conditionalExpToIfStatement(ast)

    //三元表达式转if表达式（针对：r = a ? 2 == d ? "1111" : "2222"  : "3333"; 需再次遍历，暂无更好办法）
    conditionalExpToIfStatement(ast)
}


module.exports = {
    lifeCycleFunction,
    globalDataHandle,
    addComment,
    getAstType,
    getAppFunHandle,

    checkVueFile,
    arrayToObject,
    createObjectProperty,
    requirePathHandle,
    isThisExpressionPlus,
    renameToUni,
    cleanVisitor,


    getAppHandleByAst,
    getAppHandleByVariableDeclarator,
    getAppHandleByNewExpression,

    otherRequirePathHandle,

    conditionalExpToIfStatement,

    repairJavascript,

    onLoadFunCloneHandle,


    jsAstToString,

    handleJSImage,

    getPathType,

    getKeyNameByObject,

    renameThisName,

    astAntiAliasing,

}
