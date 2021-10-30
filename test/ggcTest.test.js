/*
 * @Author: zhang peng
 * @Date: 2021-08-30 10:46:31
 * @LastEditTime: 2021-08-30 11:07:29
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp2\test\ggcTest.test.js
 *
 * test 的 test。。。。
 * 为了简化代码，
 *
 */
const $ = require('gogocode')

const {ggcTest} = require('./ggcTest.js')

test('ggcTest 1 ', () => {
    var source = `<input @input="test" />`
    var target = `<input @input="test" />`

    var {sourceCode, targetCode} = ggcTest(source,target,()=>{},true)

    expect(sourceCode).toBe(targetCode)
})

