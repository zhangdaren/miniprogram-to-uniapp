/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:00:05
 * @LastEditTime: 2022-11-07 22:09:09
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/transformers/variable/dataset-transformer.js
 *
 */


const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const clone = require("clone")
var appRoot = "../../.."
const utils = require(appRoot + '/src/utils/utils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')


/**
 * 处理template里面的data-属性，并且返回对应的事件回调函数列表
 * @param {*} $wxmlAst
 * @param {*} fileKey
 * @returns
 */
function templateDatasetHandle ($wxmlAst, fileKey) {
    if (!$wxmlAst) {
        return
    }

    var eventNameList = []

    $wxmlAst
        .find('<$_$tag></$_$tag>')
        .each(function (item) {
            var tagName = item.attr("content.name")
            if (utils.isMiniAppTag(tagName)) {
                // 如果是内置的标签，则不处理
                return
            }

            var attributes = item.attr("content.attributes")

            //没有属性就返回
            if (!attributes) return

            var tagId = ""
            var datasetList = []
            var reg = /^:data-|^data-/
            attributes.map(attr => {
                var attrNode = attr.key
                var valueNode = attr.value

                //没有内容也返回
                if (!attr.value) return

                var attr = attrNode.content
                var value = valueNode.content
                if (attr[0] !== ":") {
                    value = `'${ value }'`
                }
                if (attr === ":id" || attr === "id") {
                    tagId = value
                } else if (reg.test(attr)) {
                    var key = attr.replace(reg, "")
                    //转驼峰
                    key = utils.toCamel(key)
                    var objStr = key === value ? value : `${ key }:${ value }`
                    datasetList.push(objStr)
                }
            })
            //加入id
            if (tagId) {
                datasetList.push(`tagId:${ tagId }`)
            }

            //处理data-
            attributes.map(attr => {
                var attrNode = attr.key
                var valueNode = attr.value

                //没有内容也返回
                if (!attr.value) return

                var attr = attrNode.content
                var value = valueNode.content
                if (datasetList.length) {
                    if (attr[0] === "@" && utils.isVariableName(value)) {
                        var params = `{ ${ datasetList.join(",") } }`
                        valueNode.content = `${ value }($event, ${ params })`

                        //缓存事件函数名
                        eventNameList.push(value)
                    }
                }
            })
        }).root()

    //去重
    eventNameList = utils.duplicateRemoval(eventNameList)

    return eventNameList
}



// 测试用例：
// onTap1:function(xxx) {
//     const data = this.data;
//     if (!data.maskClosable) return;
//     this.setData({
//         show: false
//     });
//     this.triggerEvent('close', {}, {});
// },
// onTap2(gg) {
//     const data = this.data;
//     if (!data.maskClosable) return;
//     this.setData({
//         show: false
//     });
//     this.triggerEvent('close', {}, {});
// },


/**
 * 根据eventNameList处理method，并加入特定代码
 * @param {*} $jsAst
 * @param {*} eventNameList
 * @param {*} fileKey
 * @returns
 */
function methodDatasetHandle ($jsAst, eventNameList, fileKey) {
    if (!$jsAst || !eventNameList.length) {
        return
    }

    //处理methods
    let methodList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.METHODS,fileKey)
    methodList.map(function (item) {
        var methodName = item.key && (item.key.name || item.key.value) || ""
        if (eventNameList.includes(methodName)) {
            let eventParamName = "e"

            let params = []
            let body = null
            if (item.type === "ObjectMethod") {
                params = item.params
                body = item.body.body
            } else if (item.type === "ObjectProperty") {
                params = item.value.params
                var itemValue = item.value
                if (t.isCallExpression(itemValue)) {
                    if (t.isMemberExpression(itemValue.callee) && itemValue.callee.property.name === "throttle") {
                        if (itemValue.arguments) {
                            const fun = itemValue.arguments[0]
                            if (t.isFunctionExpression(fun) || t.isArrowFunctionExpression(fun)) {
                                params = fun.params
                                body = fun.body.body
                            }
                        }
                    }
                } else {
                    if (itemValue && itemValue.body && itemValue.body.body) {
                        body = itemValue.body.body
                    } else {
                        global.log("body为空。。。", item.key.name, fileKey)
                    }
                }
            }

            if (!body || !params) return

            let code = ""
            let firstParam = params[0]
            if (t.isRestElement(firstParam)) {
                //如果是fun(...arg){}
                let name = firstParam.argument.name
                code = `this.handleDataset(${ name }[0], ${ name }[1])`
            } else {
                if (firstParam) {
                    eventParamName = firstParam.name
                } else {
                    params.push(t.identifier(eventParamName))
                }
                params.push(t.identifier("_dataset"))
                code = `this.handleDataset(${ eventParamName }, _dataset)`
            }

            code = `/* ---处理dataset begin--- */
            ${ code }
            /* ---处理dataset end--- */`

            var node = $(code, { isProgram: false }).node
            body.unshift(node)
        }
    })
}


/**
 * template标签dataset属性处理
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 * @param {*} fileKey
 * @returns
 */
function transformDataset ($jsAst, $wxmlAst, fileKey) {
    if (!$jsAst || !$wxmlAst) {
        return
    }

    /**
     * 注意！
     * 2022-10-28
     * 经测，HBuilderX v3.6.7 alpha，在微信小程序、H5、APP等平台都支持dataset，因此不再转换
     *
     * 2022-10-07
     * 自定义组件可能会有bug，坐等修复
     */

    //步骤：
    // 1.遍历template，找到自定义组件上面，含data-属性，并且有事件的，将事件组装为：@change="onChange($event, dataset参数)"
    // 2.将对应的回调函数处理，增加一行代码及参数:onChange(e, currentTargetDataSet) {if(!e.currentTarget){ e.currentTarget = { dataset: currentTargetDataSet }    }

    var eventNameList = templateDatasetHandle($wxmlAst, fileKey)
    methodDatasetHandle($jsAst, eventNameList, fileKey)
}


module.exports = {
    transformDataset
}



// go_voucher: utils.throttle((e) => {
//     let url = wx.getStorageSync('CRMversion') == 2 ? "/packageA/pages/couponDetail/CRMcouponDetail" : "/packageA/pages/couponDetail/couponDetail";
//     wx.navigateTo({
//       url: url + '?id=' + e[0].currentTarget.dataset.id + '&taticId=' + e[0].currentTarget.dataset.taticid
//     });
// })






// 测试用例：
// <view class="searchall-tab">
// <view bindtap="searchtabs" class="[\"searchtab-item\",{{searchindex==index?'tabact':''}}" data-index="{{index}}" wx:for="{{searchtab}}">{{item}}</view>
// </view>

// <view class='footer_menu flex-row'>
// <view class='flex-grow-1 flex-row'>
// <block wx:for="{{content._left}}" wx:key="name">
//   <view class='fon_28 footer_menuv1 flex-center-col' wx:if="{{!item.hide}}" data-index="{{index}}" bindtap='menu_route' wx:key="*this" data-type="{{item.type}}" data-src="{{item.src}}" data-item='{{item}}'>
//     <image class='footer_menuimg' mode='aspectFit' src='{{item.img}}'></image>
//     <view class='color_6'>{{item.name}}</view>
//   </view>
// </block>
// </view>
// <view class='color_f fon_34 flex-grow-0 flex-center footer_menuv2' bindtap='onTap' data-tel="{{content.right_tel}}" data-type="{{content.right_type}}" style='background:{{content.color}};width:{{width}}%' wx:if="{{comment_close==1}}">
// {{content._right}}
// </view>

// <view  bindtap='onTap' data-tel="{{content.right_tel}}" data-type="{{content.right_type}}" data-name="china"  data-nav="2">
// {{content._right}}
// </view>
// </view>




// //---1
// <view bindtap="tap" id={{item.attrs.id}}></view>
// 转换后(有问题)：
// <view @tap="tap($event, {item.attrs.id: item.attrs.id})" id={{item.attrs.id}}></view>
// 正确为：
// <view @tap="tap($event, {tagId: item.attrs.id})" id={{item.attrs.id}}></view>


// //---2
// <view bindtap="_change" id={{item.attrs.id}}></view>

// _change:function(...arg){
//     if(global._events && typeof global._events.change === 'function'){
//         global._events.change(...arg);
//     }
// }

// //转换方案：
// ontap(...args) {
//     global.log(args)

//     // 0: {type: "click", timeStamp: 49810.899999996764, detail: {…}, target: {…}, currentTarget: {…}, …}
//     // 1: {a: 1}

//     var event = args[1]
//     // if(){
//         //写判断
//         event.a = 5
//     // }

//     global.log(args)
// }
