/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2021-11-23 15:23:01
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\page\script\component\component-transformer.js
 *
 */


const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")


const utils = require("../../../utils/utils")
const babelUtils = require("../../../utils/babelUtils")
const ggcUtils = require("../../../utils/ggcUtils")

var appRoot = "../../../.."
const { transformProperties } = require(appRoot + "/src/transformers/properties/properties-transformer")
const { transformObservers } = require(appRoot + "/src/transformers/observers/observers-transformer")

const componentDefaultProperty = {
    "properties": "props",  //组件的对外属性，是属性名到属性设置的映射表
    "data": "data",  //组件的内部数据，和 properties 一同用于组件的模板渲染
    "observers": "watch",  //组件数据字段监听器，用于监听 properties 和 data 的变化，参见 数据监听器	2.6.1
    "methods": "methods",  //组件的方法，包括事件响应函数和任意的自定义方法，关于事件响应函数的使用，参见 组件间通信与事件
    "behaviors": "mixins",  //类似于mixins和traits的组件间代码复用机制，参见 behaviors
    "created": "created",  //组件生命周期函数-在组件实例刚刚被创建时执行，注意此时不能调用 setData )
    "attached": "beforeMount",  //组件生命周期函数-在组件实例进入页面节点树时执行)
    "ready": "mounted",  //组件生命周期函数-在组件布局完成后执行)
    "moved": "moved",  //组件生命周期函数-在组件实例被移动到节点树另一个位置时执行)
    "detached": "destroyed",  //组件生命周期函数-在组件实例被从页面节点树移除时执行)
    "relations": "relations",  //组件间关系定义，参见 组件间关系
    "externalClasses": "externalClasses",  //组件接受的外部样式类，参见 外部样式类
    "options": "options",  //一些选项（文档中介绍相关特性时会涉及具体的选项设置，这里暂不列举）
    "lifetimes": "lifetimes",  //组件生命周期声明对象，参见 组件生命周期	2.2.3
    "pageLifetimes": "pageLifetimes",  //组件所在页面的生命周期声明对象，参见 组件生命周期	2.2.3
    "definitionFilter": "definitionFilter",  //定义段过滤器，用于自定义组件扩展，参见 自定义组件扩展

    "error": "error",  //定义段过滤器，用于自定义组件扩展，参见 自定义组件扩展

    //让小程序页面和自定义组件支持 computed 和 watch 数据监听器
    //https://developers.weixin.qq.com/community/develop/article/doc/0000a8d54acaf0c962e820a1a5e413
    "computed": "computed",
    "watch": "watch",
}

//小程序的pageLifetimes（组件所在页面的生命周期）
//https://ask.dcloud.net.cn/article/37086
const pageLifetimes = {
    "show": "onPageShow", //页面被展示时执行
    "hide": "onPageHide", //页面被隐藏时执行
    "resize": "onPageResize", //页面尺寸变化时执行
}

/**
 * lifetimes 或 pageLifetimes 预处理
 * @param {*} $ast
 * @param {*} name lifetimes 或 pageLifetimes
 */
function transformLifetimes ($ast, name) {
    $ast.find(`${ name }:{$$$}`)
        .each(function (item) {
            var list = item.match['$$$$']
            list.map(function (node) {
                item.before(node)
            })
            item.remove()
        })
        .root()
}

/**
 * Component 转换
 * @param {*} $ast
 * @param {*} fileKey
 * @returns
 */
function transformComponentAst ($ast, fileKey) {

    // ggcUtils.transformAppDotGlobalData($ast)
    ggcUtils.transformGetApp($ast)
    // ggcUtils.transformThisDotKeywordExpression($ast, "data")
    // ggcUtils.transformThisDotKeywordExpression($ast, "properties")

    //lifetimes处理
    // 组件生命周期声明对象，将组件的生命周期收归到该字段进行声明，原有声明方式仍旧有效，如同时存在两种声明方式，则lifetimes字段内声明方式优先级最高
    // $ast.replace("lifetimes:{$$$1}", "$$$1")   //这种只能保留一个。。。。
    transformLifetimes($ast, "lifetimes")

    $ast
        .find("Component($_$object)")
        .each(item => {
            var arguments = item.attr("arguments.0")
            if (t.isObjectExpression(arguments)) {
                var properties = arguments.properties

                properties.map(function (subItem) {
                    if (t.isObjectProperty(subItem) || t.isObjectMethod(subItem)) {
                        var name = subItem.key.name || subItem.key.value

                        var newName = componentDefaultProperty[name]
                        if (newName && newName !== name) {
                            subItem.key.name = newName
                            subItem.key.value = newName
                        }
                    }
                })
            } else {
                var littleCode = $ast.generate().substr(0, 250)
                console.log(`[Error]Component异常情况(建议把源代码修改为简单结构，如Component({})，再尝试转换)\nfile:${ fileKey }\n`, littleCode)
            }
        })
        .root()
        .replace("Component({data:$_$1,$$$})", `Component({data() {
            return $_$1;
          },$$$})`)
        .replace("Component($$$)", "export default $$$")


    //TODO: 这种暂时不支持，应该需要提示的，打log！！！！
    $ast.find("pageLifetimes:{$$$1}").each(function (item) {
        var list = item.match["$$$1"]
        list.map(function (node) {
            if (node.key) {
                var name = node.key.name || node.key.value

                var newName = pageLifetimes[name]
                node.key.name = newName
                node.key.value = newName
            }
        })
    }).root()

    transformLifetimes($ast, "pageLifetimes")

    transformObservers($ast, fileKey)
    try {
        transformProperties($ast, fileKey)
    } catch (error) {
console.log("transformProperties error", fileKey, error)
    }

    global.props[fileKey] = ggcUtils.getCompoentPropsList($ast)

    return $ast
}

module.exports = { transformComponentAst }
