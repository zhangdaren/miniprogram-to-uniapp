/*
 * @Author: zhang peng
 * @Date: 2023-04-30 11:06:50
 * @LastEditTime: 2023-05-17 14:52:53
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\utils\logUtils.js
 *
 */
const path = require('path')
const fs = require('fs-extra')
const util = require('util')
const pathUtils = require('./pathUtils.js')

let count = 0
let logArr = []
let timerId = null

function logPlus (msg) {
    logArr.push(msg)
    count++

    if (count >= 50) {
        clearTimeout(timerId)
        timerId = null
        outputLogs()
    } else if (!timerId) {
        timerId = setTimeout(outputLogs, 1000)
    }
}

function outputLogs () {
    if (global.hbxLog) {
        global.hbxLog(logArr.join('\n'))
    } else {
        console.log(logArr.join(' '))
    }
    count = 0
    logArr = []
    timerId = null
}


/**
 * 初始化日志，用于写入到转换目录目录
 * @param {*} folder
 * @param {*} options
 */
function initConsole (sourceFolder, options) {
    if (options.hbxLog) {
        global.hbxLog = options.hbxLog
    }

    //获取输入目录
    sourceFolder = pathUtils.getInputFolder(sourceFolder)

    if (!fs.existsSync(sourceFolder)) {
        console.log("【ERROR】输入目录不存在，请重新输入或选择要转换的小程序目录项目")
        return
    }

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

    var logPath = path.join(targetProjectFolder, 'transform.log')

    //如果存在，则清空
    if (fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, "")
    }

    // var logFile = fs.createWriteStream(logPath, { flags: 'a' })
    global.log = function () {
        var logStr = ""
        try {
            //某些情况报：RangeError:Maximum call stack size exceeded
            //来源gogocode find.js 解析html
            logStr = util.format.apply(null, arguments) + '\n'
        } catch (error) {
            logStr = error
        }
        // logPlus(logStr)

        // logFile.write(log)  //TODO:貌似不生效了，不知道是node16还是因为win10
        fs.appendFileSync(logPath, logStr)
        process.stdout.write(logStr)

        //hbuilderx console log
        if (options.hbxLog) {
            options.hbxLog(logStr)
        }
    }
}


module.exports = {
    initConsole
}

