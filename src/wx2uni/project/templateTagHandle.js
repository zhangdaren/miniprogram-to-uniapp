
const clone = require('clone')
const utils = require('../../utils/utils.js')
const TemplateParser = require('../wxml/TemplateParser')
const paramsHandle = require('../paramsHandle')
const pathUtil = require('../../utils/pathUtil.js')

//初始化一个解析器
const templateParser = new TemplateParser()

/**
 * 替换wxml里面需要替换的参数
 * @param {*} ast
 * @param {*} replacePropsMap
 * @param {*} fileKey
 */
function repalceWxmlParams (ast, replacePropsMap = {}, fileKey) {
    for (let i = 0;i < ast.length;i++) {
        let node = ast[i]
        if (!node) continue
        for (const k in node.attribs) {
            //试运行：修复template里data、id或default变量
            let oldValue = node.attribs[k]
            if (/^(v-)|^:/.test(k)) {
                //判断一下key  v-开头和:开头的才放
                let newValue = paramsHandle(oldValue, true, false, replacePropsMap)
                node.attribs[k] = newValue
            }
        }

        if (node.type === 'text') {
            if (node.data) {
                let text = node.data.replace(/{{(.*?)}}/g, function (match, $1) {
                    let result = paramsHandle($1, true, false, replacePropsMap)
                    return "{{" + result + "}}"
                })
                node.data = text
            }
        }

        if (node.children && node.children.length > 0) {
            repalceWxmlParams(node.children, replacePropsMap, fileKey)
        }
    }
}

/**
 * 使用template内容来替换相应的标签
 * @param {*} tagInfo        标签对应的数据
 * @param {*} templateList   template列表
 * @param {*} templateName   template的name，与tagbInfo.name不一定相同
 * @param {*} attr           需要附加的参数
 */
function replaceTagByTemplate (tagInfo, templateList, templateName, attr = "") {
    const name = templateName || tagInfo.name
    const fileKey = tagInfo.curFileKey
    const replacePropsMap = tagInfo.replacePropsMap
    const templateTag = tagInfo.templateTag
    const templateTagContent = templateParser.astToString([templateTag])

    let minWxml = pagesData[fileKey].data.minWxml
    let wxml = pagesData[fileKey].data.wxml

    let templateWxml = ""
    var item = templateList[name]
    if (item) {
        //先把之前的ast取出备用
        let ast = item.ast
        let oldAst = item.oldAst
        let attrs = templateTag.attribs
        let templateFileKey = item.curFileKey
        let attrsStr = attr + " data-type=\"template\"" + " data-is=\"" + name + "\"" + " data-attr=\"" + attrs[":data"] + "\""
        let reg_attr = /:?data\b|:?is\b/
        for (const key in attrs) {
            const value = attrs[key]
            if (!reg_attr.test(key)) {
                attrsStr += " " + key + "=\"" + value + "\""
            }
        }

        //开始替换
        repalceWxmlParams(ast, replacePropsMap, name)

        let templateContent = templateParser.astToString(ast)
        templateWxml = "<block" + attrsStr + ">" + templateContent + "</block>"

        if (templateFileKey === fileKey) {
            //替换掉原属于页面里面的template
            let oldTemplateContent = templateParser.astToString(oldAst)

            if (minWxml) pagesData[fileKey].data.minWxml = minWxml.replace(oldTemplateContent, "")
            if (wxml) pagesData[fileKey].data.wxml = wxml.replace(oldTemplateContent, "")
        }
    } else if (!/wxParse|WxEmojiView/i.test(name)) {
        templateWxml = "<!-- 下行template对应的wxml不存在，无法替换，代码已注释 -->\r\n" + "<!-- " + templateTagContent + "-->\r\n"
        const logStr = "[Error] template对应的wxml不存在，无法替换，代码已注释 --> " + templateTagContent + "   file --> " + fileKey
        utils.log(logStr, "base")
        global.log.push(logStr)
    }
    return templateWxml
}


/**
 * 使用template内容来替换相应的标签
 * @param {*} tagInfo        标签对应的数据
 * @param {*} templateList   template列表
 * @param {*} templateName   template的name，与tagbInfo.name不一定相同
 * @param {*} attr           需要附加的参数
 */
function replaceTagByTemplateAst (tagInfo, templateList, templateName, attr = "") {
    const name = templateName || tagInfo.name
    const replacePropsMap = tagInfo.replacePropsMap
    const templateTag = tagInfo.templateTag

    var item = templateList[name]
    let oldAst = null
    if (item) {
        //先把之前的ast取出备用
        let ast = item.ast
        oldAst = clone(item.oldAst[0])  //加[]是为了包含当前标签
        let attrs = templateTag.attribs
        let newAttrs = {
            "data-type": "template",
            "data-is": name,
            "data-attr": attrs[":data"]
        }
        let reg_attr = /:?data\b|:?is\b/
        for (const key in attrs) {
            const value = attrs[key]
            if (!reg_attr.test(key)) {
                newAttrs[key] = value
            }
        }

        //改头换面
        oldAst.name = "block"
        oldAst.attribs = newAttrs

        if (oldAst.children && oldAst.children.length > 0) {
            //开始替换
            repalceWxmlParams(oldAst.children, replacePropsMap, name)
        }
    }
    return oldAst
}


/**
 * 遍历ast，搜索template标签，查找并替换，且替换变量，直到ast内无template对象
 *
 * @param {*} parent        父元素
 * @param {*} parentKey     在父元素的key
 * @param {*} templateList  templateList
 * @param {*} tempKey       当前操作的是哪个template
 */
function templateSelfHandle (parent, parentKey, templateList, tempKey) {
    let node = parent[parentKey]
    if (node.type === "tag") {
        if (node.name === "template") {
            let templateName = node.attribs.is
            if (templateName) {
                if (templateList[templateName]) {
                    let dataAttr = node.attribs[":data"]
                    let replacePropsMap = {}
                    if (dataAttr) {
                        replacePropsMap = utils.parseTemplateAttrParams(
                            dataAttr
                        )
                    }

                    let newAst = templateList[templateName].oldAst[0]
                    for (const kk in newAst.children) {
                        templateSelfHandle(newAst.children, kk, templateList, tempKey)
                    }

                    let item = {
                        name: templateName,
                        templateTag: node,
                        curFileKey: tempKey,
                        replacePropsMap: replacePropsMap
                    }

                    let subAst = []
                    if (/\?/.test(templateName)) {
                        //含有三元表达式的情况，需注意，目前仅支持简单的三元表达式
                        let reg = /{{\s*(.*?)\s*\?\s*(.*?)\s*:\s*(.*?)\s*}}/
                        templateName.replace(reg, function (match, $1, $2, $3) {
                            //
                            let attr = " v-if=\"" + $1 + "\""
                            let name2 = $2.replace(/^['"]|['"]$/g, "")
                            let ast1 = replaceTagByTemplateAst(item, templateList, name2, attr);;
                            ast1 && subAst.push(ast1)
                            //
                            attr = " v-else"
                            let name3 = $3.replace(/^['"]|['"]$/g, "")
                            let ast2 = replaceTagByTemplateAst(item, templateList, name3, attr)

                            ast2 && subAst.push(ast2)
                        })
                    } else {
                        let ast = replaceTagByTemplateAst(item, templateList, templateName)
                        ast && subAst.push(ast)
                    }

                    if (parentKey) {
                        parent[parentKey] = subAst[0]
                    } else {
                        parent.ast = subAst[0].children
                        parent.oldAst = subAst
                    }
                } else if (!/wxParse|WxEmojiView/i.test(templateName)) {
                    const templateTagContent = templateParser.astToString([node])

                    const logStr = "[Error] template对应的wxml不存在，无法替换2 --> " + templateTagContent + "   templateName --> " + templateName
                    utils.log(logStr, "base")
                    global.log.push(logStr)
                }
            }
        } else {
            //有name属性时，它就是一个类似于include的对象
            var children = node.children
            if (children && children.length) {
                for (const kk in children) {
                    templateSelfHandle(children, kk, templateList, tempKey)
                }
            }
        }
    } else {
        //有name属性时，它就是一个类似于include的对象
        var children = node.children
        if (children && children.length) {
            for (const kk in children) {
                templateSelfHandle(children, kk, templateList, tempKey)
            }
        }
    }
}


/**
 * 处理template标签，将页面里面的template标签使用对应的内容进行替换，替换不了的将注释
 */
function templateTagHandle () {
    let pagesData = global.pagesData
    let templateInfo = global.templateInfo
    let tagList = templateInfo.tagList
    let templateList = templateInfo.templateList

    //递归遍历templateList，解决template套娃问题
    for (const key in templateList) {
        ///wxparse貌似会一直循环，很久。。。。
        if (!/WxEmojiView/i.test(key)) {
            const item = templateList[key]
            const curFileKey = item.curFileKey
            const ast = item.oldAst
            for (const k in ast) {
                templateSelfHandle(ast, k, templateList, key)
            }

            if (pagesData[curFileKey] && pagesData[curFileKey].data && pagesData[curFileKey].data.type === "all") {
                const logStr = "[Error] template对应的wxml实际为vue文件(至少包含wxml和js文件)，请转换完后，手动调整 --> " + "   file --> " + curFileKey
                utils.log(logStr, "base")
                global.log.push(logStr)
            }
        } else {
            delete templateList[key]
        }
    }

    //过滤wxParse相关
    for (let i = tagList.length - 1;i >= 0;i--) {
        const item = tagList[i]
        const templateName = item.name
        if (/WxEmojiView/i.test(templateName)) {
            tagList.splice(i, 1);;
        }
    }

    for (const key in tagList) {
        const item = tagList[key]
        const templateName = item.name
        const fileKey = item.curFileKey
        const templateTag = item.templateTag
        const templateTagContent = templateParser.astToString([templateTag])

        if (!/WxEmojiView/i.test(templateName) && pagesData[fileKey] && pagesData[fileKey].data) {
            let templateWxml = ""
            if (/\?/.test(templateName)) {
                //含有三元表达式的情况，需注意，目前仅支持简单的三元表达式
                let reg = /{{\s*(.*?)\s*\?\s*(.*?)\s*:\s*(.*?)\s*}}/
                templateName.replace(reg, function (match, $1, $2, $3) {
                    //
                    let attr = " v-if=\"" + $1 + "\""
                    let name2 = $2.replace(/^['"]|['"]$/g, "")
                    templateWxml += replaceTagByTemplate(item, templateList, name2, attr)
                    //
                    attr = " v-else"
                    let name3 = $3.replace(/^['"]|['"]$/g, "")
                    templateWxml += replaceTagByTemplate(item, templateList, name3, attr)
                })
            } else {
                templateWxml = replaceTagByTemplate(item, templateList, templateName)
            }

            let minWxml = pagesData[fileKey].data.minWxml
            let wxml = pagesData[fileKey].data.wxml
            if (minWxml) pagesData[fileKey].data.minWxml = minWxml.replace(templateTagContent, templateWxml)
            if (wxml) pagesData[fileKey].data.wxml = wxml.replace(templateTagContent, templateWxml)
        } else {
            utils.log("页面不存在 ", fileKey, pagesData[fileKey])
        }
    }
}

module.exports = templateTagHandle
