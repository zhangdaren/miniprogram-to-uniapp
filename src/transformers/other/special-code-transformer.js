/*
 * @Author: zhang peng
 * @Date: 2021-09-06 15:00:52
 * @LastEditTime: 2023-04-01 22:04:52
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/other/special-code-transformer.js
 *
 */
1
const _ = require('lodash')
const $ = require('gogocode')
const t = require("@babel/types")

var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")

/**
 * 抹平小程序与uni-app在showModal这个api之前的差异
 * const res = await uni.showModal({ content: '确定吗' });
 * 转换为：
 * const [err, res] = await uni.showModal({ content: '确定吗' });
 * @param {*} $jsAst
 * @param {*} fileKey
 * @returns
 */
function transformAwaitShowModal ($jsAst, fileKey) {
    if (!$jsAst) return

    $jsAst.replace(
        [
            `const $_$1 = await uni.showModal($_$2)`,
            `let $_$1 = await uni.showModal($_$2)`,
            `var $_$1 = await uni.showModal($_$2)`,
            //这里的选择器顺序不能乱！！！先选择有内容，内选择无内容的。
            `const $_$1 = await uni.showModal()`,
            `let $_$1 = await uni.showModal()`,
            `var $_$1 = await uni.showModal()`,
        ],
        (match, nodePath) => {
            var kind = nodePath.node.kind
            var content = match['2']
            if (content) {
                return `${ kind } [err, $_$1] = await uni.showModal($_$2)`
            } else {
                return `${ kind } [err, $_$1] = await uni.showModal()`
            }
        }
    )
}



/**
 * 处理手动调用下拉刷新函数this.onPullDownRefresh() --> uni.startPullDownRefresh()
 * uni-app是不允许调用生命周期函数，因此替换为uni.startPullDownRefresh();
 * @param {*} $jsAst
 * @param {*} fileKey
 * @returns
 */
function transformThisDotOnPullDownRefresh ($jsAst, fileKey) {
    if (!$jsAst) return

    $jsAst
        .replace(`$_$.onPullDownRefresh()`, (match, nodePath) => {
            var object = _.get(nodePath, "node.callee.object", "")

            var isThis = false
            if (t.isThisExpression(object)) {
                isThis = true
            } else if (t.isIdentifier(object)) {
                var objectName = object.name
                var init = ggcUtils.getScopeVariableInitValue(nodePath.scope, objectName)
                if (t.isThisExpression(init)) {
                    isThis = true
                }
            }
            return isThis ? `uni.startPullDownRefresh()` : "null"
        })
}



/**
 * 转换特殊变量 & 清理代码
 * 把只有一行的这种代码集中一下
 *
 * var nowPage = getCurrentPages();
 * nowPage.__route__.xxx  -->  nowPage.route.xxx
 *
 * app.globalData.checkIsHome('/' + _this.$scope.route);  -->  app.globalData.checkIsHome('/' + _this.$vm.route);
 *
 * 处理 this.setData(this.data); 这种情况
 *
 * @param {*} $ast
 * @returns
 */
function transformSpecialCode ($jsAst, $wxmlAst) {
    if ($jsAst) {
        $jsAst
            // .replace("$_$1.__route__", "$_$1.route")
            .replace("$_$1.$scope", "$_$1.$vm")

            //注意：表达式里面$_$1与$_$1不是同一个元素
            .replace('$_$1.setData($_$2.data)', (match, nodePath) => {
                var node1 = match[1][0]
                var node2 = match[2][0]
                if (node1.value === node2.value) {
                    return ""
                }
                return null
            })

        transformAwaitShowModal($jsAst)
        transformThisDotOnPullDownRefresh($jsAst)

        //wx.nextTick -> this.$nextTick  可能的风险点：this引用不对
        //为何是uni.nextTick？可能之前已经奖名字改了，，so~
        //TODO: 使用setTimeout模拟
        $jsAst.replace('uni.nextTick', 'this.$nextTick')


        //处理selectComponent和selectAllComponents
        $jsAst.replace('$_$1.selectComponent', '$_$1.zpSelectComponent')
            .replace('$_$1.selectAllComponents', '$_$1.zpSelectAllComponents')
    }

    if ($wxmlAst) {
        //删除所有import标签
        $wxmlAst.replace(`<import></import>`, "")
    }
}

module.exports = { transformSpecialCode }
