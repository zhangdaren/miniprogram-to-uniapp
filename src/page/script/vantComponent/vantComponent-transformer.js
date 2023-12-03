/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2023-07-26 21:47:36
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/page/script/vantComponent/vantComponent-transformer.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")

const babelUtils = require("../../../utils/babelUtils")
const ggcUtils = require("../../../utils/ggcUtils")
const { debug } = require('console')

var appRoot = "../../../.."
const { transformProperties } = require(appRoot + "/src/transformers/properties/properties-transformer")
const { transformObservers } = require(appRoot + "/src/transformers/observers/observers-transformer")

const componentDefaultProperty = {
    "properties": "props",  //组件的对外属性，是属性名到属性设置的映射表
    "props": "props",  //组件的对外属性，是属性名到属性设置的映射表
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
 * VantComponent 转换
 * @param {*} $ast
 * @param {*} fileKey
 * @returns
 */
function transformVantComponent ($ast, fileKey, name) {
    $ast
        .find(`${ name }($_$object)`)
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
                global.log(`[ERROR]VantComponent异常情况(建议把源代码修改为简单结构，再尝试转换)\nfile:${ fileKey }\n`, littleCode)

            }
        })
        .root()
        .replace(`${ name }({data:$_$1,$$$})`, `${ name }({data() {
            return $_$1;
          },$$$})`)
        .replace(`${name}($$$)`, "export default $$$")

    return $ast
}

/**
 * relation 转换
 * @param {*} $ast
 * @param {*} fileKey
 * @returns
 */
function transformRelation ($ast, fileKey, astTypeName) {

    // relation: {
    //     name: 'collapse-item',
    //     type: 'descendant',
    //     linked(child) {
    //         this.children.push(child);
    //     },
    //     unlinked(child) {
    //         this.children = this.children.filter((item) => item !== child);
    //     }
    // },

    // relations: {
    // ../collapse-item/index: {
    //     type: 'descendant', // 关联的目标节点应为子节点
    //     linked(child) {
    //         this.children.push(child);
    //     },
    //     unlinked(child) {
    //         this.children = this.children.filter((item) => item !== child);
    //     }
    //   }
    // },

    // https://play.gogocode.io/#code/N4IglgdgDgrgLgYQPYBMCmIBcICGAjAYwApgAdCAAiooCc0AbHOMJCTCsy67iHAWzTsA5AST1GUAM5oAtGDho+QgDTlu3OAE8ogikPSSCaCChwQ4Kteqr1IAazQoiBABZh6KAJQcr1jW8kAOld3FDoIQNhJF2c3D08Abl91AF9VLmsYCFsIBycQ+J8Mvyo4AOC4sOMKAF4KMrAggqqIgDN3BRoiInlFbxqAPgpevgoAQhq65sTk7hTktPIUzxBlEAB3JBo7ZHQsEFasgmZWepozSVatviJ2+jQASQgr5QocKDBXpCgTiElvThUUR-OAUAAktTeH0CAHMkHDROgrMDJKDJEgYDQjJC7o9nkhAujMUYrAB6Um0NBwTGUTQYmhnC5XGgCFAURFoCguNB0Kx0ak0ShgohErFoTzJQLtExEAAG+GIYIA+mCkHgAFZoY6eWUS4qBNA4VzdEb9IaA9QANxwDJtMJgAnMkkhI0CTDgXSEdodxjgkiEeus91BavVADlUJy6t7HX6ANoABgAurMKOSKMGKBBIy6FHxAnwmK440JQ1qLEnE0nAtmkcUgax0fdAvR4UQY77JF8NRH0HrU5m6Ixfr2oxRQ6PIjRvjzmGhJFXyKnrQyh2H+GhR5Ch0wWBBJ9b6DA0FOZzQ50FpU4iFBp2bU1Q47eCQ5NDWN69n4FX4FD8fq5ABBHgYRBCLwAgBqmgbqCiYgnq2MKgWuG6jiolL0OuAijv29bjj2kanjo55gPOVaQha1haDowgAPIauWAAK05EVoli4VQr7sBRfhUboQgPOg5hgO0PJsSUVDgbosqkCAgSBKSYLAMhWEEX+J5qSkpKQOgAAeMmyukJSLOxFBqVxD7ULxtH0ccACiOm3vOkh7mJ4nPixJGSOwO4jqpOBHie7mzp5hl+MZ1jzBAqbpq6dBQIwRhENBVDLJKMLGDyTBoElSzkKs4DQPAAAyZgwvsvGGDQYA-PlLg4JITFUnONBYK0-nSGskgwHgABqJHrAAKtoGDYB6aAYCkQA

    // var relationNode = ggcUtils.getLifecycleNode($ast, astTypeName, "relation", false)

    $ast
        .find(`${ astTypeName }($_$object)`)
        .each((item) => {
            var arguments = item.attr('arguments')
            let optionsNode = arguments[0]
            // let node = item.match['object'][0].node
            // console.log(arguments, optionsNode)


            let relationNodeIndex = optionsNode.properties.findIndex(o => [o.key.name, o.key.value].includes("relation"))

            if (relationNodeIndex >= 0) {

                let relationNode = optionsNode.properties[relationNodeIndex]

                //   let argProperties = optionsNode.properties[0]

                if (relationNode.value.properties) {
                    var relNameNode = relationNode.value.properties.find((pro) =>
                        [pro.key.name, pro.key.value].includes('name')
                    )
                    // console.log('relNameNode', )

                    optionsNode.properties[relationNodeIndex] = {
                        type: 'ObjectProperty',
                        key: {
                            type: 'Identifier',
                            name: `"../${ relNameNode.value.value }/index"`,
                        },
                        value: {
                            type: 'ObjectExpression',
                            properties: relationNode.value.properties,
                        },
                    }
                }
            }

            // item.replace()
        }).root()

    return $ast
}


/**
 * VantComponent 转换
 * @param {*} $ast
 * @param {*} fileKey
 * @returns
 */
function transformVantComponentAst ($ast, fileKey, name) {
    const obj = ggcUtils.pageExpList.find(item => item.type === name)
    const keywordList = obj.keywordList

    ggcUtils.transformGetApp($ast)

    transformRelation($ast, fileKey, name)


    // VantComponent({
    //     mixins: [button, openType],
    //     classes: ['hover-class', 'loading-class'],
    //     data: {
    //         style: ''
    //     },
    // })

    //     options.externalClasses = options.externalClasses || [];
    //     options.externalClasses.push('custom-class');

    // import { basic } from '../mixins/basic';
    //     options.behaviors.push(basic);


    //     if (vantOptions.field) {
    //         options.behaviors.push('wx://form-field');
    //     }

    // import { VantComponent } from '../common/component';
    // import { button } from '../mixins/button';
    // import { openType } from '../mixins/open-type';
    // VantComponent({
    //     mixins: [link, button, openType],
    //     relation: {
    //         type: 'ancestor',
    //         name: 'goods-action',
    //         linked(parent) {
    //             this.parent = parent;
    //         }
    //     },

    //读取mixins

    keywordList.map(keyword => {
        var res = $ast.find(`${ keyword }($_$object)`)
        if (res.length) {
            transformVantComponent($ast, fileKey, keyword)
        }
    })

    transformObservers($ast, fileKey)
    transformProperties($ast, fileKey)
}

module.exports = { transformVantComponentAst }
