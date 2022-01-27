/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:00:05
 * @LastEditTime: 2021-11-19 14:45:45
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\project\configHandle.js
 *
 */
const fs = require('fs-extra')
const path = require('path')

var appRoot = "../.."
const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')
const formatUtils = require(appRoot + '/src/utils/formatUtils.js')

const pinyin = require("node-pinyin")
const clone = require('clone')

/**
 * 将小程序subPackages节点处理为uni-app所需要的节点
 * @param {*} subPackages
 * @param {*} routerData
 * @returns
 */
function subPackagesHandle (subPackages, routerData) {
    let reuslt = []
    for (const key in subPackages) {
        const obj = subPackages[key]
        const root = obj.root
        const pages = obj.pages

        let newPages = []
        for (const subKey in pages) {
            const subObj = pages[subKey]

            let absKey = root + "/" + subObj
            let style = {}
            if (routerData[absKey]) {
                style = routerData[absKey]
            }
            delete style.usingComponents

            newPages.push({
                "path": subObj,
                "style": {
                    ...style
                }
            })
        }

        reuslt.push({
            "root": root,
            "pages": newPages
        })
    }
    return reuslt
}

/**
 * 处理全局组件，将它全部放进easycom里
 * @param {*} appJSON
 */
function transformGlobalUsingComponents (appJSON) {

    //app.json里面引用的全局组件
    let globalUsingComponents = appJSON.usingComponents || {}

    //判断是否加载了vant
    // global.hasVant = Object.keys(globalUsingComponents).some(key => {
    //     return utils.isVant(key);
    // }) || global.hasVant;

    //在app.json里面引用的组件通通移入到easycom里面加载
    //TODO: 过滤非支持的？小程序专有的，怎么条件编译？没法插入注释。，。，。，
    // var easycom = {}
    // for (const key in globalUsingComponents) {
    //     // if (global.hasVant && (utils.isVant(key) || utils.isVant(globalUsingComponents[key]))) {

    //     // } else {
    //     // //key可能含有后缀名，也可能是用-连接的，统统转成驼峰
    //     // let newKey = utils.toCamel2(key)
    //     // newKey = newKey.split(".vue").join("") //去掉后缀名
    //     // let filePath = globalUsingComponents[key]
    //     // let extname = path.extname(filePath)
    //     // if (extname) filePath = filePath.replace(extname, ".vue")
    //     // filePath = filePath.replace(/^\//, "./") //相对路径处理
    //     // easycom[key] = filePath
    //     // }
    //     let filePath = globalUsingComponents[key]
    //     //过滤小程序插件
    //     if (filePath.indexOf("plugin://") === -1) {
    //         easycom[key] = filePath
    //     }
    // }

    var componentList = []
    for (const key in globalUsingComponents) {
        let filePath = globalUsingComponents[key]

        //在前面加个@
        if (/^\//.test(filePath)) {
            filePath = '@' + filePath
        }

        let obj = {
            key,
            value: filePath
        }
        componentList.push(obj)
    }

    // 调整组件加载顺序，以方便Uniapp编译时候识别。否则，调试和编译App将出现：
    // Module not found: Error: Can't resolve 'wux-@/dist/public/search/index-bar' in '....\xxxxproject\pages\assemble'
    // "search": "@/dist/public/search/index",
    // "wux-search-bar": "@/dist/wux-weapp/search-bar/index",
    // 调整为：
    // "wux-search-bar": "@/dist/wux-weapp/search-bar/index",
    // "search": "@/dist/public/search/index",
    componentList.sort(function (a, b) {
        var res = a.key.indexOf(b.key)
        if (res > -1) {
            return -1
        }
        return 0
    })

    var easycom = {}
    componentList.map(function (obj) {
        easycom[obj.key] = obj.value
    })

    var componentNum = Object.keys(easycom).length
    if (componentNum) {
        appJSON["easycom"] = {
            "autoscan": true,
            "custom": { ...easycom }
        }
    }
}


/**
 * 生成page.json
 * @param {*} configData
 * @param {*} routerData
 * @param {*} miniprogramRoot
 * @param {*} targetSourceFolder
 * @param {*} appJSON
 */
function generatePageJSON (configData, routerData, miniprogramRoot, targetSourceFolder, appJSON) {

    //将pages节点里的数据，提取routerData对应的标题，写入到pages节点里
    let pages = []
    for (const key in appJSON.pages) {
        let pagePath = appJSON.pages[key] || ""
        pagePath = utils.normalizePath(pagePath)
        let data = routerData[pagePath]

        // let usingComponents = {};

        // if (data && JSON.stringify(data) != "{}") {
        // 	usingComponents = data.usingComponents;
        // }

        let obj
        let dataBak = {}
        if (data) {
            dataBak = clone(data)
            if (!global.hasVant) {
                delete dataBak.usingComponents
            }
        }
        obj = {
            "path": pagePath,
            "style": {
                ...dataBak
            }
        }
        pages.push(obj)
    }
    appJSON.pages = pages

    transformGlobalUsingComponents(appJSON)

    //替换window节点为globalStyle
    appJSON["globalStyle"] = clone(appJSON["window"] || {})
    delete appJSON["window"]

    //判断是否引用了vant
    if (global.hasVant) {
        // let usingComponentsVant = {};
        // for (const key in appJSON["usingComponents"]) {
        // 	if (utils.vantComponentList[key]) {
        // 		usingComponentsVant[key] = utils.vantComponentList[key];
        // 	}
        // }

        appJSON["globalStyle"]["usingComponents"] = utils.vantComponentList
    }

    //sitemap.json似乎在uniapp用不上，删除！
    // delete appJSON["sitemapLocation"];

    //处理分包加载subPackages
    let subPackages = appJSON["subPackages"] || appJSON["subpackages"]
    appJSON["subPackages"] = subPackagesHandle(subPackages, routerData)
    delete appJSON["subpackages"]


    // TODO:
    // 在分包内引入插件代码包
    // 如果插件只在一个分包内用到，可以将插件仅放在这个分包内，例如：

    // {
    //   "subpackages": [
    //     {
    //       "root": "packageA",
    //       "pages": [
    //         "pages/cat",
    //         "pages/dog"
    //       ],
    //       "plugins": {
    //         "myPlugin": {
    //           "version": "1.0.0",
    //           "provider": "wxidxxxxxxxxxxxxxxxx"
    //         }
    //       }
    //     }
    //   ]
    // }

    //usingComponents节点，上面删除缓存，这里删除
    delete appJSON["usingComponents"]

    //workers处理，简单处理一下
    if (appJSON["workers"]) appJSON["workers"] = "static/" + appJSON["workers"]

    //tabBar节点
    //将iconPath引用的图标路径进行修复
    let tabBar = appJSON["tabBar"]
    if (tabBar && tabBar.list && tabBar.list.length) {
        for (const key in tabBar.list) {
            let item = tabBar.list[key]

            var iconPath = item.iconPath
            var selectedIconPath = item.selectedIconPath

            if (!iconPath || !selectedIconPath) continue

            if (global.isTransformAssetsPath) {
                item.iconPath = pathUtils.getAssetsNewPath(iconPath)
                item.selectedIconPath = pathUtils.getAssetsNewPath(selectedIconPath)
            } else {
                //没毛用，先放这里。uniapp发布的时候居然不复制根目录下面的文件了。。。
                if (iconPath.indexOf("static/") === -1 || selectedIconPath.indexOf("static/") === -1) {
                    //如果这两个路径都没有在static目录下，那就复制文件到static目录，并转换路径
                    let iconAbsPath = path.join(global.miniprogramRoot, iconPath)
                    let selectedIconAbsPath = path.join(global.miniprogramRoot, selectedIconPath)
                    //
                    let targetIconAbsPath = path.join(global.targetSourceFolder, "static", iconPath)
                    let targetSelectedIconAbsPath = path.join(global.targetSourceFolder, "static", selectedIconPath)
                    //
                    if (!fs.existsSync(targetIconAbsPath)) fs.copySync(iconAbsPath, targetIconAbsPath)
                    if (!fs.existsSync(targetSelectedIconAbsPath)) fs.copySync(selectedIconAbsPath, targetSelectedIconAbsPath)
                    //
                    iconPath = path.relative(global.targetSourceFolder, targetIconAbsPath)
                    selectedIconPath = path.relative(global.targetSourceFolder, targetSelectedIconAbsPath)

                    // xx\\xx.png --> xx/xx.png
                    item.iconPath = utils.normalizePath(iconPath)
                    item.selectedIconPath = utils.normalizePath(selectedIconPath)
                }
            }
        }
    }

    //写入pages.json
    let file_pages = path.join(targetSourceFolder, "pages.json")
    fs.writeFileSync(file_pages, JSON.stringify(appJSON, null, '\t'))
    console.log(`write ${ path.relative(global.targetSourceFolder, file_pages) } success!`)

}

/**
 * 生成manifest.json
 * @param {*} configData
 * @param {*} routerData
 * @param {*} miniprogramRoot
 * @param {*} targetSourceFolder
 * @param {*} appJSON
 */
function generateManifest (configData, routerData, miniprogramRoot, targetSourceFolder, appJSON) {
    //注：因json里不能含有注释，因些template/manifest.json文件里的注释已经被删除。
    let file_manifest = path.join(__dirname, "/template/mani_fest.json")
    let manifestJson = {}
    try {
        manifestJson = fs.readJsonSync(file_manifest)
    } catch (error) {
        console.log("[Error]工具已经被损坏，请重新安装", error)
        return
    }
    //
    let name = pinyin(configData.name, {
        style: "normal"
    }).join("")
    manifestJson.name = name
    manifestJson.description = configData.description
    manifestJson.versionName = configData.version || "1.0.0"
    //

    if (appJSON["networkTimeout"]) {
        var networkTimeout = appJSON["networkTimeout"]
        if (utils.isNumber(networkTimeout)) {
            networkTimeout = {
                "request": networkTimeout,
                "connectSocket": networkTimeout,
                "uploadFile": networkTimeout,
                "downloadFile": networkTimeout,
            }
        }
        manifestJson["networkTimeout"] = networkTimeout
    }

    let mpWeixin = manifestJson["mp-weixin"]
    mpWeixin.appid = configData.appid
    if (appJSON["plugins"]) {
        mpWeixin["plugins"] = appJSON["plugins"]
    }
    if (configData["cloudfunctionRoot"]) {
        mpWeixin["cloudfunctionRoot"] = configData["cloudfunctionRoot"]
    }
    if (configData["setting"] || appJSON["setting"]) {
        mpWeixin["setting"] = appJSON["setting"] || configData["setting"]
    }
    if (configData["plugins"] || appJSON["plugins"]) {
        mpWeixin["plugins"] = appJSON["plugins"] || configData["plugins"]
    }
    if (configData["functionalPages"] || appJSON["functionalPages"]) {
        mpWeixin["functionalPages"] = appJSON["functionalPages"] || configData["functionalPages"]
    }
    if (appJSON["globalStyle"] && appJSON["globalStyle"].resizable) {
        mpWeixin["resizable"] = appJSON["globalStyle"].resizable
    }
    if (appJSON["navigateToMiniProgramAppIdList"]) {
        mpWeixin["navigateToMiniProgramAppIdList"] = appJSON["navigateToMiniProgramAppIdList"] || configData["navigateToMiniProgramAppIdList"]
    }

    if (appJSON["requiredBackgroundModes"]) {
        mpWeixin["requiredBackgroundModes"] = appJSON["requiredBackgroundModes"] || configData["requiredBackgroundModes"]
    }

    if (appJSON["permission"]) {
        mpWeixin["permission"] = appJSON["permission"] || configData["permission"]
    }

    //manifest.json
    file_manifest = path.join(targetSourceFolder, "manifest.json")
    fs.writeFileSync(file_manifest, JSON.stringify(manifestJson, null, '\t'))
    console.log(`write ${ path.relative(global.targetSourceFolder, file_manifest) } success!`)

}

/**
 * 生成main.js
 * @param {*} configData
 * @param {*} routerData
 * @param {*} miniprogramRoot
 * @param {*} targetSourceFolder
 * @param {*} appJSON
 */
function generateMainJS (configData, routerData, miniprogramRoot, targetSourceFolder, appJSON) {
    let mainContent = "import App from './App'\r\n\r\n"

    //polyfill folder
    const sourcePolyfill = path.join(__dirname, '/template/polyfill')
    const targetPolyfill = path.join(targetSourceFolder, 'polyfill')
    fs.copySync(sourcePolyfill, targetPolyfill)

    //引入polyfill，用户自行决定是否需要polyfill
    var polyfill = `// Api函数polyfill（目前为实验版本，如不需要，可删除！）';
        import Polyfill from './polyfill/polyfill';
        Polyfill.init();`

    //全局mixins
    var mixins = `// 全局mixins，用于实现setData等功能，请勿删除！';
        import Mixin from './polyfill/mixins';`


    var vue2 = `// #ifndef VUE3
        import Vue from 'vue'

        Vue.mixin(Mixin);
        Vue.config.productionTip = false
        App.mpType = 'app'
        const app = new Vue({
            ...App
        })
        app.$mount()
        // #endif\r\n\r\n\r\n\r\n`


    var vue3 = `// #ifdef VUE3
        import { createSSRApp } from 'vue'
        export function createApp() {
            const app = createSSRApp(App)
            app.mixin(Mixin)
            return {
                app
            }
        }
        // #endif`

    mainContent += `${ polyfill }\r\n\r\n`
    mainContent += `${ mixins }\r\n\r\n`
    mainContent += vue2
    mainContent += vue3

    mainContent = formatUtils.formatCode(mainContent, "js", "main.js")

    //
    let file_main = path.join(targetSourceFolder, "main.js")
    fs.writeFileSync(file_main, mainContent)
    console.log(`write ${ path.relative(global.targetSourceFolder, file_main) } success!`)
}

/**
 * 解析app.json
 * @param {*} miniprogramRoot
 * @returns
 */
function parseAppJSON (miniprogramRoot) {
    //app.json文件路径
    let json_app = path.join(miniprogramRoot, "app.json")
    let appJSON = {
        "pages": {},
        "tabBar": {},
        "globalStyle": {},
        "usingComponents": {},
    }
    if (fs.existsSync(json_app)) {
        try {
            appJSON = fs.readJsonSync(json_app)
        } catch (error) {
            console.log("解析app.json报错", error)
        }
    } else {
        let str = "[Error] 找不到app.json文件(不影响转换)"
        // console.log(str)
        // global.log.push("\r\n" + str + "\r\n")
        // console.log(str)
    }
    return appJSON
}

/**
 * 处理配置文件
 * 生成配置文件: pages.json、manifest.json、main.js
 * @param {*} configData        小程序配置数据
 * @param {*} routerData        所有的路由页面数据
 * @param {*} miniprogramRoot   小程序主体所在目录
 * @param {*} targetSourceFolder      最终要生成的目录
 */
async function configHandle (configData, routerData, miniprogramRoot, targetSourceFolder) {
    await new Promise((resolve, reject) => {

        var appJSON = parseAppJSON(miniprogramRoot)

        //下面几个按page、manifest、main这个顺序！
        generatePageJSON(configData, routerData, miniprogramRoot, targetSourceFolder, appJSON)
        generateManifest(configData, routerData, miniprogramRoot, targetSourceFolder, appJSON)
        generateMainJS(configData, routerData, miniprogramRoot, targetSourceFolder, appJSON)

        //增加uni.scss
        let source_uniScss = path.join(__dirname, "/template/uni.scss")
        var target_uniScss = path.join(targetSourceFolder, "uni.scss")
        fs.copySync(source_uniScss, target_uniScss)

        //复制uni_modules
        let source_uniModules = path.join(__dirname, "/template/uni_modules")
        var target_uniModules = path.join(targetSourceFolder, "uni_modules")
        fs.copySync(source_uniModules, target_uniModules)

        resolve()
    })
}

module.exports = { configHandle, parseAppJSON }
