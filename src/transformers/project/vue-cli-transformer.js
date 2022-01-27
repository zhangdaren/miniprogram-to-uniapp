/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:59:08
 * @LastEditTime: 2021-12-07 14:20:45
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\project\vue-cli-transformer.js
 *
 */
const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')
const pinyin = require("node-pinyin")

var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")

/**
 * 处理vue-cli项目配置文件
 * @param {*} configData           小程序配置数据
 * @param {*} outputFolder         输出目录
 */
async function transformVueCLI (configData, outputFolder) {
    try {
        await new Promise((resolve, reject) => {
            const pathArray = [
                {
                    source: "./vue-cli/public/index.html",
                    target: "public/index.html"
                },
                {
                    source: "./vue-cli/.gitignore",
                    target: ".gitignore"
                },
                {
                    source: "./vue-cli/babel.config.js",
                    target: "babel.config.js"
                },
                {
                    source: "./vue-cli/package.json",
                    target: "package.json",
                    replaceArray: [
                        "<%= PROJECT_NAME %>"
                    ],
                },
                {
                    source: "./vue-cli/postcss.config.js",
                    target: "postcss.config.js"
                },
                {
                    source: "./vue-cli/README.md",
                    target: "README.md",
                    replaceArray: [
                        "<%= PROJECT_NAME %>"
                    ],
                },
                {
                    source: "./vue-cli/tsconfig.json",
                    target: "tsconfig.json",
                },
            ]

            for (const key in pathArray) {
                const obj = pathArray[key]
                const source = obj.source
                const target = obj.target
                const replaceArray = obj.replaceArray
                const file_source = path.join(__dirname, source)
                const file_target = path.join(outputFolder, target)
                if (replaceArray) {
                    let fileContent = fs.readFileSync(file_source, 'utf-8')
                    for (const key2 in replaceArray) {
                        const flag = replaceArray[key2]
                        // console.log(flag);
                        switch (flag) {
                            case "<%= PROJECT_NAME %>":
                                //package.json里的name字段，有时会有中文，将导致npm i时报错，这里转换为拼音
                                let name = pinyin(configData.name, { style: "normal" }).join("")
                                fileContent = fileContent.replace(flag, name)
                                break
                            default:
                                break
                        }
                    }

                    fs.writeFileSync(file_target, fileContent)
                    console.log(`write ${ target } success!`)
                } else {
                    fs.copySync(file_source, file_target)
                    console.log(`copy ${ target } success!`)
                }
            }

            //////////////////////////////////////////////////////////////////////
            resolve()
        })
    } catch (err) {
        console.log(err)
    }
}

module.exports = { transformVueCLI }
