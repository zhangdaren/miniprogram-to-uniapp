/*
 *
 * 处理template上面的参数
 * 
 */
const t = require('@babel/types');
const nodePath = require('path');
const parse = require('@babel/parser').parse;
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const template = require('@babel/template').default;
const JavascriptParser = require('./js/JavascriptParser');
const clone = require('clone');

const utils = require('../utils/utils.js');
const pathUtil = require('../utils/pathUtil.js');



/**
 * 替换字段名，根据replacePropsMap是否存在来判断用哪种方式替换
 * @param {*} name 
 * @param {*} replaceProps 
 */
function replaceField(name, replacePropsMap = {}) {
	if (!name) return "";
	let reuslt = name;
	if (utils.isObject(replacePropsMap)) {
		reuslt = replacePropsMap[name] || name;
	} else {
		reuslt = utils.getPropsAlias(name);
	}
	return reuslt;
}


/**
 * 解析params
 * @param {*} params 
 */
function parseParams(params, replacePropsMap = {}) {
	if (!/[\.\[\]\(\)]/.test(params)) return params;
	//先反转义
	let javascriptContent = params;

	//初始化一个解析器
	let javascriptParser = new JavascriptParser();

	let javascriptAst = null;
	let isParseError = false; //标识是否解析报错
	let codeText = params;
	try {
		//解析成AST
		javascriptAst = javascriptParser.parse(javascriptContent);
	} catch (error) {
		isParseError = true;
		// const logStr = "Error: paramsHandle --> 解析字符串(\"" + params + "\")出错: " + error + "(不用理会)";
		// utils.log(logStr, "base");
		// global.log.push(logStr);
	} finally {
		if (isParseError) {
			//如果params="default"时，会解析出错，这里直接进行判断
			codeText = replaceField(params, replacePropsMap);
		} else {
			let astBak = clone(javascriptAst);
			traverse(javascriptAst, {
				ConditionalExpression(path) {
					const test = path.get("test");
					const consequent = path.get("consequent");
					const alternate = path.get("alternate");
					// 判断是不是Identifier
					test.node.name = replaceField(test.node.name, replacePropsMap);
					consequent.node.name = replaceField(consequent.node.name, replacePropsMap);
					alternate.node.name = replaceField(alternate.node.name, replacePropsMap);
					// console.log("ConditionalExpression-", test.node.name)
				},
				MemberExpression(path) {
					const object = path.get("object");
					if (object.node.name) object.node.name = replaceField(object.node.name, replacePropsMap);
					// console.log("MemberExpression-", object.node.name)
				},
				ExpressionStatement(path) {
					const expression = path.get("expression");
					if (expression.node.name) expression.node.name = replaceField(expression.node.name, replacePropsMap);
					// console.log("ExpressionStatement-", expression.node.name)
				},
				BinaryExpression(path) {
					const left = path.get("left");
					if (left.node.name) left.node.name = replaceField(left.node.name, replacePropsMap);
					// console.log("BinaryExpression-", left.name)
				},
			});
			let oldCode = `${generate(astBak).code}`;
			let newCode = `${generate(javascriptAst).code}`;
			if (newCode !== oldCode) {
				codeText = newCode;
				let logStr = "[绑定值命名替换]:  " + oldValue + "  -->  " + newValue + "    file: " + path.relative(global.sourceFolder, file_wxml);
				
				//存入日志，方便查看
				utils.log(logStr, "base");
				global.logArr.rename.push(logStr);
			}
		}
	}
	return codeText;
}


/**
 * 替换template里参数里的内置关键字，如data、id等  
 * @param {*} params 
 */
function replaceReserverdKeyword(params) {
	return params.replace(/{{(.*?)}}/g, function (match, $1) {
		var result = parseParams($1);
		result = result.replace(/;/g, "");
		return "{{" + result + "}}";
	});
}


/**
 * 替换template里参数里的内置关键字，如data、id等  
 * "{{data.text}}"  --> {{dataAttr.text}}   
 * "{{id}}"  --> {{idAttr}}  
 * @param {*} params 
 * @param {*} isComponent 
 * @param {*} isInitialCode 
 */
function paramsHandle(params, isComponent, isInitialCode = true, replacePropsMap = {}) {
	let reg_tag = /{{.*?}}/; //注：连续test时，这里不能加/g，因为会被记录上次index位置
	var result = params.trim();
	if (isComponent && result) {
		//替换template里参数里的内置关键字
		if (reg_tag.test(result)) {
			if (isInitialCode) {
				if (utils.hasReserverdPorps(result)) {
					result = replaceReserverdKeyword(result);
				}
			} else {
				result = parseParams(result, replacePropsMap);
				result = result.replace(/;/g, "");
			}
		} else {
			result = parseParams(result, replacePropsMap);
			result = result.replace(/;/g, "");
		}
	}
	return result;
}

module.exports = paramsHandle;
