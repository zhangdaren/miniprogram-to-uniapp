/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2022-01-25 18:01:26
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\page\template\template-transformer.js
 *
 */


/**
 *
 * 部分代码参考：https://github.com/dcloudio/uni-app/blob/master/packages/uni-migration/lib/mp-weixin/transform/template-transformer/transform/traverse.js
 *
 */


const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")

var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")

const { parseMustache } = require(appRoot + "/src/utils/mustacheUtils")

//资源文件
const { repairScriptSourcePath,
    repairTemplateSourcePath,
    repairAstStringLiteralAssetPath
} = require(appRoot + '/src/transformers/assets/assets-path-transformer')


// const ATTRS = {
//     'wx:if': 'v-if',
//     'wx-if': 'v-if',  //we-ui 使用过的骚气写法。。。
//     'wx:elif': 'v-else-if',
//     'wx:else': 'v-else',
//     'model:value': 'v-model',  //简易双向绑定
// }

/**
 * 获取逻辑判断及简易兑换的key转换关系
 * @param {*} prefix 小程序前缀
 * @returns
 */
function getAttrMap (prefix) {
    var obj = {
        [`${ prefix }:if`]: 'v-if',
        [`${ prefix }-if`]: 'v-if',  //wx-if: we-ui 使用过的骚气写法。。。
        [`${ prefix }:elif`]: 'v-else-if',
        [`${ prefix }:else`]: 'v-else',
        'model:value': 'v-model',  //微信简易双向绑定 TODO: 未了解是否都支持，暂时都拿上吧
    }
    //baidu
    if (prefix === "s") {
        obj = {
            [`s-if`]: 'v-if',
            [`s-elif`]: 'v-else-if',
            [`s-else`]: 'v-else',
            'model:value': 'v-model',  //简易双向绑定
        }
    }
    return obj
}

const EVENTS = {
    'touchstart': 'touchstart',
    'touchmove': 'touchmove',
    'touchcancel': 'touchcancel',
    'touchend': 'touchend',
    'tap': 'tap',
    'longpress': 'longpress',
    'longtap': 'longpress',
    'transitionend': 'transitionend',
    'animationstart': 'animationstart',
    'animationiteration': 'animationiteration',
    'animationend': 'animationend',
    'touchforcechange': 'touchforcechange'
}

// const FOR = {
//     for: 'wx:for',
//     forItems: 'wx:for-items',
//     forKey: 'wx:for-key',
//     item: 'wx:for-item',
//     index: 'wx:for-index',
//     key: 'wx:key'
// }

/**
 * 获取for相关的属性
 * @param {*} prefix 小程序前缀
 * @returns
 */
function getForMap (prefix) {
    var obj = {
        for: `${ prefix }:for`,
        forItems: `${ prefix }:for-items`,
        forKey: `${ prefix }:for-key`,
        item: `${ prefix }:for-item`,
        index: `${ prefix }:for-index`,
        key: `${ prefix }:key`
    }
    //baidu
    if (prefix === "s") {
        obj = {
            for: `s-for`,
            item: `s-for-item`,
            index: `s-for-index`,
            //baidu目测没下面三个  https://smartprogram.baidu.com/docs/develop/framework/view_for/
            // forItems: `s-for-items`,
            // forKey: `s-for-key`,
            // key: `s-key`
        }
    }
    return obj
}

/**
 * 获取需要删除的属性列表
 * @param {*} prefix 小程序前缀
 * @returns
 */
function getfilterAttrList (prefix) {
    var list = [
        `${ prefix }:for`,
        `${ prefix }:for-item`,
        `${ prefix }:for-items`,
        `${ prefix }:for-index`,
        `${ prefix }:key`,
        `${ prefix }:for-key`]

    //baidu
    if (prefix === "s") {
        list = [
            `s-for`,
            `s-for-item`,
            `s-for-index`,
        ]
    }
    return list
}


const FOR_DEFAULT = {
    item: 'item',
    index: 'index',
    index_fallback: '___i___'
}

const TAGS = [
    'ad',
    'audio',
    'button',
    'camera',
    'canvas',
    'checkbox',
    'checkbox-group',
    'cover-image',
    'cover-view',
    'editor',
    'form',
    'functional-page-navigator',
    'icon',
    'image',
    'input',
    'label',
    'live-player',
    'live-pusher',
    'map',
    'movable-area',
    'movable-view',
    'navigator',
    'official-account',
    'open-data',
    'picker',
    'picker-view',
    'picker-view-column',
    'progress',
    'radio',
    'radio-group',
    'rich-text',
    'scroll-view',
    'slider',
    'swiper',
    'swiper-item',
    'switch',
    'text',
    'textarea',
    'video',
    'view',
    'web-view',
]

function transformDirective (keyNode, valueNode, state) {
    const ATTRS = getAttrMap(state.prefix)
    var name = keyNode.content

    var resultAttr = false
    var resultValue = false

    if (ATTRS[name]) {
        resultAttr = true
        keyNode.content = ATTRS[name]
    }
    if (ATTRS[name] && valueNode) {
        var newContent = parseMustache(valueNode.content)
        newContent = newContent.replace(/"/g, "'")
        valueNode.content = newContent
        resultValue = true

        //如果v-else有内容时，则需要改成v-else-if
        if (ATTRS[name] === "v-else") {
            keyNode.content = "v-else-if"
        }
    }
    return resultAttr || resultValue
}

const bindRE = /bind:?/
const catchRE = /catch:?/
const captureBindRE = /capture-bind:?/
const captureCatchRE = /capture-catch:?/


function transformEventName (name, state) {
    if (state.isComponent) {
        return '@' + (EVENTS[name] ? (EVENTS[name] + '.native') : name)
    }
    return '@' + (EVENTS[name] || name)
}

/**
 * 转换事件
 * @param {*} keyNode
 * @param {*} valueNode
 * @param {*} state
 * @returns
 */
function transformEvent (keyNode, valueNode, state) {
    // name, value, attribs,state
    var name = keyNode.content

    let event = name
    if (name.indexOf('bind') === 0) {
        event = transformEventName(name.replace(bindRE, ''), state)
    } else if (name.indexOf('catch') === 0) {
        event = transformEventName(name.replace(catchRE, ''), state) + '.stop.prevent'
    } else if (name.indexOf('capture-bind') === 0) {
        event = transformEventName(name.replace(captureBindRE, ''), state) + '.capture'
    } else if (name.indexOf('capture-catch') === 0) {
        event = transformEventName(name.replace(captureCatchRE, ''), state) + '.stop.prevent.capture'
    }

    //TODO: 如果valueNode没有，那应该需要删除！
    if (event !== name && valueNode) {

        //TODO: 这里要改掉
        // 模板 <template name> 中用到的方法在其父组件
        let newValue = parseMustache(valueNode.content, true)

        keyNode.content = event
        valueNode.content = newValue
        return true
    }
}


/**
 * 获取父级
 * @param {*} node
 * @returns
 */
function getParentForIndex (node) {
    var forIndex = null
    //获取(item, index) in list
    // var reg = /\([\w\._]+,\s*([\w\._]+)\)\s*in\s*[\w\._]+/
    node.parents().each(function (item) {
        //如果已经获取到了，就不需再获取更父级的节点了
        if (forIndex) return

        var attributes = item.attr('content.attributes')
        if (!attributes) {
            return
        }
        attributes.map(function (attr) {
            var key = attr.key.content
            if (key === "v-for-index") {
                forIndex = attr.value.content
            }
        })
    })

    return forIndex || 0
}


/**
 * for属性处理
 * https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/list.html
 * https://dimensionspacex.blog.csdn.net/article/details/82191501?utm_medium=distribute.pc_relevant.none-task-blog-2%7Edefault%7ECTRLIST%7Edefault-4.no_search_link&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2%7Edefault%7ECTRLIST%7Edefault-4.no_search_link
 * @param {*} node
 * @returns
 */
function transformFor (node, state) {
    var attributes = node.attr('content.attributes')
    // console.log("attributes", attributes)
    if (!attributes) {
        return
    }

    const prefix = state.prefix
    const FOR = getForMap(prefix)

    var attribs = {}
    attributes.forEach(function (attr, index) {
        var key = attr.key.content
        if (attr.value) {
            var value = attr.value.content
            attribs[key] = value
        }
    })

    //wx:for-items和wx:for的不同就是，wx:for-items默认的循环项为item, 不需要指定了
    if (attribs[`${ prefix }:for`] || attribs[`${ prefix }:for-items`]) {
        const vFor = attribs[FOR.for] || attribs[FOR.forItems]
        if (!vFor) {
            return
        }

        let vKey = parseMustache(attribs[FOR.key], true)
        //fix: wx:key="1"
        if (/^\d+$/.test(vKey)) {
            vKey = "index"
        }

        let vForKey = parseMustache(attribs[FOR.forKey], true)
        const vItem = parseMustache(attribs[FOR.item], true) || FOR_DEFAULT.item
        let vIndex = parseMustache(attribs[FOR.index], true) || (
            FOR_DEFAULT.index === vItem ? FOR_DEFAULT.index_fallback : FOR_DEFAULT.index
            //处理 wx:for-item="index"
        )

        if (vIndex === "in") {
            vIndex = "index"
        }

        if (vIndex === "index") {
            // 考虑嵌套for的情况
            // console.log('vFor :>> ', vFor)
            var reg = /^index/
            var parentForIndex = getParentForIndex(node)
            if (parentForIndex && reg.test(parentForIndex)) {
                var index = parentForIndex.replace(reg, "")
                index = parseInt(index || 0)
                index++
                vIndex = "index" + index
            } else {
                vIndex = "index"
            }
        }

        var vForAttr = `(${ vItem },${ vIndex }) in (${ parseMustache(vFor) })`

        //添加v-for
        var forObj = {
            key: { content: 'v-for' },
            value: { content: vForAttr }
        }
        attributes.push(forObj)

        //注意：这里添加一个标记，方便子级快速取到当前的index，后面会删除！！！
        //注意：后面想着使用正则进行提取，有点复杂了，还是使用这种吧。
        var forObj = {
            key: { content: 'v-for-index' },
            value: { content: vIndex }
        }
        attributes.push(forObj)

        if (vKey || vForKey) {
            vKey = vForKey || vKey
            if (vKey === '*this' || vKey === "this" || vKey === "index" || vKey === "item" || vKey === vItem) {
                //保留关键字 *this 代表在 for 循环中的 item 本身，这种表示需要 item 本身是一个唯一的字符串或者数字
                //注意：如果:key是一个对象，会报错的，因此还是用index吧。下同
                // vKey = vItem
                vKey = vIndex
            } else if (vKey[0] === '*') {
                //通配符+名字 如 *item
                // vKey = vItem
                vKey = vIndex
            } else if (vKey !== vItem && vKey.indexOf('.') === -1) { // wx:for-key="{{item.value}}"
                //TODO: 这里可能还是有问题。。。。
                vKey = vItem + '.' + vKey
            }
            var keyObj = {
                key: { content: ':key' },
                value: { content: vKey }
            }
            attributes.push(keyObj)
        } else {
            //像这种还是添加一个吧
            //<view class="videoList" wx:for="{{start_video}}"></view>
            var keyObj = {
                key: { content: ':key' },
                value: { content: vIndex }
            }
            attributes.push(keyObj)
        }

        // //删除wx:for相关的属性
        var content = node.attr("content")
        content.attributes = attributes.filter(function (attr, index) {
            var key = attr.key.content
            return !getfilterAttrList(state.prefix).includes(key)
        })
        content.attributes = []
        // node.attr('content.attributes', newAttributes)
    }
}

/**
 * 删除for相关的属性：用于给子级搜索当前index属性的
 * @param {*} $ast
 */
function removeForAttr ($ast, state) {
    var prefix = state.prefix

    if (prefix === "s") {
        //baidu
        $ast
            .root()
            .replace(`<$_$1 s-for="$_$2" $$$1>$$$2</$_$1>`, '<$_$1 $$$1>$$$2</$_$1>')
            .replace(`<$_$1 s-for-item="$_$2" $$$1>$$$2</$_$1>`, '<$_$1 $$$1>$$$2</$_$1>')
            .replace(`<$_$1 s-for-index="$_$2" $$$1>$$$2</$_$1>`, '<$_$1 $$$1>$$$2</$_$1>')
    } else {
        $ast
            .root()
            .replace(`<$_$1 ${ prefix }:for="$_$2" $$$1>$$$2</$_$1>`, '<$_$1 $$$1>$$$2</$_$1>')
            .replace(`<$_$1 ${ prefix }:for-item="$_$2" $$$1>$$$2</$_$1>`, '<$_$1 $$$1>$$$2</$_$1>')
            .replace(`<$_$1 ${ prefix }:for-items="$_$2" $$$1>$$$2</$_$1>`, '<$_$1 $$$1>$$$2</$_$1>')
            .replace(`<$_$1 ${ prefix }:for-index="$_$2" $$$1>$$$2</$_$1>`, '<$_$1 $$$1>$$$2</$_$1>')
            .replace(`<$_$1 ${ prefix }:key="$_$2" $$$1>$$$2</$_$1>`, '<$_$1 $$$1>$$$2</$_$1>')
            .replace(`<$_$1 ${ prefix }:for-key="$_$2" $$$1>$$$2</$_$1>`, '<$_$1 $$$1>$$$2</$_$1>')
    }

    $ast.replace(`<$_$1 v-for-index="$_$2" $$$1>$$$2</$_$1>`, '<$_$1 $$$1>$$$2</$_$1>')
        //可能有这种骚气写法：<view class='picture-magic-cont' wx:key="*this"></view>
        .replace(`<$_$1 :key="*this" $$$1>$$$2</$_$1>`, '<$_$1 $$$1>$$$2</$_$1>')
}

/**
 * 在实际操作中发现，有时使用hidden居然不生效，具体未知原因，而换成v-if，立马ok。
 * 虽然uniapp支持hidden，这里仍然转换为v-if
 *
 * @param {*} keyNode
 * @param {*} valueNode
 * @param {*} state
 * @returns
 */
function transformHidden (keyNode, valueNode, state) {
    var name = keyNode.content

    if (name === "hidden" && valueNode) {
        var value = valueNode.content

        if (value === "true") {
            keyNode.content = "v-if"
            valueNode.content = `false`
        } else if (value === "false") {
            keyNode.content = "v-if"
            valueNode.content = `true`
        } else {
            var newValueContent = parseMustache(value)
            newValueContent = newValueContent.replace(/"/g, "'")

            keyNode.content = "v-if"
            try {
                valueNode.content = logicalNegation(newValueContent)
            } catch (error) {
                console.log("error", error)
                console.log("----transformHidden----", newValueContent)
            }
        }

        return true
    }
}


/**
 * 表达式取反对应数据
 */
var logicalNegationObj = {
    "!": "",
    ">": "<=",
    "<": ">=",
    ">=": "<",
    "<=": ">",
    "==": "!=",
    "===": "!==",
    "!=": "==",
    "!==": "===",
}

/**
 * 对逻辑表达式进行取反
 * @param {*} code
 */
function logicalNegation (code) {
    if (!code) return code

    // _navbar.bottomTabStyle == '2'
    // receiveShow
    // !show
    // Swiper == null
    // type != '3'
    // !system.openVip
    // 1 == 1
    // key != 1

    var res = code
    var ast = $(code, { isProgram: false })
    if (ast.error) {
        if (code[0] === "!") {
            return code.substr(1)  //去掉第一个！
        } else {
            return `!(${ code })`  //直接整包取反。 比如多个表达式，或者是 hidden="show || 1" ,  a||b, a&&b 这种
        }
    }

    var expression = ast.attr("expression")
    if (t.isBinaryExpression(expression)) {
        var operator = expression.operator
        if (logicalNegationObj.hasOwnProperty(operator)) {
            // console.log("--isBinaryExpression--", code)
            expression.operator = logicalNegationObj[operator]
            res = ast.generate()
        }
    } else if (t.isUnaryExpression(expression)) {
        var operator = expression.operator
        if (logicalNegationObj.hasOwnProperty(operator)) {
            // console.log("--isUnaryExpression--", code)
            expression.operator = logicalNegationObj[operator]
            res = ast.generate()
        }
    } else if (t.isIdentifier(expression)) {
        // console.log("--t.isIdentifier(expression)--", code)
        res = `!${ code }`
    }

    // console.log("res", res)
    return res
}



/**
 * 转换for系列attr
 * @param {*} keyNode
 * @param {*} valueNode
 * @param {*} state
 * @returns
 */
function transformAttr (keyNode, valueNode, state) {
    var prefix = state.prefix
    var name = keyNode.content

    var forAttrList = getfilterAttrList(prefix)

    if (
        name.indexOf('v-') === 0
        || name.indexOf(':') === 0
        || forAttrList.includes(name)
    ) { // 已提前处理
        return
    }
    if (transformDirective(keyNode, valueNode, state)) {
        return
    }

    if (transformEvent(keyNode, valueNode, state)) {
        return
    }

    if (valueNode && transformHidden(keyNode, valueNode, state)) {
        return
    }

    if (valueNode) {
        // console.log("keyname", name)
        // console.log("valueNode", valueNode.content)
        var value = valueNode.content

        if (value && value.indexOf('{{') !== -1) {
            keyNode.content = ":" + name

            //TODO: 单双交杂?
            //全部转为单引号

            //这里必须处理一下，如果template的值是使用的单引号，后面会出问题，导致引号不匹配！！！
            //<text class='iconfont {{item.icon}}'></text>

            var newValueContent = parseMustache(value)
            //
            newValueContent = newValueContent.replace(/"/g, "'")
            valueNode.content = newValueContent
        } else {
            //如果属性的值为true或false，则将属性增加v-bind:
            //是数字的也加v-bind:
            if (value === "true" || value === "false") {
                keyNode.content = ":" + name
            }
        }
    }
}

/**
 * 转换attrs
 * @param {*} node
 * @returns
 */
function transformAttrs (node, state) {
    var attributes = node.attr('content.attributes')
    var tagName = node.attr('content.name')
    // console.log("attributes", attributes)
    if (!attributes) {
        return
    }

    var wxsTagList = ['wxs', "filter", "import-sjs"]
    if (wxsTagList.includes(tagName)) {
        //wxs 不在这里处理
        // console.log('wxs :>> ', "wxs")
        return
    }

    const isComponent = !TAGS.includes(tagName)
    state['isComponent'] = isComponent

    transformFor(node, state)

    //小程序scroll-view属性,需要有值，不然就是boolean
    var scollAttrList = ['scroll-top', 'scroll-left']

    //干掉<image binderror src="xxx"></image>里面的binderror
    attributes = attributes.filter(function (item, i) {
        let { key: keyNode, value: valueNode } = item
        var isNotAttrContent = !valueNode && keyNode.content.includes("bind")

        //修改单引号为双引号
        if (item.startWrapper) {
            item.startWrapper.content = '"'
        }
        if (item.endWrapper) {
            item.endWrapper.content = '"'
        }

        //去除里面的转义引号
        if (valueNode && valueNode.content) {
            valueNode.content = valueNode.content.replace(/\(\\"/g, "(").replace(/\\"\)/g, "(")
        }

        if (!isNotAttrContent) {
            transformAttr(keyNode, valueNode, state)
        }

        // scroll-top	Number		设置竖向滚动条位置
        // scroll-left	Number		设置横向滚动条位置
        // 解决<scroll-view scroll-left></scroll-view>没有给值，默认是true
        if (!valueNode && scollAttrList.includes(keyNode.content)) {
            item.value = {
                content: '0',
                type: 'token:attribute-value'
            }
        }

        return !isNotAttrContent
    })

    node.attr('content.attributes', attributes)
}


/**
 * 解析事件里的动态函数名，这种没有()的函数名，在uniapp不被执行
 * 比如：<view bindtap="{{openId==undefined?'denglu':'hy_to'}}">立即</view>
 * @param {*} $wxmlAst
 * @returns
 */
function transformEventDynamicCode ($wxmlAst) {
    if (!$wxmlAst) return
    $wxmlAst.find('<$_$1 $$$></$_$1>')
        .each(function (item) {
            var list = item.match['$$$$']
            list.map(function (obj) {
                //判断一下 v-else 这种没value的属性
                if (obj.value) {
                    var attr = obj.key.content
                    var value = obj.value.content
                    var reg = /\?|\+/
                    if (attr[0] === "@" && reg.test(value)) {
                        obj.value.content = "parseEventDynamicCode(" + value + ")"
                    }
                }
            })
        }).root()
}

/**
 * <official-account></official-account> 公众号关注组件，仅支持小程序，作条件编译处理
 * @param {*} $ast
 */
function transformOfficialAccount ($ast) {
    var selector = `<official-account $$$></official-account>`

    var replacement = `
        <block>
            <!-- #ifdef MP-WEIXIN -->
            <!-- [miniprogram-to-uniapp] 公众号关注组件 仅微信小程序支持 -->
            <official-account $$$></official-account>
            <!-- #endif -->

            <!-- #ifndef MP-WEIXIN -->
            <view>当前为非微信小程序环境，不支持公众号关注组件，请自行调整当前节点内容！</view>
            <!-- #endif -->
        </block>`

    $ast.replace(selector, replacement)
}

/**
 * 对class内容进行合并去重
 * @param {*} str1
 * @param {*} str2
 * @returns
 */
function mergeClassContent (str1, str2) {
    var arr1 = str1.split(" ")
    var arr2 = str2.split(" ")
    return [...new Set([...arr1, ...arr2])].join(" ")
}

/**
 * 标签重复属性去除
 * <i-tag i-class="i-tags" i-class="borderRight" font-size="24" >{{dataMsg}}</i-tag>
 * 转换为：
 * <i-tag i-class="i-tags borderRight" font-size="24" >{{dataMsg}}</i-tag>
 *
 * 合并规则：
 * 含只有含class才是用空格合并，其余都是使用后者替换前者！
 *
 * @param {*} $ast
 * @returns
 */
function transformDuplicateAttr ($ast) {
    if (!$ast) return

    $ast.find('<$_$1 $$$attr>$$$2</$_$1>').each(function (item) {
        var list = item.match['$$$attr']

        var tmp = {}
        var newList = list.reduce(function (init, subItem, index, orignArray) {
            var keyName = subItem.key.content
            if (tmp[keyName]) {
                var lastItem = tmp[keyName]

                if (lastItem.value) {
                    var content1 = (lastItem.value && lastItem.value.content) || ''
                    var content2 = (subItem.value && subItem.value.content) || ''

                    //合并去重(含class的属性合并去重，其余的均使用后者替代前者)
                    var newContent = content2
                    if (keyName.includes("class")) {
                        newContent = mergeClassContent(content1, content2)
                    }
                    lastItem.value.content = newContent
                }
            } else {
                tmp[keyName] = subItem
                init.push(subItem)
            }
            return init
        }, [])

        item.attr('content.attributes', newList)
    })
}

/**
 * 根据后缀名获取前缀
 * @returns
 */
function getPrefixByExtname (extname) {
    var prefix = "wx"
    switch (extname) {
        case '.wxml':
            prefix = "wx"
            break
        case '.qml':
            prefix = "qq"
            break
        case '.ttml':
            prefix = "tt"
            break
        case '.axml':
            prefix = "a"
            break
        case '.swan':
            prefix = "s"
            break
        default:
            prefix = "wx"
            break
    }
    return prefix
}

/**
 * 转换template ast
 * @param {*} $ast
 * @param {*} wxmlFile
 * @param {*} wxmlExtname
 * @returns
 */
function transformTemplateAst ($ast, wxmlFile, wxmlExtname) {
    // var data = `{{leftIndex:index+1,section3Title:item.title}}`

    // //解析这种会有问题
    // data = `{{...item,className:'huadong',canIUse:canIUse}}`

    // const name = "attribs.is"
    // if (data && data.indexOf('{{') !== -1) {
    //     const object = `{${ parseMustache(data) }}`
    //     // attribs['v-bind'] = object
    //     const ast = recast.parse(`const object = ${ object }`)
    //     // const props = state.props[name] || ['wxTemplateName']
    //     ast.program.body[0].declarations[0].init.properties.forEach(property => props.push(property.key.name))
    //     var obj =   [...new Set(props)]
    // }

    //前缀
    var prefix = getPrefixByExtname(wxmlExtname)
    var state = {
        prefix
    }

    $ast
        .find(`<$_$1 $$$1>$$$2</$_$1>`)
        .each(node => {
            var attributes = node.attr('content.attributes')

            var tagName = node.attr("content.name")

            if (!attributes) {
                // if (!attributes || tagName === "template") {
                return
            }

            transformAttrs(node, state)
        })

    //转换for后，要删除原有的
    removeForAttr($ast, state)

    //转换资源路径
    repairTemplateSourcePath($ast, wxmlFile)

    //转换事件名含动态参数
    transformEventDynamicCode($ast)

    //微信小程序关注组件处理
    transformOfficialAccount($ast)

    //对标签属性进行合并去重
    transformDuplicateAttr($ast)

    return $ast
}

module.exports = { transformTemplateAst, transformEventDynamicCode }
