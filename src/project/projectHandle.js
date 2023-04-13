/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2023-04-12 20:49:33
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/project/projectHandle.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const util = require('util')

const t = require("@babel/types")
const clone = require("clone")
const ProgressBar = require('progress')

var appRoot = "../.."
const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')
const statisticUtils = require(appRoot + '/src/utils/statisticUtils.js')

const configUtils = require(appRoot + '/src/utils/configUtils.js')

const { configHandle, parseAppJSON } = require('./configHandle')

const { transformTemplateTag, addTemplateTagDataToGlobal } = require(appRoot + "/src/transformers/tag/template-tag-transformer")

// const {  } = require(appRoot + "/src/transformers/tag/template-tag-transformer2")

const { transformIncludeTag } = require(appRoot + "/src/transformers/tag/include-tag-transformer")
const { transformVueCLI } = require(appRoot + "/src/transformers/project/vue-cli-transformer")
const { transformWxCloud } = require(appRoot + "/src/transformers/cloud/cloud-transformer")

const { transformGenericsComponent } = require(appRoot + "/src/transformers/component/generics-transformer")

const { getPageSimpleVariableTypeInfo } = require(appRoot + '/src/transformers/variable/variable-transformer')

const Page = require(appRoot + "/src/page")

const pkg = require('../../package.json')

const MAX_FILE_SIZE = 1024 * 500  //最大可处理js大小

//TODO: 注意事项，其实global上面挂了很多很多东西
// global = { ...global, ...options }
//注意，不能像上面这样给global增加东西，会报错的。。 比如：prettier-eslint


/**
 * 检测是否为uni-app发布后的项目
 * @param {*} sourceFolder
 */
function checkCompileProject (sourceFolder) {
    var appJs = path.join(sourceFolder, "app.js")
    var content = ""
    try {
        content = fs.readFileSync(appJs, 'utf-8')
    } catch (error) {
        //可能没有这个文件
    }
    if (content) {
        var list = ["./common/vendor.js"]
        var result = list.every(str => content.includes(str))
        return result
    } else {
        return false
    }
}


/**
 *
 * @param {*} sourceFolder
 * @param {*} targetSourceFolder
 * @returns
 */
async function transform (sourceFolder, targetSourceFolder) {
    return new Promise(async function (resolve, reject) {
        var allPageData = {}

        var isCompileProject = checkCompileProject(sourceFolder)
        if (isCompileProject) {
            reject("[ERROR]检测到当前项目可能是uniapp发布后的小程序项目，不支持转换！")
            return
        }

        const startTime = new Date()
        var files = utils.getAllFile(sourceFolder)
        var num = files.length

        const time = new Date().getTime() - startTime.getTime()
        var logStr = `搜索到${ num }个文件(含目录)，耗时：${ time }ms\r\n`
        global.log(logStr)

        //过滤目录不处理
        // files = files.filter(file=> !file.includes("node_modules") && !file.includes("miniprogram_npm"))

        global.log(`开始分析文件`)

        files.forEach(function (file) {
            //这种取不到~~
            // let isFolder = obj.dirent['Symbol(type)'] === 2
            // let file = obj.path
            // let name = obj.name
            // let isFolder = file.lastIndexOf("/") === file.length - 1

            //快速判断是否为目录
            var extname = path.extname(file)

            //判断是否为目录，暂时无更好更快的办法判断= =，后缀名不行，有些目录是叫“pro2.0”
            var stat = fs.statSync(file)
            let isFolder = stat.isDirectory()


            var relPath = path.relative(sourceFolder, file)
            var newFile = path.join(targetSourceFolder, relPath)

            if (isFolder) {
                //去除最后的杠，他的使命已完成。仅使用fastGlob遍历文件才需要这玩意！！！
                // file = file.substring(0, file.length - 1)

                var folderName = path.basename(file)
                if (folderName === "__test__") {
                    //weui-miniprogram 源码里面的目录，无须转换
                    // } else if (folderName === "node_modules" || file.includes("miniprogram_npm")) {
                    //     fs.copySync(file, newFile)
                } else {
                    if (!fs.existsSync(newFile)) {
                        fs.mkdirSync(newFile)
                    }
                }
            } else {
                var fileKey = pathUtils.getFileKey(file)

                if (!allPageData[fileKey]) {
                    allPageData[fileKey] = {}
                }

                var fileData = allPageData[fileKey]

                var fileNameNoExt = pathUtils.getFileNameNoExt(file)
                var fileName = path.basename(file)

                switch (extname) {
                    case '.js':

                        var stats = fs.statSync(file)
                        if (stats.size > MAX_FILE_SIZE) {
                            //直接复制
                            fs.copySync(file, newFile)
                        } else {
                            fileData['js'] = file
                        }

                        // var tsFile = file.replace(/\.js$/, ".ts")
                        // if (!fs.existsSync(tsFile)) {
                        //     //如果同名ts文件不存在
                        //     var stats = fs.statSync(file)
                        //     if (stats.size > MAX_FILE_SIZE) {
                        //         //直接复制
                        //         fs.copySync(file, newFile)
                        //     } else {
                        //         fileData['js'] = file
                        //     }
                        // }
                        break
                    case '.wxml':
                    case '.qml':
                    case '.ttml':
                    case '.axml':
                    case '.swan':
                        fileData['wxml'] = file
                        fileData['wxmlExtname'] = extname

                        //TODO: 小程序类型
                        // global.mpType = utils.getMPType(extname)
                        // global.mpTypeName = utils.mpInfo[global.mpType].keyword
                        break
                    case '.wxss':
                    case '.qss':
                    case '.ttss':
                    case '.acss':
                        fileData['wxss'] = file
                        fileData['cssLanguage'] = ""
                        break
                    case '.less':
                        fileData['wxss'] = file
                        fileData['cssLanguage'] = "less"
                        break
                    case '.scss':
                        fileData['wxss'] = file
                        fileData['cssLanguage'] = "scss"
                        break
                    case '.ts':
                        //如果有ts文件，优先用ts
                        var stats = fs.statSync(file)
                        if (stats.size > MAX_FILE_SIZE) {
                            //直接复制
                            fs.copySync(file, newFile)
                        } else {
                            fileData['js'] = file
                            fileData['jsFileType'] = "TS"
                        }
                        //有ts文件，则判定为ts项目
                        global.isTypescript = true
                        break
                    case '.json':
                        //粗暴获取上层目录的名称~~~
                        // let pFolderName = pathUtils.getParentFolderName(file)
                        if (!fileKey.includes("/") && fileName !== "app.json") {
                            fs.copySync(file, newFile)
                        }
                        ///这里要判断是文件名是否为上层目录名，如果是的话就可以
                        fileData['json'] = file
                        break
                    case '.wxs':
                    case '.sjs':
                        //直接复制
                        fs.copySync(file, newFile)
                        break
                    default:
                        if (ggcUtils.staticAssetsReg.test(extname)) {
                            // 2021-07-31
                            //移入到static目录
                            //不移不行，仅app和h5 ok，微信小程序不ok
                            let relPath = path.relative(global.miniprogramRoot, file)
                            relPath = utils.normalizePath(relPath)
                            if (!global.assetInfo[relPath])
                                global.assetInfo[relPath] = {}
                            global.assetInfo[relPath]['oldPath'] = file
                            let targetFile = path.join(targetSourceFolder, relPath.startsWith('static') ? "" : "static", relPath)
                            global.assetInfo[relPath]['newPath'] = targetFile

                            fs.copySync(file, targetFile)
                        } else {
                            fs.copySync(file, newFile)
                        }
                        //如果是资源文件，则直接剔除
                        delete allPageData[fileKey]
                        break
                }
            }
        })

        var pageList = Object.keys(allPageData)
        var total = pageList.length * 2
        var bar = new ProgressBar('进度 [:bar] :rate/bps :percent :etas ', {
            complete: '#',
            incomplete: '-',
            width: 30,
            total: total
        })

        global.log(`分析文件信息完成，共${ pageList.length }组数据`)
        global.log(`开始转换文件组为vue文件`)

        //顺序不能错!!!
        await transformPageList(allPageData, bar, total)

        global.log(`开始二次遍历及生成vue文件`)
        await transformOtherComponents(allPageData, bar, total)

        resolve()
    })
}



/**
 * 处理文件组
 * @param {*} fileGroupData
 * @param {*} bar
 * @returns
 */
async function transformFileGroup (fileGroupData, fileKey, bar, total) {
    return new Promise(async function (resolve, reject) {
        var count = 0
        var jsFile = fileGroupData["js"] || ""
        var jsFileType = fileGroupData["jsFileType"] || ""
        var wxmlFile = fileGroupData["wxml"] || ""
        var jsonFile = fileGroupData["json"] || ""
        var wxssFile = fileGroupData["wxss"] || ""
        var cssLanguage = fileGroupData["cssLanguage"] || ""
        var wxmlExtname = fileGroupData["wxmlExtname"] || ""

        var options = {
            jsFile,
            jsFileType,
            wxmlFile,
            jsonFile,
            wxssFile,
            fileKey,
            cssLanguage,
            wxmlExtname,
            jsFileType: fileGroupData["jsFileType"] || "JS"
        }

        var page = new Page(options)
        await page.transform()

        //将template和include转换为组件
        if (global.isTemplateToComponent) {
            let list = page.templateIncludeList
            if (list && list.length) {
                list.map(async item => {
                    let page = new Page(options)
                    page.jsAst = item.jsAst
                    page.wxmlAst = item.wxmlAst
                    page.fileKey = item.fileKey
                    await page.transform(true)
                    allPageData[item.fileKey] = {}
                    allPageData[item.fileKey]["data"] = page
                })
            }
        }

        global.routerData[fileKey] = page.styleConfig

        pathUtils.cacheImportComponentList(jsFile, wxmlFile, page.usingComponents)

        //
        // if (!global.isTemplateToComponent) {
        addTemplateTagDataToGlobal(page, fileKey)
        // }

        fileGroupData["data"] = page

        statisticUtils.statistic(page)

        bar.tick()

        global.log(`转换进度: ${ count } / ${ total }   fileKey：` + fileKey)

        resolve()
    })
}


/**
 * 处理页面
 * @param {*} allPageData
 * @param {*} bar
 * @returns
 */
async function transformPageList (allPageData, bar, total) {
    return new Promise(async function (resolve, reject) {
        //因为要遍历，要同步，没法使用map或forEach
        var count = 0

        // var list = Object.keys(allPageData).map(fileKey => {
        //     return transformFileGroup(allPageData[fileKey],fileKey, bar, total)
        // })

        // global.log(`转换进度: `)

        // await Promise.all(list).then((result) => {
        //     console.log(result)       // [ '3秒后醒来', '2秒后醒来' ]
        //     resolve()
        // }).catch((error) => {
        //     console.log(error)
        // })

        for (let fileKey of Object.keys(allPageData)) {
            var fileGroupData = allPageData[fileKey]

            var jsFile = fileGroupData["js"] || ""
            var jsFileType = fileGroupData["jsFileType"] || ""
            var wxmlFile = fileGroupData["wxml"] || ""
            var jsonFile = fileGroupData["json"] || ""
            var wxssFile = fileGroupData["wxss"] || ""
            var cssLanguage = fileGroupData["cssLanguage"] || ""
            var wxmlExtname = fileGroupData["wxmlExtname"] || ""

            var options = {
                jsFile,
                jsFileType,
                wxmlFile,
                jsonFile,
                wxssFile,
                fileKey,
                cssLanguage,
                wxmlExtname,
                jsFileType: fileGroupData["jsFileType"] || "JS"
            }

            var page = new Page(options)
            await page.transform()

            //将template和include转换为组件
            if (global.isTemplateToComponent) {
                let list = page.templateIncludeList
                if (list && list.length) {
                    list.map(async item => {
                        let page = new Page(options)
                        page.jsAst = item.jsAst
                        page.wxmlAst = item.wxmlAst
                        page.fileKey = item.fileKey
                        await page.transform(true)
                        allPageData[item.fileKey] = {}
                        allPageData[item.fileKey]["data"] = page
                    })
                }
            }

            global.routerData[fileKey] = page.styleConfig

            pathUtils.cacheImportComponentList(jsFile, wxmlFile, page.usingComponents)

            //
            // if (!global.isTemplateToComponent) {
            addTemplateTagDataToGlobal(page, fileKey)
            // }

            allPageData[fileKey]["data"] = page

            statisticUtils.statistic(page)

            bar.tick()

            count++
            global.log(`转换进度: ${ count } / ${ total }   fileKey：` + fileKey)
        }
        resolve()

    })
}


/**
 * 处理其他组件
 * @param {*} allPageData
 * @param {*} bar
 * @returns
 */
async function transformOtherComponents (allPageData, bar, total) {
    return new Promise(async function (resolve, reject) {
        //处理template和include标签，以及未定义的变量等
        var count = 0
        for (let fileKey of Object.keys(allPageData)) {
            var pageData = allPageData[fileKey]["data"]

            var jsAst = pageData.jsAst
            var wxmlAst = pageData.wxmlAst
            var wxmlFile = pageData.wxmlFile
            var genericsComponentList = pageData.genericsComponentList
            var usingComponents = pageData.usingComponents


            if (wxmlAst) {
                //待template to component成熟后，此种方式将弃用。
                if (!global.isTemplateToComponent) {
                    transformIncludeTag(wxmlAst, wxmlFile, allPageData)
                    transformTemplateTag(pageData, fileKey, false)
                }
            }

            //抽象节点
            transformGenericsComponent(jsAst, wxmlAst, genericsComponentList, usingComponents, fileKey)

            if (jsAst && !pageData.isTemplateFile) {
                var variableTypeInfo = getPageSimpleVariableTypeInfo(jsAst, wxmlAst, allPageData)
                pageData.variableHandle(variableTypeInfo)
            }

            //处理属性类型与组件定义类型有差异的---是个大工程，杀鸡用牛刀，花里胡哨
            // if(astType==="Page"){
            // }
            //读取usingComponents:下面的组件，然后获取节点的属性，一个一个的对比判断
            //还需加入全局组件
            //简单判断，暂时不考虑自动注册全局组件的情况

            pageData.generate()

            if (pageData.isVueFile) {
                global.statistics.vueFileCount++
            }

            bar.tick()

            count++
            if (global.outputChannel) {
                global.log(`转换进度: ${ count + total / 2 } / ${ total }   fileKey：` + fileKey)
            }
        }
        resolve()
    })
}

// await transformPageList(allPageData, bar)
// await transformOtherComponents(allPageData, bar)






/**
 * 项目转换
 * @param {*} sourceFolder
 * @param {*} options
 */
async function projectHandle (sourceFolder, options = {}) {

    //如果选择的目录里面只有一个目录的话，那就把source目录定位为此目录，暂时只管这一层，多的不理了。
    var readDir = fs.readdirSync(sourceFolder)
    if (readDir.length === 1) {
        var baseFolder = path.join(sourceFolder, readDir[0])
        var statInfo = fs.statSync(baseFolder)
        if (statInfo.isDirectory()) {
            sourceFolder = baseFolder
        }
    }

    if (!fs.existsSync(sourceFolder)) {
        console.error("【ERROR】输入目录不存在，请重新输入或选择要转换的小程序目录项目")
        return
    }

    let miniprogramRoot = sourceFolder

    //因后面会清空输出目录，为防止误删除其他目录/文件，所以这里不给自定义!!!
    //目标项目目录
    var targetProjectFolder = sourceFolder + '_uni'
    //目录项目src目录，也可能与项目目录一致
    var targetSourceFolder = sourceFolder + '_uni'

    if (options.isVueAppCliMode) {
        targetProjectFolder = sourceFolder + '_uni_vue-cli'
        targetSourceFolder = path.join(targetProjectFolder, "src")

        if (!fs.existsSync(targetProjectFolder)) {
            fs.mkdirSync(targetProjectFolder)
        }

        if (!fs.existsSync(targetSourceFolder)) {
            fs.mkdirSync(targetSourceFolder)
        }
    } else {
        if (!fs.existsSync(targetSourceFolder)) {
            fs.mkdirSync(targetSourceFolder)
        }
    }

    //定义全局变量
    global.miniprogramRoot = sourceFolder
    global.targetProjectFolder = targetProjectFolder
    global.targetSourceFolder = targetSourceFolder
    global.assetInfo = {}
    global.routerData = {}
    global.wxsInfo = {}

    //是否是uni-app发布后的小程序
    global.isCompileProject = false

    //配置
    global.isVueAppCliMode = options.isVueAppCliMode || false
    global.isMergeWxssToVue = options.isMergeWxssToVue || false
    global.isTemplateToComponent = options.isTemplateToComponent || false

    //是否加载polyfill
    global.hasPolyfill = options.hasPolyfill || false

    //所有的组件信息，记录着name, props等
    //key为fileKey,内容为props（name:[类型]）
    global.props = {}

    //所有import的component，用于记录所有第三方组件
    global.importComponentList = {}

    //判断项目是否含weui
    global.hasWeUI = false

    //TODO: 未完成
    //判断项目是否含vant
    global.hasVant = false

    //读取小程序项目配置
    const configData = configUtils.getProjectConfig(miniprogramRoot, sourceFolder)

    //小程序项目目录，不一定就等于输入目录，有无云开发的目录结构是不相同的。
    miniprogramRoot = configData.miniprogramRoot
    if (!fs.existsSync(miniprogramRoot)) {
        var newMiniprogramRoot = path.join(sourceFolder, "./src")
        if (fs.existsSync(newMiniprogramRoot)) {
            miniprogramRoot = newMiniprogramRoot
        } else {
            global.log("找不到小程序代码目录？")
        }
    }

    //项目里用到的npm包
    global.dependencies = configData.dependencies || {}

    //检测是否是taro项目
    var hasTaro = Object.keys(global.dependencies).some(key => key.includes("@tarojs/"))
    if (hasTaro) {
        console.error("[ERROR]检测到当前项目可能是Taro开发的小程序项目，不支持转换！")
    }

    //是否使用到relations和getRelationNodes函数
    global.hasComponentRelation = false

    //项目里抽象节点信息
    global.genericList = []

    //判断是否是ts项目
    global.isTypescript = false

    //统计数据
    global.statistics = {
        vueFileCount: 0,
        pageCount: 0,
        componentCount: 0,
        payApiCount: 0,
        loginApiCount: 0,
        chooseMediaCount: 0,
        getLocationCount: 0,
        getRelationNodesCount: 0,
        videoCount: 0,
        mapCount: 0,
        adCount: 0,
    }

    //云开发目录
    if (configData.cloudfunctionRoot) {
        //处理云函数
        transformWxCloud(sourceFolder, configData.cloudfunctionRoot, targetSourceFolder)
    }

    //vue-cli模式
    if (options.isVueAppCliMode) {
        transformVueCLI(
            configData,
            targetProjectFolder,
            true
        )
    }

    /////////////////////定义全局变量//////////////////////////
    //之前传来传去的，过于麻烦，全局变量的弊端就是过于耦合了。
    global.miniprogramRoot = miniprogramRoot
    global.sourceFolder = sourceFolder

    var appJSON = parseAppJSON(miniprogramRoot)
    pathUtils.cacheImportComponentList("", "", appJSON.usingComponents)

    //app.json里引入的组件
    global.globalUsingComponents = appJSON.usingComponents || []

    /////////////////////////////////////////////
    await transform(miniprogramRoot, targetSourceFolder)

    //处理配置文件
    await configHandle(configData, global.routerData, miniprogramRoot, targetSourceFolder)
}


module.exports = projectHandle
