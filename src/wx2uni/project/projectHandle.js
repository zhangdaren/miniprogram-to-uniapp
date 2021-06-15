const fs = require('fs-extra')
const path = require('path')

const t = require('@babel/types')

const utils = require('../../utils/utils.js')
const pathUtil = require('../../utils/pathUtil.js')
const babelUtil = require('../../utils/babelUtil.js')

const includeTagHandle = require('./includeTagHandle')
const templateTagHandle = require('./templateTagHandle')
const attribHandle = require('./attribHandle')

/**
 * 保存所有未保存的文件
 */
async function saveAllFile () {
    let pagesData = global.pagesData

    //判断类型，然后操作一把 app main 对调处理一下
    if (global.isCompiledProject) {
        let app = pagesData["app"]
        let main = pagesData["common/main"]
        if (app && main) {
            app.data.js = main.data.js
        }
    }

    for (const key in pagesData) {
        const item = pagesData[key]
        let data = item.data
        let fileContent = ""
        let targetFilePath = data.path
        let msg = ""

        let jsContent = ""
        switch (data.type) {
            case "all":
                jsContent = await babelUtil.jsAstToString(data.jsData)
                fileContent = data.wxml + (jsContent || data.js) + data.css
                msg = `Convert ${ path.relative(global.targetFolder, targetFilePath) } success!`
                global.stats.vueFileNum++
                break
            case "js":
                jsContent = await babelUtil.jsAstToString(data.jsData)
                fileContent = jsContent || data.js
                msg = `Convert component ${ path.relative(global.targetFolder, targetFilePath) } success!`
                break
            case "wxml":
                fileContent = (data.wxml || data.minWxml) + (jsContent || data.js)
                msg = `Convert component ${ path.relative(global.targetFolder, targetFilePath) }.wxml success!`
                break
            case "css":
                fileContent = data.css
                msg = `Convert ${ path.relative(global.targetFolder, targetFilePath) }.wxss success!`
                break
        }
        utils.log(msg)
        global.log.push(msg)
        //
        if (!fileContent) {
            // the data argument must be of type string or an instance of buffer typeArray or dataView receive type Number(NaN)
            global.log.push("[Error] targetFilePath: " + targetFilePath + " 内容为空！！！ ")
            //可能会有某种情况（暂未复现是何种情况出现），会报错
            //因此当文件内容为空时，给它一个空格(有时文件为空，但引用还在，所以不能直接删除)
            //有种情况：一组页面，只有js文件时，会报错，但没复现
            fileContent = " "
        }

        //写入文件
        fs.writeFileSync(targetFilePath, fileContent)
    }
}


/**
 * 解析小程序项目的配置
 * @param {*} folder        小程序主体所在目录
 * @param {*} sourceFolder  输入目录
 */
function getProjectConfig (folder, sourceFolder) {
    let file_projectConfigJson = path.join(folder, 'project.config.json')
    let projectConfig = {
        name: '',
        version: '',
        description: '',
        appid: '',
        projectname: '',
        miniprogramRoot: '',
        cloudfunctionRoot: '',
        compileType: '',
        author: ''
    }

    if (fs.existsSync(file_projectConfigJson)) {
        let data = {}
        try {
            data = fs.readJsonSync(file_projectConfigJson)
        } catch (error) {
            utils.log(`[Error] 解析project.config.json报错：` + error)
        }

        // if (data.cloudfunctionRoot) {
        //     //有云函数的
        //     projectConfig.cloudfunctionRoot = path.resolve(
        //         sourceFolder,
        //         data.cloudfunctionRoot
        //     )
        // }

        projectConfig.cloudfunctionRoot = data.cloudfunctionRoot || ""

        if (data.miniprogramRoot) {
            projectConfig.miniprogramRoot = path.resolve(
                sourceFolder,
                data.miniprogramRoot
            )
        } else {
            projectConfig.miniprogramRoot = folder
        }

        projectConfig.appid = data.appid || data.qqappid || ''
        projectConfig.compileType = data.compileType || ''
        projectConfig.name = decodeURIComponent(data.projectname || '')
    } else {
        projectConfig.miniprogramRoot = sourceFolder
        utils.log(`Warning： 找不到project.config.json文件(不影响转换，无视这条)`);
        // global.log.push("\r\nWarning： 找不到project.config.json文件(不影响转换，无视这条)\r\n")
        // throw (`error： 这个目录${sourceFolder}应该不是小程序的目录，找不到project.config.json文件`)
    }

    //读取package.json
    let file_package = path.join(folder, 'package.json')
    if (fs.existsSync(file_package)) {
        let packageJson = null
        try {
            packageJson = fs.readJsonSync(file_package)
        } catch (error) {
            utils.log(`Error： 解析package.json报错：` + error)
        }
        //
        if (packageJson) {
            projectConfig.name = packageJson.name || ''
            projectConfig.version = packageJson.version || ''
            projectConfig.description = packageJson.description || ''
            //author用不到，先留着
            projectConfig.author = packageJson.author || ''
            projectConfig.dependencies = packageJson.dependencies || {} //安装的npm包

            //判断是否加载了vant
            // global.hasVant = Object.keys(projectConfig.dependencies).some(key => {
            //     return utils.isVant(key);
            // }) || global.hasVant;
        }
    } else {
        utils.log(`Warning： 找不到package.json文件(不影响转换，无视这条)`);
        // global.log.push("\r\nWarning： 找不到package.json文件(不影响转换，无视这条)\r\n")
    }
    return projectConfig
}

/**
 * template 标签属性里面的未声明变量和方法处理
 */
function attribValueHandle () {
    // global.pagesData[fileKey]['data']['attribs']
    let pagesData = global.pagesData

    for (const fileKey in pagesData) {
        const item = pagesData[fileKey]
        var jsData = item.data.jsData  //居然有为null的情况。。。。

        if (jsData && item.data.type === "all" || item.data.type === "js") {
            let attribs = item.data.attribs
            if (attribs) {
                //倒序一下，因为加进来的时候是倒序循环
                attribs.reverse()

                //将setData的key添加进来，并且优先级是比较低的
                var jsSetDataKeyList = item.data.jsSetDataKeyList
                if (jsSetDataKeyList) {
                    attribs.push(...jsSetDataKeyList)
                }

                //去重
                attribs = utils.unique(attribs, "exp")

                attribs.forEach(obj => {
                    attribHandle(obj, jsData, fileKey)
                })
            }

            //未定义函数处理
            let attribFunList = item.data.attribFunList
            notImplementedFunHandle(attribFunList, jsData, fileKey)
        }
    }
}

/**
 * 未定义函数处理
 * @param {*} attribFunList
 * @param {*} jsData
 * @param {*} fileKey
 */
function notImplementedFunHandle (attribFunList, jsData, fileKey) {
    if (attribFunList) {
        const reg = /(\w+).*/
        let methodsAstList = jsData.methodsAstList
        let dataAstList = jsData.dataAstList

        //去重
        attribFunList = utils.unique(attribFunList, "value")

        var funNameList = []
        var dataValueNameList = []
        if (methodsAstList) {
            methodsAstList.forEach(function (item) {
                const keyName = babelUtil.getKeyNameByObject(item)
                funNameList.push(keyName)
            })
        }
        if (dataAstList) {
            dataAstList.forEach(function (item) {
                const keyName = babelUtil.getKeyNameByObject(item)
                dataValueNameList.push(keyName)
            })
        }

        attribFunList.forEach(function (obj) {
            let funName = obj.value
            if (funName.indexOf("?") > -1) {
                //TODO: 未来可能会将内容放函数里并直接创建一个函数
                let logStr = `[Error] 检测到${ obj.key }绑定的函数 ${ funName } 是代码块，在Uniapp里不支持，请转换后手动调整为具名函数形式   file-> ` + fileKey
                utils.log(logStr)
                global.log.push(logStr)
            } else if (utils.isJavascriptKeyWord(funName)) {
                let logStr = `[Error] 检测到${ obj.key }绑定的函数 ${ funName } 是Javascript关键字，不能作为函数名，请转换后手动重命名！   file-> ` + fileKey
                utils.log(logStr)
                global.log.push(logStr)
            } else {
                //只取第一个单词！
                funName = funName.replace(reg, "$1")
                if(!funName) return ;

                if (funNameList.indexOf(funName) > -1 || dataValueNameList.indexOf(funName) > -1) {
                    // 函数或变量存在(如果函数重名，那已经处理了，因此这里不用再处理)
                    // console.log("函数存在 -- ", funName)
                } else {
                    //构建空函数
                    // xxxx() {
                    //     console.log("xxx函数不存在，创建空函数代替");
                    // },
                    var meExp = t.memberExpression(t.identifier("console"), t.identifier("log"))
                    var tip = "占位：函数 " + funName + " 未声明"
                    var callExp = t.callExpression(meExp, [t.stringLiteral(tip)])
                    var expStatement = t.expressionStatement(callExp)
                    var blockStatement = t.blockStatement([expStatement])
                    var objectMethod = t.objectMethod("method", t.identifier(funName), [], blockStatement)
                    if (methodsAstList) {
                        methodsAstList.push(objectMethod)

                        let logStr = `[Tip] 检测到${ obj.key }绑定的函数 ${ funName } 不存在，已添加空函数占位   file-> ` + fileKey
                        utils.log(logStr)
                        global.log.push(logStr)

                        //TODO: 这里没有直接修改template，因为最终合成的时候还是用的str，后期再弄
                        // obj.node.attribs[obj.key] = "abc"
                    } else {
                        //可能是template文件
                        // console.log("error methodsAstList --", fileKey)
                    }
                }
            }
        })
    }
}


/**
 * 项目处理
 */
async function projectHandle () {
    await attribValueHandle()

    includeTagHandle()
    templateTagHandle()
    // attribValueHandle()
    saveAllFile()
}

module.exports = {
    projectHandle,
    getProjectConfig,
}
