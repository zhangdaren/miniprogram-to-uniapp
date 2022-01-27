/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2022-01-25 18:15:07
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\page\script\page\page-transformer.js
 *
 */


const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")


const babelUtils = require("../../../utils/babelUtils")

const ggcUtils = require("../../../utils/ggcUtils")

var appRoot = "../../../.."
const { transformLifecycleFunction } = require(appRoot + "/src/transformers/lifecycle/lifecycle-transformer")


//小程序页面默认生命周期及数据
const pageDefaultProperty = {
    "data": true,  //页面的初始数据
    "options": true,  //页面的组件选项，同 Component 构造器 中的 options ，需要基础库版本 2.10.1
    "onLoad": true,  //生命周期回调—监听页面加载
    "onShow": true,  //生命周期回调—监听页面显示
    "onReady": true,  //生命周期回调—监听页面初次渲染完成
    "onHide": true,  //生命周期回调—监听页面隐藏
    "onUnload": true,  //生命周期回调—监听页面卸载
    "onPullDownRefresh": true,  //监听用户下拉动作
    "onReachBottom": true,  //页面上拉触底事件的处理函数
    "onShareAppMessage": true,  //用户点击右上角转发
    "onShareTimeline": true,  //用户点击右上角转发到朋友圈
    "onAddToFavorites": true,  //用户点击右上角收藏
    "onPageScroll": true,  //页面滚动触发事件的处理函数
    "onResize": true,  //页面尺寸改变时触发，详见 响应显示区域变化
    "onTabItemTap": true,  //当前是 tab 页时，点击 tab 时触发
    "behaviors": "mixins",
}



/**
 *
 * 处理页面ast
 *
 * @param {*} $ast
 * @param {*} fileKey
 * @returns
 */
function transformPageAst ($ast, fileKey) {

    // ggcUtils.transformAppDotGlobalData($ast)
    ggcUtils.transformGetApp($ast)
    // ggcUtils.transformThisDotKeywordExpression($ast, "data")

    transformLifecycleFunction($ast, fileKey)

    var methodsNode = ggcUtils.getLifecycleNode($ast, "Page", "methods", true)

    $ast
        .find("Page($_$object)")
        .each(item => {
            var node = item.attr("arguments.0")
            if (t.isObjectExpression(node)) {
                //item.attr("arguments.0.properties") 获取的是一个新数组，因此直接操作父级比较好一点
                var arguments = item.attr("arguments.0")
                arguments.properties = arguments.properties.filter(function (subItem) {
                    var isMatch = true
                    if (t.isObjectProperty(subItem) || t.isObjectMethod(subItem)) {
                        var name = subItem.key.name || subItem.key.value
                        if (pageDefaultProperty[name] || name === "methods") {
                            //默认数据不动
                            if (name === "behaviors") {
                                var newName = pageDefaultProperty[name]
                                subItem.key.name = subItem.key.value = newName
                            }
                        } else {
                            //其他的如果是函数的话就都放入methods
                            methodsNode.value.properties.push(subItem)
                            isMatch = false
                        }
                    }
                    return isMatch
                })
            } else {
                var littleCode = $ast.generate().substr(0, 300)
                console.log(`[Error]Page异常情况(建议把源代码修改为简单结构，如Page({})，再尝试转换)\nfile:${ fileKey }\n`, littleCode)
            }
        })
        .root()
        .replace("Page({data:$_$1,$$$})", `Page({data() {
            return $_$1;
        },$$$})`)

    try {
        $ast.replace("Page($$$)", "export default $$$")
    } catch (error) {
        console.error("解析页面异常", error)
    }

    return $ast
}


module.exports = { transformPageAst }
