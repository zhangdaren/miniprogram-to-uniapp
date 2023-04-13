/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:00:05
 * @LastEditTime: 2023-02-19 12:17:42
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/tag/template-tag-transformer.js
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

const { renameTemplateVariable } = require(appRoot + "/src/utils/renameUtils")

/**
 * 添加模板到global存起，如果有需要替换的则进行替换
 * @param {*} pageData
 * @param {*} fileKey
 */
function addTemplateTagDataToGlobal (pageData, fileKey) {
    var wxmlAst = pageData.wxmlAst
    if (wxmlAst) {
        if (!global.templateData) {
            global.templateData = {}
        }

        var wxsScriptList = pageData.wxsScriptList
        var code = wxmlAst.generate()

        wxmlAst.replace(`<import src="$_$" $$$></import>`, "")
            .find(`<template name="$_$name" $$$></template>`)
            .each(function (item) {
                var match = item.match['name']
                var name = match[0].value

                if (!global.templateData[name]) {
                    global.templateData[name] = {}
                }
                // global.log("template name=", name)
                //
                global.templateData[name]["ast"] = item
                global.templateData[name]["fileKey"] = fileKey

                //wxs
                var list = wxsScriptList.filter(item => code.includes(item.module))
                global.templateData[name]["wxsScriptList"] = list

                //wxss
                var wxssFile = pageData.wxssFile
                let fileDir = path.dirname(wxssFile)
                let fullPath = pathUtils.getResolvePath(wxssFile, fileDir)
                var absPath = pathUtils.getAbsolutePath(fullPath)
                absPath = absPath.replace(/\.wxss$/, '.css')
                global.templateData[name]["wxssFile"] = absPath

                //TODO: 注释它
            }).root()

        //处理标签
        transformTemplateTag(pageData, fileKey, true)
    }
}

/**
 * 使用newAst替换template标签，并且解析dataAttr，替换对应变量
 * @param {*} templateTagAst
 * @param {*} dataAttr
 * @param {*} targetAst  用作替换的真正的template内容的ast
 * @param {*} attrs
 */
function replaceTemplateTag (templateTagAst, dataAttr, targetAst, attrs) {
    //把参数改了
    const object = `var obj = {${ dataAttr }}`

    //TODO:解析失败时，后面流程怎么走
    var ast = $(object, { isProgram: false })
    if (ast.error) {
        global.log("replaceTemplateTag dataAttr parse error  data=" + dataAttr)
    } else {
        var list = ast.attr("declarations.0.init.properties")

        var replaceList = []
        list.forEach(function (obj) {
            //忽略解构语法对象：SpreadElement
            if (t.isObjectProperty(obj)) {
                var key = obj.key.name || obj.key.value
                if (!obj.shorthand) {
                    var value = obj.value
                    //可能这里有很多类型
                    replaceList.push({
                        oldName: key,
                        newName: $(value).generate()
                    })
                }
            }
        })

        renameTemplateVariable(targetAst, replaceList)
        // global.log(newAst.root().generate());
        // global.log("replaceList", replaceList)
    }

    targetAst.attr("content.name", "block")
    //
    //节点替换
    templateTagAst.before(`<!-- parse ${ templateTagAst.generate() } -->`)

    //缓存
    var newTargetAst = targetAst.clone()

    /**
     * 将对应的template代码进行隐藏，防止<template name="mine"/>和<template is="mine"></template>在同一个页面时，干扰正常的布局
     * TODO: 后面看是不是需要直接进行删除？
     */
    targetAst.attr("content.name", "block")
    if (!targetAst.isHandle) {
        var attributes = targetAst.attr("content.attributes")
        var attr = attributes.find(node => node.key.content === "v-if")
        if (attr) {
            attr.value.content = "false"
        } else {
            attributes.push({
                key: {
                    content: "v-if"
                },
                value: {
                    content: "false"
                }
            })
        }
        targetAst.before("<!-- template对应的原始代码，为保证正常显示，已对其进行隐藏。 -->")
        //增加标识，防止重复处理
        targetAst.isHandle = true
    }

    //添加template原有属性
    var attributes = newTargetAst.attr("content.attributes")
    if (attrs) {
        //可能attrs为undefined
        attributes.push(...attrs)
    }

    newTargetAst.attr("content.attributes", attributes)
    newTargetAst.attr("content.name", "block")

    try {
        templateTagAst.replaceBy(newTargetAst)
    } catch (error) {
        global.log('%c [ templateTagAst.replaceBy(newAst.clone()) error ]-118', 'font-size:13px; background:pink; color:#bf2c9f;', error)
        global.log('%c [ templateTagAst.generate()  ]-119', 'font-size:13px; background:pink; color:#bf2c9f;', newTargetAst.generate())
    }
}

/**
 * template标签处理
 * @param {*} pageData
 * @param {*} fileKey
 * @param {*} isAddToGlobal
 * @returns
 */
function transformTemplateTag (pageData, fileKey, isAddToGlobal = false) {
    let wxmlAst = pageData.wxmlAst
    let wxmlFile = pageData.wxmlFile

    if (!wxmlAst) {
        return
    }
    if (wxmlFile && wxmlFile.indexOf("index.wxml") > -1) {
        // global.log("wxmlFile 1", wxmlFile)
    }
    wxmlAst.find([
        `<template is="$_$is" :data="$_$data" $$$></template>`,
        `<template is="$_$is" data="$_$data" $$$></template>`,
        `<template :is="$_$is" $$$></template>`,
        `<template is="$_$is" $$$></template>`,
    ])
        .each((item) => {
            // global.log("wxmlFile 2", wxmlFile)

            var isMatch = item.match['is']
            var dataMatch = item.match['data']
            var attrs = item.match['$$$$']

            var is = isMatch[0].value

            //wxParse不在这里处理
            if (is === "wxParse") return

            var data = ""
            if (dataMatch) {
                data = dataMatch[0].value || ""
            }
            // global.log("is, data", is, data)

            if (global.templateData[is] && global.templateData[is]["ast"]) {
                // global.log("找到了，就在当前页面")
                var templateAst = global.templateData[is]["ast"]
                var templatePageData = global.templateData[is]

                // wxs
                var wxsScriptList = templatePageData["wxsScriptList"]
                handlePageWxsScript(pageData, wxsScriptList)

                // css
                var wxssFile = templatePageData["wxssFile"]
                handlePageWxssStyle(pageData, wxssFile)

                if (templateAst) {
                    if (!isAddToGlobal) {
                        // global.log("1", templateAst.generate())
                        transformTemplateTag(templateAst, wxmlFile)
                    }
                    // global.log("2", templateAst.generate())
                    replaceTemplateTag(item, data, templateAst, attrs)
                }
            } else {
                // global.log("template is=", is)

                if (isAddToGlobal) {
                    //添加到global
                    global.templateData[is] = {
                        ast: null,
                        data,
                        fileKey: fileKey,
                        attrs
                    }
                } else {
                    item.before("<!-- template没有找到这个wxml，已注释 -->")
                    item.replaceBy(`<!-- ${ item.generate() } -->`)

                    global.log("[ERROR]template没有找到这个wxml   is=" + is + "    fileKey: " + fileKey)
                }
            }

        }).root()
}

/**
 * 添加wxsScriptList添加到pageData里
 * @param {*} pageData
 * @param {*} wxsScriptList
 */
function handlePageWxsScript (pageData, wxsScriptList) {
    //路径处理
    var list = clone(wxsScriptList)
    pageData.wxsScriptList.push(...list)
    //数组去重
    pageData.wxsScriptList = utils.uniqueArray(pageData.wxsScriptList, "absPath")
}

/**
 * 添加wxsStyleList添加到pageData里
 * @param {*} pageData
 * @param {*} wxsStyleList
 */
function handlePageWxssStyle (pageData, wxssFile) {
    pageData.wxsStyleList.push(wxssFile)
    //数组去重
    pageData.wxsStyleList = utils.duplicateRemoval(pageData.wxsStyleList)
}

module.exports = {
    addTemplateTagDataToGlobal,
    replaceTemplateTag,
    transformTemplateTag,
}
