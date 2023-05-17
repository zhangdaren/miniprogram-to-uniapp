/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:01:45
 * @LastEditTime: 2023-05-12 22:20:02
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/component/generics-transformer.js
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

// 抽象节点
// https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/generics.html

/**
 * 转换组件的路径为相对于根目录的绝对路径
 * "./ttt/index" --> "/linui/water-flow/ttt/index"
 * "/linui/water-flow/ttt/index" --> "/linui/water-flow/ttt/index"
 *
 * @param {*} componentPath  组件的相对路径
 * @param {*} jsFile  当前引用这个组件的页面的js文件全路径
 * @returns
 */
function transformComponentPathToAbsolute (componentPath, jsFile) {
    var genericTargetPath = componentPath
    var newSrc = ""
    if (genericTargetPath.startsWith("/")) {
        //如果已经是绝对路径，那么不用做什么了
        newSrc = genericTargetPath
    } else {
        //为方便替换，将组件引用路径，转换为相对于根目录的绝对路径
        let fileDir = path.dirname(jsFile)
        //解析为绝对路径
        genericTargetPath = path.resolve(fileDir, genericTargetPath)
        //转换为相对路径
        var newSrc = path.relative(global.miniprogramRoot, genericTargetPath)
        newSrc = utils.normalizePath(newSrc)
        if (!newSrc.startsWith("/")) {
            newSrc = "/" + newSrc
        }
    }
    return newSrc
}


/**
 * 将标签上面的"generic:"去掉，并将信息存入到global.genericList
 * @param {*} $wxmlAst
 * @param {*} usingComponents
 * @param {*} jsFile
 * @param {*} fileKey
 * @returns
 */
function transformGenericsTag ($wxmlAst, usingComponents, jsFile, fileKey) {
    if (!$wxmlAst) return

    $wxmlAst
        .find(`<$_$1 $$$1>$$$2</$_$1>`)
        .each(node => {
            var tagName = node.attr('content.name')
            var attributes = node.attr('content.attributes')
            if (attributes) {
                attributes.map(function (attr) {
                    var key = attr.key.content
                    if (key.startsWith("generic:")) {
                        var newKey = key.replace(/^generic:/, "")
                        attr.key.content = newKey
                        //
                        var value = attr.value && attr.value.content || ""

                        //命名规则如下：
                        // <selectable-group   generic:selectable="custom-checkbox" />
                        // genericComponentName     genericName   genericTargetName

                        var newSrc = transformComponentPathToAbsolute(usingComponents[value], jsFile)

                        global.genericList.push({
                            genericName: newKey,
                            genericComponentName: tagName,
                            genericComponentPath: usingComponents[tagName],
                            genericTargetName: value,
                            genericTargetPath: newSrc
                        })
                    }
                })
            }
        })

    return $wxmlAst
}

/**
 * 处理抽象节点
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 * @param {*} genericsComponentList
 * @param {*} fileKey
 * @returns
 */
function transformGenericsComponent ($jsAst, $wxmlAst, genericsComponentList, usingComponents, fileKey) {
    if (!genericsComponentList.length) return

    //添加props
    if ($jsAst) {
        var propList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.PROPS, fileKey)
        genericsComponentList.map(item => {
            //有path是默认节点，不用添加prop了
            if (!item.path) {
                var name = utils.toCamel(item.name)
                let op = t.objectProperty(t.identifier(name), t.identifier("String"))
                propList.push(op)
            }
        })
    }

    //对标签进行调整，加v-if，并注释原组件
    if ($wxmlAst) {
        var genericTargetList = []
        genericsComponentList.map(item => {
            var list = global.genericList.filter(obj => obj.genericName === item.name)
            if (!list.length && item.path) {
                list.push({
                    genericComponentName: '',
                    genericComponentPath: '',
                    genericName: item.name,
                    genericTargetName: item.name,
                    genericTargetPath: item.path,
                })
            }
            genericTargetList.push(...list)
        })
        // global.log("genericTargetList", genericTargetList)

        //数据结构
        // {
        //     genericComponentName:'l-water-flow',  // <component generic:name></component>所在的组件名
        //     genericComponentPath:'/linui/water-flow/index', // <component generic:name></component>所在的组件路径
        //     genericName:'l-water-flow-item', //<component generic:name></component>  里面的name
        //     genericTargetName:'product',  // 需要加载进来的组件
        //     genericTargetPath:'/pages/article/product/index' // 需要加载进来的组件路径
        // }

        // 1.找到节点，并根据可能要用来替换的组件，进行显式判断
        //<l-water-flow generic:l-water-flow-item="product" column-gap="30rpx" />
        var genericMap = {}
        genericTargetList.map(obj => {
            var item = genericMap[obj.genericName]
            if (!item) {
                item = genericMap[obj.genericName] = []
            }
            item.push(obj)
        })
        Object.keys(genericMap).map(genericName => {
            var list = genericMap[genericName]
            //是否替换，genericComponentName如果没空，则不用替换
            //TODO: 应该没有这么奇葩，两种情况都存在吧？ 那就需要用some，暂时不考虑。
            var isReplace = list.every(item => item.genericComponentName)
            if (isReplace) {
                list.map(obj => {
                    $wxmlAst.find(`<${ genericName }>$$$</${ genericName }>`).each(item => {
                        var newAst = getCloneAst(item, obj)
                        item.before(newAst)
                    })
                })
                // 注释节点
                $wxmlAst.replace(`<${ genericName } $$$1>$$$2</${ genericName }>`, `<!-- <${ genericName } $$$1>$$$2</${ genericName }> -->`)
            }
        })

        // 2.增加组件导入，路径需转换为绝对引入
        genericTargetList.map(obj => usingComponents[obj.genericTargetName] = obj.genericTargetPath)
    }
}

/**
 * 根据item及参数获取对应的克隆的ast
 * @param {*} item
 * @param {*} data
 * @returns
 */
function getCloneAst (item, data) {
    var tagName = data.genericTargetName
    var newAst = $(`<${ tagName }></${ tagName }>`, { isProgram: false, parseOptions: { language: 'html' } })
    var attributes = clone(item.attr('content.attributes'))
    var children = clone(item.attr('content.children'))
    if (attributes) {
        var propName = utils.toCamel(data.genericName)
        var vIfNode = attributes.find(attr => attr.key.content === "v-if")
        if (vIfNode) {
            // 合并v-if
            vIfNode.value.content = `(${ vIfNode.value.content }) && ${ propName }==='${ data.genericTargetName }'`
        } else {
            attributes.unshift({
                key: {
                    content: "v-if"
                },
                value: {
                    content: `${ propName }==='${ data.genericTargetName }'`
                },
                startWrapper: {
                    type: 'token:attribute-value-wrapper-start', content: '"',
                },
                endWrapper: {
                    type: 'token:attribute-value-wrapper-end', content: '"'
                }
            })
        }
        newAst.attr('content.attributes', attributes)
    }
    if (children) {
        newAst.attr('content.children', children)
    }
    return newAst
}

module.exports = {
    transformGenericsTag,
    transformGenericsComponent,
    transformComponentPathToAbsolute,
}
