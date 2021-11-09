/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:01:45
 * @LastEditTime: 2021-10-30 16:45:55
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/lifecycle/lifecycle-transformer.js
 *
 */


const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")
var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")


/**
 * 判断代码里面是否有this.onLoad()代码
 * @param {*} $ast
 * @param {*} lifecycleFnName
 * @returns
 */
function hasThisDotOnLoadCode ($ast, lifecycleFnName) {
    var selector = {
        type: "CallExpression", callee: {
            type: "MemberExpression", property: {
                name: lifecycleFnName
            }
        }
    }
    var len = $ast.find(selector).length
    return len > 0
}

/**
 * 生命周期函数处理
 * @param {*} $ast
 * @param {*} lifecycleFnName   重合周期函数名
 * @param {*} fileKey
 * @returns
 */
function lifecycleFunctionHandle ($ast, lifecycleFnName, fileKey) {

    var onLoadFunNode = ggcUtils.getLifecycleNode($ast, "Page", lifecycleFnName)
    var methodsNode = ggcUtils.getLifecycleNode($ast, "Page", "methods", true)

    if (onLoadFunNode && methodsNode) {
        var newFunName = lifecycleFnName + "Clone3389"

        //this.onLoad() --> this.onLoadClone3389()
        //that.onShow() --> that.onShowClone3389()

        //如果都没有this.onLoad(), 就没必要进行下面的操作了
        var hasThisDotOnLoad = hasThisDotOnLoadCode($ast, lifecycleFnName)
        if (!hasThisDotOnLoad) return

        var selector = {
            type: "CallExpression", callee: {
                type: "MemberExpression", property: {
                    name: lifecycleFnName
                }
            }
        }

        $ast
            .find(selector)
            .each(function (item) {
                var nodePath = item[0].nodePath
                var arguments = nodePath.node.arguments

                var calleeNode = nodePath.node.callee
                var object = calleeNode.object
                var property = calleeNode.property

                //空对象
                var objExp = t.objectExpression([])
                if (t.isThisExpression(object)) {
                    property.name = newFunName
                    arguments.push(objExp)
                } else if (t.isIdentifier(object)) {
                    var objectName = object.name
                    var init = ggcUtils.getScopeVariableInitValue(nodePath.scope, objectName)
                    if (t.isThisExpression(init)) {
                        property.name = newFunName
                        arguments.push(objExp)
                    }
                }
            }).root()

        //把函数加入到methods
        var clonePath = clone(onLoadFunNode)
        clonePath.key.name = newFunName
        methodsNode.value.properties.push(clonePath)

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
        if (t.isObjectProperty(onLoadFunNode)) {
            // console.log("fileKey", fileKey)
            //onLoad:function(a){}
            var args = clone(onLoadFunNode.value.params)

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
            onLoadFunNode.value = funExp
        } else if (t.isObjectMethod(onLoadFunNode)) {
            //onLoad(a){}
            var args = onLoadFunNode.params
            var me = t.memberExpression(t.thisExpression(), t.identifier(newFunName))
            var callExp = t.callExpression(me, args)
            var expStatement = t.expressionStatement(callExp)
            var blockStatement = t.blockStatement([expStatement])
            onLoadFunNode.body = blockStatement
        }
    }
}



/**
 *
 *  生命周期函数处理
 *
 *  用于有函数里面调用onLoad刷新页面的情况，因为uniapp里面不能直接调用onLoad刷新的，
 *  因此为onload做了一个副本，将所有调用onLoad的地方都指向副本
 *
 *  1.调用this.onLoad()    ✓
 *  2.调用this.onShow()    ✓
 *
 * @param {*} $ast
 * @param {*} fileKey
 */
function transformLifecycleFunction ($ast, fileKey) {
    lifecycleFunctionHandle($ast, "onLoad", fileKey)
    lifecycleFunctionHandle($ast, "onShow", fileKey)
}

module.exports = { transformLifecycleFunction }
