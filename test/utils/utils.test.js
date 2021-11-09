
const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")

var appRoot = "../.."
const utils = require(appRoot + '/src/utils/utils')


test('setDataByPathList 1 ', () => {
    var ast = $(code)
    var dataPath = ast.find('var data = $_$')
    var init = dataPath.attr("declarations.0.init")

    var list = ["user", "aa", "bb"]
    setDataByPathList(init, list, "Array")

    var target = `var data = {
        user: {
            name: "baby",
            aa: {
                bb: []
            }
        },
        list: [{
            name: "beijing",
            address: "北京xxx"
        }]
    };`

    var sourceCode = $(ast).generate({ isPretty: true })
    var targetCode = $(target).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})

