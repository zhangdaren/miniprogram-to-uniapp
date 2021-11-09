/*
 * @Author: zhang peng
 * @Date: 2021-08-16 11:44:02
 * @LastEditTime: 2021-10-30 16:47:35
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/function/triggerEvent-transformer.js
 *
 */


const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")


var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")

/**
 * triggerEvent 转换
 * @param {*} $ast
 */
function transformTriggerEvent ($ast) {
    if(!$ast) return;


    // this.triggerEvent(
    //     'updataSelect',
    //     selectIndex
    //   )
    //转换为：
    //   this.$emit(
    //     'updataSelect',
    //     {
    //       detail: selectIndex,
    //     }
    //   )

    $ast
        .find({
            type: 'CallExpression',
            callee: {
                property: {
                    name: 'triggerEvent',
                },
            },
        })
        .each(function (item) {
            //triggerEvent --> $emit
            item.attr('callee.property.name', '$emit')
            var args = item.node.arguments
            if (args && args.length > 1) {
                //给第二个参数，再包一层detail节点，这里小程序与uniapp有所不同
                item.attr('arguments.1', {
                    type: 'ObjectExpression',
                    properties: [
                        { type: 'ObjectProperty', key: 'detail', value: args[1] },
                    ],
                })
            }
        })
        .root()
}

module.exports = { transformTriggerEvent }
