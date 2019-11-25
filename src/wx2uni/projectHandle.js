const fs = require('fs-extra');
const path = require('path');

const utils = require('../utils/utils.js');
const pathUtil = require('../utils/pathUtil.js');

/**
 * 处理include标签
 */
function includeHandle() {
	let pagesData = global.pagesData;
	let includeInfo = global.includeInfo;

	for (const key in includeInfo) {
		const item = includeInfo[key];
		const fileKey = item.curFileKey;
		const includeFileKey = item.includeFileKey;
		if (pagesData[fileKey]) {
			let wxml = pagesData[fileKey].data.wxml;
			if (pagesData[includeFileKey]) {
				let includeWxml = pagesData[includeFileKey].data.minWxml;
				includeWxml = "<template" + item.attrs + ">" + includeWxml + "</template>";
				pagesData[fileKey].data.wxml = wxml.replace(item.includeTag, includeWxml);
			} else {
				// path.relative(global.miniprogramRoot, item.includeWxmlAbsPath)
				let logStr = "Error: 找不到include所对应的wxml文件-->" + path.relative(global.miniprogramRoot, item.includeWxmlAbsPath) + "   标签：" + item.includeTag;
				console.log(logStr);
				global.log.push(logStr);
			}
		}
	}
}

/**
 * 保存所有未保存的文件
 */
function saveAllFile() {
	let pagesData = global.pagesData;
	for (const key in pagesData) {
		const item = pagesData[key];
		let data = item.data;
		let fileContent = "";
		let targetFilePath = data.path;
		let msg = "";
		switch (data.type) {
			case "all":
				fileContent = data.wxml + data.js + data.css;
				msg = `Convert ${path.relative(global.targetFolder, targetFilePath)} success!`;
				break;
			case "js":
				fileContent = data.js;
				msg = `Convert component ${path.relative(global.targetFolder, targetFilePath)} success!`;
				break;
			case "wxml":
				fileContent = data.wxml + data.js;
				msg = `Convert component ${path.relative(global.targetFolder, targetFilePath)}.wxml success!`;
				break;
			case "css":
				fileContent = data.css;
				msg = `Convert ${path.relative(global.targetFolder, targetFilePath)}.wxss success!`;
				break;
		}

		//写入文件
		fs.writeFile(targetFilePath, fileContent, () => {
			console.log(msg);
		});
	}
}


/**
 * 项目处理
 */
function projectHandle() {
	includeHandle();
	saveAllFile();
}

module.exports = projectHandle;
