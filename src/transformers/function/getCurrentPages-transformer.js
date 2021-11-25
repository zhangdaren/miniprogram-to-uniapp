/*
 * @Author: zhang peng
 * @Date: 2021-08-16 11:59:58
 * @LastEditTime: 2021-11-20 11:57:36
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\function\getCurrentPages-transformer.js
 */


const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")


var appRoot = "../../../.."
// const ggcUtils = require(appRoot + "/src/utils/ggcUtils")

/**
 * getCurrentPages函数处理
 * @param {*} $ast
 * @param {*} fileKey
 */
function transformGetCurrentPages ($ast, fileKey) {

    // var pages = getCurrentPages();
    // var currentPage = pages[pages.length - 1];
    // var typeid = currentPage.options.typeid || 0;   //这个options是url上面的参数
    // var urlData = {
    //     path: currentPage.route,   //加了$vm后，这个获取不到
    //     typeid: typeid
    // };
    // return urlData;

    //貌似有点问题，在微信小程序里。。。
    return

    if (!$ast) return
    $ast
        .find({ type: 'MemberExpression' })
        .each(function (item) {
            var object = item.attr("object")
            var property = item.attr("property")
            if (t.isIdentifier(object)) {
                // 写法一：
                //  var pages = getCurrentPages();
                //  var prevPage = pages[pages.length - 1];  -->   var prevPage = pages[pages.length - 1].$vm;
                //  prevPage.setData();
                var bindings = item[0].nodePath.scope.getBindings()
                var keyName = item.attr('object.name')
                if (bindings[keyName]) {
                    var obj = bindings[keyName]

                    if (!obj[0]) {
                        console.log('transformGetCurrentPages: 找不到bindings[keyName] :>> ' + keyName + "   file:" + fileKey)
                        return
                    }

                    var parentNode = obj[0].parentPath.node
                    if (parentNode.type === 'VariableDeclarator') {
                        var init = parentNode.init

                        //判断init是否存在
                        //比如 for (const docChange of snapshot.docChanges) {}
                        //变量docChange此时的init为null

                        if (init &&
                            init.type === 'CallExpression' &&
                            init.callee.name === 'getCurrentPages'
                        ) {
                            //过滤pages.length > 1，防止误替换
                            var propertyName = property.name || property.value
                            if (propertyName === "length") return

                            //防止给子级也添加上$vm，使用babel可以不用这个判断！
                            var hasFixed = false
                            item.parents().each(parent => {
                                if (hasFixed) return
                                if (parent.node
                                    && parent.node.type == 'MemberExpression'
                                    && parent.node.property === '$vm'
                                ) {
                                    hasFixed = true
                                }
                            })
                            if (!hasFixed) {
                                item.replaceBy({
                                    type: 'MemberExpression',
                                    object: item.node,
                                    property: '$vm',
                                })
                            }
                        }
                    }
                }
            } else if (t.isCallExpression(object)) {
                //下面两种情况，可以简单的使用造表达式进行替换
                let callee = object.callee
                if (t.isIdentifier(callee, { name: "getCurrentPages" })) {
                    if (t.isBinaryExpression(property)) {
                        // 写法二：
                        //var e = getCurrentPages()[getCurrentPages().length - 1]; e.onShow();
                        //转换为：
                        //var e = getCurrentPages()[getCurrentPages().length - 1].$vm; e.onShow();

                        var parentNode = item[0].nodePath.parentPath.node
                        if (t.isMemberExpression) {
                            var property = parentNode.property
                            if (property) {
                                var propertyName = property.name || property.value

                                var keyMap = {
                                    "onLoad": "onLoadClone3389",
                                    "onShow": "onShowClone3389"
                                }
                                if (keyMap[propertyName]) {
                                    var newName = keyMap[propertyName]
                                    property.name = newName
                                    property.valuenewName
                                }
                            } else {
                                console.log("transformGetCurrentPages:  未知错误")
                            }
                        }
                        let meExp = t.memberExpression(item.node, t.identifier("$vm"))
                        item.replaceBy(meExp)
                    } else if (t.isIdentifier(property, { name: "pop" })) {
                        // 写法三:
                        //  var o = getCurrentPages().pop();  -->  var o = getCurrentPages().pop().$vm;
                        //  o.setData({
                        //    warrant: !0
                        //  });
                        let meExp = t.memberExpression(t.callExpression(item.node, []), t.identifier("$vm"))
                        item.parent().replaceBy(meExp)
                    }
                }
            }
        })
        .root()
}

module.exports = { transformGetCurrentPages }
