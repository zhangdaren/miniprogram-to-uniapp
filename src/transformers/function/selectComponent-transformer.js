/*
 * @Author: zhang peng
 * @Date: 2021-08-16 11:59:58
 * @LastEditTime: 2022-08-01 20:29:47
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\function\selectComponent-transformer.js
 */

const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")

var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")

/**
 * selectComponent函数处理
 * 使用库zp-select-component替换selectComponent函数
 * 然后对data属性进行收尾
 *
 * @param {*} $ast
 * @param {*} astType
 * @param {*} fileKey
 */
function transformSelectComponent ($jsAst, astType, fileKey) {
    if (!$jsAst) return

    $jsAst
        .find(`$_$.data`)
        .each(function (item) {
            var nodePath = item["0"].nodePath
            var object = nodePath.node.object

            //过滤var aa = a.b.data.c;这种情况
            if (t.isIdentifier(object)) {
                var objectName = object.name
                var init = ggcUtils.getScopeVariableInitValue(nodePath.scope, objectName)
                if (t.isCallExpression(init) && t.isMemberExpression(init.callee) && t.isIdentifier(init.callee.property, { name: "selectComponent" })) {
                    item.replaceBy(object)
                }
            }
        }).root()
}

module.exports = { transformSelectComponent }


//测试样例
// const options = {
// 	linfoldTap() {

// 		var aa = a.b.data.c

// 		var test = this.selectComponent('#tttt')
// 		console.log('#test', test);
// 		console.log('#test', test.data.foo); ///注，这里有data!!!!!!!!!!!!!!!!!!!!!!!!!!!


// 		//根据ID获取组件对象
// 		var showTwo = this.selectComponent('#myShow');
// 		//访问属性,使用data访问内部属性和组件属性
// 		console.info(showTwo.data);
// 		//执行操做
// 		showTwo.innerAdd();

// 		//根据样式获取，建议使用selectAllComponents
// 		var showThree = this.selectComponent('.myShow');
// 		console.info(showThree.data);
// 		showThree.innerAdd();

// 		const my_sel = this.selectComponent(".selectfromcomponent");
// 		//2然后通过setData修改数据(不合理)应该是用下面调用方法的
// 		my_sel.setData({
// 			counter: my_sel.data.counter + 10
// 		})
// 	},
// }
