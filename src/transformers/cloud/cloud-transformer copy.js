/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:01:45
 * @LastEditTime: 2023-04-10 20:36:33
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/cloud/cloud-transformer copy.js
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
function transformCloud ($jsAst, fileKey) {
    if (!$jsAst) return

    $jsAst.replace(`wx.cloud.callFunction`, 'uniCloud.callFunction')
        .replace(`wx.cloud.uploadFile`, 'uniCloud.uploadFile')


        //查找文件
        //遍历
        //分析


//拿到cloud名
//注释cloud.init
//替换cloud.database
//拿到db
// 开始搜索


// const cloud = require('wx-server-sdk');

// cloud.init({
//   env: cloud.DYNAMIC_CURRENT_ENV
// });

// const db = cloud.database();

// // 创建集合云函数入口函数
// exports.main = async (event, context) => {
//   try {
//     // 创建集合
//     await db.createCollection('sales');
//     await db.collection('sales').add({
//       // data 字段表示需新增的 JSON 数据
//       data: {
//         region: '华东',
//         city: '上海',
//         sales: 11
//       }
//     });
// }

// 微信小程序云开发add、update、set操作时参数比uniCloud多了一层data 从微信小程序云开发迁移时最需要注意的事项

// const db = uniCloud.database() //代码块为cdb
// db.collection('list')
//   .where({
//     name: "hello-uni-app" //传统MongoDB写法，不是jql写法。实际开发中推荐使用jql写法
//   }).get()
//   .then((res)=>{
//     // res 为数据库查询结果
//   }).catch((err)=>{
//     global.log(err.code); // 打印错误码
// 		global.log(err.message); // 打印错误内容
//   })


// $(source)
// .replace('$_$1.add({data:{$$$}})', (match, nodePath) => {
//     global.log(match)
//     if (match[1][0].value.startsWith('db.')) {
//       return '$_$1.add({$$$})'
//     } else {
//       return null
//     }
//   })
//   .generate()


function transform(fileInfo, api, options) {
    const $ = api.gogocode
    const source = fileInfo.source
    // return your transformed code here

    var ast = $(source)

    var cloudName = ''

    ast
      .find([
        "const $_$1 = require('wx-server-sdk')",
        "let $_$1 = require('wx-server-sdk')",
        "var $_$1 = require('wx-server-sdk')",
      ])
      .each((item) => {
        cloudName = item.match[1][0].value
        item.remove()
      })

    global.log("cloudName",cloudName)

    // const db = uniCloud.database(); //代码块为cdb

    ast.find(`${cloudName}.init()`).each((item) => {
      var code = $(item).generate()
      var list = code.split('\n')
      list = list.map((str) => '\n//' + str + '\n')
      global.log(code, list, list.join('\n'))
      // list.reverse()

      // if(item.prev().length)

      //     list.map((str) => {
      //       if(item.prev().length){
      //  item.prev().after(str)
      //       }else{
      //         global.log("item.parent()",item.parent())

      //       item.parent().prepend(str)

      //       }
      //     })
      // item.empty()
      item.remove()
    })

    var dbVarName = ''

    ast.replace(
      [
        `const $_$1 = ${cloudName}.database()`,
        `let $_$1 = ${cloudName}.database()`,
        `var $_$1 = ${cloudName}.database()`,
      ],
      (match, nodePath) => {
        //应该没有定义几个的情况吧？
        dbVarName = match[1][0].value
        return `const $_$1 = uniCloud.database()`
      }
    )

    ast.replace(`${cloudName}.database()`, 'uniCloud.database()')

    return ast
      .replace('$_$1.add({data:{$$$}})', (match, nodePath) => {
        // global.log(match)
        if (match[1][0].value.startsWith(`${dbVarName}.`)) {
          return '$_$1.add({$$$})'
        } else {
          return null
        }
      })
      .generate()
  }


    //   微信小程序云开发add、update、set操作时参数比uniCloud多了一层data 从微信小程序云开发迁移时最需要注意的事项


}

module.exports = {
    transformCloud
}
