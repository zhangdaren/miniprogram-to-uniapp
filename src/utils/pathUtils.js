/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2022-01-10 11:16:43
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\utils\pathUtils.js
 *
 */
// const { NodePath } = require('@babel/traverse')
const fs = require('fs')
const path = require('path')
const nodeUtil = require('util')
const utils = require('./utils')


/**
 * 获取无后缀名的文件名
 * @param {*} filePath  文件路径
 */
function getFileNameNoExt (filePath) {
    let extname = path.extname(filePath)
    return path.basename(filePath, extname)
}

/**
 * 粗暴获取父级目录的目录名
 * @param {*} filePath  文件路径
 */
function getParentFolderName (filePath) {
    //当前文件上层目录
    let pFolder = path.dirname(filePath)
    //粗暴获取上层目录的名称~~~
    return path.basename(pFolder)
}



//TODO: 要不要校验此文件是否存在？
/**
 * 路径转换，转换根路径(路径前面为/)和当前路径(无/开头)为相对于当前目录的路径
 * @param {*} filePath  文件相对路径
 * @param {*} root      根目录
 * @param {*} fileDir   当前文件所在目录
 */
function relativePath (filePath, root, fileDir) {
    if (!filePath) return filePath

    //去掉js后缀名
    //排除例外：import {SymbolIterator} from "./methods/symbol.iterator";
    //import Im from '../../lib/socket.io';
    // let extname = path.extname(filePath);
    // if (extname == ".js") {
    //     filePath = path.join(
    //         path.dirname(filePath),
    //         getFileNameNoExt(filePath)
    //     ); //去掉扩展名
    // }

    // import PubSub, { publish } from 'pubsub-js'
    // import moment from "moment"

    const reg_signle = /[\w-_]+/
    const reg_weui = /^weui-miniprogram\//

    var extname = path.extname(filePath)

    if (filePath.indexOf("weui-miniprogram") > -1) {
        console.log("---- weui-miniprogram --")
    }

    if (reg_signle.test(filePath) || reg_weui.test(filePath)) {
        var testFile = path.join(root, "miniprogram_npm", filePath)

        // console.log("---------------filePath 1 ", filePath)
        // console.log("---------------ftestFolder ", testFolder)
        if (fs.existsSync(testFile)) {
            filePath = "@/" + path.relative(root, testFile)
        } else {
            // console.log("----------------------漏风")
            if (/^\//.test(filePath)) {
                //如果是以/开头的，表示根目录
                filePath = path.join(root, filePath)
            } else {
                filePath = path.join(fileDir, filePath)
            }
            // console.log("---------------filePath 2 ", filePath)

            //todo: test @
            // var xx = path.relative(global.miniprogramRoot, filePath);
            // console.log("xx", xx)

            filePath = path.relative(fileDir, filePath)


            if (extname) {
                if (!/^[\.\/@]/.test(filePath)) {
                    filePath = './' + filePath
                }
            }
        }
    } else {
        if (/^\//.test(filePath)) {
            //如果是以/开头的，表示根目录
            filePath = path.join(root, filePath)
        } else {
            filePath = path.join(fileDir, filePath)
        }
        // console.log("---------------filePath 2 ", filePath)

        //todo: test @
        // var xx = path.relative(global.miniprogramRoot, filePath);
        // console.log("xx", xx)

        filePath = path.relative(fileDir, filePath)

        if (!/^[\.\/@]/.test(filePath)) {
            filePath = './' + filePath
        }
    }

    // if(filePath.indexOf("pubsub-js") > -1)
    // {
    //     console.log("---------------filePath 2 ", filePath)
    // }

    return utils.normalizePath(filePath)
}

//TODO: 要不要校验此文件是否存在？

/**
 * 替换路径为相对于static目录的路径
 * @param {*} filePath     文件的路径，一般为相对路径
 * @param {*} root         根目录
 * @param {*} fileDir      当前文件所在目录
 * @param {*} userAtSymbol 是否在根路径前面增加@符号，默认true
 */
function  repairAssetPath (filePath, root, fileDir, userAtSymbol = true) {
    // console.log(" repairAssetPath", filePath, fileDir)
    if (!filePath || utils.isURL(filePath)) return filePath
    if (!/^[\.\/]/.test(filePath)) {
        filePath = './' + filePath
    }
    let absPath = ''
    if (/^\//.test(filePath)) {
        //如果是以/开头的，表示根目录
        absPath = path.join(root, filePath)
    } else {
        absPath = path.join(fileDir, filePath)
    }
    let relPath = utils.normalizePath(path.relative(root, absPath))
    relPath = getAssetsNewPath(relPath, global.targetSourceFolder, fileDir)
    if (userAtSymbol && /^\//.test(relPath)) {
        //如果是以/开头的，表示根目录
        relPath = "@" + relPath
    }
    return utils.normalizePath(relPath)
}

/**
 * 获取类似于小程序配置文件里路径信息，由文件目录+文件名(无后缀名)组成
 * 如：
 * @param {*} filePath  //文件路径
 * @param {*} root      //根目录，默认为miniprogramRoot
 */
function getFileKey (filePath, root) {
    if (!filePath) return ''
    if (!root) root = global.miniprogramRoot
    let fileFolder = path.dirname(filePath)
    fileFolder = path.relative(root, fileFolder)
    let fileNameNoExt = getFileNameNoExt(filePath)
    let key = path.join(fileFolder, fileNameNoExt)
    return utils.normalizePath(key)
}


/**
 * 从global.assetInfo这个对象里取出与当前路径相似的新路径
 * @param {*} filePath
 * @param {*} rootFolder 根路径，即项目根目录
 */
function getAssetsNewPath (filePath, rootFolder = '') {
    if (!filePath || utils.isURL(filePath)) return filePath

    let result = utils.normalizePath(filePath)
    for (const key in global.assetInfo) {
        let obj = global.assetInfo[key]
        if (result.indexOf(key) > -1) {
            result = utils.normalizePath(obj.newPath)
            break
        }
    }
    //如果找不到文件：即文件路径不存在时
    if (result === filePath) {
        result = path.join(global.targetSourceFolder, "static", result)
    }
    //获取相对于根路径的路径
    if (rootFolder) {
        result = path.relative(rootFolder, result)
    } else {
        result = path.relative(global.targetSourceFolder, result)
    }

    if (!/^[\.\/]/.test(result)) {
        //统一相对于根路径，使用/
        result = '/' + result
    }
    result = utils.normalizePath(result)
    return result
}


/**
 * 保存所有页面引入的外部组件
 * @param {*} jsFile
 * @param {*} wxmlFile
 * @param {*} usingComponents
 */
function cacheImportComponentList (jsFile, wxmlFile, usingComponents) {
    if (!usingComponents) return

    let fileDir = ""
    if (jsFile || wxmlFile) {
        fileDir = path.dirname(jsFile || wxmlFile)
    } else {
        fileDir = global.miniprogramRoot
    }
    Object.keys(usingComponents).map(function (componentName) {
        var componentPath = usingComponents[componentName]

        if (componentPath.indexOf("plugin:") === 0) {
            console.log("这个是小程序插件" + componentPath)
            return
        }

        var componentFullPath = path.join(fileDir, componentPath)
        if (componentPath.indexOf("/") === 0) {
            componentFullPath = path.join(global.miniprogramRoot, componentPath)
        }

        global.importComponentList[componentName] = getFileKey(componentFullPath)
    })
}


module.exports = {
    getFileNameNoExt,
    getParentFolderName,
    relativePath,

    getFileKey,
    getAssetsNewPath,
     repairAssetPath,
    cacheImportComponentList
}
