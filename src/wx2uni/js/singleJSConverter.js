const t = require("@babel/types");
const nodePath = require("path");
const generate = require("@babel/generator").default;
const traverse = require("@babel/traverse").default;
const Vistor = require("./Vistor");
const clone = require("clone");
const pathUtil = require("../../utils/pathUtil");
const babelUtil = require("../../utils/babelUtil");

//当前文件所在目录
let fileDir = "";

//key
let fileKey = "";

/*
 *
 */
const singleJSVistor = {
    StringLiteral (path) {
        if (global.isTransformAssetsPath) {
            //尽可能的转换路径
            let val = path.node.value;
            const reg = /^((\/|\.+\/).*?\.(jpe?g|gif|svg|png|mp3))$/i;
            if (reg.test(val)) {
                path.node.value = val.replace(reg, function (match, $1) {
                    let newVal = pathUtil.replaceAssetPath(
                        val,
                        global.miniprogramRoot,
                        fileDir
                    );
                    return newVal;
                })
            }
        }
    },
    CallExpression (path) {
        //处理require()里面的路径
        babelUtil.requirePathHandle(path, fileDir);

        //
        let callee = path.get("callee");
        let property = path.get("property");
        if (t.isIdentifier(callee.node, { name: "getApp" })) {
            /**
             * getApp() -- >  getApp().globalData
             * getApp().xxx -- >  getApp().globalData.xx
             */
            let arguments = path.node.arguments;
            if (arguments.length == 0) {
                const parent = path.parent;
                if (
                    parent &&
                    parent.property &&
                    t.isIdentifier(parent.property, { name: "globalData" })
                ) {
                    //如果已经getApp().globalData就不进行处理了
                } else {
                    //一般来说getApp()是没有参数的。
                    path.replaceWith(
                        t.memberExpression(
                            t.callExpression(t.identifier("getApp"), []),
                            t.identifier("globalData")
                        )
                    );
                    path.skip();
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
        }
    },
    VariableDeclarator (path) {
        babelUtil.globalDataHandle2(path);
    },
};

/**
 * 处理单独的js文件
 * @param {*} ast               ast
 * @param {*} _file_js          当前转换的文件路径
 */
const singleJSConverter = function (ast, _file_js) {
    file_js = _file_js;
    fileDir = nodePath.dirname(file_js);
    fileKey = pathUtil.getFileKey(_file_js);
    traverse(ast, singleJSVistor);
    return ast;
};

module.exports = singleJSConverter;
