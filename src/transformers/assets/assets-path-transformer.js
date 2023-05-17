/*
 * @Author: zhang peng
 * @Date: 2021-09-06 15:00:52
 * @LastEditTime: 2023-04-10 20:38:51
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/assets/assets-path-transformer.js
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

/**
 * 修复js里面的src路径
 * @param {*} $ast
 * @param {*} jsFile 所在文件
 */
function repairScriptSourcePath ($jsAst, jsFile) {
    if (!$jsAst) return

    $jsAst.find([
        `require('$_$src')`,
        `import $_$1 from '$_$src'`,
        `import { $$$1 } from '$_$src'`
    ]).each(function (item) {
        var src = item.match["src"][0].value

        let fileDir = path.dirname(jsFile)
        let extname = path.extname(jsFile)
        let newSrc = pathUtils.relativePath(src, global.miniprogramRoot, fileDir, ".js")

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
            let newSrc = pathUtils.repairAssetPath(src, global.miniprogramRoot, fileDir, false)

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
            let srcNode = item.match['src'][0].node
            let src = srcNode.content

            // global.log("src----", src)

            //这种略过不处理
            //<image class="wc-ftimg" mode="aspectFit" :src="imgsrc + '/wechatimg/form/edit.png'"></image>

            let fileDir = path.dirname(wxmlFile)

            //处理template里面的相对路径
            let newSrc = src.replace(ggcUtils.multiAssetsFileReg, function (match, $1) {
                let newVal = $1

                //展开为绝对路径
                let fullPath = pathUtils.getResolvePath($1, fileDir)

                //重要：判断是否有源文件！防止误替换(???不太记得了)，这里仍然还是转换为相对于static目录
                if (!ggcUtils.urlReg.test(newVal) && !fs.existsSync(fullPath)) {
                    var fileKey = pathUtils.getFileKey(wxmlFile)
                    global.log(`[WARN] 文件 ${ pathUtils.getAbsolutePath(fullPath, false) } 不存在，但仍然对路径进行转换为相对于static目录，运行时需注意！   fileKey: ${ fileKey }`)
                }
                //转换路径为相对于static目录
                newVal = pathUtils.repairAssetPath(
                    $1,
                    global.miniprogramRoot,
                    fileDir,
                    false   //不使用@/，  <image :src="'@/static/image' + file+  'png'"></image>这种引用不到!
                )

                //加上引号
                let character = match[0]
                if (/^['"]/.test(character)) {
                    newVal = `${ character }${ newVal }`
                }
                character = match[match.length - 1]
                if (/['"]$/.test(character)) {
                    newVal = `${ newVal }${ character }`
                }

                return newVal
            })

            //单个路径处理
            // var newSrc = src
            // if (ggcUtils.assetsFileReg.test(src)) {
            //     newSrc = pathUtils.repairAssetPath(
            //         src,
            //         global.miniprogramRoot,
            //         fileDir,
            //         false   //不使用@/，  <image :src="'@/static/image' + file+  'png'"></image>这种引用不到!
            //     )
            // }

            // if (!isReplace) {
            //     var fileKey = pathUtils.getFileKey(wxmlFile)
            //     global.log("[WARN]这个img标签可能有找不到文件的问题，转换后需注意。", item.generate(), '   file: ' + fileKey)
            // }

            srcNode.content = newSrc
        })
        .root()
}




/**
 * 尽可能的转换更多路径
 * 对js代码里面的路径进行资源路径处理
 * 注：这里理论上应该使用/代表绝对路径，而不应该使用@/，
 * 因为有时候，比如地图或第三方需要使用图片时，不识别@符号！！！！
 *
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 * @param {*} fileDir
 */
function repairAstStringLiteralAssetPath ($jsAst, $wxmlAst, fileDir) {
    if ($jsAst) {
        $jsAst.find({ type: 'StringLiteral' })
            .each(function (item) {
                var value = item.attr('value')
                if (ggcUtils.assetsFileReg.test(value)) {
                    //展开为绝对路径
                    let fullPath = pathUtils.getResolvePath(value, fileDir)

                    //重要：判断是否有源文件！防止误替换
                    if (fs.existsSync(fullPath)) {
                        let newSrc = pathUtils.repairAssetPath(value, global.miniprogramRoot, fileDir, false)
                        item.attr('value', newSrc)
                    }
                }
            }).root()
    }

    if ($wxmlAst) {
        // 函数repairTemplateSourcePath已尽可能的多处理路径了，后续如有需要再添加。
    }
}


/**
 * 修复require和import路径
 * @param {*} file  文件相对路径
 * @param {*} root      根目录
 * @param {*} fileDir   当前文件所在目录
 */
function repairRequireAndImportPath (file, root, fileDir) {
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
