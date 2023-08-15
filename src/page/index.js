/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2023-05-17 15:29:56
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\page\index.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const clone = require("clone")

var appRoot = "../.."
const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')
const restoreJSUtils = require(appRoot + '/src/utils/restoreJSUtils.js')
const formatUtils = require(appRoot + '/src/utils/formatUtils.js')
const { getTemplateVarList } = require(appRoot + '/src/utils/varUtils.js')

//js babel 解析器
const JavascriptParser = require(appRoot + "/src/page/script/JavascriptParser")

//初始化一个解析器
const javascriptParser = new JavascriptParser()


//js
const { transformAppAst } = require(appRoot + "/src/page/script/app/app-transformer")
const { transformPageAst } = require(appRoot + "/src/page/script/page/page-transformer")
const { transformComponentAst } = require(appRoot + "/src/page/script/component/component-transformer")
const { transformBehaviorAst } = require(appRoot + "/src/page/script/behavior/behavior-transformer")
const { transformCustomPageAst } = require(appRoot + "/src/page/script/customPage/customPage-transformer")
const { transformVantComponentAst } = require(appRoot + "/src/page/script/vantComponent/VantComponent-transformer")
const { transformSingleJSAst } = require(appRoot + "/src/page/script/singleJS/singleJS-transformer")

//template
const { transformTemplateAst } = require(appRoot + "/src/page/template/template-transformer")

//style
const { transformStyleFile } = require(appRoot + "/src/page/style/style-transformer")

//component
const { transformWxParse } = require(appRoot + "/src/transformers/component/wxParse-transformer")
const { transformRegionPicker } = require(appRoot + "/src/transformers/component/regionPicker-transformer")
const { transformUsingComponents } = require(appRoot + "/src/transformers/component/usingComponents-transformer")
const { transformWeUIScript } = require(appRoot + "/src/transformers/component/weui-transformer")
const { transformGenericsTag, transformComponentPathToAbsolute } = require(appRoot + "/src/transformers/component/generics-transformer")

//function
const { transformGetCurrentPages } = require(appRoot + "/src/transformers/function/getCurrentPages-transformer")
const { transformTriggerEvent } = require(appRoot + "/src/transformers/function/triggerEvent-transformer")
const { transformSetData } = require(appRoot + "/src/transformers/function/setData-transformer")
const { transformAnimate } = require(appRoot + "/src/transformers/function/animate-transformer")
const { transformArrowFunction } = require(appRoot + '/src/transformers/function/arrowFunction-transformer')
const { transformSelectComponent } = require(appRoot + '/src/transformers/function/selectComponent-transformer')
const { transformSelectorQuery } = require(appRoot + '/src/transformers/function/selectorQuery-transformer')
const { transformCloudFunction } = require(appRoot + '/src/transformers/cloudFunction/cloudFunction-transformer')

//lifecycle
const { transformLifecycleFunction } = require(appRoot + "/src/transformers/lifecycle/lifecycle-transformer")

//variable
const { transformVariable } = require(appRoot + '/src/transformers/variable/variable-transformer')
const { transformDataset } = require(appRoot + '/src/transformers/variable/dataset-transformer')

//behavior/mixins
const { transformBehavior } = require(appRoot + '/src/transformers/behavior/behavior-transformer')

//other code
const { transformSpecialCode } = require(appRoot + '/src/transformers/other/special-code-transformer')

//处理特殊代码结构
const { transformSpecialStructure } = require(appRoot + '/src/transformers/specialStructure/specialStructure-transformer')

//处理ts
const { transformTypescript } = require(appRoot + '/src/transformers/typescript/typescript-transformer')

//处理include和template
const {transformTemplateToComponent } = require(appRoot + '/src/transformers/tag/transform-include')


//资源文件
const {
    repairScriptSourcePath,
    repairTemplateSourcePath,
    repairAstStringLiteralAssetPath
} = require(appRoot + '/src/transformers/assets/assets-path-transformer')

class Page {
    constructor (options) {
        this.jsFile = options.jsFile || ""
        this.jsFileType = options.jsFileType || "JS"
        this.wxmlFile = options.wxmlFile || ""
        this.jsonFile = options.jsonFile || ""
        this.wxssFile = options.wxssFile || ""
        this.fileKey = options.fileKey || ""
        this.cssLanguage = options.cssLanguage || ""
        this.wxmlExtname = options.wxmlExtname || ".wxml"

        //是否是ts
        this.isTSFile = this.jsFileType === "TS"

        this.jsAst = null
        this.wxmlAst = null
        this.wxssAst = null

        this.astType = ""

        this.isApp = this.fileKey === "app"

        this.styleConfig = {}
        this.usingComponents = {}

        //抽象节点列表
        this.genericsComponentList = []

        this.styleContent = ""


        if (
            this.fileKey === "app"
            || this.jsFile && this.wxmlFile
            || this.wxmlFile && this.wxssFile
        ) {
            this.isVueFile = true
        } else {
            this.isVueFile = false
        }

        //页面里的wxs信息
        this.wxsScriptList = []
        this.wxsStyleList = []

        this.propInfo = null //初始为null，方便后面判断

        this.isSDKFile = false

        this.varList = []

        this.isTemplateFile = false
        this.templateNameList = []
        this.templateImportList = []
        this.includeList = []
        this.vanTagList = []

        //统计简易双向绑定变量，其实这两个并无实际用上。
        this.tagTwoWayBindings = []
        this.twoWayBindings = []
    }

    /**
     * 获取输出文件名
     * @param {*} file
     * @returns
     */
    getOutFile (file) {
        if (!file) {
            //等于对应文件vue, js 等
        }
        var relPath = path.relative(global.sourceFolder, file)
        var newFile = path.join(global.targetSourceFolder, relPath)
        newFile = utils.normalizePath(newFile)
        return newFile
    }


    /**
     * 获取props里面的字段及类型
     * 支持单/多个类型，统一输出成数组
     * {
     *    "width": ["Number"],
     *    "height":["Number", "String"]
     * }
     */
    getPropsInfo () {
        if (this.propInfo) return this.propInfo

        var propList = ggcUtils.getDataOrPropsOrMethodsList(this.jsAst, ggcUtils.propTypes.PROPS, this.fileKey)
        var obj = {}
        propList.map(function (item) {
            var key = item.key && (item.key.name || item.key.value)
            var typeList = []
            if (item.value && item.value.properties) {
                var properties = item.value.properties
                var typeNode = properties.find((obj) => obj.key && (obj.key.name === "type" || obj.key.value === "type"))

                if (typeNode && typeNode.value) {
                    if (t.isIdentifier(typeNode.value)) {
                        var type = typeNode.value.name || typeNode.value.value
                        typeList.push(type)
                    } else if (t.isArrayExpression(typeNode.value)) {
                        var list = typeNode.value.elements.map(node => (node.name || node.value))
                        typeList.push(...list)
                    }

                    key = key.replace(/^:/, "")
                    //驼峰命名转为短横线命名
                    key = utils.getKebabCase(key)
                    obj[key] = typeList
                }
            }
        })

        return obj
    }

    /**
     * ////////////////////////////////////////////////////////////////
     * //                                                            //
     * //                    文件转换，核心方法！！！                    //
     * //                                                            //
     * ////////////////////////////////////////////////////////////////
     */
    async transform (isIncludeFile = false) {
        if (this.isSDKFile) return

        //生成jsAst、wxmlAst、style内容(style单独处理了，无ast)

        var fileKey = this.fileKey
        var jsFile = this.jsFile
        var wxmlFile = this.wxmlFile
        var wxssFile = this.wxssFile

        //获取当前文件所在目录
        let fileDir = path.dirname(jsFile || wxmlFile)

        if (!isIncludeFile) {
            this.transformScriptFile(jsFile, fileKey)
            this.transformTemplateFile(wxmlFile, this.wxmlExtname)
            this.styleContent = await transformStyleFile(wxssFile, fileKey)
        }

        var jsAst = this.jsAst
        var wxmlAst = this.wxmlAst

        //解析json文件
        this.parsePageConfig()

        //将template和include转换为组件（实验性）
        if (global.isTemplateToComponent) {
            try {
                transformTemplateToComponent(this,isIncludeFile, fileDir, fileKey)
            } catch (error) {
                global.log("[ERROR]transformTemplateToComponent: ", fileKey,  error)
            }
        }

        try {
            //生命周期处理
            transformLifecycleFunction(jsAst)
        } catch (error) {
            global.log("[ERROR]transformLifecycleFunction: ", fileKey,  error)
        }

        try {
            //处理组件兼容: wxParse、含省市区的Picker
            transformWxParse(jsAst, wxmlAst, fileKey)
        } catch (error) {
            global.log("[ERROR]transformWxParse: ", fileKey,  error)
        }

        try {
            transformRegionPicker(wxmlAst, fileKey)
        } catch (error) {
            global.log("[ERROR]transformRegionPicker: ", fileKey,  error)
        }

        //处理方法函数: getCurrentPages、onLoad、triggerEvent
        try {
            transformGetCurrentPages(jsAst, fileKey)
        } catch (error) {
            global.log("[ERROR]transformGetCurrentPages: ", fileKey,  error)
        }

        try {
            transformTriggerEvent(jsAst)
        } catch (error) {
            global.log("[ERROR]transformTriggerEvent: ", fileKey,  error)
        }

        try {
            transformSetData(jsAst, fileKey)
        } catch (error) {
            global.log("[ERROR]transformSetData: ", fileKey,  error)
        }

        try {
            //其他代码处理，一行流的处理都放在这里面了，懒得增开文件了
            transformSpecialCode(jsAst, wxmlAst)
        } catch (error) {
            global.log("[ERROR]transformSpecialCode: ", fileKey,  error)
        }

        try {
            //在transformSpecialCode后面执行，免得把$scope被替换，
            //TODO:这里还是有点存疑问，是否$scope与$vm是同一个对象呢？
            transformAnimate(jsAst, fileKey)
        } catch (error) {
            global.log("[ERROR]transformAnimate: ", fileKey,  error)
        }

        try {
            //转换methods里的箭头函数
            transformArrowFunction(jsAst, fileKey)
        } catch (error) {
            global.log("[ERROR]transformArrowFunction: ", fileKey,  error)
        }

        try {
            //处理behavior/mixins    暂时这里先这样处理，还涉及到，引用的文件，需要对其进行处理
            transformBehavior(jsAst, fileKey)
        } catch (error) {
            global.log("[ERROR]transformBehavior: ", fileKey,  error)
        }

        try {
            //处理this.selectComponent()
            transformSelectComponent(jsAst, fileKey)
        } catch (error) {
            global.log("[ERROR]transformSelectComponent: ", fileKey,  error)
        }

        try {
            //处理this.createSelectorQuery()
            transformSelectorQuery(jsAst, fileKey)
        } catch (error) {
            global.log("[ERROR]transformSelectorQuery: ", fileKey,  error)
        }

        try {
            //处理云函数
            transformCloudFunction(jsAst, fileKey)
        } catch (error) {
            global.log("[ERROR]transformCloudFunction: ", fileKey,  error)
        }

        try {
            //对抽象节点进行处理，并且存储抽象节点信息
            transformGenericsTag(wxmlAst, this.usingComponents, jsFile, fileKey)
        } catch (error) {
            global.log("[ERROR]transformGenericsTag: ", fileKey,  error)
        }

        try {
            //ts处理
            if (this.isTSFile) {
                transformTypescript(jsAst, fileKey)
            }
        } catch (error) {
            global.log("[ERROR]transformTypescript: ", fileKey,  error)
        }

        try {
            //处理wxs标签
            this.wxsScriptList = this.getWxsScriptList(wxmlAst, fileDir)
        } catch (error) {
            global.log("[ERROR]getWxsScriptList: ", fileKey,  error)
        }

        try {
            //TODO: 尽可能多转换路径
            repairAstStringLiteralAssetPath(jsAst, wxmlAst, fileDir)
        } catch (error) {
            global.log("[ERROR]repairAstStringLiteralAssetPath: ", fileKey,  error)
        }

        //检查代码里是否有不支持的代码
        this.checkCode(jsAst, wxmlAst, fileKey)

        //编译页面里使用到的vant组件
        if(this.astType !== "VantComponent"){
            this.vanTagList = ggcUtils.getVanTagList(wxmlAst)
        }

        //判断是否含weui
        global.hasWeUI = global.hasWeUI || ggcUtils.checkWeUI(jsAst, wxmlAst)
    }



    /**
     * 变量处理，须在template和include标签处理后再进行处理
     */
    variableHandle (variableTypeInfo) {
        try {
            //处理所有变量，包括未声明、重名的等等等等
            //(必须最后处理! 因为可能某prop的observer里通过this.data.xxx调用了它，不能重名！)
            var wxsModuleNameList = this.wxsScriptList.map(item => item.module)
            transformVariable(this.jsAst, this.wxmlAst, variableTypeInfo, wxsModuleNameList, this.fileKey)
        } catch (error) {
            global.log("[ERROR]variableHandle: ", error, this.fileKey)
        }

        //处理dataset 暂停使用  2022-11-09 仍然启用！
        transformDataset(this.jsAst, this.wxmlAst, this.fileKey)

        //注意：这里有个时机问题！！！必须在变量名处理后再进行处理！！！
        if (!this.isSDKFile) {
            //如果只是sdk的js，那就没必要再对this.data进行转换了
            //比如DOM Level 2的dom.js文件
            //http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
            // renameThisDotXXX($jsAst, oldName, newName, type)
            //将this.data.xxx转换为this.xxx
            ggcUtils.transformThisDotKeywordExpression(this.jsAst, "data", [], this.fileKey)
        }
        ggcUtils.transformThisDotKeywordExpression(this.jsAst, "properties", [], this.fileKey)
    }

    /**
     * 预处理babel js代码
     * @param {*} fileData
     * @param {*} fileKey
     * @param {*} isVueFile
     * @returns
     */
    preHandleScriptCode (fileData, fileKey, wxmlExtname, isVueFile) {
        //获取小程序的全局关键字
        var mpKeyword = utils.getMpKeywordByExtname(wxmlExtname)

        //去掉getApp<IAppOption>()，防止babel解析报错，简单处理一下
        fileData = fileData.replace(/getApp<IAppOption>\(\)/g, 'getApp()')

        var code = restoreJSUtils.addReplaceTag(fileData, mpKeyword)

        //TODO:解析特殊结构
        // var $ast = $(code)
        // var astType = ggcUtils.getAstType($ast, this.fileKey)
        // code = restoreJSUtils.fixSpecialCode2($ast, astType)

        var newFileData = fileData
        //判断一下，用babel解析ts会报错。。。
        // if (this.jsFileType === "JS") {
        var ast = null
        try {
            ast = javascriptParser.parse(code, fileKey, isVueFile)
        } catch (error) {
            global.log("javascriptParser err", error)
        }

        if (ast) {
            if (fileKey.indexOf(".min") === -1 && !this.isSDKFile) {
                restoreJSUtils.restoreJS(ast, mpKeyword)
            }
            restoreJSUtils.renameKeywordToUni(ast, mpKeyword)
            newFileData = javascriptParser.generate(ast)
        }
        // }

        return newFileData
    }

    /**
     * 转换js文件
     * @param {*} jsFile
     * @returns
     */
    transformScriptFile (jsFile) {
        if (!jsFile) return

        var fileData = fs.readFileSync(jsFile, 'utf8')

        this.isSDKFile = utils.isSDKFile(fileData)

        //预处理js代码
        fileData = this.preHandleScriptCode(fileData, this.fileKey, this.wxmlExtname, this.isVueFile)

        var $ast = $(fileData)

        if ($ast.error) {
            global.log(`小程序js代码解析失败(gogocode)，请根据错误信息修复后，再重新进行转换。file: ${ this.fileKey }.js :>> ` + $ast.error)
        }

        //处理特殊结构
        transformSpecialStructure($ast, this.fileKey)

        this.astType = ggcUtils.getAstType($ast, this.fileKey)

        //处理webpack打包出来的weui js文件，需提前处理！
        transformWeUIScript($ast)

        //修复路径
        repairScriptSourcePath($ast, jsFile)

        // global.log("astType ", this.astType, this.fileKey)
        switch (this.astType) {
            case "App":
                try {
                    transformAppAst($ast, this.fileKey)
                } catch (error) {
                    global.log("transformAppAst err", error)
                }

                break
            case "Page":
                transformPageAst($ast, this.fileKey)
                break
            case "Behavior":
                transformBehaviorAst($ast, this.fileKey)
                break
            case "Component":
                transformComponentAst($ast, this.fileKey)
                break
            case "CustomPage":
                transformCustomPageAst($ast, this.fileKey, this.astType)
                break
            case "VantComponent":
                transformVantComponentAst($ast, this.fileKey, this.astType)
                break
            case "Webpack":
                // global.log(`[ERROR]${this.fileKey}.js目测是uniapp发布的文件，建议停止转换！`)
                global.isCompileProject = true
            default:
                transformSingleJSAst($ast, this.fileKey)
                break
        }

        this.jsAst = $ast
    }


    /**
     * 解析wxml前，对它进行预处理
     * @param {*} code
     * @returns
     */
    beforeParseWxml (code) {
        /**
         * fix gogocode parse error with `<!--  加载搜索栏 ---->`
         * gogocode 暂时未修复，先这么搞！20211213
         */
        code = code.replace(/\<!-{2,}\s*(.*?)\s*-{2,}\>/g, '<!-- $1 -->')

        code = code.replace(/url\(\s*\\?['"]\s*\{\{(.*?)\}\}\s*\\?['"]\s*\)/g, "url({{$1}})")
            .replace(/([^'])url\(['"]([^'"].*?)['"]\)/g, "$1url($2)")
            .replace(/(?<!['"\d#])(0{2,})(?!['"\d])/g, `'$1'`)  //将00替换为"00"
            .replace(/\\"/g, `&quot;`) //使用特定字符替换掉引号，以便gogocode可以顺利解析
            .replace(/\b\s?<\s?\b/g, " < ") //在<前后添加空格，以便gogocode可以顺利解  TODO: 如果在注释里,会被误替换,不过问题不大

        //将转义的干掉，否则解析可能会出问题
        //<input class='iptbox {{index === focusIndex?\'show\':\'hide\'}}'></input>
        code = code.replace(/\{\{[^\{]+\}\}/g, (match) => {
            return match.replace(/\\'/g, `"`).replace(/\\"/g, `'`)
        })

        //检查template是否含特殊字符ascii里0-31位置的字符
        var reg = /[\x08]/
        if (reg.test(code)) {
            global.log(`[ERROR]template里含不支持的字符，可能引起语法报错。   fileKey:${ this.fileKey }}`)
        }
        return code

    }

    /**
     * 转换wxml文件
     * @param {*} wxmlFile
     * @returns
     */
    transformTemplateFile (wxmlFile, wxmlExtname) {
        if (!wxmlFile) return

        var fileData = fs.readFileSync(wxmlFile, 'utf8')

        //预处理
        fileData = this.beforeParseWxml(fileData)

        // //获取wxml里面的变量
        // this.varList = getTemplateVarList(fileData)


        //
        // getTemplateLevelOneVarList()


        //怎么判断是template文件？ 还是说引用的时候再弄？


        // 判断是template，看里面是否有name=""
        // 如果是全vue，则单独拿出来，做成组件
        // 如果不是，则按逻辑弄


        // 拿到wxml
        // 遍历所有{{}}， 或动态绑定的，
        // 拿到所有表达式
        // 拿到所有变量

        // 组装prop，和computed



        // var $ast = $.loadFile(wxmlFile, { parseOptions: { language: 'html' } })
        var $ast = $(fileData, { parseOptions: { language: 'html' } })

        if ($ast.error) {
            //TODO:这里要加上后缀名！
            global.log(`小程序template代码解析失败(gogocode)，请根据错误信息修复后，再重新进行转换。file: ${ this.fileKey } :>> ` + $ast.error)
        }

        transformTemplateAst($ast, wxmlFile, wxmlExtname, this)

        this.wxmlAst = $ast
    }


    /**
     * 解析页面配置文件
     * @returns
     */
    parsePageConfig () {
        if (!this.jsonFile) return

        let data = ""
        try {
            data = fs.readJsonSync(this.jsonFile)
        } catch (error) {
            global.log("读取json报错" + this.jsonFile)
        }

        if (data) {
            this.styleConfig = { ...data }
            this.styleConfig["usingComponents"] && delete this.styleConfig["usingComponents"]
            this.usingComponents = data.usingComponents || {}

            //处理抽象节点
            var componentGenerics = data.componentGenerics || {}
            var keys = Object.keys(componentGenerics)
            keys.map(key => {
                let item = componentGenerics[key]
                if (item.default) {
                    // 抽象节点的默认组件
                    // 抽象节点可以指定一个默认组件，当具体组件未被指定时，将创建默认组件的实例。默认组件可以在 componentGenerics 字段中指定：
                    // {
                    //     "componentGenerics": {
                    //         "selectable": {
                    //         "default": "path/to/default/component"
                    //         }
                    //     }
                    // }

                    var newSrc = transformComponentPathToAbsolute(item.default, this.jsFile)

                    this.genericsComponentList.push({
                        "name": key,
                        "path": newSrc
                    })
                } else {
                    this.genericsComponentList.push({
                        "name": key,
                        "path": ""
                    })
                }
            })
        }
    }

    /**
     * 生成template
     * @returns
     */
    generateTemplate (extname, fileKey) {
        //看看有几个template
        //第一个节点是不是template
        if (!this.wxmlAst) {
            return ""
        }

        //去除空属性
        this.wxmlAst.find(`<$_$1></$_$1>`)
            .each(item => {
                //需判断，`<view></view>` 就没有attributes
                if (item.node.content.attributes) {
                    item.node.content.attributes.forEach(attr => {
                        if (attr.value && attr.value.content == "" && attr.key.content === "v-if") {
                            delete attr.value
                        }
                    })
                }

            })

        var templateContent = ""
        var list = this.wxmlAst.root().attr("content.children")
        //如果wxml无内容, 则添加空template节点
        if (!list) return "<template></template>"

        //使用replayBy后，会将内容使用document节点包住。。。见include-tag-transformer.js
        var tagList = list.filter(obj => obj.nodeType === "tag" || obj.nodeType === "document")

        //是否存在page-meta标签
        var hasPageMeta = list.some(obj => (obj.nodeType === "tag" || obj.nodeType === "document") && obj.content.name === "page-meta")
        // TODO：感觉可以对page-meta进行排序

        try {
            templateContent = this.wxmlAst.root().generate()
        } catch (error) {
            global.log('%c [ TODO: 报错啦 ]: ', 'color: #bf2c9f; background: pink; font-size: 13px;', error, this.fileKey)
        }

        if (tagList.length > 1) {
            templateContent = `<template>\r\n<view style="height:100%;overflow: auto;">\r\n${ templateContent }\r\n</view>\r\n</template>`
        } else if (tagList.length === 1) {
            var firstNode = tagList[0].content
            var attributes = firstNode.attributes
            if (!attributes) return ""

            var hasFor = attributes.some(obj => obj.key.content.indexOf("for") > -1)
            if (hasFor || firstNode.name !== "view") {
                templateContent = `<template>\r\n<view style="height:100%;overflow: auto;">\r\n${ templateContent }\r\n</view>\r\n</template>`
            } else {
                templateContent = `<template>\r\n${ templateContent }\r\n</template>`
            }
        } else {
            templateContent = `<template>\r\n${ templateContent }\r\n</template>`
        }

        return templateContent
    }

    /**
     * 生成script
     * @param {*} extname
     * @returns
     */
    generateScript (extname) {
        // 看看是什么类型.只有vue.才需要加scipt
        if (!this.jsAst) {
            return ""
        }

        //注意：必须放在这里执行！ (提示: generics)
        if (!this.isApp) {
            //处理外部引用的组件
            transformUsingComponents(this.jsAst, this.usingComponents, this.fileKey)
        }

        //ts处理
        if (this.isTSFile && this.isVueFile && !this.isApp) {
            var hasMixin = this.jsAst.has(`export default {mixins:$_$1, $$$}`)
            if (hasMixin) {
                global.log("[Tip]原来的已经有mixin，转换后，需要手动修复一下")
            }
            this.jsAst.replace(`export default {$$$}`, `export default zpMixins.extend({$$$})`)
        }

        var jsContent = this.jsAst.root().generate({ isPretty: false })
        switch (extname) {
            case "vue":
                var lang = this.isTSFile ? `lang="ts"` : ""
                var insertCode = (this.isTSFile && !this.isApp) ? `import zpMixins from "@/uni_modules/zp-mixins/index";` : ""
                jsContent = `<script ${ lang }>${ insertCode }\r\n${ jsContent }\r\n</script>`
                break
            case "js":

                break
        }
        return jsContent
    }


    /**
     * 生成style
     * @param {*} extname
     * @returns
     */
    generateStyle (extname) {
        //css语言
        var lang = this.cssLanguage ? `lang="${ this.cssLanguage }"` : ""

        var styleContent = this.styleContent
        var styleContentFull = this.styleContent

        return {
            lang,
            styleContent,
            styleContentFull  //包括script标签
        }
    }



    /**
     * 输出
     */
    generate () {
        var extname = ""
        var fileName = ""

        if (!(this.jsFile || this.wxmlFile || this.wxssFile)) {
            //这三种文件都不是时，不写文件。
            return
        }

        if (this.isVueFile) {
            extname = "vue"
            // fileName = pathUtils.getFileNameNoExt(this.jsFile || this.wxmlFile)
        } else if (this.jsFile) {
            extname = this.isTSFile ? "ts" : "js"
            // fileName = pathUtils.getFileNameNoExt(this.jsFile)
        } else if (this.wxssFile) {
            extname = "css"
            // fileName = pathUtils.getFileNameNoExt(this.wxssFile)
        } else {
            //TODO
            extname = "vue"
            // fileName = pathUtils.getFileNameNoExt(this.wxmlFile)
        }

        fileName = pathUtils.getFileNameNoExt(this.fileKey)

        // global.log("filename", fileName, this.fileKey)

        //App.vue
        var filePath = this.fileKey
        if (this.isApp) {
            filePath = "App"
        }

        var newFile = path.join(global.targetSourceFolder, filePath + "." + extname)
        var templateContent = this.generateTemplate(extname, this.fileKey)
        var jsContent = this.generateScript(extname, this.fileKey)
        var {
            lang,
            styleContent,
            styleContentFull  //包括script标签
        } = this.generateStyle(extname)

        var wxsCode = this.wxsScriptList.map(item => item.wxsCode).join("") + "\r\n"

        //还原wxs里面的转义符
        wxsCode = utils.escape2Html(wxsCode)

        var wxsStyleCode = this.wxsStyleList.map(src => `@import "${ src }";`).join("\r\n")

        var fileContent = ""
        const reg = /\.min$|htmlparser/
        switch (extname) {
            case "vue":
                if (global.isMergeWxssToVue) {
                    if (extname === "vue") {
                        styleContentFull = `<style ${ lang }>\r\n ${ styleContent } ${ wxsStyleCode } \r\n</style>`
                    }
                    styleContent = styleContentFull
                } else {
                    var styleExtname = this.cssLanguage || "css"
                    const cssFilePath = path.join(global.targetSourceFolder, this.fileKey + "." + styleExtname)

                    styleContent = formatUtils.formatCode(styleContent, styleExtname, this.fileKey)
                    //写入文件
                    fs.writeFileSync(cssFilePath, styleContent)
                    //
                    styleContent = `<style ${ lang }>\r\n@import "./${ fileName }.${ styleExtname }";${ wxsStyleCode }\r\n</style>`
                }
                fileContent = templateContent + "\r\n" + wxsCode + jsContent + "\r\n" + styleContent
                break
            case "js":
            case "ts":
                if (this.isTSFile) {
                    extname = "ts"
                    newFile = path.join(global.targetSourceFolder, filePath + "." + extname)
                }
                fileContent = jsContent
                break
            case "css":
                extname = this.cssLanguage || "css"
                newFile = path.join(global.targetSourceFolder, filePath + "." + extname)
                fileContent = styleContent
                break
            default:
                global.log('其他-------------------', extname)
                break
        }

        if (fileContent && !reg.test(this.fileKey) && !this.isSDKFile) {
            fileContent = formatUtils.formatCode(fileContent, extname, this.fileKey)
        }
        if (global.isMergeWxssToVue && this.isVueFile && extname === "css") {
            return
        }
        $.writeFile(fileContent, newFile, false)
    }


    /**
     * wxs标签处理，返回wxsScriptList
     * @param {*} wxmlAst
     * @param {*} fileDir
     * @returns
     */
    getWxsScriptList (wxmlAst, fileDir) {
        if (!wxmlAst) return []

        // <wxs module="m1">
        //     var msg = "hello world";
        //     module.exports.message = msg;
        //     </wxs>
        //     <view> {{m1.message}} </view>

        // 1. 增加lang="wxs"
        // 2. 移除wxs标签
        // 3. 移动到template外
        var wxsScriptList = []

        // 小程序写法示例
        // <wxs src="../wxs/common.wxs" module="common" />
        // <filter src="./index.filter.js" module="swan"></filter>
        // <import-sjs from="./index.sjs" name="test"></import-sjs>
        // <import-sjs from="./namedExport.sjs" name="{x, y: z}" />  //TODO:这玩意有点异形了

        // uniapp写法示例
        // <script module="utils" lang="wxs" src="./utils.sjs"></script>
        // <script module="utils" lang="filter" src="./utils.filter.js"></script>
        // <script module="utils" lang="sjs" src="./utils.sjs"></script>

        wxmlAst
            .replace(`<wxs module="$_$" $$$1>$$$2</wxs>`, `<script module="$_$" lang="wxs" $$$1>$$$2</script>`)
            .replace(`<filter module="$_$" $$$1>$$$2</filter>`, `<script module="$_$" lang="filter" $$$1>$$$2</script>`)
            .replace(`<import-sjs name="$_$1" from="$_$2" $$$1>$$$2</import-sjs>`, `<script module="$_$1" src="$_$2" lang="sjs" $$$1>$$$2</script>`)
            .find([
                `<script module="$_$1" src="$_$2" $$$1>$_$3</script>`,
                `<script module="$_$1" src="$_$2" $$$1></script>`,
                `<script module="$_$1" $$$1></script>`
            ])
            .each((item) => {
                var module = item.match["1"][0].value

                var wxsSrc = ""  //wxs源路径
                var absPath = ""  //wxs绝对路径

                // 原来的方案：相对路径绝对路径分开处理
                // if (item.match["2"]) {
                //     //wxs路径处理
                //     var srcNode = item.match["2"][0].node
                //     var src = wxsSrc = srcNode.content
                //     if (!/^[\.\/]/.test(src)) {
                //         //在当前目录 TODO: 应该没有在npm里的吧？
                //         src = './' + src
                //     } else if (/^\//.test(src)) {
                //         //如果是以/开头的，表示根目录
                //         src = '@' + src
                //     }
                //     srcNode.content = src
                // }

                // 现在的方案：直接干成绝对路径，方便后续<template is=""/>节点处理
                if (item.match["2"]) {
                    let srcNode = item.match["2"][0].node
                    wxsSrc = srcNode.content
                    let fullPath = pathUtils.getResolvePath(wxsSrc, fileDir)
                    absPath = pathUtils.getAbsolutePath(fullPath)
                    srcNode.content = absPath
                }
                //
                var wxsCode = item.generate()
                //存入global，最终在合成时，添加进去
                wxsScriptList.push({
                    module,
                    wxsCode,
                    oldPath: wxsSrc,
                    absPath
                })

                item.remove()
            }).root()

        return wxsScriptList
    }


    /**
     *
     * 代码检测
     * 含不支持转换的
     *
     * @param {*} $jsAst
     * @param {*} $wxmlAst
     * @param {*} fileKey
     */
    checkCode ($jsAst, $wxmlAst, fileKey) {
        if ($jsAst) {
            var jsSelectorList = [
                {
                    selector: { type: "CallExpression", callee: { name: "requirePlugin" } },  //requirePlugin('myPlugin');
                    msg: `[ERROR] requirePlugin方法仅在微信小程序里支持，请转换后手动调整代码       file: ${ fileKey }`
                },
                {
                    selector: { type: "CallExpression", callee: { name: "requireMiniProgram" } },  //requireMiniProgram();
                    msg: `[ERROR] requireMiniProgram方法仅在微信小程序里支持，请转换后手动调整代码       file: ${ fileKey }`
                },
                {
                    selector: { type: "CallExpression", callee: { name: "requestSubscribeMessage" } },  //wx.requestSubscribeMessage({});
                    msg: `[ERROR] requestSubscribeMessage方法仅在微信小程序里支持，请转换后手动调整代码       file: ${ fileKey }`
                },
                {
                    selector: { type: "StringLiteral" },  //`plugin-private://wx2bxxxxxx/pages/live-player-plugin?room_id=${id}`
                    msg: `[ERROR] plugin-private://插件仅在微信小程序里支持，请转换后手动调整代码       file: ${ fileKey }`,
                    reg: new RegExp(`plugin-private://`)
                },
                {
                    selector: { type: "TemplateLiteral" },  //`plugin-private://wx2bxxxxxx/pages/live-player-plugin?room_id=${id}`
                    msg: `[ERROR] plugin-private://插件仅在微信小程序里支持，请转换后手动调整代码       file: ${ fileKey }`,
                    reg: new RegExp(`plugin-private://`)
                },
            ]

            jsSelectorList.map(function (obj) {
                var res = $jsAst.find(obj.selector)
                if (res.length) {
                    if (obj.reg) {
                        var reg = obj.reg
                        res.each(function (item) {
                            var value = ""
                            if (t.isStringLiteral(item.node)) {
                                value = item.attr("value")
                            } else if (t.isTemplateLiteral(item.node)) {
                                value = $(item).generate()
                            }

                            if (!value) return

                            if (reg.test(value)) {
                                global.log("checkCode1", obj.msg)
                            }
                        })
                    } else {
                        global.log("checkCode2", obj.msg)
                    }
                }
            })
        }

        if ($wxmlAst) {
            var reg = /^plugin:\/\//
            var selector = `<navigator url="$_$url"></navigator>`
            $wxmlAst.find(selector).each(function (item) {
                var url = item.match["url"][0].value
                if (reg.test(url)) {
                    var msg = `"[ERROR] <navigator src="${ url }"></navigator>标签跳转的是plugin页面，仅在微信小程序里支持，请转换后手动调整代码       file: ${ fileKey }`
                    global.log(msg)
                }
            })

            $wxmlAst.find('<$_$1 v-if $$$></$_$1>').each(function (item) {
                var attrs = item.attr("content.attributes")
                var vIfItem = attrs.find(sub => sub.key.content === 'v-if')
                if (!vIfItem.value) {
                    var msg = `[ERROR] 标签v-if的值不能为空.  code:  ${ item.generate() }   file: ${ fileKey }`
                    global.log(msg)
                }
            })

        }
    }
}


module.exports = Page
