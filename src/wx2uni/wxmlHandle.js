/*
*
* 处理wxml文件
* 
* todo:
* <import src="../../../common/head.wxml" />
* <import src="../../../common/foot.wxml" />
* 
*/
const TemplateParser = require('./wxml/TemplateParser');
const templateConverter = require('./wxml/templateConverter');

//初始化一个解析器
templateParser = new TemplateParser();

async function wxmlHandle(fileData) {

	let reg = /<template([\s\S]*?)<\/template>/g;

	let tmpArr = fileData.match(reg) || [];
	//
	let isMultiTemplate = tmpArr.length > 1;

	//生成语法树
	let templateAst = await templateParser.parse(fileData);

	//进行上述目标的转换
	let convertedTemplate = templateConverter(templateAst);

	//把语法树转成文本
	templateConvertedString = templateParser.astToString(convertedTemplate);

	if (isMultiTemplate) {
		templateConvertedString = `\r\n${templateConvertedString}\r\n`;
	} else {
		templateConvertedString = `<template>\r\n${templateConvertedString}\r\n</template>\r\n`;
	}

	return templateConvertedString;
}

module.exports = wxmlHandle;
