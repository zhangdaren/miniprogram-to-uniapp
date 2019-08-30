/*
*
* 处理wxml文件
* 
* todo:
* <import src="../../../common/head.wxml" />
* <import src="../../../common/foot.wxml" />
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
 * 2.根元素含有wx:for变量
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
			if (node.attribs["wx:for"]) isMultiTag = true;
		}
	});
	if (count > 1) isMultiTag = true;
	return isMultiTag;
}

/**
 * wxml文件处理
 * @param {*} fileData wxml文件内容
 * @param {*} file_wxml 当前操作的文件路径
 */
async function wxmlHandle(fileData, file_wxml, onlyWxmlFile) {

	let reg = /<template([\s\S]*?)<\/template>/g;

	let tmpArr = fileData.match(reg) || [];
	//
	let isMultiTemplate = tmpArr.length > 0;

	//生成语法树
	let templateAst = await templateParser.parse(fileData);

	//
	let isMultiTag = checkMultiTag(templateAst);

	//进行上述目标的转换
	let convertedTemplate = templateConverter(templateAst, false, file_wxml, onlyWxmlFile);

	//把语法树转成文本
	templateConvertedString = templateParser.astToString(convertedTemplate);

	if (isMultiTemplate) {
		templateConvertedString = `\r\n${templateConvertedString}\r\n`;
	} else {
		if (isMultiTag) {
			templateConvertedString = `<template>\r\n<view>\r\n${templateConvertedString}\r\n</view>\r\n</template>\r\n\r\n`;
		} else {
			templateConvertedString = `<template>\r\n${templateConvertedString}\r\n</template>\r\n\r\n"`;
		}
	}

	//如果不进行转换wxs的话，那么需要把wxs标签移到template下面来
	if (!global.isTransformWXS) {
		//当前处理文件所在目录
		let wxmlFolder = path.dirname(file_wxml);
		// key为文件路径 + 文件名(不含扩展名)组成
		let key = path.join(wxmlFolder, pathUtil.getFileNameNoExt(file_wxml));
		let wxsInfoArr = global.wxsInfo[key];
		if(wxsInfoArr)
		{
			const wxsInfoString = templateParser.astToString(wxsInfoArr);
			let wxsStr = wxsInfoString + "\r\n";
			templateConvertedString += wxsStr + "\r\n";
		}
	}

	return templateConvertedString;
}

module.exports = wxmlHandle;
