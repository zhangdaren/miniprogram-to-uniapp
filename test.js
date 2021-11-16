/*
 * @Author: zhang peng
 * @Date: 2021-11-08 18:03:16
 * @LastEditTime: 2021-11-16 16:59:15
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\test.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")

const utils = require('./src/utils/utils.js')
const { transform } = require('./index')

/**
 *  仅用于测试
 */
async function test () {
    try {
        // var sourceFolder = "./demo/test-20210606"
        // var sourceFolder = "./demo/test-20210903"
        // var sourceFolder = "./demo/testweui"
        // var sourceFolder = "./demo/weui-src"
        // var sourceFolder = "./demo/wechatProject_meifumx_health"
        // var sourceFolder = "./demo/qianyuny-0802"
        // var sourceFolder = "./demo/city2021-615"

        // var sourceFolder = "./demo/_-700529215_8-miniapp0603"

        var sourceFolder = "./demo/weui-demo"
        // var sourceFolder = "./demo/taoanmo-old"

        // var sourceFolder = "./demo/459hejian"

        // var sourceFolder = "./demo/test-20211001"
        // var sourceFolder = "./demo/tt-app-mall-master"

        // var sourceFolder = "./demo/1108mp"

        // var sourceFolder = "./demo/xiaochengxu"

        sourceFolder = path.join(__dirname, sourceFolder)
        sourceFolder = utils.normalizePath(sourceFolder)

        await transform(sourceFolder)
    } catch (error) {
        console.log("transform error", error)
    }
}

test()

//没有teyp
{/* <icon class="weui-icon-checked"></icon> */}

//error  outerClass 类型不对
