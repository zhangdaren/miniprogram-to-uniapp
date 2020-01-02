
const clone = require('clone');
const utils = require('../../utils/utils.js');
const TemplateParser = require('../wxml/TemplateParser');
const paramsHandle = require('../paramsHandle');

//初始化一个解析器
const templateParser = new TemplateParser();

/**
 * 替换wxml里面需要替换的参数
 * @param {*} ast 
 * @param {*} replacePropsMap 
 * @param {*} fileKey 
 */
function repalceWxmlParams(ast, replacePropsMap = {}, fileKey) {
	for (let i = 0; i < ast.length; i++) {
		let node = ast[i];
		if (!node) continue;
		for (const k in node.attribs) {
			//试运行：修复template里data、id或default变量
			let oldValue = node.attribs[k];
			if (/^(v-)|^:/.test(k)) {
				//判断一下key  v-开头和:开头的才放
				let newValue = paramsHandle(oldValue, true, false, replacePropsMap);
				node.attribs[k] = newValue;
			}
		}

		if (node.type === 'text') {
			if (node.data) {
				let text = node.data.replace(/{{(.*?)}}/g, function (match, $1) {
					let result = paramsHandle($1, true, false, replacePropsMap);
					return "{{" + result + "}}";
				})
				node.data = text;
			}
		}

		if (node.children) {
			repalceWxmlParams(node.children, replacePropsMap, fileKey);
		}
	}
}

/**
 * 使用template内容来替换相应的标签
 * @param {*} tagInfo        标签对应的数据
 * @param {*} templateList   template列表
 * @param {*} templateName   template的name，与tagbInfo.name不一定相同
 * @param {*} attr           需要附加的参数
 */
function replaceTagByTemplate(tagInfo, templateList, templateName, attr = "") {
	const name = templateName || tagInfo.name;
	const fileKey = tagInfo.curFileKey;
	const replacePropsMap = tagInfo.props;
	const templateTag = tagInfo.templateTag;
	const templateTagContent = templateParser.astToString([templateTag]);

	let minWxml = pagesData[fileKey].data.minWxml;
	let wxml = pagesData[fileKey].data.wxml;

	let templateWxml = "";
	var item = templateList[name];
	if (item) {
		//先把之前的ast取出备用
		let ast = item.ast;
		let oldAst = clone(item.oldAst);  //加[]是为了包含当前标签
		let attrs = templateTag.attribs;
		let templateFileKey = item.curFileKey;
		let attrsStr = attr + " data-type=\"template\"" + " data-is=\"" + name + "\"" + " data-attr=\"" + attrs[":data"] + "\"";
		let reg_attr = /:?data\b|:?is\b/;
		for (const key in attrs) {
			const value = attrs[key];
			if (!reg_attr.test(key)) {
				attrsStr += " " + key + "=\"" + value + "\"";
			}
		}

		//开始替换
		repalceWxmlParams(ast, replacePropsMap, name);
		let templateContent = templateParser.astToString(ast);
		templateWxml = "<block" + attrsStr + ">" + templateContent + "</block>";

		if (templateFileKey === fileKey) {
			//替换掉原属于页面里面的template
			let oldTemplateContent = templateParser.astToString(oldAst);

			if (minWxml) pagesData[fileKey].data.minWxml = minWxml.replace(oldTemplateContent, "");
			if (wxml) pagesData[fileKey].data.wxml = wxml.replace(oldTemplateContent, "");
		}
	} else {
		templateWxml = "<!-- 下行template对应的wxml不存在，无法替换，代码已注释 -->\r\n" + "<!-- " + templateTagContent + "-->\r\n";
		const logStr = "Error: template对应的wxml不存在，无法替换，代码已注释 --> " + templateTagContent + "   file --> " + fileKey;
		utils.log(logStr, "base");
		global.log.push(logStr);
	}
	return templateWxml;
}

/**
 * 处理template标签，将页面里面的template标签使用对应的内容进行替换，替换不了的将注释
 */
function templateTagHandle() {
	let pagesData = global.pagesData;
	let templateInfo = global.templateInfo;

	let tagList = templateInfo.tagList;
	let templateList = templateInfo.templateList;

	for (const key in tagList) {
		const item = tagList[key];
		const templateName = item.name;
		const fileKey = item.curFileKey;
		const templateTag = item.templateTag;
		const templateTagContent = templateParser.astToString([templateTag]);

		if (pagesData[fileKey] && pagesData[fileKey].data) {
			let templateWxml = "";
			if (/\?/.test(templateName)) {
				//含有三元表达式的情况，需注意，目前仅支持简单的三元表达式
				let reg = /{{\s*(.*?)\s*\?\s*(.*?)\s*:\s*(.*?)\s*}}/;
				templateName.replace(reg, function (match, $1, $2, $3) {
					//
					let attr = " v-if=\"" + $1 + "\"";
					let name2 = $2.replace(/^['"]|['"]$/g, "");
					templateWxml += replaceTagByTemplate(item, templateList, name2, attr);
					//
					attr = " v-else";
					let name3 = $3.replace(/^['"]|['"]$/g, "");
					templateWxml += replaceTagByTemplate(item, templateList, name3, attr);
				});
			} else {
				templateWxml = replaceTagByTemplate(item, templateList, templateName);
			}

			let minWxml = pagesData[fileKey].data.minWxml;
			let wxml = pagesData[fileKey].data.wxml;
			if (minWxml) pagesData[fileKey].data.minWxml = minWxml.replace(templateTagContent, templateWxml);
			if (wxml)  pagesData[fileKey].data.wxml = wxml.replace(templateTagContent, templateWxml);
		} else {
			console.log("页面不存在 ", fileKey, pagesData[fileKey])
		}
	}
}

module.exports = templateTagHandle;