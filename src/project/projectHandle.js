/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2022-01-10 15:28:52
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

var appRoot = "../.."
const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')

const configUtils = require(appRoot + '/src/utils/configUtils.js')

const { configHandle, parseAppJSON } = require('./configHandle')

const { transformTemplateTag, addTemplateTagDataToGlobal } = require(appRoot + "/src/transformers/tag/template-tag-transformer")
const { transformIncludeTag } = require(appRoot + "/src/transformers/tag/include-tag-transformer")
const { transformVueCLI } = require(appRoot + "/src/transformers/project/vue-cli-transformer")

const { getPageSimpleVariableTypeInfo } = require(appRoot + '/src/transformers/variable/variable-transformer')

const Page = require(appRoot + "/src/page")

const pkg = require('../../package.json')

const MAX_FILE_SIZE = 1024 * 100  //最大可处理js大小

//TODO: 注意事项，其实global上面挂了很多很多东西
// global = { ...global, ...options }
//注意，不能像上面这样给global增加东西，会报错的。。 比如：prettier-eslint


/**
 * 检测是否为uniapp发布后的项目
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
        var list = ["./common/runtime.js", "./common/vendor.js", "./common/main.js"]
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
 * @param {*} outputChannel  hbx插件专用
 * @returns
 */
async function transform (sourceFolder, targetSourceFolder, outputChannel) {
    return new Promise(async function (resolve, reject) {
        var allPageData = {}

        var isCompileProject = checkCompileProject(sourceFolder)
        if (isCompileProject) {
            reject("[Error]检测到当前项目可能是uniapp发布后的小程序项目，不支持转换！")
            return
        }

        const startTime = new Date()
        var files = utils.getAllFile(sourceFolder)
        var num = files.length

        const time = new Date().getTime() - startTime.getTime()
        var logStr = `搜索到${ num }个文件，耗时：${ time }ms\r\n`
        console.log(logStr)

        files.forEach(async function (file) {
            //这种取不到~~
            // let isFolder = obj.dirent['Symbol(type)'] === 2
            // let file = obj.path
            // let name = obj.name
            // let isFolder = file.lastIndexOf("/") === file.length - 1

            var basename = path.basename(file)
            if(basename === ".DS_Store") return;

            //快速判断是否为目录
            var extname = path.extname(file)
            let isFolder = !extname

            if(isFolder){
                //二次判断是否是文件，因为有些文件没有后缀名，比如LICENSE
                var stat = fs.statSync(file);
                isFolder = stat.isDirectory()
            }

            // console.log("file", file)
            // console.log("isFolder", isFolder)

            var relPath = path.relative(sourceFolder, file)
            var newFile = path.join(targetSourceFolder, relPath)

            if (isFolder) {
                //去除最后的杠，他的使命已完成。仅使用fastGlob遍历文件才需要这玩意！！！
                // file = file.substring(0, file.length - 1)

                var folderName = path.basename(file)
                if (folderName === "__test__") {
                    //weui-miniprogram 源码里面的目录，无须转换
                } else if (folderName === "node_modules") {
                    fs.copySync(file, newFile)
                } else {
                    if (!fs.existsSync(newFile)) {
                        fs.mkdirSync(newFile)
                    }
                }
            } else if (file.includes("node_modules")) {
                //node_modules 不处理
                console.log("不处理node_modules目录")
            } else {
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
                        var stats = fs.statSync(file)
                        if (stats.size > MAX_FILE_SIZE) {
                            console.log(`[Tip]文件(${ fileKey }.js)体积大于 ${ MAX_FILE_SIZE / 1000 } kb ，跳过处理`)
                            //直接复制
                            fs.copySync(file, newFile)
                        } else {
                            fileData['js'] = file
                        }
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
                        //ts文件不动
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
                        // console.log(extname, path.dirname(fileDir));
                        // console.log(fileDir, path.basename(path.dirname(fileDir)));
                        if (ggcUtils.staticAssetsReg.test(extname)) {
                            //当前文件上层目录
                            let pFolder = path.dirname(file)

                            if (global.isVueAppCliMode) {
                                let relFolder = path.relative(miniprogramRoot, pFolder)
                                let key = relFolder.replace(/\\/g, '/')
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
                                let targetFile = path.join(targetSourceFolder, 'static', relPath)
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
        var total = pageList.length * 2
        var bar = new ProgressBar('进度 [:bar] :rate/bps :percent :etas ', {
            complete: '#',
            incomplete: '-',
            width: 30,
            total: total
        })

        //顺序不能错!!!
        await transformPageList(allPageData, bar, outputChannel, total)
        await transformOtherComponents(allPageData, bar, outputChannel, total)

        resolve()
    })
}

/**
 * 处理页面
 * @param {*} allPageData
 * @param {*} bar
 * @returns
 */
async function transformPageList (allPageData, bar, outputChannel, total) {
    return new Promise(async function (resolve, reject) {
        //因为要遍历，要同步，没法使用map或forEach
        var count = 0
        for (let fileKey of Object.keys(allPageData)) {
            var fileGroupData = allPageData[fileKey]

            var jsFile = fileGroupData["js"] || ""
            var wxmlFile = fileGroupData["wxml"] || ""
            var jsonFile = fileGroupData["json"] || ""
            var wxssFile = fileGroupData["wxss"] || ""
            var cssLanguage = fileGroupData["cssLanguage"] || ""
            var wxmlExtname = fileGroupData["wxmlExtname"] || ""

            var options = {
                jsFile,
                wxmlFile,
                jsonFile,
                wxssFile,
                fileKey,
                cssLanguage,
                wxmlExtname,
            }

            var page = new Page(options)
            try {
                await page.transform()
            } catch (error) {
                console.log("page.transform(): ", error)
            }
            global.routerData[fileKey] = page.styleConfig

            pathUtils.cacheImportComponentList(jsFile, wxmlFile, page.usingComponents)

            addTemplateTagDataToGlobal(page.wxmlAst, fileKey)

            allPageData[fileKey]["data"] = page

            global.payApiCount += page.payApiCount
            global.loginApiCount += page.loginApiCount

            bar.tick()

            count++
            if (outputChannel) {
                outputChannel.appendLine(`转换进度: ${ count } / ${ total }   fileKey：` + fileKey)
            }
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
async function transformOtherComponents (allPageData, bar, outputChannel, total) {
    return new Promise(async function (resolve, reject) {
        //处理template和include标签，以及未定义的变量等
        var count = 0
        for (let fileKey of Object.keys(allPageData)) {
            var pageData = allPageData[fileKey]["data"]

            var jsAst = pageData.jsAst
            var wxmlAst = pageData.wxmlAst
            var wxmlFile = pageData.wxmlFile

            if (wxmlAst) {
                transformIncludeTag(wxmlAst, wxmlFile, allPageData)
                transformTemplateTag(wxmlAst, wxmlFile, allPageData)
            }

            if (jsAst) {
                try {
                    var variableTypeInfo = getPageSimpleVariableTypeInfo(jsAst, wxmlAst, allPageData)
                    pageData.variableHandle(variableTypeInfo)
                } catch (error) {
                    console.log("[Error]variableHandle: ", fileKey, jsAst.generate())
                }
            }

            pageData.generate()

            if (pageData.isVueFile) {
                global.vueFileCount++
            }

            bar.tick()

            count++
            if (outputChannel) {
                outputChannel.appendLine(`转换进度: ${ count + total / 2 } / ${ total }   fileKey：` + fileKey)
            }
        }
        resolve()
    })
}

// await transformPageList(allPageData, bar)
// await transformOtherComponents(allPageData, bar)




/**
 * 初始化日志，用于写入到转换目录目录
 * @param {*} folder
 * @param {*} outputChannel
 */
function initConsole (folder, outputChannel) {
    var logPath = path.join(folder, 'transform.log')

    if (fs.existsSync(logPath)) {
        fs.unlinkSync(logPath)
    }

    var logFile = fs.createWriteStream(logPath, { flags: 'a' })
    console.log = function () {
        var log = util.format.apply(null, arguments) + '\n'
        logFile.write(log)
        process.stdout.write(log)

        //hbuilderx console log
        if (outputChannel) {
            outputChannel.appendLine(log)
        }
    }
    console.error = function () {
        var log = util.format.apply(null, arguments) + '\n'
        logFile.write(log)
        process.stdout.write(log)

        //hbuilderx console log
        if (outputChannel) {
            outputChannel.appendLine(log)
        }
    }
}

function closeReadStream(stream) {
    if (!stream) return;
    if (stream.close) stream.close();
    else if (stream.destroy) stream.destroy();
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

    if (!fs.existsSync(sourceFolder)) {
        console.log("输入目录不存在")
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

    initConsole(targetProjectFolder, options.outputChannel)

    console.log(`miniprogram-to-uniapp v2 转换日志\n`)

    console.log(`工具版本：v${ pkg.version }`)
    console.log(`转换模式：${ options.isVueAppCliMode ? 'Vue-CLi' : 'HBuilder X' }`)
    console.log(`是否合并css：${ options.isMergeWxssToVue ? '是' : '否' }`)


    console.log(`项目 '${ path.basename(sourceFolder) }' 开始转换...`)
    console.log("sourceFolder = " + sourceFolder)

    //定义全局变量
    global.miniprogramRoot = sourceFolder
    global.targetProjectFolder = targetProjectFolder
    global.targetSourceFolder = targetSourceFolder
    global.assetInfo = {}
    global.routerData = {}
    global.payApiCount = 0
    global.loginApiCount = 0
    global.vueFileCount = 0
    global.wxsInfo = {}

    //是否是uniapp发布后的小程序
    global.isCompileProject = false

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
        const targetCloudfunctionRoot = path.join(targetSourceFolder, configData.cloudfunctionRoot)
        fs.copySync(sourceCloudfunctionRoot, targetCloudfunctionRoot)
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

    /////////////////////////////////////////////
    await transform(miniprogramRoot, targetSourceFolder, options.outputChannel)

    //处理配置文件
    await configHandle(configData, global.routerData, miniprogramRoot, targetSourceFolder)



}


module.exports = projectHandle
