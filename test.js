/*
 * @Author: zhang peng
 * @Date: 2021-11-08 18:03:16
 * @LastEditTime: 2022-01-26 17:35:40
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

        // var sourceFolder = "./demo/weui-demo"
        // var sourceFolder = "./demo/taoanmo-old"

        // var sourceFolder = "./demo/459hejian"

        // var sourceFolder = "./demo/test-20211001"

        var sourceFolder = "./demo/test-20211118"

        // var sourceFolder = "./demo/test-20220119"

        // var sourceFolder = "./demo/Discuz-minapp-2.0"

        // var sourceFolder = "./demo/test-20211125"

        // var sourceFolder = "./demo/test-202200125-weiqing"

        // var sourceFolder = "./demo/1214"
        // var sourceFolder = "./demo/shsy88"

        // var sourceFolder = "./demo/eymini-master"

        // var sourceFolder = "./demo/wxapp(4)-app-fix"
        //
        // var sourceFolder = "./demo/tt-app-mall-master"

        // var sourceFolder = "./demo/1108mp"

        // var sourceFolder = "./demo/xiaochengxu"

        sourceFolder = path.join(__dirname, sourceFolder)
        sourceFolder = utils.normalizePath(sourceFolder)

        var options = {
            // isVueAppCliMode:true
        }

        await transform(sourceFolder, options)
    } catch (error) {
        console.log("transform error", error)
    }
}

test()


// const lessSyntax = require('postcss-less')
// const ScssSyntax = require('postcss-scss')

// test2()
// function test2 () {

//     var css = `.banner{
//             &__info{}
//             .abc__test{}
//         }`

//     var ast = lessSyntax.parse(css)
//     const styleRules = ast.nodes
//     console.log(JSON.stringify(ast, null, 4))
// }

