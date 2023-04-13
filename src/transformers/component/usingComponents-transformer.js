/*
 * @Author: zhang peng
 * @Date: 2021-09-06 11:27:11
 * @LastEditTime: 2023-04-10 20:36:52
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/component/usingComponents-transformer.js
 *
 */
const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")

const { restore } = require('../../utils/restoreJSUtils')


var appRoot = "../../.."
const utils = require(appRoot + "/src/utils/utils")
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")

// const babelUtils = require(appRoot + "/src/utils/babelUtils")
const restoreJSUtils = require(appRoot + "/src/utils/restoreJSUtils")

//资源文件
const { repairRequireAndImportPath } = require(appRoot + '/src/transformers/assets/assets-path-transformer')

/**
 * 组件处理
 * @param {*} $jsAst
 * @param {*} usingComponents
 */
function transformUsingComponents ($jsAst, usingComponents,fileKey) {
    if (!$jsAst) return

    // 1.在头上添加import,注意组件名
    // 2.在components添加引用

    // "usingComponents": {
    //     "appbar": "/components/appbar/appbar",
    //     "SearchBar": "/components/searchBox/index",
    //     "mp-html": "/components/mp-html/index",
    //     "mp-tabs": "../../components/tabs/index",
    //     "mp-cell": "../cell/cell",
    //     "mp-cell-item": "../cell/cell/item",
    //     "test-to-camel": "../cell/cell/item",
    //     "diy-imageSingle": "../cell/cell/item",
    //      "hello-component": "plugin://myPlugin/hello-component"
    // }


    var keyList = Object.keys(usingComponents)
    if (!keyList.length) {
        return
    }

    var componentList = []
    try {
        componentList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, "COMPONENTS", fileKey, true)
    } catch (error) {
        global.log("[ERROR]", error, "getDataOrPropsOrMethodsList",  fileKey)
    }

    var reg_plugin = /^plugin:\/\//
    var res_weui = /weui-miniprogram\//

    var importStrList = []
    const mpHtmlReg = /mp-html|mpHtml/i
    keyList.map(function (componentName) {
        //如果小程程序添加过mp-html，那么就跳过
        if (mpHtmlReg.test(componentName)) return

        //备份
        const oldComponentName = componentName

        var componentPath = usingComponents[componentName]
        componentName = utils.toCamel(componentName)

        if (reg_plugin.test(componentPath)) {
            //"hello-component": "plugin://myPlugin/hello-component"
            global.log(`${ componentName }: ${ componentPath } 是小程序特有插件，uniapp不支持！`)
        } else if (res_weui.test(componentPath)) {
            // "mp-searchbar": "/weui-miniprogram/searchbar/searchbar"
            // "mp-actionSheet": "weui-miniprogram/actionsheet/actionsheet"
            // global.log(`weui组件不引入`)
        } else {

            //如果是当前目录，则加上./
            if (!/^[\.\/]/.test(componentPath)) {
                componentPath = './' + componentPath
            }
            //如果是根目录，则加上@
            if (/^\//.test(componentPath)) {
                //如果是以/开头的，表示根目录
                componentPath = "@" + componentPath
            }

            //处理这种根目录的: import SearchBar from '/components/searchBox/index';
            // if (/^\//.test(componentPath)) {
            //     componentPath = '@' + componentPath
            // }

            var fileDir = path.dirname(componentPath)
            componentPath = repairRequireAndImportPath(componentPath, global.miniprogramRoot, fileDir)

            var importStr = ""
            if (global.globalUsingComponents[oldComponentName]) {
                //如果已经全局引入了，那么注释掉局部组件，并且不在components里引入组件
                importStr = `// import ${ componentName } from "${ componentPath }"; // PS: 此组件与全局组件重名，已注释（可能误判，请开发者根据实际情况处理）。\r\n`
            } else {
                importStr = `import ${ componentName } from "${ componentPath }";\r\n`
                //添加components申明
                var op = t.objectProperty(t.identifier(componentName), t.identifier(componentName), false, true)
                componentList.push(op)
            }
            importStrList.push(importStr)
        }
    })

    //倒转一下再插入，不然是反的。
    importStrList.reverse().map(function (importStr) {
        if (importStr.startsWith("//")) {
            $jsAst.before(importStr).root()
        } else {
            try{
                $jsAst.prepend(importStr).root()
            }catch(error){
                global.log('%c [ $jsAst.prepend(importStr).root() error ]-124', 'font-size:13px; background:pink; color:#bf2c9f;', error)
                global.log('%c [ importStr ]-125', 'font-size:13px; background:pink; color:#bf2c9f;', importStr)
            }
        }
    })

    // global.log('11 :>> ', 11)
}

module.exports = {
    transformUsingComponents
}
