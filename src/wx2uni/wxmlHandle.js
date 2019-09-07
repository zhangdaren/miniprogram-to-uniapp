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
		if (node.type == "tag") {
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

	if(count === 0)
	{
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

	//生成语法树
	let templateAst = await templateParser.parse(fileData);

	//判断根标签上是否包含wx:for或v-for
	let isMultiTag = checkMultiTag(templateAst);

	//进行上述目标的转换
	let convertedTemplate = templateConverter(templateAst, false, file_wxml, onlyWxmlFile, templateParser);

	//判断ast是否没有tag，是的话就全删除
	convertedTemplate = checkEmptyTag(convertedTemplate);

	//把语法树转成文本
	templateConvertedString = templateParser.astToString(convertedTemplate);

	//去掉首尾空，有可能文件内容都删除完了。
	templateConvertedString = templateConvertedString.trim();

	//查找有多少个template
	// let tmpArr = templateConvertedString.match(reg) || [];
	// let isMultiTemplate = tmpArr.length > 1;

	//
	const globalTemplateComponents = global.globalTemplateComponents;
	for (const name in globalTemplateComponents) {
		const componentData = globalTemplateComponents[name];
		//这里判断一下，可能有两个页面同时引用了某个组件
		if (componentData.ast && !componentData.data) {
			// console.log("file_wxml-------", file_wxml, "------------" + name)
			let tempComponent = templateConverter(componentData.ast, false, file_wxml, onlyWxmlFile, templateParser);
			let tempComponentString = templateParser.astToString(tempComponent);
			let isMultiTag2 = checkMultiTag(componentData.ast);
			if (isMultiTag2) {
				tempComponentString = `<template>\r\n<view>\r\n${tempComponentString}\r\n</view>\r\n</template>\r\n\r\n`;
			} else {
				tempComponentString = `<template>\r\n${tempComponentString}\r\n</template>\r\n\r\n`;
			}
			tempComponentString += '<script>\r\n' +
				'    export default {\r\n' +
				'    		name: "' + componentData.alias + '",\r\n' +
				'    		props: ["item"]\r\n' +
				'    	}\r\n' +
				'</script>\r\n';
			componentData.data = tempComponentString;
		}
	}



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
			let wxsInfoArr = global.wxsInfo[key];
			if (wxsInfoArr) {
				const wxsInfoString = templateParser.astToString(wxsInfoArr);
				let wxsStr = wxsInfoString + "\r\n";
				templateConvertedString += wxsStr + "\r\n";
			}
		}

	}

	return templateConvertedString;
}

module.exports = wxmlHandle;
