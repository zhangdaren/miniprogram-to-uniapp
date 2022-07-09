/*
 * @Author: zhang peng
 * @Date: 2021-08-03 10:57:51
 * @LastEditTime: 2022-05-04 21:24:16
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/project/template/polyfill/mixins.js
 *
 * 如果你想删除本文件，请先确认它使用的范围，感谢合作~
 * 如有疑问，请直接联系: 375890534@qq.com
 */
export default {
    methods: {
        /**
         * 转义符换成普通字符
         * @param {*} str
         * @returns
         */
        escape2Html (str) {
            if (!str) return str
            var arrEntities = {
                'lt': '<',
                'gt': '>',
                'nbsp': ' ',
                'amp': '&',
                'quot': '"'
            }
            return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function (all, t) {
                return arrEntities[t]
            })
        },
        /**
         * 普通字符转换成转义符
         * @param {*} sHtml
         * @returns
         */
        html2Escape (sHtml) {
            if (!sHtml) return sHtml
            return sHtml.replace(/[<>&"]/g, function (c) {
                return {
                    '<': '&lt;',
                    '>': '&gt;',
                    '&': '&amp;',
                    '"': '&quot;'
                }[c]
            })
        },
        /**
         * setData polyfill 勿删!!!
         * 用于转换后的uniapp的项目能直接使用this.setData()函数
         * @param {*} obj
         * @param {*} callback
         */
        setData: function (obj, callback) {
            let that = this
            const handleData = (tepData, tepKey, afterKey) => {
                var tepData2 = tepData
                tepKey = tepKey.split('.')
                tepKey.forEach(item => {
                    if (tepData[item] === null || tepData[item] === undefined) {
                        let reg = /^[0-9]+$/
                        tepData[item] = reg.test(afterKey) ? [] : {}
                        tepData2 = tepData[item]
                    } else {
                        tepData2 = tepData[item]
                    }
                })
                return tepData2
            }
            const isFn = function (value) {
                return typeof value == 'function' || false
            }
            Object.keys(obj).forEach(function (key) {
                let val = obj[key]
                key = key.replace(/\]/g, '').replace(/\[/g, '.')
                let front, after
                let index_after = key.lastIndexOf('.')
                if (index_after != -1) {
                    after = key.slice(index_after + 1)
                    front = handleData(that, key.slice(0, index_after), after)
                } else {
                    after = key
                    front = that
                }
                if (front.$data && front.$data[after] === undefined) {
                    Object.defineProperty(front, after, {
                        get () {
                            return front.$data[after]
                        },
                        set (newValue) {
                            front.$data[after] = newValue
                            that.hasOwnProperty("$forceUpdate") && that.$forceUpdate()
                        },
                        enumerable: true,
                        configurable: true
                    })
                    front[after] = val
                } else {
                    that.$set(front, after, val)
                }
            })
            // this.$forceUpdate();
            isFn(callback) && this.$nextTick(callback)
        },
        /**
         * 解析事件里的动态函数名，这种没有()的函数名，在uniapp不被执行
         * 比如：<view bindtap="{{openId==undefined?'denglu':'hy_to'}}">立即</view>
         * @param {*} exp
         */
        parseEventDynamicCode (e, exp) {
            if (typeof (this[exp]) === 'function') {
                this[exp](e)
            }
        },
        /**
         * 用于处理对props进行赋值的情况
         * //简单处理一下就行了
         *
         * @param {*} target
         * @returns
         */
        deepClone (target) {
            return JSON.parse(JSON.stringify(target))
        },
        /**
         * 用于处理dataset
         * 自定义组件的事件里，是获取不到e.currentTarget.dataset的
         * 因此收集data-参数，手动传进去
         *
         * @param {*} event
         * @param {*} dataSet
         * @returns
         */
        datasetHandle (event, dataSet = {}) {
            if (event && !event.currentTarget) {
                if (dataSet.tagId) {
                    event.currentTarget = {
                        id: dataSet.tagId
                    }
                } else {
                    event.currentTarget = {
                        dataset: dataSet
                    }
                }
            }
        }
    }
}
