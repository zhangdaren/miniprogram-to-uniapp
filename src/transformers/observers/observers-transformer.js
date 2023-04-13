/*
 * @Author: zhang peng
 * @Date: 2021-08-16 11:44:02
 * @LastEditTime: 2023-04-13 12:50:33
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
 * @param {*} properties        node参数所在的数组
 * @param {*} index             node参数所在的数组index, 默认为-1
 * @param {*} isReferenceType   是否引用类型，默认为false
 */
function transformWatchItem (node, properties = [], index = -1, isReferenceType = false) {
    var reg = /\.\*\*$/

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

    var keyName = node.key.name || node.key.value
    keyName = keyName.replace(/\s/g, "").replace(/,/g, "_")

    if (keyName === "**") {
        // "**" --> "$data"  //PS:奇巧淫技
        keyName = "$data"

        //添加注释  //PS:这也算奇巧淫技吧。。。
        $(node).before('// fix "**" --> "$data"\n')

        isReferenceType = true
    } else if (keyName.endsWith(".**")) {
        //'some.field.**' --> 'some.field'
        keyName = keyName.replace(reg, "")
        isReferenceType = true
    }

    let objValue = funExp
    let subProperties = []
    if (isReferenceType) {
        let objExp_handle = t.objectProperty(
            t.identifier("handler"),
            funExp
        )

        //Array和Object换成深度监听
        let objExp_deep = ggcUtils.createObjectProperty("deep")

        //对齐微信小程序，开启首次赋值监听
        let objExp_immediate = ggcUtils.createObjectProperty("immediate")

        subProperties = [objExp_deep, objExp_immediate, objExp_handle]

        objValue = t.objectExpression(subProperties)
    }

    //重名
    node.key.name = keyName
    node.key.value = keyName
    //
    if (node.value) {
        node.value = objValue
    } else {
        var objExp = t.objectProperty(t.identifier(keyName), objValue)
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
 * @param {*} _keyName
 * @param {*} fileKey
 */
 function addComputedItem ($jsAst, _keyName, fileKey) {
    /**
     * 处理诸如 "a, b, c" 的情况。关键在于【空格的存在】，
     * 不经过这个处理，后面的 var newKeyName = keyName.replace(/,/g, "_") 会产出
     *
     * "a_ b_ c"的情况，导致报错
     *
     */
    var keyName = _keyName.replace(/\s/g, "");
    var computedList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.COMPUTED, fileKey, true)

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
 * 转换observers是一个函数的情况
 * @param {*} $ast
 * @param {*} fileKey
 */
function transformFunctionObservers ($jsAst, fileKey) {
    // 奇巧淫技，用于解决：
    // observers: (newVal, oldVal)=> {
    //     if(newVal.title!=oldVal.title||newVal.location!=oldVal.location)
    //     {
    //       this.setData({
    //         defaultData:newVal
    //       })
    //     }
    // }
    $jsAst.find(`export default {
        watch: $_$list
    }`).each(item => {
        var node = item.match['list'][0].node
        if (t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) {
            let isWatchAll = !!node.body.body.length

            let content = `"$data": {
                handler: $_$list,
                deep:true,
                immediate:true
            }`
            $jsAst.replace(`export default {$$$, watch: $_$list }`, `export default {$$$, watch: { ${ isWatchAll ? content : '' } } }`)
        }
    }).root()
}

/**
 * observers 转换
 * @param {*} $ast
 * @param {*} fileKey
 */
function transformObservers ($jsAst, fileKey) {
    if (!$jsAst) return

    transformFunctionObservers($jsAst, fileKey)

    var keyNameList = []

    //这种，对properties数组修改时，可能不会更新。。。
    // $jsAst.find("export default {watch:{$$$watch}}")
    //     .each(function (item) {
    //         var properties = item.match["$$$watch"]

    //
    $jsAst.find("export default {watch:$_$watch}")
        .each(function (item) {
            var watchNode = item.match["watch"][0].node
            var properties = watchNode.properties

            if(!properties) {
                global.log(`$jsAst.find("export default {watch:$_$watch}") properties为空   fileKey： ${fileKey}`)
                return
            }

            properties.map(function (node, index) {
                var keyName = node.key.name || node.key.value

                var value = node.value
                if (!value && t.isObjectMethod(node, index)) {
                    value = node
                }

                if (!value) {
                    let pathStr = $(item).generate()

                    let logStr = `[Warn] observers 里: ${ keyName }的监听表达式异常，已尝试处理(可能后续仍需手动调整)     代码： ${ pathStr }    file:  ${ fileKey }`
                    // global.log(logStr)
                    // global.log.push(logStr)

                    global.log(logStr)
                }

                if (keyName && keyName.indexOf(",") > -1) {
                    if (t.isStringLiteral(value)) {
                        // TODO: 可能是这种形式： 'aa,bb,cc,dd': "watchList"
                        console.error(`暂时不考虑'aa,bb,cc,dd': "watchList"这种情况`)
                    } else {
                        var funExp = value

                        //ObjectMethod ObjectMethod
                        var funExpBody = funExp.body.body

                        //组装需要在函数第一行添加的变量声明 const {a, b} = newValue;
                        var objList = funExp.params.map(item => t.objectProperty(item, item, false, true))

                        //将函数的参数替换为 function(newValue, oldValue){}
                        funExp.params = [t.identifier("newValue"), t.identifier("oldValue")]

                        if (objList.length) {
                            //在函数的第一行添加 const {a, b} = newValue;
                            var objectPattern = t.objectPattern(objList)
                            var varPath = t.variableDeclaration("const", [t.variableDeclarator(objectPattern, t.identifier("newValue"))])
                            funExpBody.unshift(varPath)
                        }

                        //添加watch
                        transformWatchItem(node, properties, index, true)

                        keyNameList.push(keyName)
                    }
                } else {
                    let isReferenceType = ggcUtils.checkPropReferenceType(fileKey, keyName)
                    transformWatchItem(node, properties, index, isReferenceType)
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

    //在computed添加keyName
    //注意，此处逻辑需提取出来
    keyNameList.map(keyName => addComputedItem($jsAst, keyName, fileKey))


}

module.exports = { transformObservers }
