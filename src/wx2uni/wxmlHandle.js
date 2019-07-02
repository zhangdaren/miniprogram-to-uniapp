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
/**
 * @description: 解析wxml
 * @param {String} fileData 文件中的 <template>....</template>内容
 * @return: templateConvertedString 已经转换好的内容
 */
async function wxmlHandle(fileData) {
	// console.log(fileData);
	let reg = /<template([\s\S]*?)<\/template>/g; 
	// 判断是否为多template文件
	let tmpArr = fileData.match(reg)||[]; 
    // console.log(tmpArr);
	//
	let isMultiTemplate = tmpArr.length > 1;
	
	//生成语法树
	let templateAst = await templateParser.parse(fileData);
	// console.log(templateAst);
	//进行上述目标的转换
	let convertedTemplate = templateConverter(templateAst);

	//把语法树转成文本
	templateConvertedString = templateParser.astToString(convertedTemplate);
	
	if(isMultiTemplate)
	{
		templateConvertedString = `\r\n${templateConvertedString}\r\n`;
	}else{
		templateConvertedString = `<template>\r\n${templateConvertedString}\r\n</template>\r\n`;
	}

	// console.log(templateConvertedString);
	return templateConvertedString;
}

module.exports = wxmlHandle;
