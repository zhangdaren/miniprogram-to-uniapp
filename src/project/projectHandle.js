/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2023-05-18 21:43:50
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
 *
 * @param {*} sourceFolder
 * @param {*} targetSourceFolder
 * @returns
 */
async function transform (sourceFolder, targetSourceFolder) {
    return new Promise(async function (resolve, reject) {
        var allPageData = {}

        var compileProjectInfo = utils.checkCompileProject(sourceFolder)
        if (compileProjectInfo) {
            reject(`[ERROR]检测到当前项目可能是${compileProjectInfo}发布后的小程序项目，不支持转换！请换一个小程序项目再尝试。`)
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

        //过滤含点目录
        // files = files.filter(file=> !file.includes("."))

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
                        //使用ensureDirSync可以创建多级目录
                        fs.ensureDirSync(newFile)
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
                        if (!fileData['cssLanguage']) {
                            fileData['wxss'] = file
                            fileData['cssLanguage'] = ""
                        }
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

        //暂未用上
        // transformTwoWayBindingAll(allPageData)
        global.log(`开始二次遍历及生成vue文件`)
        await transformOtherComponents(allPageData, bar, total)

        resolve()
    })
}




/**
 * @param {*} pageData
 * @param {*} allPageData
 * @returns
 */
function transformTwoWayBindingAll (allPageData) {
    var importComponentList = global.importComponentList

    for (let fileKey of Object.keys(allPageData)) {
        var pageData = allPageData[fileKey]["data"]

        pageData.tagTwoWayBindings.map(item => {
            var componentName = item.componentName
            var propName = item.propName

            //驼峰命名转为短横线命名
            componentName = utils.getKebabCase(componentName)

            //找不到这个组件，就返回
            if (!importComponentList[componentName]) return

            var comFileKey = importComponentList[componentName]

            //找不到这个组件的数据也返回
            if (!allPageData[comFileKey]) {
                //小程序里components/child 等价于components/child/index
                if (allPageData[comFileKey + "/index"]) {
                    comFileKey += "/index"
                } else {
                    global.log("找不到这个组件: " + comFileKey)
                    return
                }
            }
            allPageData[comFileKey].data.twoWayBindings.push(propName)
        })
    }
}


/**
 * 处理文件组
 * @param {*} fileGroupData
 * @param {*} bar
 * @returns
 */
async function transformFileGroup (fileGroupData, fileKey, bar, total) {
    return new Promise(async function (resolve, reject) {
        //进度输出
        bar.tick()
        if (global.hbxLog) {
            global.log(`转换进度: ${ count } / ${ total }   fileKey：` + fileKey)
        }

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
        if (!global.isTemplateToComponent) {
            addTemplateTagDataToGlobal(page, fileKey)
        }

        fileGroupData["data"] = page

        statisticUtils.statistic(page)

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
            //进度输出
            bar.tick()
            count++
            if (global.hbxLog) {
                global.log(`转换进度: ${ count } / ${ total }   fileKey：` + fileKey)
            }

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
            if (!global.isTemplateToComponent) {
                addTemplateTagDataToGlobal(page, fileKey)
            }

            allPageData[fileKey]["data"] = page

            statisticUtils.statistic(page)
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
            //进度输出
            bar.tick()
            count++
            if (global.outputChannel) {
                global.log(`转换进度: ${ count + total / 2 } / ${ total }   fileKey：` + fileKey)
            }

            var pageData = allPageData[fileKey]["data"]

            var jsAst = pageData.jsAst
            var wxmlAst = pageData.wxmlAst
            var wxmlFile = pageData.wxmlFile
            var genericsComponentList = pageData.genericsComponentList
            var usingComponents = pageData.usingComponents

            try {
                if (wxmlAst) {
                    //待template to component成熟后，此种方式将弃用。
                    if (!global.isTemplateToComponent) {
                        transformIncludeTag(wxmlAst, wxmlFile, allPageData)
                        transformTemplateTag(pageData, fileKey, false)
                    }
                }
            } catch (error) {
                global.log("[ERROR]transform template/include Tag: ", fileKey, error)
            }

            try {
                //抽象节点
                transformGenericsComponent(jsAst, wxmlAst, genericsComponentList, usingComponents, fileKey)
            } catch (error) {
                global.log("[ERROR]transformGenericsComponent: ", fileKey, error)
            }


            try {
                if (jsAst && !pageData.isTemplateFile) {
                    var variableTypeInfo = getPageSimpleVariableTypeInfo(jsAst, wxmlAst, allPageData)
                    pageData.variableHandle(variableTypeInfo)
                }
            } catch (error) {
                global.log("[ERROR]variableHandle: ", fileKey, error)
            }

            //处理属性类型与组件定义类型有差异的---是个大工程，杀鸡用牛刀，花里胡哨
            // if(astType==="Page"){
            // }
            //读取usingComponents:下面的组件，然后获取节点的属性，一个一个的对比判断
            //还需加入全局组件
            //简单判断，暂时不考虑自动注册全局组件的情况

            try {
                pageData.generate()
            } catch (error) {
                global.log("[ERROR]generate: ", fileKey, error)
            }

            if (pageData.isVueFile) {
                global.statistics.vueFileCount++
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

    //获取输入目录
    sourceFolder = pathUtils.getInputFolder(sourceFolder)

    if (!fs.existsSync(sourceFolder)) {
        console.error("【ERROR】输入目录不存在，请重新输入或选择要转换的小程序目录项目")
        return
    }

    let miniprogramRoot = sourceFolder

    if (!options.output) {
        options.output = pathUtils.getOutputFolder(sourceFolder, options.isVueAppCliMode)
    }

    //因后面会清空输出目录，为防止误删除其他目录/文件，所以这里不给自定义!!!
    //目标项目目录
    var targetProjectFolder = options.output
    //目录项目src目录，也可能与项目目录一致
    var targetSourceFolder = options.output

    if (options.isVueAppCliMode) {
        targetSourceFolder = path.join(targetProjectFolder, "src")

        if (!fs.existsSync(targetProjectFolder)) {
            fs.mkdirSync(targetProjectFolder)
        }
    }

    if (!fs.existsSync(targetSourceFolder)) {
        fs.mkdirSync(targetSourceFolder)
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
        vanTagList: [],
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
