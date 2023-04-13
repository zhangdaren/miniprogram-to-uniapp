/*
 * @Author: zhang peng
 * @Date: 2022-11-02 22:55:09
 * @LastEditTime: 2022-11-07 22:00:05
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/utils/statisticUtils.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const clone = require("clone")

var appRoot = "../.."
const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')
const restoreJSUtils = require(appRoot + '/src/utils/restoreJSUtils.js')
const formatUtils = require(appRoot + '/src/utils/formatUtils.js')


/**
 * 统计项目文件信息
 * @param {*} page     页面数据
 * @param {*} fileKey
 */
function statistic (page, fileKey) {
    if (!page) return

    //统计调用支付api的次数
    var payApiCount = ggcUtils.getApiCount(page.jsAst)
    var loginApiCount = ggcUtils.getApiCount(page.jsAst, "login")
    var chooseMediaCount = ggcUtils.getApiCount(page.jsAst, "chooseMedia")
    var getLocationCount = ggcUtils.getApiCount(page.jsAst, "getLocation")
    var getRelationNodesCount = ggcUtils.getApiCount(page.jsAst, "getLocation")

    //统计支付api和登录api
    global.statistics.payApiCount += payApiCount
    global.statistics.loginApiCount += loginApiCount
    global.statistics.chooseMediaCount += chooseMediaCount
    global.statistics.getLocationCount += getLocationCount
    global.statistics.getRelationNodesCount += getRelationNodesCount

    //统计页面数，组件数
    switch (page.astType) {
        case "Page":
            global.statistics.pageCount++
            break
        case "Component":
            global.statistics.componentCount++
            break
    }

    //标签
    var videoCount = ggcUtils.getTagCount(page.wxmlAst, "video")
    var mapCount = ggcUtils.getTagCount(page.wxmlAst, "map")
    var adCount = ggcUtils.getTagCount(page.wxmlAst, "ad")

    global.statistics.videoCount += videoCount
    global.statistics.mapCount += mapCount
    global.statistics.adCount += adCount

    // getRelationNodes

    // 分享
    // 扫一扫。 自定义tabbar
    // 数量

    // 云函数提示，只能用于当前小程序 平台

    // getRelationNodes数量

    // vant项目

    // custom-tab-bar


    // 生命周期直接调用

    // 检测路径 是否存在
}

module.exports = {
    statistic
}

