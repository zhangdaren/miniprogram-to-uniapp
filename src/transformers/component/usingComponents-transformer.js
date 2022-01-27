/*
 * @Author: zhang peng
 * @Date: 2021-09-06 11:27:11
 * @LastEditTime: 2021-10-30 16:47:17
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
const {  repairRequireAndImportPath} = require(appRoot + '/src/transformers/assets/assets-path-transformer')

/**
 * 组件处理
 * @param {*} $jsAst
 * @param {*} usingComponents
 */
function transformUsingComponents ($jsAst, usingComponents) {
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

    var componentList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, "COMPONENTS", true)

    var reg_plugin = /^plugin:\/\//
    var res_weui = /weui-miniprogram\//

    var importStrList = []
    keyList.map(function (componentName) {
        var componentPath = usingComponents[componentName]
        componentName = utils.toCamel(componentName)

        if (reg_plugin.test(componentPath)) {
            //"hello-component": "plugin://myPlugin/hello-component"
            console.log(`${ componentName }: ${ componentPath } 是小程序特有插件，uniapp不支持！`)
        } else if (res_weui.test(componentPath)) {
            // "mp-searchbar": "/weui-miniprogram/searchbar/searchbar"
            // "mp-actionSheet": "weui-miniprogram/actionsheet/actionsheet"
            // console.log(`weui组件不引入`)
        } else {
            //处理这种根目录的: import SearchBar from '/components/searchBox/index';
            // if (/^\//.test(componentPath)) {
            //     componentPath = '@' + componentPath
            // }

            var fileDir = path.dirname(componentPath)
            componentPath =  repairRequireAndImportPath(componentPath, global.miniprogramRoot, fileDir)

            var importStr = `import ${ componentName } from "${ componentPath }";\r\n`
            importStrList.push(importStr)

            //添加components申明
            var op = t.objectProperty(t.identifier(componentName), t.identifier(componentName), false, true)
            componentList.push(op)
        }
    })

    //倒转一下再插入，不然是反的。
    importStrList.reverse().map(function (importStr) {
        $jsAst.prepend(importStr).root()
    })

    // console.log('11 :>> ', 11)
}

module.exports = {
    transformUsingComponents
}
