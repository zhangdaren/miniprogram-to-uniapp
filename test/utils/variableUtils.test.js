
const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")

const { setDataByPathList, getExpressionVariableList } = require('../../src/utils/variableUtils')

var code = `var data = {
    user:{
      name:"baby"
    },
    list:[
      {
        name:"beijing",
        address:"北京xxx"
      }
    ]
  }`

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


test('setDataByPathList 2 ', () => {
    var ast = $(code)
    var dataPath = ast.find('var data = $_$')
    var init = dataPath.attr("declarations.0.init")

    var list = ["user1", "aa", "bb"]
    setDataByPathList(init, list, "Array")

    var target = `var data = {
        user: {
            name: "baby"
        },
        list: [{
            name: "beijing",
            address: "北京xxx"
        }],
        user1: {
            aa: {
                    bb: []
                }
            }
    };`

    var sourceCode = $(ast).generate({ isPretty: true })
    var targetCode = $(target).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})

test('setDataByPathList 3 ', () => {
    var ast = $(code)
    var dataPath = ast.find('var data = $_$')
    var init = dataPath.attr("declarations.0.init")

    var list = ["user1[0]", "aa", "bb"]
    setDataByPathList(init, list, "Array")

    var target = `var data = {
        user: {
            name: "baby"
        },
        list: [{
            name: "beijing",
            address: "北京xxx"
        }],
        user1: [{
            aa: {
                    bb: []
                }
            }]
    };`

    var sourceCode = $(ast).generate({ isPretty: true })
    var targetCode = $(target).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})



test('setDataByPathList 4 ', () => {
    var ast = $(code)
    var dataPath = ast.find('var data = $_$')
    var init = dataPath.attr("declarations.0.init")

    var list = ["user1[0]", "aa[0]", "bb"]
    setDataByPathList(init, list, "Array")

    var target = `var data = {
        user: {
            name: "baby"
        },
        list: [{
            name: "beijing",
            address: "北京xxx"
        }],
        user1: [{
            aa: [{
                    bb: []
                }]
            }]
    };`

    var sourceCode = $(ast).generate({ isPretty: true })
    var targetCode = $(target).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})


test('setDataByPathList 5 ', () => {
    var ast = $(code)
    var dataPath = ast.find('var data = $_$')
    var init = dataPath.attr("declarations.0.init")

    var list = ["user1[0]", "aa[0]", "bb[0]"]
    setDataByPathList(init, list, "Array")

    var target = `var data = {
        user: {
            name: "baby"
        },
        list: [{
            name: "beijing",
            address: "北京xxx"
        }],
        user1: [{
            aa: [{
                    bb: []
                }]
            }]
    };`

    var sourceCode = $(ast).generate({ isPretty: true })
    var targetCode = $(target).generate({ isPretty: true })

    expect(sourceCode).toBe(targetCode)
})




/////////////////////////////////////getExpressionVariableList//////////////////////////////////////

test('getExpressionVariableList 1 ', () => {
    var obj = { attr: "", value: ` extClass + ' ' +( outerClass || 5)` }

    var list = getExpressionVariableList(obj.attr, obj.value)

    var sourceCode = JSON.stringify(list)
    var targetCode = '$(target).generate({ isPretty: true })'

    expect(sourceCode).toBe(targetCode)
})

