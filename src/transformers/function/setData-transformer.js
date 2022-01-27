/*
 * @Author: zhang peng
 * @Date: 2021-08-16 11:44:02
 * @LastEditTime: 2022-01-06 14:24:37
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\function\setData-transformer.js
 *
 */

const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")



var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")


/**
 * 获取setdata不能识别的表达式的字符串
 * @param {*} keyNode
 * @param {*} thisName
 * @param {*} scope
 * @param {*} fileKey
 * @returns
 */
function getParamsExpressionString (keyNode, thisName, scope, fileKey) {
    var codeStr = ""

    //检测setData里面的变量 [${ name }] 是数组形式，uniapp不支持，已尝试进行修复
    var keyStr = $(keyNode).generate()

    if (t.isTemplateLiteral(keyNode)) {
        //含模板字符串
        // this.setData({
        //     [`numarr[${index+1}].num`]: '',
        //     acitveIndex: index,
        // })

        // this.setData({
        //     [`${style}.xxx.${name}`]: 11
        // });

        //先替换在[]里的变量
        keyStr = keyStr.replace(/\[\$\{([^\{]*)\}\]/g, "[$1]")
        keyStr = keyStr.replace(/\.\$\{([^\{]*)\}/g, "[$1]")
        keyStr = keyStr.replace(/\$\{([^\{]*)\}/g, "[$1]")
        keyStr = keyStr.replace(/`/g, "")

        var dotStr = keyStr[0] === "[" ? "" : "."
        codeStr = thisName + dotStr + keyStr

    } else if (t.isBinaryExpression(keyNode)) {
        //不含模板字符串
        // this.setData({
        //     ["info.jishilist[" + index + "].ifguanzhu"]: 0
        // });
        keyStr = keyStr.replace(/["']\s*\+\s*|\s*\+\s*["']|["']/g, "")

        var dotStr = keyStr[0] === "[" ? "" : "."
        codeStr = thisName + dotStr + keyStr
    } else if (t.isIdentifier(keyNode)) {
        //变量的形式:
        // this.setData({
        //     [field]: 0
        // });
        //注意： 这种经测试，H5里，不用转换也是可行的。
        var init = ggcUtils.getScopeVariableInitValue(scope, keyNode.name)
        if (init) {
            //重新获取
            var newKeyStr = getParamsExpressionString(init, thisName, scope, fileKey)

            keyStr = newKeyStr || keyStr

            keyStr = keyStr.replace(/["']\s*\+\s*|\s*\+\s*["']|["']/g, "")

            if (keyStr.indexOf(thisName) === 0) {
                codeStr = keyStr
            } else {
                var dotStr = keyStr.indexOf("[") === 0 ? "." : ""
                codeStr = thisName + dotStr + "[" + keyStr + "]"
            }
        } else {
            codeStr = thisName + "." + keyStr
            //找不到，修复不了
            // console.log(`[Tip]找不到setData里面的变量${ keyNode.name }的声明处，暂无法修复。 file:${ fileKey }.js`)
        }
    }
    return codeStr
}



/**
 * 针对setData里面含有数组时的处理
 * @param {*} $ast
 * @param {*} fileKey
 */
function transformSetData ($ast, fileKey) {
    if (!$ast) return

    $ast
        .find(['$_$this.setData({$$$List}, $_$callback)', '$_$this.setData({$$$List})'])
        .each(function (item) {
            var thisNode = item.match['this'][0].node

            var list = item.match['$$$List']   //这个是clone对象
            var listNode = item.attr("arguments.0.properties")  //这个才是真实对象

            var callbackNode = item.match["callback"]

            var scope = item[0].nodePath.scope

            var bool = true
            if (bool) {
                //局部
                var i = list.length - 1
                while (i >= 0) {
                    var op = list[i]
                    var value = op.value
                    var keyNode = op.key
                    var computed = op.computed

                    var thisName = $(thisNode).generate()
                    if (computed) {
                        var codeStr = getParamsExpressionString(keyNode, thisName, scope, fileKey)

                        if (codeStr) {
                            // //尝试修复一下
                            var newExp = codeStr + "=" + $(value).generate() + "\n"
                            item.before(newExp)

                            listNode.splice(i, 1)
                        }
                    }
                    i--
                }
            } else {
                //全部
                //TODO:还是有问题，比如：
                // t.invoice_info.company || this.setData({
                //     invoicenumber: ""
                // });
                var len = list.length - 1
                var i = 0
                while (i <= list.length - 1) {
                    var op = list[i]
                    var value = op.value
                    var keyNode = op.key
                    var computed = op.computed

                    var thisName = $(thisNode).generate()
                    if (computed) {
                        var codeStr = getParamsExpressionString(keyNode, thisName, scope, fileKey)

                        if (codeStr) {
                            // //尝试修复一下
                            var newExp = codeStr + "=" + $(value).generate() + "\n"
                            item.before(newExp)

                            listNode.splice(i, 1)
                        }
                    } else {
                        var keyStr = $(keyNode).generate()
                        codeStr = thisName + "." + keyStr.replace(/['"]/g, '')

                        // //尝试修复一下
                        var newExp = codeStr + "=" + $(value).generate() + "\n"
                        item.before(newExp)

                        listNode.splice(i, 1)
                    }
                    i++
                }
            }

            //TODO: 回调事件的处理
            //如果setData里无对象、且无回调事件时，直接删除
            if (listNode.length === 0 && !callbackNode) {
                item.remove()
            }
        }).root()
}

module.exports = { transformSetData }


//测试用例：

// Component({

// 	pickerchange(e) {

// 		this.setData({
// 			[`numarr[${index+1}].num`]: '',
// 			acitveIndex: index,
// 		})

// 		this.setData({
// 			[`${style}.xxx.${name}`]: 11
// 		});

// 		this.setData({
// 			["info.jishilist[" + index + "].ifguanzhu"]: 0
// 		});

// 		let field = e.currentTarget.dataset.name;
// 		this.setData({
// 			[`${field}`]: name
// 		})
// 	},
// 	pickerchange2(e) {
// 		let field = e.currentTarget.dataset.name;

// 		this.setData({
// 			[`params.${field}`]: name
// 		})
// 		console.log('picker确定，携带值为', field, e, value, columnData)
// 	},
// 	checkboxPickerChange(e) {
// 		let field = e.currentTarget.dataset.name
// 		this.setData({
// 			[`params.${field}`]: field == 'month' ? e.detail.map(item => item.id).toString() || '' : e
// 				.detail.map(item => item.name).toString() || '',
// 			[field]: e.detail
// 		})
// 	},
// 	onChange(field1, e) {
// 		var field = `item${index}`
// 		this.setData({
// 			[field]: e.detail.value
// 		})
// 	},
// 	ready() {
// 		var field = "test";
// 		this.setData({
// 			[field]: e.detail.value
// 		})

// 		this.setData({
// 			[`numarr[${index+1}].num`]: '',
// 			acitveIndex: index,
// 		})

// 		this.setData({
// 			password: mobile,
// 			[`numarr[${index}].num`]: val[index],
// 			acitveIndex: index,
// 		})

// 	},
// });

                    // var title = 'language[' + i + '].title';
                    // var value = 'language[' + i + '].value';
                    // var values = data.data[0][data.dataModel[i].FieldName];
                    // if (values == "" || values == null) {
                    //     values = '-';
                    // }
                    // that.setData({
                    //     [title]: data.dataModel[i].Title,
                    //     [value]: values
                    // })
                    // that.setData({
                    //     ['language[' + i + '].list[' + j + '].title']: value.Title,
                    //     ['language[' + i + '].list[' + j + '].value']: values
                    //   })

    //TODO:这里还有一种是变量引用的
    // this.setData(data)
    // var t = e.delta ? e.delta : 1;
    // if (e.data) {
    //     var n = getCurrentPages(), o = n[n.length - (t + 1)];
    //     o.pageForResult ? o.pageForResult(e.data) : o.setData(e.data);
    // }
    // var m = {};
    //     m[e] = g, l.setData(m)
