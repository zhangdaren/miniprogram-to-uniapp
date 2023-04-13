/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2023-02-19 00:33:03
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/page/script/app/app-transformer.js
 *
 */


const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")

var appRoot = "../../../.."
const babelUtils = require(appRoot + "/src/utils/babelUtils")
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")


/**
 * App生命周期函数
 */
const lifecycleFunction = {
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
 * app.js处理
 * @param {*} $ast
 * @param {*} fileKey
 * @returns
 */
function transformAppAst ($ast, fileKey) {
    var globalDataNode = ggcUtils.getLifecycleNode($ast, "App", "globalData", true)

    var littleCode = $ast.generate().substr(0, 250)
    if (!globalDataNode) {
        global.log(`[ERROR]App异常情况： app.js结构太复杂，请调整为App({})这种单一结构再试\nfile:${ fileKey }\n`, littleCode)
    }

    //解决globalData: require('siteinfo.js')这种结构，
    //转换为: globalData: { ...require('siteinfo.js') }
    if (globalDataNode && t.isCallExpression(globalDataNode.value)) {
        globalDataNode.value = t.objectExpression([t.spreadElement(globalDataNode.value)])
    }
    ggcUtils.transformGetApp($ast)

    $ast
        .find("App($_$object)")
        .each(item => {
            var node = item.attr("arguments.0")
            if (t.isObjectExpression(node)) {
                //item.attr("arguments.0.properties") 获取的是一个新数组，因此直接操作父级比较好一点
                node.properties = node.properties.filter(function (subItem, i) {
                    var isMatch = true
                    if (t.isObjectProperty(subItem) || t.isObjectMethod(subItem)) {
                        var name = subItem.key.name || subItem.key.value
                        if (lifecycleFunction[name] || name === "globalData") {
                            //默认数据不动
                        } else {
                            isMatch = false

                            //这里必须转成代码，不然没scope
                            // var code = $(subItem).generate()
                            // subItem = ggcUtils.transformThisDotKeywordExpression($(code), "globalData", globalDataNode.value.properties, fileKey)

                            //其他的非生命周期的话就都放入globalData
                            globalDataNode.value.properties.push(subItem)
                        }
                    }
                    return isMatch
                })

                //获取globalData所有（大部分能获取到的）元素的name
                let globalDataFunNameList = []
                globalDataNode.value.properties.map(function (item) {
                    if (t.isObjectProperty(item) || t.isObjectMethod(item)) {
                        var name = item.key && (item.key.name || item.key.value) || ""
                        globalDataFunNameList.push(name)
                    }
                })

                //开始操作生命周期函数里面的变量引用关系
                node.properties.forEach(function (item) {
                    var name = item.key && (item.key.name || item.key.value)
                    if (name === "globalData") {
                        return
                    }

                    // fun(){} 这种取body
                    // fun:function(){} 这种取value
                    const valueBody = $(item.body || item.value)
                    if (!valueBody) {
                        return
                    }

                    let thisNameList = ggcUtils.getThisNameList(valueBody)

                    // 处理this.globalData
                    globalDataFunNameList.forEach(function (valName) {
                        // 替换this.xxx 为this.globalData.xxx
                        if (!thisNameList.includes("this")) {
                            thisNameList.map(thisName => {
                                valueBody.replace(`${ thisName }.${ valName }`, `${ thisName }.globalData.${ valName }`)
                            })
                        }
                        valueBody.replace(`this.${ valName }`, `this.globalData.${ valName }`)
                    })
                })
            } else {
                global.log(`[ERROR]App异常情况(建议把源代码修改为简单结构，如App({})，再尝试转换)\nfile:${ fileKey }\n`, littleCode)
            }
        })
        .root()

    //globalData里面的this关系调整
    //注只能在这里单独查找，再进行调整
    //如果在globalDataNode.value.properties.push(subItem)代码处，则不生效！
    $ast.find(`App({
        globalData:{$$$}
    })`).each(function (item) {
        item.match["$$$$"].map(obj => {
            //这里必须转成代码，不然没scope
            var code = ""
            if (obj.body) {
                code = $(obj.body).generate()
            } else if (obj.value) {
                if (obj.value.value) {
                    code = $(obj.value).generate()
                } else if (obj.value.body) {
                    // 这种函数形式 scanCarts: function () {}
                    code = $(obj.value.body).generate()
                }
            }
            if (code) {
                var body = ggcUtils.transformThisDotKeywordExpression($(code), "globalData", globalDataNode.value.properties, fileKey)

                if (obj.body) {
                    obj.body = body.node
                } else if (obj.value) {
                    if (obj.value.value) {
                        obj.value = body.node
                    } else if (obj.value.body) {
                        obj.value.body = body.node
                    }
                }
            }

        })
    })

    $ast.replace("App($$$)", "export default $$$")

    return $ast
}

module.exports = { transformAppAst }
