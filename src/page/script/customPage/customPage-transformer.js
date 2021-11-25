/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2021-11-23 15:23:32
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\page\script\customPage\customPage-transformer.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")


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

    //让小程序页面和自定义组件支持 computed 和 watch 数据监听器
    //https://developers.weixin.qq.com/community/develop/article/doc/0000a8d54acaf0c962e820a1a5e413
    "computed": "computed",
    "watch": "watch",
}


/**
 * CustomPage 转换
 * @param {*} $ast
 * @param {*} fileKey
 * @returns
 */
function transformCustomPageAst ($ast, fileKey, name) {

    // ggcUtils.transformAppDotGlobalData($ast)
    ggcUtils.transformGetApp($ast)
    // ggcUtils.transformThisDotKeywordExpression($ast, "data")
    // ggcUtils.transformThisDotKeywordExpression($ast, "properties")

    $ast
        .find(`${name}($_$object)`)
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
                var littleCode = $ast.generate().substr(0, 250);
                console.log(`[Error]CustomPage异常情况(建议把源代码修改为简单结构，再尝试转换)\nfile:${fileKey}\n`, littleCode)

            }
        })
        .root()
        .replace(`${name}({data:$_$1,$$$})`, `${name}({data() {
            return $_$1;
          },$$$})`)
        .replace("${name}($$$)", "export default $$$")

    transformObservers($ast, fileKey)
    transformProperties($ast, fileKey)

    return $ast
}

module.exports = { transformCustomPageAst }
