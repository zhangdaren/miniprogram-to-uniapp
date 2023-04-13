const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")

var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")

/**
 * this.createSelectorQuery() 转换
 * @param {*} $ast
 */
function transformSelectorQuery ($ast) {
    if (!$ast) return

    $ast
        .replace(
            [
                `$_$1.createSelectorQuery().$_$2($_$3)`,
                `$_$1.createSelectorQuery()`,
            ],
            (match, nodePath) => {
                var firstName = match['1'][0].value
                var hasFun = !!match['2']

                var res = null
                if (hasFun) {
                    var funName = match['2'][0].value
                    if (funName !== 'in') {
                        res = `uni.createSelectorQuery().in(${ firstName }).${funName}($_$3)`
                    }
                } else {
                    var firstNode = match['1'][0].node
                    if (t.isThisExpression(firstNode)) {
                        res = `uni.createSelectorQuery().in(${ firstName })`
                    } else if (t.isIdentifier(firstNode)) {
                        var objectName = firstNode.name
                        var init = ggcUtils.getScopeVariableInitValue(nodePath.scope, objectName)
                        if (t.isThisExpression(init)) {
                            //确定是this的别名
                            res = `uni.createSelectorQuery().in(${ firstName })`
                        }
                    }
                }
                return res
            })
}

module.exports = { transformSelectorQuery }



//测试用例：
// const query = this.createSelectorQuery();
// query.select('.dt-list >>> .dt-item')
//   .boundingClientRect()
//   .exec(([ret]) => {
//     console.log('how to find `dt-item` in this query', ret);
//     // how to find `dt-test` in this qury null
//   });

// wx.createSelectorQuery().in(this).select(".slot").boundingClientRect().exec();

// class NodeUtil {
// async getNodeRectFromComponent(e, t) {
//     return await new Promise((o) => {
//         e.createSelectorQuery()
//             .select(t)
//             .boundingClientRect((e) => {
//                 o(e);
//             })
//             .exec();
//     });
// }

// async getNodesRectFromComponent(e, t) {
//     return await new Promise((o) => {
//         e.createSelectorQuery()
//             .selectAll(t)
//             .boundingClientRect((e) => {
//                 o(e);
//             })
//             .exec();
//     });
// }

// async getNodeFieldsFromComponent(e, t, o) {
//     return await new Promise((n) => {
//         e.createSelectorQuery()
//             .select(t)
//             .fields(o, (e) => {
//                 n(e);
//             })
//             .exec();
//     });
// }
// }

// mounted() {
//     requestAnimationFrame(() => {
//         this.swiping = true;
//         this.setData({
//             container: () => this.createSelectorQuery().select('.van-tabs'),
//         });
//         this.resize();
//         this.scrollIntoView();
//     });
// },
