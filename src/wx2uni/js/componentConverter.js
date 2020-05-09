const t = require("@babel/types");
const nodePath = require("path");
const generate = require("@babel/generator").default;
const traverse = require("@babel/traverse").default;
const Vistor = require("./Vistor");
const clone = require("clone");
const utils = require("../../utils/utils");
const pathUtil = require("../../utils/pathUtil");
const babelUtil = require("../../utils/babelUtil");
//

let vistors = {};

//外部定义的变量
let declareNodeList = [];
//当前处理的js文件路径
let file_js = "";
//当前文件所在目录
let fileDir = "";

//key
let fileKey = "";

/*
 *
 * 注：为防止深层遍历，将直接路过子级遍历，所以使用enter进行全遍历时，孙级节点将跳过
 *
 */
const componentVistor = {
    IfStatement (path) {
        babelUtil.getAppFunHandle(path);
    },
    ExpressionStatement (path) {
        const parent = path.parentPath.parent;
        if (t.isCallExpression(path.node.expression)) {
            const calleeName = t.isIdentifier(path.node.expression.callee)
                ? path.node.expression.callee.name.toLowerCase()
                : "";
            if (
                t.isFile(parent) &&
                calleeName != "app" &&
                calleeName != "page" &&
                calleeName != "component" &&
                calleeName != "vantcomponent"
            ) {
                //定义的外部函数

                declareNodeList.push(path);
                path.skip();
            }
            // } else if (t.isAssignmentExpression(path.node.expression)) {
        } else {
            if (t.isFile(parent)) {
                if (t.isAssignmentExpression(path.node.expression)) {
                    const callee = path.get("expression.right.callee");
                    if (t.isIdentifier(callee.node, { name: "Behavior" })) {
                        // console.log("Behavior文件")
                    } else {
                        //path.node 为AssignmentExpression类型，所以这里区分一下
                        //定义的外部函数

                        declareNodeList.push(path);
                    }
                } else {
                    //path.node 为AssignmentExpression类型，所以这里区分一下
                    //定义的外部函数

                    declareNodeList.push(path);
                }
            }
        }
    },
    ImportDeclaration (path) {
        let specifiers = path.get("specifiers");
        let local = "";
        if (specifiers.length) {
            local = path.get("specifiers.0.local");
        }
        if (local && t.isIdentifier(local) && /wxparse/i.test(local.node.name)) {
            //判断是import wxParse from '../../../wxParse/wxParse.js';
        } else {
            //定义的导入的模块
            //处理import模板的路径，转换当前路径以及根路径为相对路径
            let filePath = path.node.source.value;
            filePath = nodePath.join(
                nodePath.dirname(filePath),
                pathUtil.getFileNameNoExt(filePath)
            ); //去掉扩展名
            filePath = pathUtil.relativePath(
                filePath,
                global.miniprogramRoot,
                fileDir
            );
            path.node.source.value = filePath;

            //定义的外部函数

            declareNodeList.push(path);
            path.skip();
        }
    },
    VariableDeclaration (path) {
        const parent = path.parentPath.parent;
        if (t.isFile(parent)) {
            //将require()里的地址都处理一遍
            traverse(path.node, {
                noScope: true,
                CallExpression (path2) {
                    let callee = path2.get("callee");
                    let property = path2.get("property");
                    if (t.isIdentifier(callee.node, { name: "require" })) {
                        let arguments = path2.node.arguments;
                        if (arguments && arguments.length) {
                            if (t.isStringLiteral(arguments[0])) {
                                let filePath = arguments[0].value;
                                filePath = pathUtil.relativePath(
                                    filePath,
                                    global.miniprogramRoot,
                                    fileDir
                                );
                                path2.node.arguments[0] = t.stringLiteral(filePath);
                            }
                        }
                    } else if (t.isIdentifier(callee.node, { name: "getApp" })) {
                        /**
                         * getApp().xxx;
                         * 替换为:
                         * getApp().globalData.xxx;
                         *
                         * 虽然var app = getApp()已替换，还是会有漏网之鱼，如var t = getApp();
                         */
                        const parent2 = path2.parentPath;
                        if (
                            t.isMemberExpression(parent2.node) &&
                            parent2.node.property &&
                            parent2.node.property.name !== "globalData"
                        ) {
                            const me = t.memberExpression(
                                t.callExpression(t.identifier("getApp"), []),
                                t.identifier("globalData")
                            );
                            path2.replaceWith(me);
                            path2.skip();
                        }
                    }
                },
                VariableDeclarator (path2) {
                    babelUtil.globalDataHandle2(path2);
                    if (t.isCallExpression(path2.node && path2.node.init)) {
                        //处理外部声明的require，如var md5 = require("md5.js");
                        const initPath = path2.node.init;
                        const callee = initPath.callee;
                        if (t.isIdentifier(callee, { name: "require" })) {
                            let arguments = initPath.arguments;
                            if (arguments && arguments.length) {
                                if (t.isStringLiteral(arguments[0])) {
                                    let filePath = arguments[0].value;
                                    if (
                                        !/^[\.\/]/.test(filePath) &&
                                        /node_modules/.test(fileDir)
                                    ) {
                                        //如果require的路径即没有以.或/开头，而且当前文件也在node_modules目录下的话，
                                        //那么就判断这个模块，也应该同处于node_modules下。相应的路径处理方式略有不同。
                                        //应该是相对于miniprogram_npm目录
                                        filePath = "../" + filePath;
                                    } else {
                                        filePath = pathUtil.relativePath(
                                            filePath,
                                            global.miniprogramRoot,
                                            fileDir
                                        );
                                    }
                                    initPath.arguments[0] = t.stringLiteral(filePath);
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
                            path.remove();
                        }
                    }
                }
            });
            //定义的外部函数

            declareNodeList.push(path);
            path.skip();
        }
    },
    FunctionDeclaration (path) {
        const parent = path.parentPath.parent;
        if (t.isFile(parent)) {
            babelUtil.getAppFunHandle(path);

            //定义的外部函数

            declareNodeList.push(path);
            path.skip();
        }
    },
    ObjectMethod (path) {
        const name = path.node.key.name;
        lifeCycleHandle(path);
    },
    ObjectProperty (path) {
        const name = path.node.key.name;
        // console.log("name", path.node.key.name)
        // console.log("name", path.node.key.name)
        lifeCycleHandle(path);
    }
};

/**
 * 组件里生命周期函数处理
 * 这样修改的原因是：
 * lifetimes下面的函数有两种写法attached(){}和lifetimes:{}
 * @param {*} path
 */
function lifeCycleHandle (path) {
    const name = path.node.key.name;
    switch (name) {
        case "data":
            var properties = path.node.value.properties;
            if (properties) {
                properties.forEach(function (item) {
                    if (item && item.key && item.key.name) {
                        //还有问题，先不更新!!!
                        // item.key.name = utils.getFunctionAlias(item.key.name);
                        vistors[name].handle(item);
                    }
                });
            }
            path.skip();
            break;
        case "computed":
        case "watch":
        case "observers":
            var properties = path.node.value.properties;
            if (properties) {
                properties.forEach(function (item) {
                    // if(item.key.name === "data") item.key.name="pData";
                    vistors[name === "observers" ? "watch" : name].handle(item);
                });
            }
            ///////////////////////////////////
            //TODO: observers需要处理成深度监听，但还得判断data/prop里是使用类型的
            //判断data是否有prop一致的，还需要分割,进行

            path.skip();
            break;
        case "props": // VantComponent组件
        case "properties":
            //组件特有生命周期: properties-->props
            var properties = path.get("value.properties");
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

                    let propItemName = item.node.key.name || item.node.key.value;
                    //20200418->减少侵入，也因为修复不完全，不再进行重名！
                    // propItemName = utils.getPropsAlias(propItemName);

                    //
                    const props = item.get("value.properties");
                    let typeItem = null;
                    let defaultItem = null;
                    let observerItem = null;
                    if (props && props.length > 0) {
                        props.forEach(function (subItem) {
                            const name = subItem.node.key.name;
                            switch (name) {
                                case "value":
                                    subItem.node.key.name = "default";
                                    defaultItem = subItem;
                                    break;
                                case "type":
                                    typeItem = subItem;
                                    break;
                                case "observer":
                                    observerItem = subItem;
                                    break;
                            }
                        });
                    }
                    if (typeItem && defaultItem) {
                        if (
                            typeItem.node.value.name == "Array" ||
                            typeItem.node.value.name == "Object"
                        ) {
                            let afx = t.arrowFunctionExpression([], defaultItem.node.value);
                            let op = t.ObjectProperty(defaultItem.node.key, afx);
                            defaultItem.replaceWith(op);
                        }
                    }
                    if (observerItem) {
                        let objProp;
                        //observer换成watch
                        let op_value = null;
                        if (
                            typeItem.node.value.name == "Array" ||
                            typeItem.node.value.name == "Object"
                        ) {
                            //Array和Object换成深度监听
                            if (t.isObjectProperty(observerItem.node)) {
                                op_value = observerItem.node.value;
                            } else if (t.isObjectMethod(observerItem.node)) {
                                op_value = t.functionExpression(
                                    null,
                                    observerItem.node.params,
                                    observerItem.node.body
                                );
                            } else {
                                op_value = observerItem.node.value;
                            }

                            let objExp_handle = t.objectProperty(
                                t.identifier("handler"),
                                op_value
                            );
                            let objExp_deep = t.objectProperty(
                                t.identifier("deep"),
                                t.booleanLiteral(true)
                            );
                            let properties = [objExp_handle, objExp_deep];
                            let objExp = t.objectExpression(properties);
                            //如果observer的属性名是字符串，那就进行命名的修正
                            //20200418->减少侵入，也因为修复不完全，不再进行重名！
                            // if (t.isStringLiteral(objExp))
                            //     objExp.value = utils.getPropsAlias(objExp.value);
                            objProp = t.objectProperty(t.identifier(propItemName), objExp);
                        } else {
                            if (t.isObjectProperty(observerItem.node)) {
                                op_value = observerItem.node.value;
                            } else if (t.isObjectMethod(observerItem.node)) {
                                op_value = t.functionExpression(
                                    null,
                                    observerItem.node.params,
                                    observerItem.node.body
                                );
                            } else {
                                op_value = observerItem.node.value;
                            }
                            //如果observer的属性名是字符串，那就进行命名的修正
                            //20200418->减少侵入，也因为修复不完全，不再进行重名！
                            // if (t.isStringLiteral(op_value))
                            //     op_value.value = utils.getPropsAlias(op_value.value);

                            //其他类型原样
                            objProp = t.objectProperty(t.identifier(propItemName), op_value);
                        }
                        vistors.watch.handle(objProp);
                        observerItem.remove();
                    }
                    //20200418->减少侵入，也因为修复不完全，不再进行重名！
                    // item.node.key.name = utils.getPropsAlias(item.node.key.name);
                    vistors.props.handle(item.node);
                });
            }
            path.skip();
            break;
        case "attached":
            //组件特有生命周期: attached-->beforeMount
            let newPath_a = clone(path);
            newPath_a.node.key.name = "beforeMount";
            vistors.lifeCycle.handle(newPath_a.node);
            path.skip();
            break;
        case "detached":
            //组件特有生命周期: detached-->destroyed
            let newPath_d = clone(path);
            newPath_d.node.key.name = "destroyed";
            vistors.lifeCycle.handle(newPath_d.node);
            path.skip();
            break;
        case "ready":
            //组件特有生命周期: ready-->mounted
            let newPath_r = clone(path);
            newPath_r.node.key.name = "mounted";
            vistors.lifeCycle.handle(newPath_r.node);
            path.skip();
            break;
        case "moved":
            //组件特有生命周期: moved-->moved  //这个vue没有对应的生命周期
            let newPath_m = clone(path);
            newPath_m.node.key.name = "moved";
            vistors.lifeCycle.handle(newPath_m.node);
            path.skip();
            break;
        case "pageLifetimes":
            //组件所在页面的生命周期函数pageLifetimes，原样放入生命周期内
            // show -- > onPageShow
            // hide -- > onPageHide
            // size -- > onPageResize
            var properties = path.node.value.properties;
            if (properties) {
                properties.forEach(function (item) {
                    let name = item.key.name;
                    switch (item.key.name) {
                        case "show":
                            name = "onPageShow";
                            break;
                        case "hide":
                            name = "onPageHide";
                            break;
                        case "resize":
                            name = "onPageResize";
                            break;
                    }
                    item.key.name = name;
                    vistors.lifeCycle.handle(item);
                });
            }
            path.skip();
            break;
        case "behaviors":
            //组件的behaviors，重名为mixins，放入生命周期
            let newPath_b = clone(path);
            newPath_b.node.key.name = "mixins";
            vistors.lifeCycle.handle(newPath_b.node);
            path.skip();
            break;
        case "lifetimes":
            //组件特有生命周期组lifetimes，不处理
            break;
        case "externalClasses":
        //组件的externalClass自定义组件样式
        case "relations":
        //组件的relations
        case "options":
            //组件的options
            vistors.lifeCycle.handle(path.node);
            path.skip();
            break;
        case "methods":
            //组件特有生命周期: methods
            var properties = path.node.value.properties;
            if (properties) {
                properties.forEach(function (item) {
                    vistors.methods.handle(item);
                });
            }
            path.skip();
            break;
        default:
            vistors.lifeCycle.handle(path.node);
            path.skip();
            break;
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
    declareNodeList = [];
    //
    file_js = _file_js;
    fileDir = nodePath.dirname(file_js);
    fileKey = pathUtil.getFileKey(_file_js);

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
    };

    traverse(ast, componentVistor);

    return {
        convertedJavascript: ast,
        vistors: vistors,
        declareNodeList //定义的变量和导入的模块声明
    };
};

module.exports = componentConverter;
