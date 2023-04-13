/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:01:45
 * @LastEditTime: 2022-11-15 16:24:14
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \wtu\src\transformers\cloudfunction\cloudfunction-transformer.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const clone = require("clone")
const ProgressBar = require('progress')
const { switchCase } = require('@babel/types')

var appRoot = "../../.."
const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')


/**
 * 微信云函数转换
 * @param {*} $jsAst
 * @param {*} fileKey
 * @returns
 */
function transformCloudFunction ($jsAst, fileKey) {
  if (!$jsAst) return

  $jsAst.replace(`wx.cloud.callFunction`, 'uniCloud.callFunction')
    .replace(`wx.cloud.uploadFile`, 'uniCloud.uploadFile')
}

module.exports = {
  transformCloudFunction
}
