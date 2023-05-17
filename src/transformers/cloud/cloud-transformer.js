/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2023-02-25 10:04:18
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/cloud/cloud-transformer.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const util = require('util')

const t = require("@babel/types")
const clone = require("clone")
const ProgressBar = require('progress')

var appRoot = "../../.."
const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')


/**
 * 处理函数
 * @param {*} ast
 * @param {*} funName  函数名
 * @param {*} dbVarName  db变量名
 */
function handleFunction (ast, funName, dbVarName) {
  ast
    .root()
    .replace('$_$1.add({data:{$$$}})', (match, nodePath) => {
      // global.log(match)
      if (match[1][0].value.startsWith(`${ dbVarName }.`)) {
        return `$_$1.${ funName }({$$$})`
      } else {
        return null
      }
    })
}



/**
 * 云函数转换
 * @param {*} file
 * @param {*} targetFile
 * @returns
 */
function transformCloud (file, targetFile) {
  // global.log('%c [ file ]-27', 'font-size:13px; background:pink; color:#bf2c9f;', file)

  var ast = $.loadFile(file)

  //
  var cloudName = ''

  ast.replace(
    [
      "const $_$1 = require('wx-server-sdk')",
      "let $_$1 = require('wx-server-sdk')",
      "var $_$1 = require('wx-server-sdk')",
    ],
    (match, nodePath) => {
      //应该没有定义几个的情况吧？
      cloudName = match[1][0].value
      return `;/** const $_$1 = require('wx-server-sdk') */`
      return null
    }
  )

  // global.log(cloudName)
  if (!cloudName) return false

  ast.replace(`${ cloudName }.init($_$1)`, `/** ${ cloudName }.init($_$1) */`)

  var dbVarName = ''

  ast.replace(
    [
      `const $_$1 = ${ cloudName }.database()`,
      `let $_$1 = ${ cloudName }.database()`,
      `var $_$1 = ${ cloudName }.database()`,
    ],
    (match, nodePath) => {
      //应该没有定义几个的情况吧？
      dbVarName = match[1][0].value
      return `const $_$1 = uniCloud.database()`
    }
  )

  if (!dbVarName) return false

  ast.replace(`${ cloudName }.database()`, 'uniCloud.database()')

  //微信小程序云开发add、update、set操作时参数比uniCloud多了一层data 从微信小程序云开发迁移时最需要注意的事项
  handleFunction(ast, 'add', dbVarName)
  handleFunction(ast, 'update', dbVarName)
  handleFunction(ast, 'set', dbVarName)

  var code = ast.root().generate()
  fs.writeFileSync(targetFile, code)

  return true
}


/**
 * @param {*} sourceCloudFunsFolder
 * @param {*} targetCloudFunsFolder
 * @returns
 */
async function transform (sourceCloudFunsFolder, targetCloudFunsFolder) {
  return new Promise(async function (resolve, reject) {

    const startTime = new Date()
    var files = utils.getAllFile(sourceCloudFunsFolder)
    var num = files.length

    const time = new Date().getTime() - startTime.getTime()
    // var logStr = `搜索到${ num }个文件(含目录)，耗时：${ time }ms\r\n`
    // global.log(logStr)

    files.forEach(async function (file) {
      //快速判断是否为目录
      var extname = path.extname(file)

      //判断是否为目录，暂时无更好更快的办法判断= =，后缀名不行，有些目录是叫“pro2.0”
      var stat = fs.statSync(file)
      let isFolder = stat.isDirectory()

      var relPath = path.relative(sourceCloudFunsFolder, file)
      var newFile = path.join(targetCloudFunsFolder, relPath)

      if (isFolder) {
        if (!fs.existsSync(newFile)) {
          fs.mkdirSync(newFile)
        }
      } else {
        switch (extname) {
          case '.js':
            var res = transformCloud(file, newFile)
            if (!res) {
              fs.copySync(file, newFile)
            }
            break
          default:
            fs.copySync(file, newFile)
            break
        }
      }
    })

    resolve()
  })
}

/**
 * 云函数转换
 * @param {*} sourceFolder
 * @param {*} cloudfunctionRoot   云函数目录名
 * @param {*} targetFolder
 * @param {*} options
 * @returns
 */
async function transformWxCloud (sourceFolder, cloudfunctionRoot, targetFolder, options = {}) {
  if (!fs.existsSync(sourceFolder)) {
    return
  }

  //源云函数目录
  var sourceCloudFunsFolder = path.join(sourceFolder, cloudfunctionRoot)

  if(!fs.existsSync(sourceCloudFunsFolder)){
    global.log(`[TIP] project.config.json配置的云函数目录不存在：` , cloudfunctionRoot);
    return
  }

  //uniCloud输出目录
  var uniCloudFolder = path.join(targetFolder, 'uniCloud-aliyun')
  if (!fs.existsSync(uniCloudFolder)) {
    fs.mkdirSync(uniCloudFolder)
  }

  //输出的云函数目录
  var targetCloudFunsFolder = path.join(uniCloudFolder, 'cloudfunctions')
  if (!fs.existsSync(targetCloudFunsFolder)) {
    fs.mkdirSync(targetCloudFunsFolder)
  }

  /////////////////////////////////////////////
  await transform(sourceCloudFunsFolder, targetCloudFunsFolder)
}


module.exports = { transformWxCloud }
