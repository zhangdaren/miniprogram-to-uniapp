/*
*
* 处理wxml文件
* 
*/
const path = require('path');

const TemplateParser = require('./wxml/TemplateParser');
const templateConverter = require('./wxml/templateConverter');

const pathUtil = require('../utils/pathUtil.js');

//初始化一个解析器
templateParser = new TemplateParser();


/**
 * 判断是否为多根元素模式
 * 分为两种情况：
 * 1.wxml里有多个tag标签
 * 2.根元素含有wx:for或v-for属性
 * @param {*} ast 
 */
function checkMultiTag(ast) {
	//判断是否有多个标签存在于一个wxml文件里
	let isMultiTag = false;
	let count = 0;
	ast.forEach(node => {
		if (node.type == "tag" && node.name !== "wxs") {
			count++;
			//如果根元素含有wx:for，需要在外面再包一层
			if (node.attribs["wx:for"] || node.attribs["v-for"]) isMultiTag = true;
		}
	});
	if (count > 1) isMultiTag = true;
	return isMultiTag;
}

/**
 * 检查ast里是否全是注释，是就清空
 * @param {*} ast 
 */
function checkEmptyTag(ast) {
	let count = 0;
	ast.forEach(node => {
		if (node.type == "tag") {
			count++;
		}
	});

	if (count === 0) {
		ast = [];
	}
	return ast;
}



/**
 * wxml文件处理
 * @param {*} fileData wxml文件内容
 * @param {*} file_wxml 当前操作的文件路径
 */
async function wxmlHandle(fileData, file_wxml, onlyWxmlFile) {
	let reg = /<template([\s\S]*?)<\/template>/g;


	//查找有多少个template
	let tmpArr = fileData.match(reg) || [];
	let templateNum = tmpArr.length;

	//生成语法树
	let templateAst = await templateParser.parse(fileData);

	//判断根标签上是否包含wx:for或v-for
	let isMultiTag = checkMultiTag(templateAst);

	//进行上述目标的转换
	let convertedTemplate = await templateConverter(templateAst, false, file_wxml, onlyWxmlFile, templateParser, templateNum);

	//判断ast是否没有tag，是的话就全删除
	convertedTemplate = checkEmptyTag(convertedTemplate);

	//把语法树转成文本
	let templateConvertedString = templateParser.astToString(convertedTemplate);

	//去掉首尾空，有可能文件内容都删除完了。
	templateConvertedString = templateConvertedString.trim();

	//1226
	// const globalTemplateComponents = global.globalTemplateComponents;
	// for (const name in globalTemplateComponents) {
	// 	const componentData = globalTemplateComponents[name];
	// 	//这里判断一下，可能有两个页面同时引用了某个组件
	// 	if (componentData.ast && !componentData.data) {
	// 		//这里需要缓存，不然可能会串掉！
	// 		(async function (file_wxml, onlyWxmlFile) {
	// 			// console.log("file_wxml-------", file_wxml, "------------" + name)
	// 			let tempComponent = await templateConverter(componentData.ast, false, file_wxml, onlyWxmlFile, templateParser);
	// 			let tempComponentString = templateParser.astToString(tempComponent);
	// 			let isMultiTag2 = checkMultiTag(componentData.ast);
	// 			if (isMultiTag2) {
	// 				tempComponentString = `<template>\r\n<view>\r\n${tempComponentString}\r\n</view>\r\n</template>\r\n\r\n`;
	// 			} else {
	// 				tempComponentString = `<template>\r\n${tempComponentString}\r\n</template>\r\n\r\n`;
	// 			}
	// 			tempComponentString += '<script>\r\n' +
	// 				'    export default {\r\n' +
	// 				'    		name: "' + componentData.alias + '",\r\n' +
	// 				'    		props: ["item"]\r\n' +
	// 				'    	}\r\n' +
	// 				'</script>\r\n';
	// 			componentData.data = tempComponentString;

	// 		})(file_wxml, onlyWxmlFile);
	// 	}
	// }

	//不加template标签的wxml，用于导入include
	const templateConvertedStringMin = templateConvertedString;
	if (templateConvertedString) {
		if (isMultiTag) {
			templateConvertedString = `<template>\r\n<view>\r\n${templateConvertedString}\r\n</view>\r\n</template>\r\n\r\n`;
		} else {
			templateConvertedString = `<template>\r\n${templateConvertedString}\r\n</template>\r\n\r\n`;
		}

		//如果不进行转换wxs的话，那么需要把wxs标签移到template下面来
		if (!global.isTransformWXS) {
			//当前处理文件所在目录
			let wxmlFolder = path.dirname(file_wxml);
			// key为文件路径 + 文件名(不含扩展名)组成
			let key = path.join(wxmlFolder, pathUtil.getFileNameNoExt(file_wxml));
			let pageWxsInfoArr = global.pageWxsInfo[key];
			if (pageWxsInfoArr) {
				// const wxsInfoString = templateParser.astToString(pageWxsInfoArr);
				// let wxsStr = wxsInfoString + "\r\n";
				// templateConvertedString += wxsStr + "\r\n";

				//转换为<script/>方式引用wxs
				let wxsStr = "";
				for (const obj of pageWxsInfoArr) {
					wxsStr += `<script module="${obj.module}" lang="wxs" src="${obj.src}"></script>\r\n`;
				}
				templateConvertedString += wxsStr + "\r\n";
			}
		}
	}
	return {
		templateString: templateConvertedString,
		templateStringMin: templateConvertedStringMin
	};
}

module.exports = wxmlHandle;
