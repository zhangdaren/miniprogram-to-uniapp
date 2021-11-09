/*
 * @Author: zhang peng
 * @Date: 2021-08-30 21:18:47
 * @LastEditTime: 2021-10-30 16:42:47
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/test/transformers/variable/variable-transformer.test.js
 *
 */
const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")

var appRoot = "../../.."
const {
    jsKeywordFunctionHandle,
    undefinedFunctionHandle,
    dataWithMethodsDuplicateHandle,
    propWithDataDuplicateHandle,
} = require(appRoot + '/src/transformers/variable/variable-transformer')




test('jsKeywordFunctionHandle 1 ', () => {

    var sourceTemplateAst = $(`<view style="$data.user" @tap="default">{{$data.user.name}}</view>
        <view @tap="continue">{{test($data.user)}}</view>
        <view @tap="export">{{test($data.user)}}</view>`, { parseOptions: { language: 'html' } })

    var sourceScriptAst = $(`export default {
            data() {
                return {};
            },
            methods: {
                default(){},
                continue(){},
                export(){},
            }
        }`)


    jsKeywordFunctionHandle(sourceScriptAst, sourceTemplateAst)


    var targetTemplateAst = $(`<view style="$data.user" @tap="defaultFun">{{$data.user.name}}</view>
        <view @tap="continueFun">{{test($data.user)}}</view>
        <view @tap="exportFun">{{test($data.user)}}</view>`, { parseOptions: { language: 'html' } })

    var targetScriptAst = $(`export default {
        data() {
            return {};
        },
        methods: {
            defaultFun(){},
            continueFun(){},
            exportFun(){},
        }
    }`)


    var sourceTemplateStr = sourceTemplateAst.generate({ isPretty: true })
    var sourceScriptStr = sourceScriptAst.generate({ isPretty: true })
    var targetTemplateStr = targetTemplateAst.generate({ isPretty: true })
    var targetScriptStr = targetScriptAst.generate({ isPretty: true })


    expect(sourceTemplateStr).toBe(targetTemplateStr)
    expect(sourceScriptStr).toBe(targetScriptStr)
})




test('jsKeywordFunctionHandle 2 ', () => {

    var sourceTemplateAst = $(`<view style="$data.user" @tap="default">{{$data.user.name}}</view>
        <view @tap="continue">{{test($data.user)}}</view>
        <view @tap="export">{{test($data.user)}}</view>`, { parseOptions: { language: 'html' } })

    var sourceScriptAst = $(`export default {
            data() {
                return {};
            },
            onLoad(){
                this.default()
                this.continue()
                this.export()
            },
            methods: {
                default(){},
                continue(){},
                export(){},
            }
        }`)


    jsKeywordFunctionHandle(sourceScriptAst, sourceTemplateAst)


    var targetTemplateAst = $(`<view style="$data.user" @tap="defaultFun">{{$data.user.name}}</view>
        <view @tap="continueFun">{{test($data.user)}}</view>
        <view @tap="exportFun">{{test($data.user)}}</view>`, { parseOptions: { language: 'html' } })

    var targetScriptAst = $(`export default {
        data() {
            return {};
        },
        onLoad(){
            this.defaultFun()
            this.continueFun()
            this.exportFun()
        },
        methods: {
            defaultFun(){},
            continueFun(){},
            exportFun(){},
        }
    }`)


    var sourceTemplateStr = sourceTemplateAst.generate({ isPretty: true })
    var sourceScriptStr = sourceScriptAst.generate({ isPretty: true })
    var targetTemplateStr = targetTemplateAst.generate({ isPretty: true })
    var targetScriptStr = targetScriptAst.generate({ isPretty: true })


    expect(sourceTemplateStr).toBe(targetTemplateStr)
    expect(sourceScriptStr).toBe(targetScriptStr)
})



/////////////////////////////////////////// undefinedFunctionHandle //////////////////////////////////////////////

test('undefinedFunctionHandle 1 ', () => {

    var sourceTemplateAst = $(`<view @tap="xxxxxxxxx">test</view>`, { parseOptions: { language: 'html' } })

    var sourceScriptAst = $(`export default {
            data() {
                return {};
            },
            onLoad(){
            },
            methods: {
            }
        }`)

    undefinedFunctionHandle(sourceScriptAst, sourceTemplateAst)

    var targetTemplateAst = $(`<view @tap="xxxxxxxxx">test</view>`, { parseOptions: { language: 'html' } })

    var targetScriptAst = $(`export default {
        data() {
            return {};
        },
        onLoad(){
        },
        methods: {
            xxxxxxxxx(){
                console.log("占位：函数 xxxxxxxxx 未声明");
            },
        }
    }`)


    var sourceTemplateStr = sourceTemplateAst.generate({ isPretty: true })
    var sourceScriptStr = sourceScriptAst.generate({ isPretty: true })
    var targetTemplateStr = targetTemplateAst.generate({ isPretty: true })
    var targetScriptStr = targetScriptAst.generate({ isPretty: true })


    // expect(sourceTemplateStr).toBe(targetTemplateStr)
    expect(sourceScriptStr).toBe(targetScriptStr)
})



/////////////////////////////////////////// dataWithMethodsDuplicateHandle //////////////////////////////////////////////

test('dataWithMethodsDuplicateHandle 1 ', () => {

    var sourceTemplateAst = $(`<view style="$data.user" @tap="test">{{$data.user.name}}</view>
        <view >{{ test(item) }}</view>`, { parseOptions: { language: 'html' } })

    var sourceScriptAst = $(`export default {
        data() {
            return {
                test:1,
            };
        },
        onLoad: function(options) {
            var a = this.test;
        },
        methods: {
            refreshPage3389: function(options) {
                var that = this;
                this.setData({
                    test:"111"
                })

                this.test()
                that.test()
            },
            test() {}
        }
    };`)

    dataWithMethodsDuplicateHandle(sourceScriptAst, sourceTemplateAst)

    var targetTemplateAst = $(`<view style="$data.user" @tap="testFun">{{$data.user.name}}</view>
        <view>{{testFun(item)}}</view>`, { parseOptions: { language: 'html' } })

    var targetScriptAst = $(`export default {
        data() {
            return {
                test:1,
            };
        },
        onLoad: function(options) {
            var a = this.test;
        },
        methods: {
            refreshPage3389: function(options) {
                var that = this;
                this.setData({
                    test:"111"
                })

                this.testFun()
                that.testFun()
            },
            testFun() {}
        }
    }`)


    var sourceTemplateStr = sourceTemplateAst.generate({ isPretty: true })
    var sourceScriptStr = sourceScriptAst.generate({ isPretty: true })
    var targetTemplateStr = targetTemplateAst.generate({ isPretty: true })
    var targetScriptStr = targetScriptAst.generate({ isPretty: true })


    expect(sourceTemplateStr).toBe(targetTemplateStr)
    expect(sourceScriptStr).toBe(targetScriptStr)
})


/////////////////////////////////////////// propWithDataDuplicateHandle //////////////////////////////////////////////

test('propWithDataDuplicateHandle 1 ', () => {

    var sourceTemplateAst = $(`<view :style="">{{ propE.message }}</view>`, { parseOptions: { language: 'html' } })

    var sourceScriptAst = $(` export default {
        data() {
            return {
                tt:1
            };
        },
        props:{
            propE: {
                type: Object,
                default: function () {
                    return { message: 'hello' }
                }
            },
        },
        onLoad: function(options) {
            t.setData({
                propE: {
                    message:"hello world"
                },
                tt:2
            });
        },
        methods:{
            test(){
                t.setData({
                    propE: {
                        message:"hello world2222"
                    },
                    tt:22222
                });
            }
        }
    }`)

    propWithDataDuplicateHandle(sourceScriptAst, sourceTemplateAst)

    var targetTemplateAst = $(`<view :style="">{{propEclone.message}}</view>`, { parseOptions: { language: 'html' } })

    var targetScriptAst = $(`export default {
        data() {
            return {
                tt: 1,
                propEclone: {}
            };
        },
        props: {
            propE: {
                type: Object,
                default: function() {
                    return {
                        message: "hello"
                    };
                }
            }
        },
        watch:{
            propE: {
            　　handler(newName, oldName) {
                　　this.propEclone = newName;
            　　},
                deep: true,
            　　immediate: true
            }
        },
        onLoad: function(options) {
            t.setData({
                propEclone: {
                    message: "hello world"
                },
                tt: 2
            });
        },
        methods: {
            test() {
                t.setData({
                    propEclone: {
                        message: "hello world2222"
                    },
                    tt: 22222
                });
            }
        }
    };`)


    var sourceTemplateStr = sourceTemplateAst.generate({ isPretty: true })
    var sourceScriptStr = sourceScriptAst.generate({ isPretty: true })
    var targetTemplateStr = targetTemplateAst.generate({ isPretty: true })
    var targetScriptStr = targetScriptAst.generate({ isPretty: true })


    expect(sourceTemplateStr).toBe(targetTemplateStr)
    expect(sourceScriptStr).toBe(targetScriptStr)
})



