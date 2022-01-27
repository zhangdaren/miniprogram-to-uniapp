/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:00:05
 * @LastEditTime: 2022-01-06 15:12:22
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\tag\template-tag-transformer.js
 *
 */


const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const clone = require("clone")
var appRoot = "../../.."
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')

const { getMustacheTokens, parseMustache, stringifyMustache } = require(appRoot + "/src/utils/mustacheUtils")

const { renameTemplateVariable } = require(appRoot + "/src/utils/renameUtils")

function addTemplateTagDataToGlobal (wxmlAst, fileKey) {
    if (wxmlAst) {
        if (!global.templateData) {
            global.templateData = {}
        }
        wxmlAst.replace(`<import src="$_$" $$$></import>`, "")
            .find(`<template name="$_$name" $$$></template>`)
            .each(function (item) {
                var match = item.match['name']
                var name = match[0].value

                if (!global.templateData[name]) {
                    global.templateData[name] = {}
                }
                // console.log("template name=", name)
                global.templateData[name]["ast"] = item
                global.templateData[name]["fileKey"] = fileKey

                //TODO: 注释它
            }).root()

        wxmlAst.find([
            `<template is="$_$is" :data="$_$data" $$$></template>`,
            `<template is="$_$is" data="$_$data" $$$></template>`,
            `<template :is="$_$is" $$$></template>`,
            `<template is="$_$is" $$$></template>`,
        ])
            .each(function (item) {
                var isMatch = item.match['is']
                var dataMatch = item.match['data']
                var attrs = item.match['$$$$']

                //TODO: 这种是动态的。。要判断一下
                {/* <template is="{{xxxx}}" data="{{text: 'forbar', abc, 'd':5, ...tt, b:[1,2,3]}}" class="abc"/> */ }

                var is = isMatch[0].value

                //wxParse 不在这里处理
                if (is === "wxParse") return

                var data = ""
                if (dataMatch) {
                    data = dataMatch[0].value
                }

                // console.log("is---------------", is, wxmlAst.root().generate())

                // console.log("is, data", is, data)
                if (global.templateData[is] && global.templateData[is]["ast"]) {
                    // console.log("找到了，就在当前页面")
                    var newAst = global.templateData[is]["ast"]
                    replaceTemplateTag(item, data, newAst, attrs)
                } else {
                    // console.log("template is=", is)

                    global.templateData[is] = {
                        ast: null,
                        data,
                        fileKey: fileKey,
                        attrs
                    }
                }
            }).root()
    }
}

/**
 * 使用newAst替换template标签，并且解析dataAttr，替换对应变量
 * @param {*} templateTagAst
 * @param {*} dataAttr
 * @param {*} newAst
 */
function replaceTemplateTag (templateTagAst, dataAttr, newAst, attrs) {
    //把参数改了
    const object = `var obj = {${ dataAttr }}`

    //TODO:解析失败时，后面流程怎么走
    var ast = $(object, { isProgram: false })
    if (ast.error) {
        console.log("replaceTemplateTag dataAttr parse error", ast.error)
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

        renameTemplateVariable(newAst, replaceList)
        // console.log(newAst.root().generate());
        // console.log("replaceList", replaceList)
    }

    newAst.attr("content.name", "block").root()
    //
    //节点替换
    templateTagAst.before(`<!-- parse ${ templateTagAst.generate() } -->`)
    templateTagAst.replaceBy(newAst)
    // item.append( ...newAst.attr("content.children"))

    //添加template原有属性
    var attributes = templateTagAst.attr("content.attributes")
    attributes.push(...attrs)
    templateTagAst.attr("content.attributes", attributes)

    templateTagAst.attr("content.name", "block").root()
}

/**
 * template标签处理
 * @param {*} wxmlAst
 * @param {*} wxmlFile
 * @returns
 */
function transformTemplateTag (wxmlAst, wxmlFile) {
    if (!wxmlAst) {
        return
    }
    if (wxmlFile && wxmlFile.indexOf("index.wxml") > -1) {
        // console.log("wxmlFile 1", wxmlFile)
    }
    wxmlAst.find([
        `<template is="$_$is" :data="$_$data" $$$></template>`,
        `<template is="$_$is" data="$_$data" $$$></template>`,
        `<template :is="$_$is" $$$></template>`,
        `<template is="$_$is" $$$></template>`,
    ])
        .each((item) => {
            // console.log("wxmlFile 2", wxmlFile)

            var isMatch = item.match['is']
            var dataMatch = item.match['data']

            var is = isMatch[0].value

            //wxParse不在这里处理
            if (is === "wxParse") return

            var data = ""
            if (dataMatch) {
                data = dataMatch[0].value
            }
            // console.log("is, data", is, data)

            if (!global.templateData[is] || !global.templateData[is]["ast"]) {
                item.before("<!-- template没有找到这个wxml，已注释 -->")
                item.replaceBy(`<!-- ${ item.generate() } -->`)

                var fileKey = pathUtils.getFileKey(wxmlFile)
                console.log("[Error]template没有找到这个wxml   is=" + is + "    fileKey: " + fileKey)
                return
            }
            var templatePageData = global.templateData[is]
            var templateAst = templatePageData["ast"]

            if (templateAst) {
                // console.log("1", templateAst.generate())

                transformTemplateTag(templateAst, wxmlFile)

                // console.log("2", templateAst.generate())
                replaceTemplateTag(item, data, templateAst)
            }
        }).root()
}


module.exports = {
    addTemplateTagDataToGlobal,
    replaceTemplateTag,
    transformTemplateTag,
}
