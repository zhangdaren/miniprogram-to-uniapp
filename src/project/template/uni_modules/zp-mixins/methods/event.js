/**
 * 解析事件里的动态函数名，这种没有()的函数名，在uniapp不被执行
 * 比如：<view bindtap="{{openId==undefined?'denglu':'hy_to'}}">立即</view>
 * @param {*} exp
 */
export function parseEventDynamicCode(e, exp) {
	if (typeof(this[exp]) === 'function') {
		this[exp](e)
	}
}
