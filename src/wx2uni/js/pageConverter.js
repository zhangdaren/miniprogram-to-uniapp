const t = require("@babel/types")
const nodePath = require("path")
const generate = require("@babel/generator").default
const traverse = require("@babel/traverse").default
const Vistor = require("./Vistor")
const clone = require("clone")
const utils = require("../../utils/utils.js")
const pathUtil = require("../../utils/pathUtil")
const babelUtil = require("../../utils/babelUtil")
//
let vistors = {}

//外部定义的变量
let declareNodeList = []

//data对象
let dataValue = {}

//computed对象
let computedValue = {}

//wacth对象
let watchValue = {}

//当前处理的js文件路径
let file_js = ""

//当前文件所在目录
let fileDir = ""

//key
let fileKey = ""

/*
 * 注：为防止深层遍历，将直接路过子级遍历，所以使用enter进行全遍历时，孙级节点将跳过
 *
 */
const componentVistor = {
    IfStatement (path) {
        babelUtil.getAppFunHandle(path, fileKey)
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
                    declareNodeList.push(path);;

                    path.skip()
                }
                // } else if (t.isAssignmentExpression(path.node.expression)) {
            } else {
                //有可能app.js里是这种结构，exports.default = App({});
                //path.node 为AssignmentExpression类型，所以这里区分一下
                if (t.isFile(parent)) {
                    //定义的外部函数

                    declareNodeList.push(path);;
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
            // let extname = nodePath.extname(filePath);
            // if (extname == ".js") {
            //     filePath = nodePath.join(
            //         nodePath.dirname(filePath),
            //         pathUtil.getFileNameNoExt(filePath)
            //     ); //去掉扩展名
            // }

            filePath = pathUtil.relativePath(
                filePath,
                global.miniprogramRoot,
                fileDir
            )
            path.node.source.value = filePath

            // console.log("filePath------------------------", filePath)

            //定义的外部函数
            babelUtil.otherRequirePathHandle(path, fileDir)
            declareNodeList.push(path);;

            path.skip()
        }
    },
    VariableDeclaration (path) {
        const parent = path.parentPath.parent
        if (t.isFile(parent)) {

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
            babelUtil.getAppFunHandle(path, fileKey)

            //定义的外部函数
            babelUtil.otherRequirePathHandle(path, fileDir)
            declareNodeList.push(path)

            path.skip()
        }
    },
    CallExpression (path) {

        /**
         * 处理异常函数写法：
         * t(e, "checkAuth", function() {
         *        var t = this;
         *        wx.getSetting({
         *           success: function(e) {
         *               e.authSetting["scope.userInfo"] && "" != wx.getStorageSync("setInfo") || t.setData({
         *                   wxlogin: !0
         *               }), 0 != t.data.sendPacket && void 0 !== t.data.sendPacket && wx.navigateTo({
         *                   url: "/pages/send-packet/send-packet?id=" + t.data.sendPacket
         *               });
         *           }
         *       });
         *   })
         */
        var callExp = path.get("callee")
        var arguments = path.node.arguments
        var reg = /[a-z]/i
        if (reg.test(callExp.node.name) && arguments.length === 3) {
            var idExp = arguments[0]
            var stringLiteral = arguments[1]
            var exp = arguments[2]

            if (t.isIdentifier(idExp) && reg.test(idExp.name) &&
                t.isStringLiteral(stringLiteral)) {
                if (t.isFunctionExpression(exp)) {
                    var newFunExp = t.ObjectProperty(stringLiteral, exp)
                    vistors.methods.handle(newFunExp)
                    path.skip()
                } else {
                    //if (t.isObjectExpression(exp))  或其他类型a(t, "userinfo", null)
                    var newObjExp = t.ObjectProperty(stringLiteral, exp)
                    vistors.data.handle(newObjExp)
                    path.skip()
                }
            }
        }
    },
    ObjectMethod (path) {
        const parent = path.parentPath.parent
        const value = parent.value
        var name = ""
        var keyNode = path.node.key
        if (t.isIdentifier(keyNode)) {
            name = keyNode.name
        } else if (t.isStringLiteral(keyNode)) {
            name = keyNode.value
        }
        // utils.log("add methods： ", name);
        if (value == computedValue) {
            vistors.computed.handle(path.node)
        } else if (value == watchValue) {
            vistors.watch.handle(path.node)
        } else {
            if (value) {
                //async函数
                if (vistors.methods.check(name)) {
                    const logStr = `[Error] methods 里函数：${ name }() 有重复，请手动删除其中一个！     file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                    utils.log(logStr)
                    global.log.push(logStr)
                }
                vistors.methods.handle(path.node)
            } else {
                //这里function
                if (babelUtil.lifeCycleFunction[name]) {
                    //value为空的，可能是app.js里的生命周期函数
                    vistors.lifeCycle.handle(path.node)
                } else {
                    //类似这种函数 fun(){}
                    if (vistors.methods.check(name)) {
                        const logStr = `[Error] methods 里函数：${ name }() 有重复，请手动删除其中一个！     file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                        utils.log(logStr)
                        global.log.push(logStr)
                    }
                    vistors.methods.handle(path.node)
                }
            }
        }
        path.skip()
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

        var dataValueReg = /^\$/
        switch (name) {
            case "data":
                //只让第一个data进来，暂时不考虑其他奇葩情况
                if (JSON.stringify(dataValue) == "{}") {
                    //第一个data，存储起来
                    if (t.isSequenceExpression(path.node.value)) {
                        specialDataHandle(path)
                        path.skip()
                    } else {
                        dataValue = path.node.value
                    }
                } else {
                    //这里是data里面的data同名属性
                    // utils.log("add data", name);
                    if (vistors.data.check(name)) {
                        let logStr = `[Error] data 里变量：${ name } 有重复，请手动删除其中一个！     file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                        utils.log(logStr)
                        global.log.push(logStr)
                    }
                    if (dataValueReg.test(name)) {
                        let logStr = `[Error] data 里变量：${ name } 为$开头，与uniapp内部变量名冲突，请转换后手动重命名！     file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                        utils.log(logStr)
                        global.log.push(logStr)
                    }

                    vistors.data.handle(path.node)
                    path.skip()
                }
                break
            case "mixins":
                //mixins仍然放入生命周期
                vistors.lifeCycle.handle(path.node)
                break
            case "computed":
                //只让第一个computed进来，暂时不考虑其他奇葩情况
                if (JSON.stringify(computedValue) == "{}") {
                    //第一个computed，存储起来
                    computedValue = path.node.value
                }
                break
            case "watch":
                //只让第一个watch进来，暂时不考虑其他奇葩情况
                if (JSON.stringify(watchValue) == "{}") {
                    //第一个watch，存储起来
                    watchValue = path.node.value
                }
                break
            case "observers":
                //observers移入到watch
                var properties = path.node.value.properties
                if (properties) {
                    properties.forEach(function (item) {
                        vistors.watch.handle(item)
                    })
                }
                path.skip()
                break
            default:

                const parent = path.parentPath.parent
                const value = parent.value
                // utils.log("name", path.node.key.name)
                //如果父级不为data时，那么就加入生命周期，比如app.js下面的全局变量
                if (value && value == dataValue) {
                    if (vistors.data.check(name)) {
                        const logStr = `[Error] data 里变量：${ name } 有重复，请手动删除其中一个！     file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                        utils.log(logStr)
                        global.log.push(logStr)
                    }
                    vistors.data.handle(path.node)
                    //data下面的变量不再遍历
                    path.skip()
                } else {
                    const node = path.node.value
                    if (
                        t.isFunctionExpression(node) ||
                        t.isArrowFunctionExpression(node) ||
                        t.isObjectExpression(node) ||
                        t.isCallExpression(node)
                    ) {
                        //这里function
                        if (babelUtil.lifeCycleFunction[name]) {
                            // utils.log("add lifeCycle： ", name);
                            vistors.lifeCycle.handle(path.node)
                            //跳过生命周期下面的子级，不然会把里面的也给遍历出来
                        } else if (value == computedValue) {
                            vistors.computed.handle(path.node)
                        } else if (value == watchValue) {
                            vistors.watch.handle(path.node)
                        } else {
                            if (node.properties) {
                                //如果是对象，就放入data
                                if (vistors.data.check(name)) {
                                    const logStr = `[Error] data 里变量：${ name } 有重复，请手动删除其中一个！     file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                                    utils.log(logStr)
                                    global.log.push(logStr)
                                }
                                vistors.data.handle(path.node)
                            } else {
                                if (vistors.methods.check(path.node.key.name)) {
                                    const logStr = `[Error] methods 里函数：${ name }() 有重复，请手动删除其中一个！     file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                                    utils.log(logStr)
                                    global.log.push(logStr)
                                }

                                if (t.isFunctionExpression(path.node.value)) {
                                    //试运行：可能有未知异常
                                    //fix --> lookck: function name(params) {}
                                    path.node.value.id = null
                                }
                                vistors.methods.handle(path.node)
                            }
                        }
                        path.skip()
                    } else {
                        //这里判断一下，有些非常规写法，还真没什么好方法来区分，如下代码写法：
                        //下面不判断的话，list:e.result.data会被加入到data里，而报错
                        // Page((_defineProperty(_Page = {
                        // 	data: {
                        // 		edit_state: 0,
                        // 		select_all_state: !1
                        // 	},
                        // },_defineProperty(_Page, "onShow", function() {
                        // 	var t = this;
                        // 	http.post("apicloud/like_list", {}).then(function(e) {
                        // 		t.setData({
                        // 			list: e.result.data
                        // 		});
                        // 	});
                        // }),_Page));

                        if (t.isObjectProperty(path.node)) {
                            const value = path.node.value
                            // if (
                            //     value.object &&
                            //     t.isMemberExpression(value.object) &&
                            //     value.object.object.name != "e"
                            // ) {
                            if (vistors.data.check(name)) {
                                const logStr = `[Error] data 里变量：${ name } 有重复，请手动删除其中一个！     file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                                utils.log(logStr)
                                global.log.push(logStr)
                            }
                            vistors.data.handle(path.node)
                            // }

                            /**
                             * 将qqmapsdk和timer也放到data里（因此注释了上面的判断）
                             * Page({
                                    'data': {
                                    },
                                    qqmapsdk: null,
                                    timer: null,
                                });
                             */
                        } else {
                            if (vistors.data.check(name)) {
                                const logStr = `[Error]  data 里变量：${ name } 有重复，请手动删除其中一个！     file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
                                utils.log(logStr)
                                global.log.push(logStr)
                            }
                            vistors.data.handle(path.node)
                        }
                    }
                }
                break
        }
    }
}

/**
 * 处理异常data
 * data: (t = {
 *    buyed: [{
 *        head: "/hyb_o2o/resource/images/img/yindao1.png",
 *        nick: "喔喔"
 *    }, {
 *        head: "/hyb_o2o/resource/images/img/yindao1.png",
 *        nick: "打开就花"
 *    }],
 *    over_type: 1,
 *    show_price: {
 *        gprice: "10"
 *    }
 * }, a(t, "params", {
 *    authbg: "/images/pop-login.png",
 *    cardname: "思创粉丝卡",
 * }), a(t, "shop", {
 *    address: "麒麟北路美佳华购物广场3楼",
 *    id: "63",
 *    name: "乐悠游儿童乐园",
 *    tel: "12345678580"
 * }), a(t, "userinfo", null), t),
 * @param {*} dataPath
 */
function specialDataHandle (dataPath) {
    if (t.isSequenceExpression(dataPath.node.value)) {
        var value = dataPath.node.value
        dataPath.traverse({
            AssignmentExpression (path) {
                var right = path.node.right
                if (t.isObjectExpression(right)) {
                    var properties = right.properties
                    properties.forEach(function (item) {
                        vistors.data.handle(item)
                    })
                }
            },
            CallExpression (path) {
                /**
                 * 处理异常data写法：
                 */
                var callExp = path.get("callee")
                var arguments = path.node.arguments
                var reg = /[a-z]/i
                if (reg.test(callExp.node.name) && arguments.length === 3) {
                    var idExp = arguments[0]
                    var stringLiteral = arguments[1]
                    var exp = arguments[2]
                    if (t.isIdentifier(idExp) && reg.test(idExp.name) &&
                        t.isStringLiteral(stringLiteral)) {
                        var newObjExp = t.ObjectProperty(stringLiteral, exp)
                        vistors.data.handle(newObjExp)
                        path.skip()
                    }
                }
            },
        })
    }
}




/**
 * 转换
 * @param {*} ast               ast
 * @param {*} _file_js          当前转换的文件路径
 * @param {*} isVueFile         是否为vue文件
 */
const pageConverter = function (ast, _file_js, isVueFile) {
    //清空上次的缓存
    declareNodeList = []
    //data对象
    dataValue = {}
    //computed对象
    computedValue = {}
    //wacth对象
    watchValue = {}
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

module.exports = pageConverter
