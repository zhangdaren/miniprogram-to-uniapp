/*
 * @Author: zhang peng
 * @Date: 2021-08-18 13:56:43
 * @LastEditTime: 2022-01-19 15:16:08
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\utils\renameUtils.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const clone = require("clone")

var appRoot = "../.."

const utils = require(appRoot + '/src/utils/utils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')

const { getMustacheTokens, parseMustache, stringifyMustache } = require(appRoot + "/src/utils/mustacheUtils")


/**
 * 对data里面的变量或methods里面的方法进行重命名
 * @param {*} $jsAst
 * @param {*} oldName
 * @param {*} newName
 * @param {*} type      data里面的变量还是函数(取值：DATA, METHODS)
 * @returns
 */
function renameDataOrMethods ($jsAst, oldName, newName, type) {
    if (!$jsAst) return
    var selector = {
        DATA: `export default {
                    data() {
                        return $_$list
                    }
                }`,
        METHODS: `export default {
                    methods: $_$list
                }`
    }

    //替换data下面的变量名或methods下面的函数名
    $jsAst
        .find(selector[type])
        .each(function (item) {
            var list = item.match['list'][0].node.properties
            if (!list) return

            //TODO:要不要创建呢？？？？？？？？
            // var res = list.find(node => node.key.name === oldName || node.key.value === oldName)
            // if(!res){
            //     if(type === "DATA"){
            //         list.push()
            //     }
            // }
            // res.key.name = newName
            // res.key.value = newName

            list.map(function (node) {
                var keyName = node.key.name || node.key.value
                if (keyName === oldName) {
                    //有点取巧了，直接把类型变了算了，懒得判断了
                    node.key = {
                        type: 'Identifier',
                        name: newName,
                    }
                }
            })
        })
        .root()

}
/**
 * 给MemberExpression的property进行重名
 * @param {*} item
 * @param {*} propNameList
 */
function renameProperty (item, oldName, newName, propNameList, ast) {
    if (!item || !item.length) {
        return
    }
    // TODO: 暂时简单处理，如果name是prop里的话，就不对this.xxx进行重名了
    if (propNameList.includes(oldName)) {
        return
    }

    item.attr('property.name', newName)
    item.attr('property.value', newName)


    //判断是否在watch里，如果碰到prop里面也有watch的话，两个操作交叉的不太好弄
    // var isInWatch = false
    // item.parents().each(parent => {
    //     if (parent.node
    //         && parent.node.type == 'ObjectProperty'
    //         && t.isIdentifier(parent.node.key, { name: "watch" })
    //     ) {
    //         isInWatch = true
    //     }
    // })

    // console.log('object :>> ', ast.generate())

    // if (!isInWatch) {
    //     item.attr('property.name', newName)
    //     item.attr('property.value', newName)
    // }
}

/**
 * 对this.xxx进行重名
 * this.xxx --> this.newName
 * @param {*} $jsAst
 * @param {*} oldName
 * @param {*} newName
 * @param {*} type      要改的是变量还是方法(取值：DATA, METHODS)
 * @returns
 */
function renameThisDotXXX ($jsAst, oldName, newName, type) {
    if (!$jsAst) return

    var propList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, "PROPS")
    var propNameList = propList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    $jsAst.root()
        .find([
            {
                type: 'MemberExpression',
                property: {
                    value: oldName,
                },
            },
            {
                type: 'MemberExpression',
                property: {
                    name: oldName,
                },
            },
        ])
        .each(function (item) {
            var nodePath = item['0'].nodePath
            var object = item.attr('object')
            var parentNode = nodePath.parentPath.node
            if (object.type === 'ThisExpression') {
                if (type === "METHODS") {
                    if (t.isCallExpression(parentNode)) {
                        renameProperty(item, oldName, newName, propNameList, $jsAst)
                    }
                } else {
                    renameProperty(item, oldName, newName, propNameList, $jsAst)
                }
            } else {
                var objectName = object.name
                var res = nodePath.scope.lookup(objectName)
                if (res && res.bindings[objectName]) {
                    var scopeNode = res.bindings[objectName][0]
                    var scopeParentNode = scopeNode.parentPath
                    if (
                        scopeParentNode.node.type === 'VariableDeclarator' &&
                        scopeParentNode.node.init.type === 'ThisExpression'
                    ) {
                        //确定是this的别名
                        if (type === "METHODS") {
                            if (t.isCallExpression(parentNode)) {
                                renameProperty(item, oldName, newName, propNameList, $jsAst)
                            }
                        } else {
                            renameProperty(item, oldName, newName, propNameList, $jsAst)
                        }
                    }
                }
            }
        })
        .root()
}




/**
 * 对this.data.xxx进行重名  [增强版]
 * this.data.xxx --> this.data.newName
 * @param {*} $jsAst
 * @param {*} oldName
 * @param {*} newName
 * @param {*} type      要改的是变量还是方法(取值：DATA, METHODS)
 * @returns
 */
function renameThisDotDataDotXXX ($jsAst, oldName, newName, type) {
    if (!$jsAst) return

    var propList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, "PROPS")
    var propNameList = propList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    //TODO: 这里应该有四种情形
    // var tt = function(){
    //     var a = this.data.seach;
    //     var b = this['data'].seach;
    //     var c = this['data']['seach'];
    //     var d =  this.data['seach'];
    // }

    $jsAst
        .find('$_$this.data.$_$value')
        .each(function (item) {

            var thisNode = item.match["this"][0].node
            var valueNode = item.match["value"][0].node

            var nodePath = item['0'].nodePath
            var parentNode = nodePath.parentPath.node
            if (thisNode.type === 'ThisExpression') {
                if (type === "METHODS") {
                    if (t.isCallExpression(parentNode)) {
                        renameProperty(valueNode, oldName, newName, propNameList, $jsAst)
                    }
                } else {
                    renameProperty(valueNode, oldName, newName, propNameList, $jsAst)
                }
            } else {
                var objectName = thisNode.name
                var res = nodePath.scope.lookup(objectName)
                if (res && res.bindings[objectName]) {
                    var scopeNode = res.bindings[objectName][0]
                    var scopeParentNode = scopeNode.parentPath
                    if (
                        scopeParentNode.node.type === 'VariableDeclarator' &&
                        scopeParentNode.node.init.type === 'ThisExpression'
                    ) {
                        //确定是this的别名
                        if (type === "METHODS") {
                            if (t.isCallExpression(parentNode)) {
                                renameProperty(valueNode, oldName, newName, propNameList, $jsAst)
                            }
                        } else {
                            renameProperty(valueNode, oldName, newName, propNameList, $jsAst)
                        }
                    }
                }
            }
        })
        .root()
}


/**
 * 对setData表达式里面的变量进行重名
 * this.setData({
 *      $data:{}
 * })
 * 转换为：
 * this.setData({
 *      newName:{}
 * })
 * @param {*} $jsAst
 * @param {*} oldName
 * @param {*} newName
 * @returns
 */
function renameSetDataVariable ($jsAst, oldName, newName) {
    if (!$jsAst) return

    var isInSetData = false
    $jsAst
        .find('$_$.setData($_$list)')
        .each(function (item) {
            var list = item.match['list'][0].node.properties
            if (!list) return
            list.map(function (node) {

                var keyName = node.key && (node.key.name || node.key.value) || ""
                if (keyName === oldName) {
                    //TODO: 如果oldName刚好在这个变量里呢？ 比如：
                    // this.setData({
                    //     [oldName + "text"]:"1024"
                    // })

                    //处理缩写的情况
                    // this.setData({
                    //     buttons
                    // });
                    node.shorthand = false

                    node.key = {
                        type: 'Identifier',
                        name: newName,
                    }

                    isInSetData = true
                }
            })
        }).root()

    if (isInSetData) {
        //如果watch没有prop，则加入，有则添加一行代码
        addPropToWatchHandle($jsAst, oldName, newName)
    }
}

/**
 * 如果watch没有prop，则加入，有则添加一行代码
 * @param {*} $jsAst
 * @param {*} oldName
 * @param {*} newName
 */
function addPropToWatchHandle ($jsAst, oldName, newName) {
    var watchList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, "WATCH", true)

    var watchItemNode = watchList.find(function (item) {
        return item.key && (item.key.name === oldName || item.key.value === oldName)
    })

    if (watchItemNode) {
        //已存在则不加入
        var funExp = watchItemNode.value.properties.find(function (item) {
            return item.key && (item.key.name === "handler" || item.key.value === "handler")
        })

        if (t.isFunctionExpression(funExp.value)) {
            var ast = $(funExp)
            var res = ast.find([
                `var $_$ = this.${ oldName }`,
                `let $_$ = this.${ oldName }`,
            ])
            if (res.length === 0) {
                var code = `this.${ newName } = this.deepClone(this.${ oldName })`
                var node = $(code, { isProgram: false }).node
                funExp.value.body.body.unshift(node)
            }
        }
    } else {
        //不存在则在watch加入
        var assExp = t.assignmentExpression("=", t.memberExpression(t.thisExpression(), t.identifier(newName)), t.identifier("newVal"))
        var blockStatement = t.blockStatement([t.expressionStatement(assExp)])
        var funExp = t.functionExpression(null, [t.identifier("newVal"), t.identifier("oldVal")], blockStatement)
        var objExp = t.objectProperty(t.identifier(oldName), funExp)

        // var funExp = $(`{${oldName}: function(newVal, oldVaL) {
        //     this.${ newName } = newVal;
        // }}`).node

        var propList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.PROPS)
        var propType = ggcUtils.getPropTypeByPropList(propList, oldName)

        ggcUtils.addWatchHandlerItem($jsAst, watchList, oldName, propType, objExp)
    }

}

/**
 * 扩展运算符的处理(buttons 在prop里)
 * const { buttons, icon } = this;
 * @param {*} $jsAst
 * @param {*} oldName
 * @param {*} newName
 */
function spreadSyntaxHandle ($jsAst, oldName, newName) {


}

/**
 * 变量与函数同名时，对【this.函数】也进行替换
 * 注意：必须在未对this.data.xxx转换为this.xxx之前调用，否则可能无效！
 *
 * this.oldName --> this.newName
 * @param {*} $jsAst
 * @param {*} oldName
 * @param {*} newName
 * @param {*} type
 * @returns
 */
function renameThisDotFun ($jsAst, oldName, newName, type) {
    if (!$jsAst) return

    $jsAst.find(`$_$this.${ oldName }`).each(function (item) {
        var thisNode = item.match["this"][0].node

        var nodePath = item[0].nodePath
        var property = nodePath.node.property

        if (thisNode.type === 'ThisExpression') {
            property.name = newName
            property.value = newName
        } else {
            var objectName = thisNode.name
            var res = nodePath.scope.lookup(objectName)
            if (res && res.bindings[objectName]) {
                var scopeNode = res.bindings[objectName][0]
                var scopeParentNode = scopeNode.parentPath
                if (
                    scopeParentNode.node.type === 'VariableDeclarator' &&
                    scopeParentNode.node.init.type === 'ThisExpression'
                ) {
                    property.name = newName
                    property.value = newName
                }
            }
        }
    })
        .root()
}

/**
 *
 * 替换js里面的变量名，含data、生命周期和methods等
 *
 * @param {*} $jsAst         ast
 * @param {*} oldName        旧名，必填
 * @param {*} newName        新名，必填
 * @param {*} type           要替换data里面的变量还是methods里面的函数(取值：DATA, METHOD)
 * @returns
 */
function renameScriptVariable ($jsAst, oldName, newName, type) {
    if (!$jsAst) return
    if (!newName) throw new Error("renameScriptVariable 没有newName")
    if (!oldName) throw new Error("renameScriptVariable 没有oldName")

    //1.找到data里面的变量并重名
    renameDataOrMethods($jsAst, oldName, newName, type)

    //2.找到所有this.data.xxx进行重名
    renameThisDotDataDotXXX($jsAst, oldName, newName, type)

    //3.对this.xxx进行替换，如果是函数与变量重名了
    renameThisDotFun($jsAst, oldName, newName, type)

    //3.扩展运算符的处理(buttons 在prop里)
    //const { buttons, icon } = this;  --> ?
    spreadSyntaxHandle($jsAst, oldName, newName)

    if (type === "DATA") {
        //4.还有setData里面的变量
        renameSetDataVariable($jsAst, oldName, newName)
    }
}


/**
 * 替换template里面的变量名
 * //js不支持重载...
 * renameTemplateVariable ($wxmlAst, replaceList)
 * renameTemplateVariable ($wxmlAst, oldName, newName)
 *
 * replaceList数据结构：
 * [{
 *     oldName,  // 旧名
 *     newName   // 新名
 * }]
 * @param {*} $wxmlAst     $wxmlAst
 * @param {*} replaceList  需要替换的变量hash对象数组
 *
 */
function renameTemplateVariable ($wxmlAst) {
    if (!$wxmlAst) return

    var replaceList = []
    var arg2 = arguments[1]
    var isOnlyReplaceFunction = false
    if (Array.isArray(arg2)) {
        replaceList = arg2
        isOnlyReplaceFunction = arguments[2]
    } else if (utils.isString(arg2)) {
        var oldName = arg2
        var newName = arguments[2]

        if (!oldName) throw new Error("renameTemplateVariable 没有oldName")
        if (!newName) throw new Error("renameTemplateVariable 没有newName")

        replaceList = [{ oldName, newName }]

        isOnlyReplaceFunction = arguments[3]
    }

    var bindReg = /^(:|v-|@)/
    $wxmlAst.find('<$_$tag></$_$tag>')
        .each(function (item) {
            var attributes = item.attr("content.attributes")
            var children = item.attr("content.children")

            //处理标签属性
            if (attributes) {
                attributes.forEach(function (attr) {
                    var attrNode = attr.key
                    var valueNode = attr.value

                    if (attr.value) {
                        //判断：有些属性没有值，如v-else
                        var attr = attrNode.content
                        var value = valueNode.content

                        //TODO: 标签属性只弄绑定事件的
                        //TODO: 可能这里不太全面！！！！！！！！！！
                        if (isOnlyReplaceFunction && attr[0] !== "@") return

                        if (bindReg.test(attr) && value) {
                            var newValue = value
                            replaceList.forEach(function (item) {
                                let { oldName, newName } = item
                                newValue = renameTemplateAttrVariable(newValue, oldName, newName, isOnlyReplaceFunction)
                            })
                            valueNode.content = newValue
                        }
                    }
                })
            }

            //处理标签内容
            if (children && children.length === 1) {
                var contentNode = children[0].content.value

                if (!contentNode) return

                var content = contentNode.content
                if (content && content.indexOf('{{') !== -1) {
                    let tokens = getMustacheTokens(content)
                    tokens.forEach(function (token) {
                        if (token[0] === '!' || token[0] === 'name') {
                            var expr = token[1]

                            replaceList.forEach(function (item) {
                                let { oldName, newName } = item
                                expr = renameTemplateAttrVariable(expr, oldName, newName, isOnlyReplaceFunction)
                            })
                            token[1] = expr
                        }
                    })
                    //重新还原为{{value}}字符串
                    var newExpr = stringifyMustache(tokens)
                    contentNode.content = newExpr
                }
            }
        })
        .root()
}

/**
 * 对code里面，指定的变量名进行重命名
 *
 * $data.user.name --> newName.user.name
 *
 * @param {*} content
 * @param {*} oldName
 * @param {*} newName
 * @param {*} isOnlyReplaceFunction 是否仅替换函数名
 * @returns
 */
function renameTemplateAttrVariable (code, oldName, newName, isOnlyReplaceFunction = false) {
    // var res = $(code)
    //     .find({
    //         type: 'Identifier',
    //         name: oldName,
    //     })
    //     .each(function (subItem) {
    //         if (subItem[0].nodePath.name !== 'property') {
    //             subItem.replaceBy(newName)
    //         }
    //     })
    //     .root().generate()

    var res = code

    //如果变量是true、false，不处理
    //扩展到所有js关键字，不能作为变量！！！
    if (utils.isJavascriptKeyWord(oldName)) return res

    //另一种实现方式
    if (code === oldName) {
        //如果就是一个单词，那没必要这样那样处理了
        res = newName
    } else {
        var ast = $(code)
        if (!ast.error) {
            try {
                //仅一个单词，会报错，判断一下
                //{list:[{goods_list:list}],cat_index:0,list_style:2,loading:loading,cat_position:0,price:1,name:1,sub_name:1,label:1,level_price:(list_style == 1 ? 1 : 0),buy:1,sales:1}
                //也会报错
                var res = ast.replace(oldName, (match, nodePath) => {
                    if (nodePath.name !== 'property') {
                        if (isOnlyReplaceFunction) {
                            if (t.isCallExpression(nodePath.parentPath.node)) {
                                return newName
                            } else {
                                return null  //不用改的，返回null
                            }
                        } else {
                            return newName
                        }
                    } else {
                        return null  //不用改的，返回null
                    }
                }).root().generate()

                //将值里面的全角全转成半角，不然可能会导致引号有问题
                //例：
                // <template is="footer"  data="{{text: 'group'}}"/>
                // <template name="footer">
                //     <view class="footer-wrapper">
                //     <navigator url="/pages/my/peiwang/modules/index/index" hover-class="none" open-type="redirect" class="footer-name {{text == 'index' ? 'blue' : ''}}">
                //         <text class='iconfont icon-light font22'></text>
                //         <text>设备</text>
                //     </navigator>
                //     <navigator url="/pages/my/peiwang/modules/group/group" hover-class="none" open-type="redirect" class="footer-name {{text == 'group' ? 'blue' : ''}}">
                //         <text class='iconfont icon-group font22'></text>
                //         <text>群组</text>
                //     </navigator>
                //     <navigator url="/pages/my/peiwang/modules/user/user" hover-class="none" open-type="redirect"  class="footer-name {{text == 'user' ? 'blue' : ''}}">
                //         <text class='iconfont icon-user font20'></text>
                //         <text>我的</text>
                //     </navigator>
                //     <view>
                // </template>
                res = res.replace(/"/g, "'")
            } catch (error) {
                console.log("[Error]renameTemplateAttrVariable: newName有问题，无法替换。 error: ", error)
                console.log("[Error]renameTemplateAttrVariable: newName有问题，无法替换。 newName: ", newName)
            }
        }
    }
    return res
}

module.exports = {
    renameDataOrMethods,
    renameThisDotXXX,
    renameSetDataVariable,
    renameTemplateAttrVariable,
    //上面的用于测试

    renameScriptVariable,
    renameTemplateVariable,
}
