/**
 * 转义符换成普通字符
 * @param {*} str
 * @returns
 */
export function escape2Html(str) {
	if (!str) return str
	var arrEntities = {
		'lt': '<',
		'gt': '>',
		'nbsp': ' ',
		'amp': '&',
		'quot': '"'
	}
	return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function(all, t) {
		return arrEntities[t]
	})
}

/**
 * 普通字符转换成转义符
 * @param {*} sHtml
 * @returns
 */
export function html2Escape(sHtml) {
	if (!sHtml) return sHtml
	return sHtml.replace(/[<>&"]/g, function(c) {
		return {
			'<': '&lt;',
			'>': '&gt;',
			'&': '&amp;',
			'"': '&quot;'
		} [c]
	})
}

