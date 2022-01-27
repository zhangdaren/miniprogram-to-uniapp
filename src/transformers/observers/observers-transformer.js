/*
 * @Author: zhang peng
 * @Date: 2021-08-16 11:44:02
 * @LastEditTime: 2021-11-26 16:35:16
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\observers\observers-transformer.js
 *
 */


const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")


var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")



/**
 * 将observer item改造成handler引用方式
 * @param {*} node
 * @param {*} properties  node参数所在的数组
 * @param {*} index       node参数所在的数组index
 */
function transformWatchItem (node, properties = [], index = -1) {
    var reg = /\.\*\*$/

    var keyName = node.key.name || node.key.value
    var funExp = node.value

    if (!funExp && t.isObjectMethod(node)) {
        funExp = ggcUtils.objectMethod2FunctionExpression(node)
    }

    // funExp为undefined的情况，异常情况
    // 下面代码let objExp_handle = t.objectProperty(){}
    // 报错：["Expression", "PatterLike" ] but instead got undefined
    if (!funExp) {
        funExp = t.functionExpression(
            null,
            [t.identifier("newValue"), t.identifier("oldValue")],
            t.blockStatement([])
        )
    }
    let objExp_handle = t.objectProperty(
        t.identifier("handler"),
        funExp
    )
    //对齐微信小程序，开启首次赋值监听
    let objExp_immediate = ggcUtils.createObjectProperty("immediate")

    //Array和Object换成深度监听
    let objExp_deep = ggcUtils.createObjectProperty("deep")

    let subProperties = [objExp_handle, objExp_immediate, objExp_deep]
    let objValue = t.objectExpression(subProperties)

    //'some.field.**' --> 'some.field'
    var newKeyName = keyName.replace(/\s/g, "").replace(/,/g, "_").replace(reg, "")
    node.key.name = newKeyName
    node.key.value = newKeyName
    //
    if (node.value) {
        node.value = objValue
    } else {
        var objExp = t.objectProperty(t.identifier(newKeyName), objValue)
        properties[index] = objExp
    }
}


/**
 * 用于observers多变量时的处理
 * 生成一个对象放入computed里
 *
 *  numberA_numberB() {
 *	   const { numberA, numberB } = this
 *	   return { numberA,numberB }
 *  }
 *
 * @param {*} $jsAst
 * @param {*} keyName
 */
function addComputedItem ($jsAst, keyName) {
    var computedList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.COMPUTED, true)

    var keyList = keyName.split(",")
    var objList = []
    keyList.forEach(function (name) {
        name = name.trim()
        objList.push(t.objectProperty(t.identifier(name), t.identifier(name), false, true))
    })
    var objectPattern = t.objectPattern(objList)
    var varPath = t.variableDeclaration("const", [t.variableDeclarator(objectPattern, t.thisExpression())])
    var returnPath = t.returnStatement(t.objectExpression(objList))
    var body = t.blockStatement([varPath, returnPath])
    var newKeyName = keyName.replace(/,/g, "_")
    var objectMethod = t.objectMethod("method", t.identifier(newKeyName), [], body)

    computedList.push(objectMethod)
}

/**
 * observers 转换
 * @param {*} $ast
 * @param {*} fileKey
 */
function transformObservers ($jsAst, fileKey) {
    if (!$jsAst) return

    /**
     *
     * TODO: 这个暂时没法支持
     * 特别地，仅使用通配符 ** 可以监听全部 setData 。
     *
     * 如果需要监听所有子数据字段的变化，可以使用通配符 ** 。
     *
     *
     */
    //  Component({
    //     observers: {
    //       '**': function() {
    //         // 每次 setData 都触发
    //       },
    //     },
    //   })

    // Component({
    //     observers: {
    //       'some.field.**': function(field) {
    //         // 使用 setData 设置 this.data.some.field 本身或其下任何子数据字段时触发
    //         // （除此以外，使用 setData 设置 this.data.some 也会触发）
    //         field === this.data.some.field
    //       },
    //     },
    //   })

    var reg = /\.\*\*$/

    $jsAst.find("export default {watch:$_$watch}")
        .each(function (item) {
            var watchNode = item.match["watch"][0].node
            var properties = watchNode.properties

            //TODO: 这种就为undefined
            // observers: (newVal, oldVal)=> {
            //     if(newVal.title!=oldVal.title||newVal.location!=oldVal.location)
            //     {
            //       this.setData({
            //         defaultData:newVal
            //       })
            //     }
            // },
            if (!properties) return

            properties.map(function (node, i) {
                var keyName = node.key.name || node.key.value

                // 这种就直接拿node就行了，测试用例
                // observers: {
                //     isUpdateFlow(value) {
                //       if(value) {
                //         this.childNumber = 0;
                //         wx.nextTick(() => {
                //           this.resetParam();
                //           const waterfallItems = this.getRelationNodes('./waterfall-item');
                //           waterfallItems.forEach((waterfallItem) => {
                //             this.childNumber += 1;
                //             waterfallItem.setWaterfallItemPosition();
                //           })
                //         })
                //       }
                //     }
                //   },
                var value = node.value
                if (!value && t.isObjectMethod(node, i)) {
                    value = node
                }

                if (keyName === "**") {
                    let logStr = `[Error] 小程序上 “ ** ” 是监听整个data的变量，但uniapp/vue无此语法，请转换后手动处理!    file:  ${ fileKey }`
                    // console.log(logStr)
                    // global.log.push(logStr)
                    console.log(logStr)
                }

                if (!value) {
                    let pathStr = $(item).generate()

                    let logStr = `[Warn] observers 里: ${ keyName }的监听表达式异常，已尝试处理(可能后续仍需手动调整)     代码： ${ pathStr }    file:  ${ fileKey }`
                    // console.log(logStr)
                    // global.log.push(logStr)

                    console.log(logStr)
                }

                if (keyName && keyName.indexOf(",") > -1) {
                    if (t.isStringLiteral(value)) {
                        // TODO: 可能是这种形式： 'aa,bb,cc,dd': "watchList"
                        console.log(`暂时不考虑'aa,bb,cc,dd': "watchList"这种情况`)
                    } else {
                        var funExp = value
                        var funExpBody = funExp.body.body

                        //将函数的参数替换为 function(newValue, oldValue){}
                        funExp.params = [t.identifier("newValue"), t.identifier("oldValue")]

                        //在函数的第一行添加 const {a, b} = newValue;
                        var keyList = keyName.split(",")
                        var objList = []
                        keyList.forEach(function (name) {
                            name = name.trim().replace(reg, "")
                            objList.push(t.objectProperty(t.identifier(name), t.identifier(name), false, true))
                        })
                        var objectPattern = t.objectPattern(objList)
                        var varPath = t.variableDeclaration("const", [t.variableDeclarator(objectPattern, t.identifier("newValue"))])
                        funExpBody.unshift(varPath)

                        transformWatchItem(node, properties, i)

                        //在computed添加
                        addComputedItem($jsAst, keyName)
                    }
                } else {
                    transformWatchItem(node, properties, i)
                }
            })
        }).root()
        //清除未添加内容的watch对象
        .replace("export default {$$$1, watch:{$$$2}}", (match, nodePath) => {
            if (match['$$$2'].length) {
                return null  //不修改原来的
            } else {
                return `export default {$$$1}`
            }
        })
}

module.exports = { transformObservers }
