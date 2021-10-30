/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2021-10-29 19:51:46
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\project\projectHandle.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const util = require('util')

const t = require("@babel/types")
const clone = require("clone")
const ProgressBar = require('progress')

var appRoot = require('app-root-path').path

// console.log("appRoot---" , appRoot )

// console.log('__dirname : ' + __dirname)

if(appRoot !== __dirname){
    appRoot = __dirname.split(/[\\/]miniprogram-to-uniapp/)[0] + "/miniprogram-to-uniapp"
}

const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')

const configUtils = require(appRoot + '/src/utils/configUtils.js')

const { configHandle, parseAppJSON } = require('./configHandle')

const { transformTemplateTag, addTemplateTagDataToGlobal } = require(appRoot + "/src/transformers/tag/template-tag-transformer")
const { transformIncludeTag } = require(appRoot + "/src/transformers/tag/indule-tag-transformer")

const { getPageSimpleVariableTypeInfo } = require(appRoot + '/src/transformers/variable/variable-transformer')

const Page = require(appRoot + "/src/page")

//TODO: 注意事项，其实global上面挂了很多很多东西
// global = { ...global, ...options }
//注意，不能像上面这样给global增加东西，会报错的。。 比如：prettier-eslint


async function transform (sourceFolder, targetFolder) {
    return new Promise(async function (resolve, reject) {
        var allPageData = {}

        const startTime = new Date()
        var files = utils.getAllFile(sourceFolder)

        const time = new Date().getTime() - startTime.getTime()
        var logStr = `搜索到${ files.length }个文件，耗时：${ time }ms\r\n`
        console.log(logStr)

        files.forEach(async function (file) {
            //这种取不到~~
            // let isFolder = obj.dirent['Symbol(type)'] === 2
            // let file = obj.path
            // let name = obj.name
            // let isFolder = file.lastIndexOf("/") === file.length - 1

            let isFolder = !path.extname(file)

            // console.log("file", file)
            // console.log("isFolder", isFolder)

            var relPath = path.relative(sourceFolder, file)
            var newFile = path.join(targetFolder, relPath)

            if (isFolder) {
                //去除最后的杠，他的使命已完成。仅使用fastGlob遍历文件才需要这玩意！！！
                // file = file.substring(0, file.length - 1)

                var folderName = path.basename(file)
                if (folderName === "__test__") {
                    //weui-miniprogram 源码里面的目录，无须转换
                } else {
                    if (!fs.existsSync(newFile)) {
                        fs.mkdirSync(newFile)
                    }
                }
            } else {
                var extname = path.extname(file)

                var fileKey = pathUtils.getFileKey(file)

                //custom-tab-bar目录不进行转换
                var reg = /[\///]custom-tab-bar[\///]/
                if (reg.test(fileKey)) {
                    fs.copySync(file, newFile)
                    return
                }

                if (!allPageData[fileKey]) {
                    allPageData[fileKey] = {}
                }

                var fileData = allPageData[fileKey]

                var fileNameNoExt = pathUtils.getFileNameNoExt(file)
                var fileName = path.basename(file)

                switch (extname) {
                    case '.js':
                        fileData['js'] = file
                        break
                    case '.wxml':
                    case '.qml':
                    case '.ttml':
                    case '.axml':
                    case '.swan':
                        fileData['wxml'] = file

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
                        //ts文件不动
                        break
                    case '.json':
                        //粗暴获取上层目录的名称~~~
                        let pFolderName = pathUtils.getParentFolderName(file)
                        if (fileNameNoExt !== pFolderName && fileName != 'app.json' && fileName != 'index.json') {
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
                        // console.log(extname, path.dirname(fileDir));
                        // console.log(fileDir, path.basename(path.dirname(fileDir)));
                        if (ggcUtils.staticAssetsReg.test(extname)) {
                            //当前文件上层目录
                            let pFolder = path.dirname(file)

                            if (global.isVueAppCliMode) {
                                let relFolder = path.relative(miniprogramRoot, pFolder)
                                let key = relFolder.replace(/\\/g, '/')
                                global.assetsFolderObject.add(key)
                                fs.copySync(file, newFile)
                            } else {
                                // 2021-07-31
                                //移入到static目录
                                //不移不行，仅app和h5 ok，微信小程序不ok
                                let relPath = path.relative(global.miniprogramRoot, file)
                                relPath = utils.normalizePath(relPath)
                                if (!global.assetInfo[relPath])
                                    global.assetInfo[relPath] = {}
                                global.assetInfo[relPath]['oldPath'] = file
                                let targetFile = path.join(targetFolder, 'static', relPath)
                                global.assetInfo[relPath]['newPath'] = targetFile

                                fs.copySync(file, targetFile)
                            }
                        } else {
                            fs.copySync(file, newFile)
                        }
                        break
                }
            }
        })

        var pageList = Object.keys(allPageData)
        var bar = new ProgressBar('  转换进度 [:bar] :rate/bps :percent 预计剩余:etas ', {
            complete: '█',
            incomplete: '░',
            width: 60,
            total: pageList.length * 2
        })

        //顺序不能错
        await transformPageList(allPageData, bar)
        await transformOtherComponents(allPageData, bar)

        resolve()
    })
}

/**
 * 处理页面
 * @param {*} allPageData
 * @param {*} bar
 * @returns
 */
async function transformPageList (allPageData, bar) {
    return new Promise(async function (resolve, reject) {
        //因为要遍历，要同步，没法使用map或forEach
        for (let fileKey of Object.keys(allPageData)) {
            var fileGroupData = allPageData[fileKey]

            var jsFile = fileGroupData["js"] || ""
            var wxmlFile = fileGroupData["wxml"] || ""
            var jsonFile = fileGroupData["json"] || ""
            var wxssFile = fileGroupData["wxss"] || ""
            var cssLanguage = fileGroupData["cssLanguage"] || ""

            var options = {
                jsFile,
                wxmlFile,
                jsonFile,
                wxssFile,
                fileKey,
                cssLanguage,
            }

            var page = new Page(options)
            try {
                await page.transform()
            } catch (error) {
                console.log("page.transform(): ", error)
            }
            global.routerData[fileKey] = page.styleConfig

            pathUtils.cacheImportComponentList(jsFile, wxmlFile, page.usingComponents)

            addTemplateTagDataToGlobal(page.wxmlAst)

            allPageData[fileKey]["data"] = page

            global.payApiCount += page.payApiCount
            global.loginApiCount += page.loginApiCount

            bar.tick()
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
async function transformOtherComponents (allPageData, bar) {
    return new Promise(async function (resolve, reject) {
        //处理template和include标签，以及未定义的变量等
        for (let fileKey of Object.keys(allPageData)) {
            var pageData = allPageData[fileKey]["data"]

            var jsAst = pageData.jsAst
            var wxmlAst = pageData.wxmlAst
            var wxmlFile = pageData.wxmlFile

            if (wxmlAst) {
                transformIncludeTag(wxmlAst, wxmlFile, allPageData)
                transformTemplateTag(wxmlAst, wxmlFile, allPageData)
            }

            try {
                var variableTypeInfo = getPageSimpleVariableTypeInfo(jsAst, wxmlAst, allPageData)
                pageData.variableHandle(variableTypeInfo)
            } catch (error) {
                console.log("[Error]variableHandle: ", fileKey, jsAst.generate())
            }

            pageData.generate()

            if (pageData.isVueFile) {
                global.vueFileCount++
            }

            bar.tick()

        }
        resolve()

    })
}

// await transformPageList(allPageData, bar)
// await transformOtherComponents(allPageData, bar)




/**
 * 初始化日志，用于写入到转换目录目录
 * @param {*} folder
 */
function initConsole (folder) {
    var logPath = path.join(folder, 'transform.log')

    if (fs.existsSync(logPath)) {
        fs.unlinkSync(logPath)
    }

    var logFile = fs.createWriteStream(logPath, { flags: 'a' })
    console.log = function () {
        logFile.write(util.format.apply(null, arguments) + '\n')
        process.stdout.write(util.format.apply(null, arguments) + '\n')
    }
    console.error = function () {
        logFile.write(util.format.apply(null, arguments) + '\n')
        process.stderr.write(util.format.apply(null, arguments) + '\n')
    }
}


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

    let miniprogramRoot = sourceFolder

    //因后面会清空输出目录，为防止误删除其他目录/文件，所以这里不给自定义!!!
    var targetFolder = sourceFolder + '_uni'
    // if (isVueAppCliMode) {
    //     targetFolder = sourceFolder + '_uni_vue-cli'
    // } else {
    //     targetFolder = sourceFolder + '_uni'
    // }

    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder)
    }

    initConsole(targetFolder)

    console.log(`项目 '${ path.basename(sourceFolder) }' 开始转换...`)
    console.log("sourceFolder = " + sourceFolder)

    //定义全局变量
    global.miniprogramRoot = sourceFolder
    global.targetFolder = targetFolder
    global.assetInfo = {}
    global.routerData = {}
    global.payApiCount = 0
    global.loginApiCount = 0
    global.vueFileCount = 0
    global.wxsInfo = {}

    //配置
    global.isVueAppCliMode = options.isVueAppCliMode || false
    global.isMergeWxssToVue = options.isMergeWxssToVue || false

    //所有的组件信息，记录着name, props等
    //key为fileKey,内容为props（name:[类型]）
    global.props = {}

    //所有import的component，用于记录所有第三方组件
    global.importComponentList = {}

    //判断项目是否含weui
    global.hasWeUI = false

    //读取小程序项目配置
    const configData = configUtils.getProjectConfig(miniprogramRoot, sourceFolder)

    //小程序项目目录，不一定就等于输入目录，有无云开发的目录结构是不相同的。
    miniprogramRoot = configData.miniprogramRoot

    //云开发目录 复制
    if (configData.cloudfunctionRoot) {
        var sourceCloudfunctionRoot = path.join(sourceFolder, configData.cloudfunctionRoot)
        const targetCloudfunctionRoot = path.join(targetFolder, configData.cloudfunctionRoot)
        fs.copySync(sourceCloudfunctionRoot, targetCloudfunctionRoot)
    }

    /////////////////////定义全局变量//////////////////////////
    //之前传来传去的，过于麻烦，全局变量的弊端就是过于耦合了。
    global.miniprogramRoot = miniprogramRoot
    global.sourceFolder = sourceFolder

    var appJSON = parseAppJSON(miniprogramRoot)
    pathUtils.cacheImportComponentList("", "", appJSON.usingComponents)

    /////////////////////////////////////////////
    await transform(miniprogramRoot, targetFolder)

    //处理配置文件
    await configHandle(configData, global.routerData, miniprogramRoot, targetFolder)
}


module.exports = projectHandle