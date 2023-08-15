/**
 * lodash set
 * @param {*} obj
 * @param {*} path
 * @param {*} value
 * @returns
 */
function _set(obj, path, value) {
	if (Object(obj) !== obj) return obj // When obj is not an object
	// If not yet an array, get the keys from the string-path
	if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || []
	const targetObject = path.slice(0, -1).reduce((a, c, i) => // Iterate all of them except the last one
		Object(a[c]) === a[c] // Does the key exist and is its value an object?
		// Yes: then follow that path
		?
		a[c]
		// No: create the key. Is the next key a potential array-index?
		:
		a[c] = Math.abs(path[i + 1]) >> 0 === +path[i + 1] ? [] // Yes: assign a new array object
		:
		{}, // No: assign a new plain object
		obj)
	const targetKey = path[path.length - 1]
	// Finally assign the value to the last key
	if (typeof obj.$set === 'function') {
		// 对data中的数组或对象进行修改时，有些操作方式是非响应式的，这里使用$set进行响应式的数据更新
		obj.$set(targetObject, targetKey, value)
	} else {
		targetObject[targetKey] = value
	}
	return obj // Return the top-level object to allow chaining
}

export default _set
