/*
 * @Author: zhang peng
 * @Date: 2023-03-05 16:29:34
 * @LastEditTime: 2023-04-10 20:37:40
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/tag/transform-include.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

var appRoot = "../../.."
const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')
const { getTemplateVarList } = require(appRoot + '/src/utils/varUtils.js')

//全局对象，用于快速读取历史
var templateFileObj = {}

/**
 * 获取文件信息
 * @param {*} file path
 */
function getTemplateNameListByFile (file, fileKey) {
    if (templateFileObj[fileKey]) return templateFileObj[fileKey]

    //读取文件，获取name列表
    let ast = $.loadFile(file, { parseOptions: { language: 'html' } })
    let templateNameList = getTemplateNameList(ast, fileKey)
    templateFileObj[fileKey] = templateNameList
    return templateNameList
}


/**
 * 获取template里面所有的name list
 * @param {*} $wxmlAst
 * @param {*} fileKey
 */
function getTemplateNameList ($wxmlAst, fileKey) {
    let list = []
    if ($wxmlAst) {
        $wxmlAst.find(`<template name="$_$1"></template>`).each(item => {
            let name = item.match["1"][0].value
            list.push(name)
        }).root()
    }
    return list
}


/**
 * 获取template里面所有的import list
 * @param {*} $wxmlAst
 * @param {*} fileKey
 */
function getTemplateImportList ($wxmlAst, fileDir, fileKey) {
    let list = []
    if ($wxmlAst) {
        $wxmlAst.find(`<import src="$_$1"></import>`).each(item => {
            let file = item.match["1"][0].value
            let fullPath = pathUtils.getResolvePath(file, fileDir)
            var importFileKey = pathUtils.getFileKey(fullPath)
            //读取文件，获取name列表
            let templateNameList = getTemplateNameListByFile(fullPath, importFileKey)

            let componentName = utils.toCamel(templateNameList.join("-"))
            //首字母大写
            // componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1)
            list.push({
                src: file,
                path: fullPath,
                fileKey: importFileKey,
                templateNameList,
                componentName
            })
        }).root()


        //这里，template在当前文件里的
        let templateNameList = getTemplateNameList($wxmlAst, fileKey)
        let componentName = utils.toCamel(templateNameList.join("-"))
        componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1)
        if (componentName) {
            list.push({
                src: '',
                path: '',
                fileKey: fileKey,
                templateNameList,
                componentName
            })
        }

    }
    return list
}


/**
 * 获取template里面所有的include list
 * @param {*} $wxmlAst
 * @param {*} fileKey
 */
function getIncludeList ($wxmlAst, fileKey) {
    let list = []
    // if($wxmlAst){
    //     $wxmlAst.find(`<template name="$_$1"></template>`).each(item=>{
    //         let name = item.match["1"][0].value
    //         list.push(name)
    //     })
    // }
    return list
}


/**
 * 标签template 有is的时 替换函数
 * @param {*} match
 * @param {*} nodePath
 * @param {*} self
 * @param {*} templateImportList
 */
function templateIsReplaceFn (match, nodePath, self, templateImportList) {
    // global.log(match, nodePath)
    var isValue = match['is'][0].value

    //wxparse过滤
    if(/wxParse|WxEmojiView/i.test(isValue)) return null

    var dataStr = ''
    if (match['data']) {
        var dataValue = match['data'][0].value
        if (dataValue) {
            dataValue = dataValue
                .replace(/\{\{/, '{')
                .replace(/\}\}/, '}')
            dataStr = `:data="${ dataValue }"`
        }
    }

    //找到组件名
    let importInfo = templateImportList.find(item => item.templateNameList.find(sub => sub === isValue))
    if (importInfo) {
        let componentName = importInfo.componentName

        if (importInfo.src) {
            //TODO: 如果没有src，则表示可能是在当前页面里面的
            //加入到usingComponents
            self.usingComponents[componentName] = importInfo.src.replace(/\.wxml$/, ".vue")
        }
        return `<${ componentName } compName="${ isValue }" ${ dataStr } $$$1>$$$2</${ componentName }>`
    } else {
        global.log(`没有找到template的组件名${ isValue }`, self.fileKey)
        return null
    }
}


/**
 * 对template和include进行转换
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 * @param {*} templateImportList 页面里面的import文件信息数组
 * @param {*} usingComponents 页面组件列表
 * @param {*} self page对象
 */
function transformIncludePage ($jsAst, $wxmlAst, templateImportList, usingComponents, fileDir, self) {
    if (!$wxmlAst) return


    //有data和没data的，，先这么处理着
    $wxmlAst
        .replace('<template is="$_$is"  $$$1>$$$2</template>', (match, nodePath) => templateIsReplaceFn(match, nodePath, self, templateImportList))

    $wxmlAst
        .replace('<template is="$_$is" data="$_$data" $$$1>$$$2</template>', (match, nodePath) => templateIsReplaceFn(match, nodePath, self, templateImportList))



    $wxmlAst
        .replace(
            '<include src="$_$src" $$$1>$$$2</include>',
            (match, nodePath) => {
                // global.log(match, nodePath)
                var srcValue = match['src'][0].value

                let fullPath = pathUtils.getResolvePath(srcValue, fileDir)
                var includeFileKey = pathUtils.getFileKey(fullPath)

                //读取文件，获取name列表
                let templateNameList = getTemplateNameListByFile(fullPath, includeFileKey)

                // //找到组件名
                // let importInfo = templateImportList.find(item => item.fileKey === includeFileKey)
                let componentName = path.basename(srcValue, '')

                //去掉后缀名
                componentName = pathUtils.getFileNameNoExt(componentName)

                //文件里如果有template
                if (templateNameList && templateNameList.length) {
                    componentName += "-incl"
                }

                //首字母大写
                var compName = componentName.charAt(0).toUpperCase() + componentName.slice(1)

                // var newFile = path.join(global.targetSourceFolder, includeFileKey + "." + extname)

                var includeFileDir = path.dirname(srcValue)

                //加入到usingComponents
                self.usingComponents[compName] = includeFileDir + "/" + componentName + ".vue"

                return `<${ compName } $$$1 :data="this">$$$2</${ compName }>`
            }
        )

    if (self.isTemplateFile) {
        //针对没有jsAst的情况
        if (!self.jsAst) {
            //TODO: 应该都是没有jsast的，除了日历组件
            var varList = self.varList
            var computedList = varList.map(name => `${ name }(){return this.data.${ name }}`)
            var code = `
                export default {
                    props: ['data', 'compName'],
                    computed: {
                        ${ computedList.join(",") }
                    }
                }`

            self.jsAst = $(code)
        }

        // <template name="foo">
        // <template v-if="compName == 'foo'">
        $wxmlAst
            .replace(
                '<template name="$_$1" $$$1>$$$2</template>',
                (match, nodePath) => {
                    return `<template v-if="compName === '$_$1'" $$$1>$$$2</template>`
                }
            )
    }
}

//////////////////////////////////////////////////////////////////////////////////////////



/**
 * 获取template信息
 * @param {*} ast
 * @param {*} fileKey
 * @returns
 */
function getTemplateInfo (ast, fileKey) {
    if (!ast) {
        return {
            hasTemplate: false,
            hasInclude: false
        }
    }
    var hasTemplate = !!ast.find("<template name='$_$'></template>").length
    // global.log(hasTemplate)

    var hasInclude = false
    if (hasTemplate) {
        var newAst = $(ast.generate(), {
            parseOptions: { language: 'html' },
        })
            .replace("<template name='$_$' $$$1>$$$2</template>", '')
            .replace('<wxs $$$1>$$$2</wxs>', '')
            .replace('<!-- -->', '')

        // global.log(newAst.generate().trim())
        hasInclude = !!newAst.generate().trim()
    } else {
        hasInclude = true
    }

    // global.log('hasTemplate', hasTemplate)
    // global.log('hasInclude', hasInclude)
    return {
        hasTemplate,
        hasInclude
    }

}

function getIncludeInfo (self, fileKey) {
    var res = null

    var hasTemplate = self.hasTemplate
    var hasInclude = self.hasInclude

    if (hasInclude) {
        //简单处理
        var newWxmlAst = $(self.wxmlAst.generate(), { parseOptions: { language: 'html' } })
        newWxmlAst.replace("<template></template>", '').replace("<wxs></wxs>", '').replace('<!-- -->', '')

        var templateCode = newWxmlAst.generate().trim()
        //获取wxml里面的变量
        var varList = getTemplateVarList(templateCode, false)

        //将include的代码替换为空
        self.wxmlAst.replace(templateCode, "")

        var computedList = varList.map(name => `${ name }(){return this.data.${ name }}`)
        var code = `
        export default {
            props: ['data', 'compName'],
            computed: {
                ${ computedList.join(",") }
            }
        }`

        var jsAst = $(code)

        res = {
            jsAst,
            wxmlAst: newWxmlAst,
            fileKey: self.fileKey + "-incl"
        }
    }
    return res
}

function transformTemplate (self, fileKey) {
    var hasTemplate = self.hasTemplate
    var hasInclude = self.hasInclude

    if (hasTemplate) {
        var jsAst = null
        //TODO: 应该都是没有jsast的，除了日历组件
        if (!self.jsAst) {

            var code = self.wxmlAst.generate()
            //获取wxml里面的变量
            var varList = getTemplateVarList(code, false)

            var computedList = varList.map(name => `${ name }(){return this.data.${ name }}`)
            var code = `
        export default {
            props: ['data', 'compName'],
            computed: {
                ${ computedList.join(",") }
            }
        }`

            self.jsAst = $(code)
        }
        var newWxmlAst = $(self.wxmlAst.generate(), { parseOptions: { language: 'html' } })


        // <template name="foo">
        // <template v-if="compName == 'foo'">
        newWxmlAst
            .replace(
                '<template name="$_$1" $$$1>$$$2</template>',
                (match, nodePath) => {
                    return `<template v-if="compName === '$_$1'" $$$1>$$$2</template>`
                }
            )
    }
}

/**
 * 创建template或include页面数据
 * @param {*} self
 * @param {*} fileDir
 * @param {*} fileKey
 * @returns
 */
function createIncludePage (self, fileDir, fileKey) {
    if (!self.wxmlAst) return []
    var list = []

    var hasTemplate = self.hasTemplate
    var hasInclude = self.hasInclude

    if (self.isTemplateFile) {
        //两个函数：hasTemplatecode  hasIncludeCode   判断是否有两个，，如果都没有的，那就没必要改名了

        var includeInfo = null
        if (hasInclude && hasTemplate) {
            includeInfo = getIncludeInfo(self, fileKey)
        }

        transformTemplate(self, fileKey)

        if (includeInfo) {
            list.push(includeInfo)
        }
    } else {
        //在当前页面
        self.wxmlAst.find(`<template name="$_$1"></template>`).each(item => {
            var jsAst = null

            var componentName = item.match[1][0].value

            //获取wxml里面的变量
            var varList = getTemplateVarList(item.generate())
            var computedList = varList.map(name => `${ name }(){return this.data.${ name }}`)
            var code = `
                export default {
                    props: ['data', 'compName'],
                    computed: {
                        ${ computedList.join(",") }
                    }
                }`

            jsAst = $(code)


            var newWxmlAst = $(item.generate(), { parseOptions: { language: 'html' } })

            // <template name="foo">
            // <template v-if="compName == 'foo'">
            newWxmlAst
                .replace(
                    '<template name="$_$1" $$$1>$$$2</template>',
                    (match, nodePath) => {
                        return `<template v-if="compName === '$_$1'" $$$1>$$$2</template>`
                    }
                )

            var curComponentName = `${ pathUtils.getFileNameNoExt(self.fileKey) }-${ componentName }`
            var newFileKey = `${ self.fileKey }-${ componentName }`

            var obj = {
                jsAst,
                wxmlAst: newWxmlAst,
                fileKey: newFileKey
            }
            list.push(obj)

            //首字母大写
            let compName = componentName.charAt(0).toUpperCase() + componentName.slice(1)

            self.usingComponents[compName] = "./" + `${ curComponentName }.vue`

            item.remove()
        }).root()
    }

    //纯include文件
    if (!hasTemplate && hasInclude && !self.jsAst) {
        //获取wxml里面的变量
        var varList = getTemplateVarList(self.wxmlAst.generate(), false)
        var computedList = varList.map(name => `${ name }(){return this.data.${ name }}`)
        var code = `
                export default {
                    props: ['data', 'compName'],
                    computed: {
                        ${ computedList.join(",") }
                    }
                }`

        self.jsAst = $(code)
    }

    return list
}


/**
 * 将template和include标签转换为组件
 * @param {*} self           页面的this
 * @param {*} isIncludeFile
 * @param {*} fileDir
 * @param {*} fileKey
 */
function transformTemplateToComponent (self, isIncludeFile, fileDir, fileKey) {
    var {
        hasTemplate,
        hasInclude
    } = getTemplateInfo(self.wxmlAst, fileKey)
    self.hasTemplate = hasTemplate
    self.hasInclude = hasInclude

    //
    self.isTemplateFile = (self.wxmlFile && !self.jsFile) || isIncludeFile
    self.templateNameList = getTemplateNameList(self.wxmlAst, fileKey)
    self.templateImportList = getTemplateImportList(self.wxmlAst, fileDir, fileKey)
    self.includeList = getIncludeList(self.wxmlAst, fileKey)

    self.templateIncludeList = createIncludePage(self, fileDir, fileKey)

    if (self.isVueFile) {
        transformIncludePage(self.jsAst, self.wxmlAst, self.templateImportList, self.usingComponents, fileDir, self)
    }
}


module.exports = {
    transformTemplateToComponent
}





/**
 *循环里，如果wxml+wxss无js，则判定为template,     ok
 1.添加isTemplate变量，     ok
 2.并收集template-name---生成组件名     ok
 3.收集变量名，生成computed     ok
 4.分割非template内容，生成include文件     未ok  ---这个策略怎么弄？

 *
 * 页面里可以多个import标签
 * 收集页面里的import标签，并且查到对应的template-name列表（可能一个可能多个）
 *
 * 遍历template标签时，根据当前页面所有import对应的文件获取组件名
 * 调整标签为组件
 *
 *
 * include处理*
 *
 *
 *
 *
 *
 *
 *
 *-----------------------

处理页面----\
1.当前页面的template name=""
2.Import进来的template name=""
-->生成列表



处理template标签
1.代码在当前页面的---拿到template代码---生成文件（添加到allpagedata?）
2.代码是通过Import引入的 --- 好像也不需要太管，因为每个页面都会遍


难点： 怎么添加到allpagedata



 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */
