
// const $ = require('gogocode')
// const path = require('path')
// const fs = require('fs-extra')
//
// const t = require("@babel/types")

var appRoot = "../.."
const { setDataHandle,
    splitSequenceExpression } = require(appRoot + '/src/utils/restoreJSUtils')

const { ggcTest } = require('../ggcTest.js')



//////////////////////////////////////////////////// splitSequenceExpression ////////////////////////////////////////////////////

test('splitSequenceExpression 1 ', () => {

    var source = `a = 5, this.fun1(), this.fun2();`
    var target = `a = 5;
    this.fun1();
    this.fun2();`

    var { sourceCode, targetCode } = ggcTest(source, target, splitSequenceExpression, false)

    expect(sourceCode).toBe(targetCode)
})

test('splitSequenceExpression 2 ', () => {
    var source = `function test(){
            return a = 5, this.fun1(), this.fun2(), false;
        }`
    var target = `function test(){
            a = 5;
            this.fun1();
            this.fun2();
            return false;
        }`

    var { sourceCode, targetCode } = ggcTest(source, target, splitSequenceExpression, false)

    expect(sourceCode).toBe(targetCode)
})

test('splitSequenceExpression 3 ', () => {
    var source = `if(a=1, b=2, c===5){}`
    var target = `a=1;
                b=2;
                if(c===5){}`

    var { sourceCode, targetCode } = ggcTest(source, target, splitSequenceExpression, false)

    expect(sourceCode).toBe(targetCode)
})

//////////////////////////////////////////////////// setDataHandle ////////////////////////////////////////////////////

// test('setDataHandle 1 ', () => {
//     var source = "this.setData({" +
//         "[`${style}.xxx.${name}`]: 11" +
//         "});"
//     var target = "this[`${style}.xxx.${name}`] = 11;"

//     var { sourceCode, targetCode } = ggcTest(source, target, setDataHandle, false)

//     expect(sourceCode).toBe(targetCode)
// })

// test('setDataHandle 2 ', () => {
//     var source = `this.setData({
//                     title:"hello",
//                     ["info.jishilist[" + index + "].ifguanzhu"]: 0
//                 });`
//     var target = `this["info.jishilist[" + index + "].ifguanzhu"] = 0;
//                     this.setData({
//                         title: "hello"
//                     });`

//     var { sourceCode, targetCode } = ggcTest(source, target, setDataHandle, false)

//     expect(sourceCode).toBe(targetCode)
// })

// test('setDataHandle 3 ', () => {
//     var source = `this.setData({
//                     ["info.jishilist[" + index + "].ifguanzhu"]: 0
//                 });`
//     var target = `this["info.jishilist[" + index + "].ifguanzhu"] = 0;`

//     var { sourceCode, targetCode } = ggcTest(source, target, setDataHandle, false)

//     expect(sourceCode).toBe(targetCode)
// })


