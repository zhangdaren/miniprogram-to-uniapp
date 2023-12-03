/*
 * @Author: zhang peng
 * @Date: 2021-11-08 18:03:16
 * @LastEditTime: 2023-07-26 21:40:44
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/test.js
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

        // var sourceFolder = "./demo/test-20211118"

        // var sourceFolder = "./demo/test-20220119"

        // var sourceFolder = "./demo/test-20220606"

        // var sourceFolder = "./demo/qinghang-applet"

        // var sourceFolder = "./demo/test-20220824"

        // var sourceFolder = "./demo/miniprogram5.1"

        // var sourceFolder = "./demo/test-20220504"

        // var sourceFolder = "./demo/dlg-modal"

        // var sourceFolder = "./demo/test-20221005"




        // var sourceFolder = "./demo/minisns_front"

        // var sourceFolder = "./demo/test-20221017"

        // var sourceFolder = "./demo/test-20221029-relation"

        // var sourceFolder = "./demo/synthesize_components-master"


        //TODO: 有问题，会报错！！！！！！！！！！！！！！！！！！！！！！！！！！
        // var sourceFolder = "./demo/test-20221030"




        // var sourceFolder = "./demo/test-vant"


        //ts demo
        // var sourceFolder = "./demo/deduction-service-main"




        // var sourceFolder = "./demo/test-20221023"

        // var sourceFolder = "./demo/test-20221108"

        // var sourceFolder = "./demo/test-wx-cloud"

        // var sourceFolder = "./demo/test-20221029-relation"


        // var sourceFolder = "./demo/test-menery"

        // var sourceFolder = "./demo/image-clipper"
        //
        // var sourceFolder = "./demo/test-20221103-lifecycle"

        // var sourceFolder = "./demo/test-20221031-setdata"

        // var sourceFolder = "./demo/neweggs_client"


        // var sourceFolder = "./demo/test-wxs-select-component-20221024"

        // var sourceFolder = "./demo/test-20221026-selectcomponent"

        // var sourceFolder = "./demo/test-20221027-ts"

        // var sourceFolder = "./demo/renrenmall-2"

        // var sourceFolder = "./demo/test-20230214"



        // template include ---test
        // var sourceFolder = "./demo/test-20230305-tem-include"


        // var sourceFolder = "./demo/renrenmall-new"






        // var sourceFolder = "./demo/waterfall-relation"

        // var sourceFolder = "./demo/test-20221023"


        // var sourceFolder = "./demo/test-20230214"

        // var sourceFolder = "./demo/test-20230401-sync-update"

        // var sourceFolder = "./demo/renrenmall-new"



        // var sourceFolder = "./demo/baiduDemo-develop"
        // var sourceFolder = "./demo/SmartAppDemo-master"

        // var sourceFolder = "./demo/miniprogram-demo-master"  //cloud





        // var sourceFolder = "./demo/test-20221020"

        // var sourceFolder = "./demo/test-less-rpx-bug"

        // var sourceFolder = "./demo/test-20221006"

        // var sourceFolder = "./demo/验证bug专用/test-wca2uni"

        // var sourceFolder = "./demo/askdada/t"

        // var sourceFolder = "./demo/接龙"

        // var sourceFolder = "./demo/test-wca2uni0701"

        // var sourceFolder = "./demo/test-wca2uni"

        // var sourceFolder = "./demo/a前端"

        // var sourceFolder = "./demo/ts-applet-demo-master"

        // var sourceFolder = "./demo/mjmc"

        // var sourceFolder = "./demo/wxapp-jw"

        // var sourceFolder = "./demo/wxapp-hasques"
        // var sourceFolder = "./demo/kdsend"

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


        /////////////////////////////////////////////////------------------------------------

        //vant小程序v https://github.com/vant-ui/vant-demo

        // var sourceFolder = "./demo/vant-mini-app"

        //有报错！！！！
        // var sourceFolder = "./demo/wxapp"

        // var sourceFolder = "./demo/miniprogram-template有几个base_list_tpl未转换"

        // var sourceFolder = "./demo/test-20230426-template"



        //测试简易双向绑定
        // var sourceFolder = "./demo/test-simple-model2"


        //vant demo
        // var sourceFolder = "./demo/vant-weapp-learning-master"


        //先不要动
        var sourceFolder = "./demo/vant-demo"

        // var sourceFolder = "./demo/minisns_front"


        //抽象节点
        // var sourceFolder = "./demo/test-20221023"




        sourceFolder = path.join(__dirname, sourceFolder)
        sourceFolder = utils.normalizePath(sourceFolder)

        var options = {
            // isVueAppCliMode:true,
            // isMergeWxssToVue:true
            isTemplateToComponent:true
        }

        //require('v8').writeHeapSnapshot();

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

