/*
 * @Author: zhang peng
 * @Date: 2021-09-06 15:00:52
 * @LastEditTime: 2021-11-24 17:48:14
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\assets\assets-path-transformer.js
 *
 */
const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const clone = require("clone")

var appRoot = "../../.."
const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')
const restoreJSUtils = require(appRoot + '/src/utils/restoreJSUtils.js')
const formatUtils = require(appRoot + '/src/utils/formatUtils.js')

/**
 * 修复js里面的src路径
 * @param {*} $ast
 * @param {*} jsFile 所在文件
 */
function  repairScriptSourcePath ($jsAst, jsFile) {
    if (!$jsAst) return

    $jsAst.find([
        `require('$_$src')`,
        `import $_$1 from '$_$src'`
    ]).each(function (item) {
        var src = item.match["src"][0].value

        let fileDir = path.dirname(jsFile)
        let extname = path.extname(jsFile)
        let newSrc = pathUtils.relativePath(src, global.miniprogramRoot, fileDir)

        if (item.attr("type") === "CallExpression") {
            item.attr("arguments.0.value", newSrc)
        } else {
            item.attr("source.value", newSrc)
        }
    })

    $jsAst.find({ type: "ObjectProperty" }).each(function (item) {
        var valueNode = item.attr("value")

        if (t.isStringLiteral(valueNode)) {
            var src = valueNode.value

            if (!ggcUtils.staticAssetsReg.test(src)) return

            // function  repairAssetPath (filePath, root, fileDir) {
            let fileDir = path.dirname(jsFile)
            let extname = path.extname(jsFile)
            let newSrc = pathUtils. repairAssetPath(src, global.miniprogramRoot, fileDir, false)

            item.attr("value", newSrc)
        }
    }).root()
}


/**
 * 修复标签里面的src路径
 * @param {*} $ast
 * @param {*} wxmlFile 所在文件
 */
function repairTemplateSourcePath ($jsAst, wxmlFile) {
    if (!$jsAst) return

    //忽略：<image :src="imgsrc + '/wechatimg/form/edit.png'"></image>
    var reg_ignore = /^\w+\s*\+['"][^'"]*?['"]$/

    $jsAst.find([
        '<$_$1 src="$_$src" $$$>$$$2</$_$1>',
        '<$_$1 data-src="$_$src" $$$>$$$2</$_$1>',
        '<$_$1 thumb="$_$src" $$$>$$$2</$_$1>',
        '<$_$1 :src="$_$src" $$$>$$$2</$_$1>',
        '<$_$1 :data-src="$_$src" $$$>$$$2</$_$1>',
        '<$_$1 :thumb="$_$src" $$$>$$$2</$_$1>',
    ])
        .each(function (item) {
            var srcNode = item.match['src'][0].node
            var src = srcNode.content

            // console.log("src----", src)

            //不合格的路径不进行处理
            //<image class="wc-ftimg" mode="aspectFit" :src="imgsrc + '/wechatimg/form/edit.png'"></image>
            if (reg_ignore.test(src)) return

            //TODO: 含三元表达式的呢？含变量的呢？  其实这个判断也不好判断

            let fileDir = path.dirname(wxmlFile)

            // var newSrc = src.replace(ggcUtils.multiSssetsFileReg, function (match, $1) {
            //     let newVal = pathUtils. repairAssetPath(
            //         $1,
            //         global.miniprogramRoot,
            //         fileDir,
            //         false   //不使用@/，  <image :src="'@/static/image' + file+  'png'"></image>这种引用不到!
            //     )
            //     //如果有引号，则需要添加上
            //     if (/^['"]/.test(match)) {
            //         newVal = `'${ newVal }'`
            //     }
            //     return newVal
            // })

            var newSrc = src
            if (ggcUtils.assetsFileReg.test(src)) {
                newSrc = pathUtils. repairAssetPath(
                    src,
                    global.miniprogramRoot,
                    fileDir,
                    false   //不使用@/，  <image :src="'@/static/image' + file+  'png'"></image>这种引用不到!
                )
            }

            // function  repairAssetPath (filePath, root, fileDir) {
            // let fileDir = path.dirname(wxmlFile)
            // let newSrc = pathUtils. repairAssetPath(src, global.miniprogramRoot, fileDir)
            // // console.log("newSrc--", newSrc)
            srcNode.content = newSrc
        })
        .root()
}


/**
 * 尽可能的转换更多路径
 * 对js代码里面的路径进行资源路径处理
 * 注：这里理论上应该使用/代表绝对路径，而不应该使用@/，
 * 因为有时候，比如地图或第三方需要使用图片时，不识别@符号！！！！
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 * @param {*} fileDir
 */
function  repairAstStringLiteralAssetPath ($jsAst, $wxmlAst, fileDir) {
    if ($jsAst) {
        $jsAst.find({ type: 'StringLiteral' })
            .each(function (item) {
                var value = item.attr('value')
                if (ggcUtils.assetsFileReg.test(value)) {
                    //TODO: 这里有疑问，为啥要replace？而不是直接就转换呢？
                    //答，会有很多路径
                    // var newValue = value.replace(assetsFileReg, function (match, $1) {
                    //     let newVal = pathUtils. repairAssetPath(
                    //         value,
                    //         global.miniprogramRoot,
                    //         fileDir,
                    //         false
                    //     )
                    //     return newVal
                    // })

                    //直接转换就行了
                    let newSrc = pathUtils. repairAssetPath(value, global.miniprogramRoot, fileDir, false)
                    item.attr('value', newSrc)
                }
            }).root()
    }

    if ($wxmlAst) {
        // $wxmlAst
        //     .find('<$_$tag></$_$tag>')
        //     .each(function (item) {
        //         var tagName = item.attr("content.name")

        //         var attributes = item.attr("content.attributes")
        //         var children = item.attr("content.children")

        //         //处理标签属性
        //         if (attributes) {
        //             attributes.forEach(function (attr) {
        //                 var attrNode = attr.key
        //                 var valueNode = attr.value

        //                 if (attr.value) {
        //                     //判断：有些属性没有值，如v-else
        //                     var attr = attrNode.content
        //                     var value = valueNode.content

        //                     if (attr[0] === ":" || attr.indexOf("v-") > -1) {

        //                     }
        //                 }
        //             })
        //         }

        //         //处理标签内容
        //         if (children && children.length === 1) {
        //             var contentNode = children[0].content.value
        //             if (!contentNode) return
        //             var content = contentNode.content
        //             if (content && content.indexOf('{{') !== -1) {

        //             }
        //         }
        //     })
    }
}


/**
 * 修复require和import路径
 * @param {*} file  文件相对路径
 * @param {*} root      根目录
 * @param {*} fileDir   当前文件所在目录
 */
function  repairRequireAndImportPath (file, root, fileDir) {
    if (!file) return file

    // TODO:单个词是否需要过滤一下?

    if (file[0] === ".") {
        if (file.substr(0, 3) === "../") {
            //好像也没有处理的必要
        } else {
            //以./开头的不处理
        }
    } else if (file[0] === "/") {
        file = "@" + file
    } else {
        var extname = path.extname(file)
        //判断是否位于当前目录
        var curFolderFile = path.join(fileDir, file + (extname ? "" : ".js"))
        if (fs.existsSync(curFolderFile)) {
            file = "./" + file + (extname ? "" : ".js")
        } else {
            //判断是否是npm包(仅判断目录)
            var npmFile = path.join(root, "miniprogram_npm", file)
            if (fs.existsSync(npmFile)) {
                file = path.join("@/miniprogram_npm", file)
            }
        }
    }
    return utils.normalizePath(file)
}


function transformAssetsPath ($jsAst, $wxmlAst) {
    if ($jsAst) {


    }

    if ($wxmlAst) {


    }
}

module.exports = {
    transformAssetsPath,

     repairScriptSourcePath,
    repairTemplateSourcePath,
     repairAstStringLiteralAssetPath,
     repairRequireAndImportPath
}
