/*
 * @Author: zhang peng
 * @Date: 2021-07-22 16:20:33
 * @LastEditTime: 2023-04-13 11:25:02
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\index.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')
const util = require('util')
const projectHandle = require('./src/project/projectHandle')
const pkg = require('./package.json')


/**
 * 初始化日志，用于写入到转换目录目录
 * @param {*} folder
 * @param {*} outputChannel
 */
function initConsole (sourceFolder, options) {

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
        console.log("【ERROR】输入目录不存在，请重新输入或选择要转换的小程序目录项目")
        return
    }

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

    var logPath = path.join(targetProjectFolder, 'transform.log')

    if (fs.existsSync(logPath)) {
        fs.unlinkSync(logPath)
    }

    // var logFile = fs.createWriteStream(logPath, { flags: 'a' })
    global.log = function () {
        var log = ""
        try {
            //某些情况报：RangeError:Maximum call stack size exceeded
            //来源gogocode find.js 解析html
            log = util.format.apply(null, arguments) + '\n'
        } catch (error) {
            log = error
        }
        // logFile.write(log)  //TODO:貌似不生效了，不知道是node16还是因为win10
        fs.appendFileSync(logPath, log)
        process.stdout.write(log)

        //hbuilderx console log
        if (options.outputChannel) {
            options.outputChannel.appendLine(log)
        }
    }
}


/**
 *
 * @param {*} sourceFolder
 * @param {*} options
 * @param {*} callback
 */
async function transform (sourceFolder, options = {}, callback) {
    var time = +new Date()

    //初始化console
    initConsole(sourceFolder, options)

    // process.exitCode = 1

    global.log("开始转换……")
    global.log("小程序路径: ", sourceFolder)

    await projectHandle(sourceFolder, options)

    global.log("\n")
    global.log("统计信息：\n")
    global.log("Component数量:", global.statistics.componentCount)
    global.log("Page数量:", global.statistics.pageCount)
    global.log("支付api数量:", global.statistics.payApiCount)
    global.log("登录api数量:", global.statistics.loginApiCount)
    global.log("chooseMedia数量:", global.statistics.chooseMediaCount)
    global.log("getLocation数量:", global.statistics.getLocationCount)
    global.log("getRelationNodes数量:", global.statistics.getRelationNodesCount)
    global.log("<ad/>数量:", global.statistics.adCount)
    global.log("<map/>数量:", global.statistics.mapCount)
    global.log("<video/>数量:", global.statistics.videoCount)


    if (global.isCompileProject) {
        console.error("\n[ERROR]项目转换失败！！！\n")
        global.log("用时: " + (+new Date() - time) / 1000 + "s")
        console.error("[ERROR]当前项目可能是【uni-app发布的小程序】，不支持转换，转换后的项目也非完整项目！！！\n")
    } else {
        global.log("\n项目转换完成！")
        global.log("用时: " + (+new Date() - time) / 1000 + "s")
        global.log(`工具版本：v${ pkg.version }`)
        global.log(`在该小程序项目的同级目录可以看到_uni${ options.isVueAppCliMode ? '_vue-cli' : '' }结尾的项目，即是转换好的uniapp项目，相关日志在该目录里。`)

        let hasModule = global.hasComponentRelation || (JSON.stringify(global.dependencies) !== '{}' && !options.isVueAppCliMode)
        if (hasModule) {
            global.log("\n！！！ 当前项目引用了npm模块，请转换完后，在命令行里运行“npm install”命令安装npm模块 ！！！")
        }
    }

    global.log(`\n使用说明：
    1.因各种原因，本工具并非100%完美转换！部分语法仍需人工处理！
    2.如遇运行报错，请添加QQ群(四群：555691239)带图反馈或https://github.com/zhangdaren/miniprogram-to-uniapp提交Issue！
    3.更多信息请查阅转换后目录里的 README.md 和 transform.log\n\n`)

    callback && callback()
}

module.exports = { transform }
