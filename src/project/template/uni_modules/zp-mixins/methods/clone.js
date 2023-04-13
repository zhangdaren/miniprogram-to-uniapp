/**
 * 用于处理对props进行赋值的情况
 * //简单处理一下就行了
 *
 * @param {*} target
 * @returns
 */
export function clone(target) {
	return JSON.parse(JSON.stringify(target))
}
