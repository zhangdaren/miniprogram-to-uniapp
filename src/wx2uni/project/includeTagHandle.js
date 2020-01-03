
const path = require('path');

/**
 * 处理include标签
 */
function includeTagHandle() {
	let pagesData = global.pagesData;
	let includeInfo = global.includeInfo;

	for (const key in includeInfo) {
		const item = includeInfo[key];
		const fileKey = item.curFileKey;
		const includeFileKey = item.includeFileKey;

		if (pagesData[fileKey]) {
			let wxml = pagesData[fileKey].data.wxml;
			let minWxml = pagesData[fileKey].data.minWxml;
			if (pagesData[includeFileKey]) {
				let includeWxml = pagesData[includeFileKey].data.minWxml;
				includeWxml = "<block" + item.attrs + ">" + includeWxml + "</block>";
				pagesData[fileKey].data.wxml = wxml.replace(item.includeTag, includeWxml);
				pagesData[fileKey].data.minWxml = minWxml.replace(item.includeTag, includeWxml);
			} else {
				// path.relative(global.miniprogramRoot, item.includeWxmlAbsPath)
				let logStr = "Error: 找不到include所对应的wxml文件-->" + path.relative(global.miniprogramRoot, item.includeWxmlAbsPath) + "   标签：" + item.includeTag;
				console.log(logStr);
				global.log.push(logStr);
			}
		}
	}
}

module.exports = includeTagHandle;