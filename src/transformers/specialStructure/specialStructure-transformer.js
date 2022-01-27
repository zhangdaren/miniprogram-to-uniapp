/*
 * @Author: zhang peng
 * @Date: 2021-09-06 15:00:52
 * @LastEditTime: 2021-11-09 16:52:55
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\specialStructure\specialStructure-transformer.js
 *
 */

// 结构一：
// {
//  data: function(a, t, e) {
//         return t in a ? Object.defineProperty(a, t, {
//             value: e,
//             enumerable: !0,
//             configurable: !0,
//             writable: !0
//         }) : a[t] = e, a;
//     }({
//         wxuser: null,
//         order: null,
//         sets: null,
//     }, "order", {
//         ddress: "",
//         agenter: "0",
//         agentfee: "0.00",
//     }),
// }

// 转换为：
// {
//     wxuser: null,
//     order: null,
//     sets: null,
//     order:{
//         ddress: "",
//         agenter: "0",
//         agentfee: "0.00",
//     }
// }

//结构一扩展：
// Page(function (e, t, a) {
//     return t in e ? Object.defineProperty(e, t, {
//         value: a,
//         enumerable: !0,
//         configurable: !0,
//         writable: !0
//     }) : e[t] = a, e
// }({
//     data: {
//         status: 0,
//         name: "",
//         address: "",
//         tel: "",
//         address_list: [],
//         check_num: null,
//         region: ["北京市", "北京市", "通州区"]
//     },
//     change_check: function (e) {
//         wx.setStorageSync("address_id", e.currentTarget.dataset.id), wx.navigateBack({})
//     },
// }, "onShow", function() {
//     this.getUseraddress();
// }))
// )



//结构二：
// Page(Object.assign({}, {
//     data: {
//         wxuser: null,
//         order: null,
//         sets: null,
//     },
//     onLoad: function(t) {
//         var e = this;
//     },
// })

const t = require("@babel/types")

var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")
/**
 *
 * 处理特殊结构
 *
 * @param {*} $ast
 * @returns
 */
function transformSpecialStructure ($jsAst, fileKey) {
    if ($jsAst) {

        $jsAst
            //结构一
            .find(`(function($$$1){return $$$2}($_$1, $_$2, $_$3))`)
            .each(function (item) {
                var isMatchCondition1 = item.match['$$$2'][0].type === 'ReturnStatement'

                //注：之所以这里判断，是因为前面对代码进行了一行拆分多行的操作，导致上面的那个判断行不通了!!!
                var isMatchCondition2 = (item.match['$$$2'][0].type === 'IfStatement' &&
                item.match['$$$2'][1] && item.match['$$$2'][1].type === 'ReturnStatement')

                if (item.match['$$$1'].length === 3 && (isMatchCondition1 || isMatchCondition2)) {
                    var dataNode = item.match['1'][0].node
                    var keyNode = item.match['2'][0].node
                    var valueNode = item.match['3'][0].node

                    if (dataNode.type === 'ObjectExpression') {
                        dataNode.properties.push({
                            type: 'ObjectProperty',
                            key: keyNode,
                            value: valueNode,
                        })
                    }
                    item.replaceBy(dataNode)
                }
            }).root()
            //结构二
            .replace(`Page(Object.assign({}, {$$$2}))`, 'Page({$$$2})')


        /**
         * //解析这种结构
         * var abc = {...}
         * Component(abc)
         */
        var selector = [
            `Component($_$1)`,
            `Page($_$1)`,
            `App($_$1)`,
        ]


        var varName = ""
        $jsAst
            .find(selector).each(function (item) {
                var node = item.match["1"][0].node
                if (t.isIdentifier(node)) {
                    var nodePath = item[0].nodePath
                    varName = node.name

                    // var callName =item.attr("callee.name")

                    var init = ggcUtils.getScopeVariableInitValue(nodePath.scope, varName)
                    if (t.isObjectExpression(init)) {
                        //确定是变量名本体
                        //尝试修复一下
                        item.attr("arguments", [init])
                        console.log("\n[Tip]这个页面的结构非标准结构，尝试修复一下，如有问题，请先调整后，再转换。 file:" + fileKey)
                    } else {
                        console.log("\n[Tip]这个页面的结构非标准结构，无法自动修复! 请先调整后，再转换。 file:" + fileKey)
                    }
                } else if (t.isObjectExpression(node)) {
                    //这是正常的。
                } else {
                    //这是不正常了, 要不要抛出错误？
                    console.log("\n[Error]这个页面的js的结构写法无法解析   fileKey: " + fileKey)
                }
            })
        if (varName) {
            //删除多余的代码，及多余的导出
            var selector = [
                `var ${ varName } = {$$$}`,
                `let ${ varName } = {$$$}`,
                `const ${ varName } = {$$$}`,
                `module.exports = {
                    ${ varName }:  ${ varName }
                }`
            ]
            $jsAst.replace(selector, "")
        }
    }
    return $jsAst
}

module.exports = { transformSpecialStructure }
