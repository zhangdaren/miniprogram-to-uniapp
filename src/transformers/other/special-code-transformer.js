/*
 * @Author: zhang peng
 * @Date: 2021-09-06 15:00:52
 * @LastEditTime: 2021-11-20 11:58:02
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\other\special-code-transformer.js
 *
 */


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
    }

    if ($wxmlAst) {
        //删除所有import标签
        $wxmlAst.replace(`<import></import>`, "")
    }
}

module.exports = { transformSpecialCode }
