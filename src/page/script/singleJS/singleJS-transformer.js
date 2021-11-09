/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2021-10-29 19:39:35
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\page\script\singleJS\singleJS-transformer.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")

const babelUtils = require("../../../utils/babelUtils")
const ggcUtils = require("../../../utils/ggcUtils")



/**
 * 单个js转换
 * @param {*} $ast
 * @param {*} fileKey
 * @returns
 */
function transformSingleJSAst ($ast, fileKey, name) {

    // ggcUtils.transformAppDotGlobalData($ast)
    ggcUtils.transformGetApp($ast)

    return $ast
}

module.exports = { transformSingleJSAst }
