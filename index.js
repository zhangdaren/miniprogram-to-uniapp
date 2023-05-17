/*
 * @Author: zhang peng
 * @Date: 2021-07-22 16:20:33
 * @LastEditTime: 2023-05-12 22:12:21
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/index.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')
const util = require('util')
const utils = require('./src/utils/utils.js')
const projectHandle = require('./src/project/projectHandle')
const pkg = require('./package.json')
const {initConsole} = require('./src/utils/logUtils.js')

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

    let vanTagList = utils.duplicateRemoval(global.statistics.vanTagList)
    global.log("Vant组件:", `${vanTagList.join("、")}， 数量：${vanTagList.length}`)


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
    2.工具转换原理及说明文档参考：https://l4rz4zwpx7.k.topthink.com/@kmrvzg72lx/
    3.如遇运行报错，请添加QQ群(五群：536178289)带图反馈或https://github.com/zhangdaren/miniprogram-to-uniapp提交Issue！
    4.转换后请查阅_uni目录或_uni-cli目录里的 README.md 和 transform.log\n\n`)

    callback && callback()
}

module.exports = { transform }
