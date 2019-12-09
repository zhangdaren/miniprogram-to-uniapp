const t = require('@babel/types');
const nodePath = require('path');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const Vistor = require("./Vistor");
const clone = require('clone');
const pathUtil = require('../../utils/pathUtil');
const babelUtil = require('../../utils/babelUtil');


//当前文件所在目录
let fileDir = "";

/*
 * 
 */
const singleJSVistor = {
	CallExpression(path) {
		//处理require()里面的路径
		babelUtil.requirePathHandle(path, fileDir);
	},
	ImportDeclaration(path) {
		//定义的导入的模块
		//处理import模板的路径，转换当前路径以及根路径为相对路径
		let filePath = path.node.source.value;
		filePath = nodePath.join(nodePath.dirname(filePath), pathUtil.getFileNameNoExt(filePath)); //去掉扩展名
		filePath = pathUtil.relativePath(filePath, global.miniprogramRoot, fileDir);
		path.node.source.value = filePath;
	},
	// VariableDeclaration(path) {
	// 	traverse(path.node, {
	// 		noScope: true,
	// 		VariableDeclarator(path2) {
	// 			if (t.CallExpression(path2.node.init)) {
	// 				if(t.isIdentifier(path2.node.init.callee, {name:"getApp"})){
	// 					path2.remove();
	// 				}
	// 			}
	// 		}
	// 	});
	// },
}

/**
 * 处理单独的js文件
 * @param {*} ast               ast
 * @param {*} _file_js          当前转换的文件路径
 */
const singleJSConverter = function (ast, _file_js) {
	file_js = _file_js;
	fileDir = nodePath.dirname(file_js);
	traverse(ast, singleJSVistor);
	return ast;
}

module.exports = singleJSConverter;
