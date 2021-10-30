/*
 * @Author: zhang peng
 * @Date: 2021-07-22 16:20:33
 * @LastEditTime: 2021-10-29 19:49:18
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\index.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")


// 因为要使用test，遗憾没法使用best-require
// const ROOT_PATH = process.cwd();
// require('best-require')(ROOT_PATH);

var appRoot = require('app-root-path').path


// TODO:这里应该是appRoot需要考虑的事情。。。。
if(appRoot !== __dirname){
    appRoot = __dirname.split(/[\\/]miniprogram-to-uniapp/)[0] + "/miniprogram-to-uniapp"
}

const utils = require(appRoot + '/src/utils/utils.js')
const projectHandle = require(appRoot + '/src/project/projectHandle')

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
    console.log("vue文件数量:", global.vueFileCount)
    console.log("支付api数量:", global.payApiCount)
    console.log("登录api数量:", global.loginApiCount)
    console.log("用时: " + (+new Date() - time) / 1000 + "s")
    console.log("转换完成！")
    console.log("在该小程序项目的同级目录可以看到_uni结尾的项目，即是转换好的uniapp项目，相关日志在该目录里。")

    callback && callback()
}


module.exports = { transform }








/**
 *  仅用于测试
 */
function test () {
    // var sourceFolder = "./demo/test-20210606"
    // var sourceFolder = "./demo/test-20210903"
    // var sourceFolder = "./demo/testweui"
    // var sourceFolder = "./demo/weui-src"
    // var sourceFolder = "./demo/wechatProject_meifumx_health"
    // var sourceFolder = "./demo/qianyuny-0802"
    // var sourceFolder = "./demo/city2021-615"

    // var sourceFolder = "./demo/_-700529215_8-miniapp0603"

    // var sourceFolder = "./demo/weui-demo"
    // var sourceFolder = "./demo/taoanmo-old"

    var sourceFolder = "./demo/test-20211001"

    // var sourceFolder = "./demo/xiaochengxu"

    sourceFolder = path.join(__dirname, sourceFolder)
    sourceFolder = utils.normalizePath(sourceFolder)

    transform(sourceFolder)
}

// try {
//     test()
// } catch (error) {

// }
