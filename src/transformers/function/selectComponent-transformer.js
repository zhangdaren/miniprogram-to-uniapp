/*
 * @Author: zhang peng
 * @Date: 2021-08-16 11:59:58
 * @LastEditTime: 2021-12-11 14:30:21
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\function\selectComponent-transformer.js
 */

const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")

var appRoot = "../../../.."
// const ggcUtils = require(appRoot + "/src/utils/ggcUtils")

/**
 * selectComponent函数处理
 * //方案一：
 * var diy = this.selectComponent('#diy')
 * diy.test()
 * 转换为：
 * var diy = this.$mp.page.selectComponent('#diy')
 * diy.$vm.test()
 *
 * //方案二：
 * var diy = this.selectComponent('#diy')
 * diy.test()
 * 转换为：
 * var diy = this.$refs.diy
 * diy.test()
 *
 * @param {*} $ast
 * @param {*} fileKey
 */
function transformSelectComponent ($jsAst, fileKey) {
    if (!$jsAst) return

    $jsAst
        .replace([`$_$.selectComponent($$$)`, `$_$.selectComponent()`], (match, nodePath) => {
            var hasParams = match["$$$$"]
            if (hasParams) {
                return `$_$.$mp.page.selectComponent($$$)`
            } else {
                return `$_$.$mp.page.selectComponent()`
            }
        })

    //   像这种很难搞了
    //   var btns = ownerInstance.selectAllComponents('.btn')
    //   var len = btns.length
    //   var i = len - 1
    //   var mask = ownerInstance.selectComponent('.mask')
    //   var mask2 = ownerInstance.selectComponent('.mask2')
    //   var view = ownerInstance.selectComponent('.weui-slideview')
    // $jsAst
    //     .replace('$_$1.selectComponent("$_$2")', (match, nodePath) => {
    //         var idName = match[2][0].value
    //         idName = idName.replace(/#/, '')
    //         return `$_$1.$refs['${ idName }']`
    //     })
}

module.exports = { transformSelectComponent }
