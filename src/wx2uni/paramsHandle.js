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
 * 参数 处理入口方法
 */
function paramsHandle(params) {
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
		const logStr = "Error: 解析字符串(\"" + params + "\")出错: " + error + "(不用理会)";
		utils.log(logStr, "base");
		global.log.push(logStr);
	} finally {
		if (isParseError) {
			//如果params="default"时，会解析出错，这里直接进行判断
			codeText = utils.getPropsAlias(params);
		} else {
			traverse(javascriptAst, {
				ConditionalExpression(path) {
					const test = path.get("test");
					const consequent = path.get("consequent");
					const alternate = path.get("alternate");
					// 判断是不是Identifier
					test.node.name = utils.getPropsAlias(test.node.name);
					consequent.node.name = utils.getPropsAlias(consequent.node.name);
					alternate.node.name = utils.getPropsAlias(alternate.node.name);
					// console.log("ConditionalExpression-", test.node.name)
				},
				MemberExpression(path) {
					const object = path.get("object");
					if (object.node.name) object.node.name = utils.getPropsAlias(object.node.name);
					// console.log("MemberExpression-", object.node.name)
				},
				ExpressionStatement(path) {
					const expression = path.get("expression");
					if (expression.node.name) expression.node.name = utils.getPropsAlias(expression.node.name);
					// console.log("ExpressionStatement-", expression.node.name)
				},
				BinaryExpression(path) {
					const left = path.get("left");
					if (left.node.name) left.node.name = utils.getPropsAlias(left.node.name);
					// console.log("BinaryExpression-", left.name)
				},
			});
			codeText = `${generate(javascriptAst).code}`;
		}
	}



	return codeText;
}
module.exports = paramsHandle;
