/*
 * @Author: zhang peng
 * @Date: 2023-03-05 12:55:43
 * @LastEditTime: 2023-04-10 20:38:18
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/utils/varUtils.js
 *
 */

const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")

const cheerio = require('cheerio')
const traverse = require("@babel/traverse").default
// const { parseSync } = require("@babel/core")
const utils = require("./utils")

var appRoot = "../../"
const {
    getVariableListByKey,
    getTemplateExpressionList,
    getTemplateEventFnList
} = require(appRoot + '/src/utils/variableUtils')

/**
 * 获取wxml里面的所有变量
 * @param {*} code
 * @returns
 */
// function getTemplateVarList22 (code, hasTemplateContainer = true) {
//     //TODO: 这里的hasTemplateContainer需要优化！！！！！！！！！！
//     if (!hasTemplateContainer) {
//         code = `<template>${ code }</template>`
//     }

//     const $ = cheerio.load(code)

//     var vars = []
//     var domList = $('template')
//     // 获取wxml文件中template节点下的所有text节点
//     const text = domList.text()
//     const reg = /\{\{([^\{]*)\}\}/
//     const dbbraceRe = new RegExp(reg, 'g')
//     let ivar
//     // 拿到所有被{{}}包裹的动态表达式
//     while ((ivar = dbbraceRe.exec(text))) {
//         global.log("ivar=======", ivar)
//         addVar(ivar[1])
//     }

//     domList = $('*')
//     // 遍历所有节点的属性，获取所有的动态属性
//     for (let i = 0;i < domList.length;i++) {
//         const dom = domList.eq(i)
//         const attrs = Object.keys(dom.attr())
//         for (let attr of attrs) {
//             const value = dom.attr(attr)
//             global.log("value", value)
//             if (!reg.test(value)) continue
//             const exp = value.match(reg)[1]
//             global.log("exp-///-", exp)
//             try {
//                 addVar(exp)
//             } catch (e) {
//                 global.log("e", e)
//                 addVar(`{${ exp }}`)
//             }
//         }
//     }

//     //去重
//     vars = utils.duplicateRemoval(vars)

//     function addVar (exp) {
//         global.log("exp====", exp)
//         //单个单词
//         if (/^[a-zA-Z_]+$/.test(exp)) {
//             vars.push(exp)
//             return
//         }
//         traverse(parseSync(`(${ exp })`), { // 利用babel分析表达式中的所有变量
//             Identifier (path) {
//                 if (
//                     path.parentPath.isMemberExpression() &&
//                     !path.parentPath.node.computed &&
//                     path.parentPath.node.property === path.node
//                 ) {
//                     global.log("path.parentPath.node.object.name", path.parentPath.node.object.name)
//                     var name = path.parentPath.node.object.name
//                     if (name) {
//                         vars.push(path.parentPath.node.object.name) // 收集变量
//                     }

//                 }
//             }
//         })
//     }

//     global.log("self.vars", vars)
//     return vars
// }



/**
 * 获取wxml里面的所有变量
 * @param {*} code
 * @returns
 */
function getTemplateVarList (code, hasTemplateContainer = true) {

    var $wxmlAst = $(code, { parseOptions: { language: 'html' } })

    var expList = getTemplateExpressionList($wxmlAst)
    var eventFnList = getTemplateEventFnList($wxmlAst)

    // global.log('list :>> ', JSON.stringify(expList))

    //添加绑定的事件函数也添加上 TODO: 如果绑定事件的是三元表达式这类，暂时先不管
    // <v-nav class="item" src="/images/icon-home-{{index+1}}.png" text="{{item.name}}"
    //    data="{{item}}" bind:click="{{index ? 'bb' : 'bindClick'}}"/>
    expList.push(...eventFnList)

    //取第一个变量
    var varList = []
    expList.map(function (obj) {
        var code = obj.code
        var type = obj.type
        // var list = getVariableListByKey(code)
        // var first = list[0]
        var list = getExpFirstVarList(code)
        varList.push(...list)
    })
    // global.log('expList :>> ', JSON.stringify(expList))

    //去掉compName
    varList = varList.filter(item => item !== 'compName')

    //去重
    varList = utils.duplicateRemoval(varList)

    return varList
}



/**
 * // 获取表达式里面的第一个变量
 * //https://play.gogocode.io/#code/N4IglgdgDgrgLgYQPYBMCmIBcIAUBDAOgCMCBjAAgDJLyiBKcgH0fJwuvJToB0JeAbMAGc4AbUjoAHgF0CEPAFs0vXijxxCcMHH7K+EQSNEByCWknHZWnXt6Ei46SAA0IAO5IATgGtk6LCAAZjAQpFpIEORwnngQQoFeCjiBYLoAkhAJzuR4UGDZSFDhcQzAvOTkpBEi5AAk5AC8OXkEAOZI7VXo5ZXVcORCSDCepGiN5CnpmUgEg8OjPQD0i+SeaHDDkQCeQ55RMXEJnkoovejkABZoaz1Vcf1rQjD8-U2i0j21OHMjaDyRFXIBBSEBQOGMtQA+rVjP9AUC0HhSBccDhtGgFAwGgA+chlAHwsCBVg9eEVdEKAhQPBrCBwHB0OSoNAEOBbKBjBpNYwAWQxRGuAFFJFBHkIwBFjFRKKSyRSqTS0HScABGRkQZms9ljACE3L5CgFnmForQQnFktlFVKVsBd0GugI-A6qpV2Qp-1tFQAbjTyBr0AAFdQXcYU0QABlkAbQwbgFy95F9eygcYuADlmeMY2mFbS4LmY4miSSCWSKqmQ5n0FqOY0ueRefyhSKxRKIFLqImK2nqyyqgpYHA0ChEzay+XloB9OUA9GaAG6dANNegA3lQDzid3VmbnnAqTAhCj5a0ldd1GgGXDy+QAL7kND8IRjfEXwHLciAZPjAF+K9jIgBC3QA03oAAOUAKjlVzwddkwGaIw2HSlqXzBk2iPGJhwZFQJzJe0kEdZ1WnBERPAAJmMbI8PPJ88PGPDZigQR6UWURuG4AgGPeRY6EjD40PhR4tx3PdvmiUiyUvW1r1ve9yBLNFoLzJV6XVTU2TrPVGwNI0TTbSVxyfDCsJdfD8ME+EXw-Rdv1XRNuJeXj92kw8IGPZC6EMq8bzvB9Ex0llsJwABmHz3Wg5yfT9HMQygjF2KZIMQ0TcDK3jPts2ZXNYNkwtmWLYkcHXeKMwU7V631ZtjVbM0LQ7aUct7TUByHEcxzxddp3nZc104wFLO3WA+IPRCTzPRNhLQob4UvQSejWDZPEiUQCDm+y3HIABldYcE6ugOKGlxwGgeAABlYlaAJFLNUhPDAIptouPAhEDSatGuLBAjwNzXCeIgADUwDQNwABVtWOtYMEvIA * @param {*} code
 * @returns
 */
function getExpFirstVarList (source) {
    var result = []
    $(source)
        .find('$_$')
        .each((item) => {
            if (
                item.parent().node.type == 'MemberExpression' &&
                item.parent(1).node.type != 'MemberExpression'
            ) {
                // global.log(11, item)

                var nodePath = item[0].nodePath
                var pPathNode = nodePath.parentPath.node
                if (
                    pPathNode.type === 'MemberExpression' &&
                    pPathNode.computed
                ) {
                    //也是独立变量
                    result.push(item.generate())
                } else {
                    // 输出a.b.c的第一个变量a
                    var str = item.parent().generate()

                    //   global.log('str2', str)
                    str = str.split(/[\.\[]/)[0]
                    result.push(str)
                }
            } else if (item.parent().node.type != 'MemberExpression') {
                // global.log(22)
                // 输出独立的变量
                result.push(item.generate())
            } else {
                // global.log(33, item)
                var nodePath = item[0].nodePath
                var pPathNode = nodePath.parentPath.node
                if (
                    pPathNode.type === 'MemberExpression' &&
                    pPathNode.computed
                ) {
                    //也是独立变量
                    result.push(item.generate())
                }
            }
        })

    return [...new Set(result)]
}


module.exports = {
    getTemplateVarList
}






// function transform () {
//     var code = `
//     <template name="foo">
//       <view class="foo-content">
//         <text class="text1">{{item.text1}}</text>
//         <image class="pic" src="{{pic.url}}" mode="aspectFill"></image>
//       </view>
//     </template>

//     <template name="bar">
//       <view class="bar-content">
//         <image class="bar" src="{{pic.url}}" mode="aspectFill"></image>
//         <text class="text2">{{item.text2}}</text>
//       </view>
//     </template>`

//     // code = `<image class="{{bar}}" src="{{item.pic.url}}" mode="aspectFill"></image>`

//     const $ = cheerio.load(code)

//     searchVars($)

//     // $.html()
//     //=> <html><head></head><body><h2 class="title welcome">Hello there!</h2></body></html>
// }
