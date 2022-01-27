/*
 * @Author: zhang peng
 * @Date: 2021-08-16 09:56:46
 * @LastEditTime: 2021-11-15 11:27:08
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\component\regionPicker-transformer.js
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
 * 处理picker
 * @param {*} $wxmlAst
 * @param {*} fileKey
 * @returns
 */
function transformRegionPicker ($wxmlAst, fileKey) {
    if (!$wxmlAst) return

    var res = $wxmlAst.find('<picker mode="region" $$$1>$$$2</picker>')
    if (res.length) {
        //添加说明
        // 小程序端在form内的自定义组件内有input表单控件时，或者用普通标签实现表单控件，例如评分等，
        // 无法在form的submit事件内获取组件内表单控件值，此时可以使用behaviors。
        // 对于 form 组件，目前可以自动识别下列内置 behaviors:
        // uni://form-field
        // 目前仅支持 微信小程序、QQ小程序、百度小程序、h5。

        $wxmlAst
            .replace('<picker mode="region" name="$_$name" :value="$_$value" $$$1>$$$2</picker>', `<block><region-picker name="$_$name" :value="$_$value" $$$1>$$$2</region-picker>\n<input hidden="true" name="$_$name" :value="$_$value" /></block>`)
            .replace('<picker mode="region" $$$1>$$$2</picker>', `<region-picker $$$1>$$$2</region-picker>`)

        //TODO:
        var comments = `\n[Tip] 检测到组件picker的mode为 region ，在App和H5里未实现，已使用组件region-picker进行替换。
                    虽然已替换，但仍需注意picker在<form/>组件里面的取值问题(可能在formSubmit拿不address，需手动调整)。
                    详情请参阅相关文档, file: ${ fileKey }`
        console.log(comments)

        //复制目录
        var componentsFolder = path.join(global.targetSourceFolder, 'components')
        if (!fs.existsSync(componentsFolder)) {
            fs.mkdirSync(componentsFolder)
        }
        const sourceFolder = path.join(__dirname, '../../project/template/components/region-picker')
        const targetSourceFolder = path.join(global.targetSourceFolder, 'components/region-picker')

        if (!fs.existsSync(targetSourceFolder)) {
            fs.copySync(sourceFolder, targetSourceFolder)
        }
    }


    //     <picker
    //     mode="region"
    //     value="[Array]"
    //     custom-item="[String]"
    //     disabled="[Boolean]"
    //     bindchange="[EventHandle]"
    //     bindcancel="[EventHandle]"
    // >
    // </picker>

    // <picker mode="region"></picker>
    //     <picker mode="region" bindchange="bindRegionChange" value="{{region}}" custom-item="{{customItem}}">
    //     <input class="right-input" disabled="true" placeholder="省份、城市、区县" value="{{region[0]}}，{{region[1]}}，{{region[2]}}" placeholder-class="place-holder" />
    // </picker>

    // if (node.name == "picker" && node.attribs.mode === "region") {
    //     //TODO：使用第三方替代,如uview（因template代码复杂，目测有点难度）
    //     // let logStr = "[Tip] 检测到组件picker的mode为 region ，在App和H5里未实现，请转换后自行作兼容处理。        file-> " + path.relative(global.miniprogramRoot, file_wxml)
    //     // console.log(logStr)
    //     // global.log.push(logStr)

    //     //使用 https://ext.dcloud.net.cn/plugin?id=1536 替换
    //     node.name = "region-picker"
    //     delete node.attribs.mode

    //     let logStr = "[Tip] 检测到组件picker的mode为 region ，在App和H5里未实现，已使用组件region-picker进行替换。        file-> " + path.relative(global.miniprogramRoot, file_wxml)
    //     console.log(logStr)
    //     global.log.push(logStr)
    // }
}

module.exports = {
    transformRegionPicker
}
