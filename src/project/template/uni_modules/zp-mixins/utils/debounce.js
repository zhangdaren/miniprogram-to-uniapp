/**
 * 防抖
 * @param {Object} scope  //引用的this，发现不显式传this，拿不到。
 * @param {Object} fn
 * @param {Object} delay
 */
let t = null
const debounce = function(scope, fn, delay) {
	if (t !== null) {
		clearTimeout(t)
	}
	t = setTimeout(() => {
		scope[fn]()
	}, delay)
}

export default debounce
