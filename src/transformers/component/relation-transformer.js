/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:01:45
 * @LastEditTime: 2023-03-27 23:12:05
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/component/relation-transformer.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")

var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")

/**
 * 从路径'../segment-item/index'里获取组件目录名
 * @param {*} comPath
 * @returns
 */
function getComponentNameByRelationPath (comPath) {
    var list = comPath.split('/')
    list = list.filter(
        (item) => !item.includes('.') && item !== 'index'
    )
    return list.pop()
}

/**
 * 处理组件间关系（不完美解决！）
 * @param {*} $jsAst
 * @param {*} fileKey
 */
function transformRelation ($jsAst, fileKey) {

    // 1.relations节点处理，放进生命周期
    // 2.getRelationNodes处理、命名


    // const panelNodes = this.getRelationNodes('../tab-panel/tab-panel');

    // const e = this.getRelationNodes('../checkbox-group/index')[0];

    // //获取目录名
    // const e = this.getRelationNodes('checkbox-group')[0];


    // ****************

    // 以/分割

    // 去掉index
    // 去掉../
    // 去掉./
    // 去重
    // 找最后面的那个
    // ****************
    if ($jsAst) {
        var relationsNode = ggcUtils.getLifecycleNode($jsAst, "Component", "relations")
        var createdNode = ggcUtils.getLifecycleNode($jsAst, "Component", "created", true, "Function")

        var comPath = ""
        if (t.isObjectProperty(relationsNode) && relationsNode.value.properties.length) {
            relationsNode.value.properties.map(item => {
                comPath = item.key.value
                comPath = getComponentNameByRelationPath(comPath)
                var linkedNode = item.value.properties.find(obj => obj.key.name === "linked")

                // this.getRelationNodes('segment-item').map(e=>this.initTabs(e))

                if (linkedNode && linkedNode.params && linkedNode.params.length) {
                    var paramName = linkedNode.params[0].name
                    var code = $(linkedNode.body).generate()
                    code = code.replace(/^{|}$|\n/g, "").trim()
                    createdNode.value.body.body.unshift(`/** linked处理 */\nthis.getRelationNodes('${ comPath }').map(${ paramName }=>{${ code }})`)
                }

                //是否使用到relations和getRelationNodes函数
                global.hasComponentRelation = true
            })

            // created() {
            //     global.log(("created"))
            //     this.getRelationNodes('segment-item').map(e=>this.initTabs(e))
            // },

            //给根上添加unicomGroup:["segment"]
            $jsAst.replace("Component({$$$})", `Component({unicomGroup:["${ comPath }"], $$$})`)

            $jsAst.replace(
                `$_$1.getRelationNodes($_$2)`,
                (match, nodePath) => {
                    let comPath = match[2][0].value
                    global.log("getRelationNodes", comPath)
                    comPath = getComponentNameByRelationPath(comPath)
                    return `$_$1.getRelationNodes('${ comPath }')`
                }
            )
        }
    }


    // 添加

    // relations: {
    //     '../segment-item/index': {
    //         type: 'child',

    //         linked(e) {
    //             this.initTabs(e);
    //         }
    //     }
    // },
    // mounted(){
    //     this.initTabs();  //没有e！！！！！
    // },

    // Component({
    //     relations: {
    //       './custom-ul': {
    //         type: 'parent', // 关联的目标节点应为父节点   //这个没法弄
    //         linked: function(target) {  //这个放 mounted + $nextTick
    //           // 每次被插入到custom-ul时执行，target是custom-ul节点实例对象，触发在attached生命周期之后
    //         },
    //         linkChanged: function(target) {  //好像没地放，先放着
    //           // 每次被移动后执行，target是custom-ul节点实例对象，触发在moved生命周期之后
    //         },
    //         unlinked: function(target) {  //destroyed 后
    //           // 每次被移除时执行，target是custom-ul节点实例对象，触发在detached生命周期之后
    //         }
    //       }
    //     }
    //   })
}

module.exports = { transformRelation }
