/*
 * @Author: zhang peng
 * @Date: 2021-07-22 16:20:33
 * @LastEditTime: 2021-11-26 18:42:11
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\index.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")


const utils = require('./src/utils/utils.js')
const projectHandle = require('./src/project/projectHandle')

/**
 *
 * @param {*} sourceFolder
 * @param {*} options
 * @param {*} callback
 */
async function transform (sourceFolder, options = {}, callback) {
    var time = +new Date()

    console.log("开始转换……")

    await projectHandle(sourceFolder, options)

    console.log("\n")
    console.log("统计信息：\n")
    console.log("vue文件数量:", global.vueFileCount)
    console.log("支付api数量:", global.payApiCount)
    console.log("登录api数量:", global.loginApiCount)

    if (global.isCompileProject) {
        console.error("\n[Error]项目转换失败！！！\n")
        console.log("用时: " + (+new Date() - time) / 1000 + "s")
        console.error("[Error]当前项目可能是【uni-app发布的小程序】，不支持转换，转换后的项目也非完整项目！！！\n")
    } else {
        console.log("\n恭喜你，转换完成！")
        console.log("用时: " + (+new Date() - time) / 1000 + "s")
        console.log(`在该小程序项目的同级目录可以看到_uni${ options.isVueAppCliMode ? 'vue-cli' : '' }结尾的项目，即是转换好的uniapp项目，相关日志在该目录里。`)
    }
    console.log(`\n注：如有疑问，请添加QQ群(780359397、361784059、603659851)或https://github.com/zhangdaren/miniprogram-to-uniapp进行反馈！\n\n`)

    callback && callback()
}

module.exports = { transform }
