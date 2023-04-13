/*
 * @Author: zhang peng
 * @Date: 2022-12-03 11:21:27
 * @LastEditTime: 2022-12-03 11:27:37
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/typescript/typescript-transfromer.js
 *
 */
const t = require("@babel/types")

var appRoot = "../../.."
const ggcUtils = require(appRoot + "/src/utils/ggcUtils")

/**
 * ts处理
 * 看看函数参数，如果没有声明类型，则给它加上any类型
 * @param {*} $jsAst
 * @param {*} fileKey
 * @returns
 */
function transformTypescript ($jsAst, fileKey) {
    $jsAst
        .find([
            {
                type: 'ObjectMethod',
            },
            {
                type: 'FunctionExpression',
            },
        ])
        .each((item) => {
            item.node.params.map((node) => {
                var idNode = null
                if (node.type === 'AssignmentPattern') {
                    idNode = node.left
                } else if (node.type === 'Identifier') {
                    idNode = node
                }
                if (idNode && !idNode.typeAnnotation) {
                    idNode.typeAnnotation = {
                        type: 'TSTypeAnnotation',
                        typeAnnotation: {
                            type: 'TSAnyKeyword',
                        },
                    }
                }
            })
        }).root()
}

module.exports = { transformTypescript }
