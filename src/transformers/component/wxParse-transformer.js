/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:01:45
 * @LastEditTime: 2021-11-30 10:09:25
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\component\wxParse-transformer.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")



var appRoot = "../../.."
// const babelUtils = require(appRoot + "/src/utils/babelUtils")

// const ggcUtils = require(appRoot + "/src/utils/ggcUtils")
const { parseMustache } = require(appRoot + "/src/utils/mustacheUtils")


/**
 * 删除require wxparse语句
 * @param {*} $ast
 * @returns
 */
function removeReqireWxparseCode ($ast) {
    if (!$ast) return

    var reg = /\/wxParse\/|wxParse\.js/i

    //TODO: import wxParse from '../../../wxParse/wxParse.js';
    $ast
        .find(`import $_$1 from '$_$2'`)
        .each(item => {
            const source = item.match[2][0].value
            if (reg.test(source)) {
                item.remove()
            }
        }).root()


    //删除var a = require("../js/wxParse.js");
    $ast.find("require($_$src)").each(function (item) {
        var src = item.match["src"][0].value
        if (reg.test(src)) {
            var isRemoved = false
            item.parents().each(parent => {
                //只作用于第一个找到的VariableDeclarator
                if (isRemoved) return

                if (parent.node && parent.node.type == 'VariableDeclarator') {
                    parent.remove()
                    isRemoved = true
                }
            })
        }
    }).root()
}


/**
 * 获取wxParse组件数据的新的变量名
 * @param {*} varName
 */
function getWxParseDataNewVarName (varName) {
    var bindName = ""
    if (varName !== "article") {
        //加个前缀以防冲突
        bindName = "article_" + varName
    } else {
        bindName = varName
    }
    return bindName
}

/**
 * 处理wxParse.wxParse('content', 'html', detail.content, _this, 0);
 * @param {*} $jsAast
 * @returns
 */
function transformWxParseScript ($jsAast) {
    if (!$jsAast) return

    $jsAast.find('$_$1.wxParse($$$)').each(function (item) {
        var args = item.match['$$$$']
        var bindName = ""
        let bindNameNode = args[0]
        var dataNode = $(args[2]).generate()
        var targetNode = $(args[3]).generate()

        let isComputed = false
        let pathStr = `${ $(item).generate() }`

        if (t.isStringLiteral(bindNameNode)) {
            var varName = bindNameNode.value
            bindName = getWxParseDataNewVarName(varName)
        } else {
            bindName = $(bindNameNode).generate()
            isComputed = true
            // const logStr = `[Error] 工具能力有限！此行代码转换后可能会报错，需手动调试修复:  ${ pathStr }     file:  ${ nodePath.relative(global.miniprogramRoot, file_js) }`
            // //存入日志，方便查看，以防上面那么多层级搜索出问题
            // console.log(logStr)
            // global.log.push(logStr)
        }
        var code = `${ targetNode }.${ bindName } = ${ targetNode }.escape2Html(${ dataNode })`
        if (isComputed) {
            var code = `${ targetNode }[${ bindName }] = ${ targetNode }.escape2Html(${ dataNode })`
        }

        var oldCode = item.generate()
        item.replaceBy(code)

        //添加注释
        item.before("//" + oldCode + "\n")

        //TODO:
        // 1.加注释  ok
        // 2.在data里添加bindName
        // 3. wxparse 有html,,,那mp-html需要md吗

    }).root()
}



/**
 * 处理<template is="wxParse" data="{{ wxParseData:content.nodes }}"></template>
 * @param {*} $wxmlAst
 * @returns
 */
function transformWxParseTemplate ($wxmlAst) {
    if (!$wxmlAst) return

    // console.log("-----", $wxmlAst.generate());

    $wxmlAst
        .find(['<template is="wxParse" :data="$_$data" $$$></template>',
            '<template is="wxParse" data="$_$data" $$$></template>'])
        .each(function (item) {
            // console.log(match, nodePath)
            var data = item[0].match["data"][0].value
            var attrListNode = item.match["$$$$"]

            var object = `const object = {${ parseMustache(data, true) }}`

            //data应该已经转换好了，成了vue的格式，没有双括号了
            var ast = $(`${ object }`, { isProgram: false })

            // console.log("ast", ast.attr("declarations.0.init.properties.0.value"))

            var args = ast.attr("declarations.0.init.properties.0.value")
            if (args) {
                var argsStr = $(args).replace("$_$1.nodes", (match, nodePath) => {
                    var bindName = ""
                    var varName = match[1][0].value
                    bindName = getWxParseDataNewVarName(varName)
                    return bindName
                }).generate()

                var oldTag = item.generate()
                //添加注释
                item.before(`<!-- ${ oldTag } -->`)

                //添加属性
                var attrList = []
                attrListNode.map(function (obj) {
                    var { key, value } = obj

                    if(value){
                        attrList.push(`${ key.content }="${ value.content }"`)
                    }else{
                        attrList.push(`${ key.content }`)
                    }
                })

                //有点问题 TODO: 没有加属性
                var newTag = `<mp-html :content="${ argsStr }" ${ attrList.join(" ") }></mp-html>`
                item.replaceBy(newTag)
            } else {
                console.log("获取wxparse参数异常", item.generate())
                return null
            }


            // <template is="wxParse" data="{{wxParseData:editors['editor'+item.id].nodes}}" />
            //<mp-html :content="editors['editor'+item.id]" />

            //<template is="wxParse" data="{{wxParseData:richtext[diyindex].nodes}}"></template>
            // <mp-html :content="richtext[diyindex]" />

            /* <template is="wxParse" data="{{wxParseData: (goodsDetail.nodes || '无描述')}}" /></template> */
            //<mp-html :content="(goodsDetail || '无描述')" />
        })
}


/**
 * 处理WxParse组件
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 */
function transformWxParse ($jsAst, $wxmlAst) {

    if ($jsAst) {
        removeReqireWxparseCode($jsAst)
        transformWxParseScript($jsAst)
    }

    if ($wxmlAst) {
        transformWxParseTemplate($wxmlAst)
    }
}


// var $jsAast = $(`WxParse.wxParse('editors.editor' + item.id, 'html', item.content.fulltext, this);`)
// transformWxParseScript($jsAast)
// console.log("生成", $jsAast.generate())


////删除var a = require("../js/wxParse.js");
// var wxParse = require("../../../wxParse/wxParse.js");


//css里面处理过了，不用管
/**
* WxParse.wxParse(bindName , type, data, target,imagePadding)
* 1.bindName绑定的数据名(必填)
* 2.type可以为html或者md(必填)
* 3.data为传入的具体数据(必填)
* 4.target为Page对象,一般为this(必填)
* 5.imagePadding为当图片自适应是左右的单一padding(默认为0,可选)
*/


//  <template is="wxParse" data="{{wxParseData:article[index].nodes}}"></template>
/* <template is="wxParse" data="{{wxParseData: (goodsDetail.nodes || '无描述')}}" /></template> */


//<template is="wxParse"> data="{{wxParseData:editors['editor'+item.id].nodes}}"></template>
//<template is="wxParse"> data="{{wxParseData:richtext[diyindex].nodes}}"></template>
//<template is="wxParse"> data="{{wxParseData:lottery.nodes}}" wx:If='{{product.lottery}}' />


//     <import src="../../wxParse/wxParse.wxml"/>
// <template is="wxParse" data="{{wxParseData:article.nodes}}"/>


//     @import "/page/wxParse/wxParse.wxss"

//     var WxParse = require('../../wxParse/wxParse.js')

//     var article = res.data[0].post
//     WxParse.wxParse('article', 'html', article, that, 5)


//////////////////////////例0：////////////////////////
// <template is="wxParse" data="{{wxParseData:article.nodes}}"/>
//     WxParse.wxParse('article', 'html', article, that, 5)

//转换：
//<mp-html :content="article" />
//that.article = article

//给data增加article变量

//////////////////////////例一：////////////////////////
/* <block wx:for="{{moduleData}}" wx:key="index">
<block wx:if="{{item.type===1}}">
    <view class="html-content">
          <template is="wxParse" data="{{wxParseData:editors['editor'+item.id].nodes}}" />
    </view>
</block>
if (this.data.moduleData.length > 0) {
    this.data.moduleData.forEach((item) => {
      if (item.type === 1) {
        WxParse.wxParse('editors.editor' + item.id, 'html', item.content.fulltext, this);
      }
    })
  } */

//转换：
//<mp-html :content="editors['editor'+item.id]" />
// WxParse.wxParse('editors.editor' + item.id, 'html', item.content.fulltext, this);
//this['editors.editor' + item.id]: item.content.fulltext

//给data增加editors变量


///////////////////////例二：///////////////////////////

//<template is="wxParse" data="{{wxParseData:richtext[diyindex].nodes}}"></template>
//a.WxParse.wxParse("richtext." + o, "html", i[o].params.content, e, 5);


//转换：
// <mp-html :content="richtext[diyindex]" />
// e["richtext." + o] = i[o].params.content

//给data增加richtext变量


///////////////////////例三：///////////////////////////

/* <template is="wxParse" data="{{wxParseData: (goodsDetail.nodes || '无描述')}}" /></template> */
//WxParse.wxParse("goodsDetail", "html", cont, self);

//转换：
//<mp-html :content="(goodsDetail || '无描述')" />


///////////////////////例四：///////////////////////////





// if (templateName === 'wxParse') {
//     // wxParse单独处理，鉴于wxParse的data造型都是非常规律，在这里直接使用正则搞定就不花里胡哨了。
//     //<template is="wxParse" data="{{ wxParseData:content.nodes }}"></template>
//     var reg_val = /wxParseData:(.*?)\.nodes/i
//     if (dataAttr) {
//         let varName = ''
//         if (reg_val.test(dataAttr)) {
//             let val = dataAttr.match(reg_val)[1]
//            if (/\[|\]/.test(val)) {
//                 varName = dataAttr.match(reg_val)[1]
//             } else {
//                 varName = dataAttr.match(reg_val)[1]
//                 if (varName !== "article") {
//                     //加个前缀以防冲突
//                     varName = "article_" + varName
//                 }

//                 //处理：<template is="wxParse" data="{{wxParseData: (goodsDetail.nodes || '无描述')}}" />
//                 //仅提取变量，"或"操作符和三元运算符暂不考虑。
//                 varName = varName.replace(/[\s\(\[]/g, '') //替换掉空格和括号
//             }
//         } else {
//             varName = dataAttr
//                 .replace(/wxParseData:/, '')
//                 .replace(/{{(.*?)}}/, '$1')

//             //处理：<template is="wxParse" data="{{wxParseData: (goodsDetail.nodes || '无描述')}}" />
//             //仅提取变量，"或"操作符和三元运算符暂不考虑。
//             varName = varName.replace(/[\s\(\[]/g, '') //替换掉空格和括号
//         }

//         if (global.hasVant) {
//             newNode = {
//                 type: 'tag',
//                 name: 'view',
//                 attribs: {
//                     'v-html': varName
//                 }
//             }
//         } else {
//             newNode = {
//                 type: 'tag',
//                 name: 'mp-html',
//                 attribs: {
//                     ':content': varName
//                 }
//             }
//         }

//         isContinue = true
//     }


//     /////////////////////////////////////////////////////////////////
//     //填充变量名到data里去，astDataPath理论上会有值，因为根据模板填充，data是居第一个，so，开搂~
//     if (astDataPath) {
//         try {
//             let body = astDataPath.get("body.body.0")
//             let properties = body.node.argument.properties //直接get居然没法同步修改到ast，这是何解？

//             let argsBindName = wxParseArgs.bindName
//             let value = t.stringLiteral("")
//             let reg = /['"\+\[\]]/
//             if (reg.test(argsBindName)) {
//                 //这个变量名可能是表达式
//                 const logStr = "[Error] 这个变量名可能是表达式：" + argsBindName + "    file: " + file_js;;
//                 //存入日志，方便查看，以防上面那么多层级搜索出问题
//                 console.log(logStr)
//                 global.log.push(logStr)
//             } else {
//                 if (isComputed) {
//                     //如果这个变量是一个表达式的话，那么，就切割一下然后再整进去，并且用setData来赋值
//                     let re = argsBindName.match(/(\w+)\./)
//                     if (re.length > 1) argsBindName = re[1]
//                     value = t.objectExpression([])
//                 }
//                 const op = t.objectProperty(
//                     t.Identifier(argsBindName),
//                     value
//                 )
//                 properties.push(op)
//             }
//         } catch (error) {
//             const logStr =
//                 "[Error]   " +
//                 error +
//                 '   source: astDataPath.get("body.body.0.argument.properties")' +
//                 "    file: " +
//                 file_js
//             //存入日志，方便查看，以防上面那么多层级搜索出问题
//             console.log(logStr)
//             global.log.push(logStr)
//         }
//     }
// }

module.exports = {
    transformWxParse,
    transformWxParseScript,
    transformWxParseTemplate,
}
