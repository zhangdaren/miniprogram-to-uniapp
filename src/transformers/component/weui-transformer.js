/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:01:45
 * @LastEditTime: 2021-10-30 16:47:26
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/component/weui-transformer.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const clone = require("clone")
const ProgressBar = require('progress')

var appRoot = "../../.."
const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')

//
// https://developers.weixin.qq.com/miniprogram/dev/extended/weui/quickstart.html



// weui
//先转换好，放入components里


//weui demo
// import CustomPage from '../../base/CustomPage'

// CustomPage({
//     open: function(){
//         wx.showActionSheet({
//             itemList: ['A', 'B', 'C'],
//             success: function(res) {
//                 if (!res.cancel) {
//                     console.log(res.tapIndex)
//                 }
//             }
//         });
//     },
//     data: {
//         showDialog: false,
//         groups: [
//             { text: '示例菜单', value: 1 },
//             { text: '示例菜单', value: 2 },
//             { text: '负向菜单', type: 'warn', value: 3 }
//         ]
//     },
//     openDialog: function () {
//         this.setData({
//             showDialog: true
//         })
//     },
//     closeDialog: function () {
//         this.setData({
//             showDialog: false
//         })
//     },
//     btnClick(e) {
//         console.log(e)
//         this.closeDialog()
//     }
// });



// ----- 微信
//通过 useExtendedLib 扩展库 的方式引入，这种方式引入的组件将不会计入代码包大小

// app.json

// "useExtendedLib": {
//     "kbone": true,
//     "weui": true
//   }


// 1.判断是否有引用weui
// 2.复制转换好的weui到components里
// 3.路径处理，其实可以不处理了..



// weui----

// 1.ts 转 js ， 删除ts文件
// 2.less不转，，兼容转换
// 3.删除__test__目录
// 4.复制weui-wxss目录
// 5.转换为uniapp 组件
// 6.专门出个命令用来转换！

//转换weui
// 1.直接不用转，路径都干掉
// 2.在pages.json添加easycom
// 3.添加组件
// 4.原有的怎么干掉？


/**
 * 提取webpack打包后的weui里面的组件内容
 * @param {*} $jsAst
 * @returns
 */
function transformWeUIScript ($jsAst) {
    if(!$jsAst) return

    var hasWeui = ggcUtils.checkWeUI($jsAst)
    if (hasWeui) {
        $jsAst.find('Component({$$$})').each(function (item) {
            node = item.parent().parent()
            $jsAst.attr('node.program.body', node.attr('body'))
        })
    }
    return $jsAst
}



module.exports = {
    transformWeUIScript
}
