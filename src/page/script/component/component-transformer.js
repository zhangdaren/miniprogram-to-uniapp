/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2023-04-10 20:35:39
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/page/script/component/component-transformer.js
 *
 */


const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')
const clone = require('clone')

const t = require("@babel/types")


const utils = require("../../../utils/utils")
const babelUtils = require("../../../utils/babelUtils")
const ggcUtils = require("../../../utils/ggcUtils")

var appRoot = "../../../.."
const { transformProperties } = require(appRoot + "/src/transformers/properties/properties-transformer")
const { transformObservers } = require(appRoot + "/src/transformers/observers/observers-transformer")

const { transformRelation } = require(appRoot + "/src/transformers/component/relation-transformer")

const componentDefaultProperty = {
    "properties": "props",  //组件的对外属性，是属性名到属性设置的映射表
    "data": "data",  //组件的内部数据，和 properties 一同用于组件的模板渲染
    "observers": "watch",  //组件数据字段监听器，用于监听 properties 和 data 的变化，参见 数据监听器	2.6.1
    "methods": "methods",  //组件的方法，包括事件响应函数和任意的自定义方法，关于事件响应函数的使用，参见 组件间通信与事件
    "behaviors": "mixins",  //类似于mixins和traits的组件间代码复用机制，参见 behaviors
    "created": "created",  //组件生命周期函数-在组件实例刚刚被创建时执行，注意此时不能调用 setData )
    // "attached": "beforeMount",  //组件生命周期函数-在组件实例进入页面节点树时执行) -- 注：单独处理！
    // "ready": "mounted",  //组件生命周期函数-在组件布局完成后执行) -- 注：单独处理！
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
    "show": "handlePageShow", //页面被展示时执行
    "hide": "handlePageHide", //页面被隐藏时执行
    "resize": "handlePageResize", //页面尺寸变化时执行
}

/**
 * lifetimes预处理
 * @param {*} $ast
 * @param {*} name lifetimes
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
 * pageLifetimes 处理
 * @param {*} $ast
 * @param {*} methodNode
 */
function transformPageLifetimes (pageLifetimesNode, methodNode) {
    if (pageLifetimesNode.value && pageLifetimesNode.value.properties) {
        pageLifetimesNode.value.properties.reverse().map(node => {
            if (node.key) {
                let name = node.key.name || node.key.value

                let newName = pageLifetimes[name]
                node.key.name = newName
                node.key.value = newName
            }
            //将页面生命周期插入methods首位
            methodNode.value.properties.unshift(clone(node))
        })
    }
}

/**
 * Component 转换
 * @param {*} $ast
 * @param {*} fileKey
 * @returns
 */
function transformComponentAst ($ast, fileKey) {

    ggcUtils.transformGetApp($ast)

    //lifetimes处理
    // 组件生命周期声明对象，将组件的生命周期收归到该字段进行声明，原有声明方式仍旧有效，如同时存在两种声明方式，则lifetimes字段内声明方式优先级最高
    // $ast.replace("lifetimes:{$$$1}", "$$$1")   //这种只能保留一个。。。。
    transformLifetimes($ast, "lifetimes")

    //用于存储是否有这两生命周期
    var lifecycleMap = {
        attached: false,
        ready: false,
    }

    var methodNode = ggcUtils.getLifecycleNode($ast, "Component", "methods", true)

    $ast
        .find("Component($_$object)")
        .each(item => {
            var arguments = item.attr("arguments.0")
            if (t.isObjectExpression(arguments)) {
                var properties = arguments.properties

                var insertIndex = -1
                arguments.properties = properties.filter(function (subItem, index) {
                    if (t.isObjectProperty(subItem) || t.isObjectMethod(subItem)) {
                        let name = subItem.key.name || subItem.key.value

                        if (name === "attached" || name === "ready") {
                            //将生命周期attached或ready插入methods首位
                            methodNode.value.properties.unshift(clone(subItem))

                            if (name === "attached") lifecycleMap["attached"] = true
                            if (name === "ready") lifecycleMap["ready"] = true

                            if (insertIndex === -1) {
                                //记录位置
                                insertIndex = index
                            }
                            return false
                        } else if (name === "pageLifetimes") {
                            //pageLifetime
                            transformPageLifetimes(subItem, methodNode)
                        } else {
                            var newName = componentDefaultProperty[name]
                            if (newName && newName !== name) {
                                subItem.key.name = newName
                                subItem.key.value = newName
                            }
                            return true
                        }
                    }
                })
                if (insertIndex > -1) {
                    //加入mounted生命周期，用于处理attached和ready生命周期， 此过程有点骚。。。
                    var mountedCode = `const no3389 = {
                        mounted(){
                            ${ lifecycleMap.attached ? '// 处理小程序 attached 生命周期\n this.attached();' : '' }
                            ${ lifecycleMap.ready ? ' // 处理小程序 ready 生命周期\n this.$nextTick(()=>this.ready());' : '' }
                        }}`
                    var ast = $(mountedCode, { isProgram: false })
                    var mountedNode = ast.replace('const no3389 = {$$$1}', "$$$1").node
                    arguments.properties.splice(insertIndex, 0, mountedNode)
                }
            } else {
                var littleCode = $ast.generate().substr(0, 250)
                global.log(`[ERROR]Component异常情况(建议把源代码修改为简单结构，如Component({})，再尝试转换)\nfile:${ fileKey }\n`, littleCode)
            }
        })
        .root()

    try {
        $ast.replace("Component({data:$_$1,$$$})", `Component({data() {
            return $_$1;
        },$$$})`)
    } catch (error) {
        // 这写法当场报错。。。。混合写法
        // Component({
        //     data() {
        //       newMenus:''
        //     }
        //   })
        global.log("transform component data error", fileKey, error)
    }

    //此行一定要位于transformObservers前面，切记！
    global.props[fileKey] = ggcUtils.getComponentPropsList($ast, fileKey)


    try {
        // relations组件间关系处理
        transformRelation($ast, fileKey)
    } catch (error) {
        global.log("transformRelation error", fileKey, error)
    }

    try {
        //TODO: 放这里不太人性化，，，，有点那啥。。。。不能统一搞
        //需在transformPageLifetimes之后
        $ast.root().replace("Component($$$)", "export default $$$")
    } catch (error) {
        global.log("Component -> export default  error", fileKey, error)
    }

    try {
        transformObservers($ast, fileKey)
    } catch (error) {
        global.log("transformObservers error", fileKey, error)
    }

    try {
        transformProperties($ast, fileKey)
    } catch (error) {
        global.log("transformProperties error", fileKey, error)
    }

    return $ast
}

module.exports = { transformComponentAst }
