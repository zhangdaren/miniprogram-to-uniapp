/*
 * 合并wxs文件
 * 注：目前有个小问题：合并前的文件没法添加上注释，当然也无伤大雅了
 */
const fs = require('fs-extra');
const t = require('@babel/types');
const nodePath = require('path');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const JavascriptParser = require('./js/JavascriptParser');
const clone = require('clone');
const utils = require('../utils/utils.js');
const babelUtil = require('../utils/babelUtil.js');

//初始化一个解析器
const javascriptParser = new JavascriptParser();

/**
 * 合并wxs 处理入口方法
 * @param {*} fileData  要处理的文件内容 
 */
async function combineWxsHandle(srcWxsFile, targetWxsFile) {
	const srcWxsFolder = nodePath.dirname(srcWxsFile);
	const targetWxsFolder = nodePath.dirname(targetWxsFile);

	let codeText = "";
	if (fs.existsSync(srcWxsFile)) {
		const { codeText: content } = await parseWxs(srcWxsFolder, targetWxsFolder, srcWxsFile, targetWxsFile, true);
		codeText = content;
	} else {
		const logStr = "Error: " + nodePath.relative(global.miniprogramRoot, srcWxsFile) + "不存在";
		utils.log(logStr);
		global.log.push(logStr);
	}
	return codeText;
}

/**
 * 从ast里删除module.exports.xxx = xxx表达式
 * @param {*} ast 
 */
function removeAstModuleExports(ast) {
	const astClone = clone(ast);
	//删除module.exports.xxx = xxx;
	traverse(astClone, {
		ExpressionStatement(path) {
			var left = path.get("expression.left");
			if (t.isMemberExpression(left) && t.isMemberExpression(left.node.object) && t.isIdentifier(left.node.object.object, { name: "module" })) {
				path.remove();
			}
		}
	});

	return astClone;
}
/**
 * 并转换外部wxs文件的引用为当前文件，如:
 * var array = require('./array.wxs')
 * array.isArray(conf)  ==>  isArray(conf)
 * @param {*} ast 
 * @param {*} nameList 要删除的引用 
 */
function removeAstNameList(ast, nameList) {
	const astClone = clone(ast);
	//删除module.exports.xxx = xxx;
	traverse(astClone, {
		CallExpression(path) {
			let callee = path.node.callee;
			const arguments = path.node.arguments;
			if (t.isMemberExpression(callee) && t.isIdentifier(callee.object)) {
				const name = callee.object.name;
				if (nameList && nameList[name]) {
					const propertyName = callee.property.name;
					const callee2 = t.callExpression(t.identifier(propertyName), arguments);
					path.replaceWith(callee2);
				}
			}
		}
	});

	return astClone;
}

/**
 * 解析wxs文件，识别里面require了外部wxs文件时，递归解析，直到最后一个文件，并将外部wxs合并到当前wxs文件里
 * @param {*} wxsFolder        当前处理的wxs目录，不变
 * @param {*} srcWxsFile       要处理的wxs文件
 * @param {*} targetWxsFile    处理的wxs要保存的路径
 */
async function parseWxs(srcWxsFolder, targetWxsFolder, srcWxsFile) {
	//1.读入文件，正则匹配require()里的路径并去掉，并保存新文件
	//2.然后再读入子路径，
	let codeText = "";
	let replaceList = [];
	let data_wxs = fs.readFileSync(srcWxsFile, 'utf8');
	let ast;
	if (data_wxs) {
		//解析成AST
		ast = await javascriptParser.parse(data_wxs);

		traverse(ast, {
			VariableDeclarator(path) {
				//处理外部声明的require，如var array = require('./array.wxs');
				const initPath = path.node.init;
				let callee = null;
				if (t.isCallExpression(path.node.init)) {
					callee = initPath.callee;
				} else if (t.isMemberExpression(path.node.init)) {
					callee = initPath.object.callee;
				}
				if (callee && t.isIdentifier(callee, { name: "require" })) {
					let arguments = initPath.arguments || initPath.object.arguments;
					if (arguments && arguments.length) {
						if (t.isStringLiteral(arguments[0])) {
							hasQuire = true;
							let filePath = arguments[0].value;
							replaceList.push({
								name: path.node.id.name,
								path,
								relativePath: filePath
							});
						}
					}
				}
			}
		});
	}

	var nameList = {};
	//替换掉require(xxx)表达式
	for (const key in replaceList) {
		const { name, path, relativePath } = replaceList[key];
		nameList[name] = name;
		const wxsFolder = nodePath.dirname(srcWxsFile);
		const file_wxs = nodePath.join(wxsFolder, relativePath);
		const targetWxsFile = nodePath.join(targetWxsFolder, relativePath);
		if (!fs.existsSync(file_wxs)) {
			const logStr = "Error: " + nodePath.relative(global.miniprogramRoot, file_wxs) + "不存在";
			utils.log(logStr);
			global.log.push(logStr);
			continue;
		}

		if (global.wxsFileList.hasOwnProperty(file_wxs)) {
			console.log(file_wxs + " 已存在，直接使用缓存")
			let { ast: subAst, nameList: nameList2 } = global.wxsFileList[file_wxs];

			let subAstClone = removeAstModuleExports(subAst);
			subAstClone = removeAstNameList(subAstClone, nameList2);

			if (path && path.parentPath) {
				path.parentPath.replaceWithMultiple(subAstClone.program.body);
				babelUtil.addComment(subAstClone.program.body[0], "/////////////////////////////////" + nodePath.relative(global.miniprogramRoot, file_wxs) + "/////////////////////////////////")
			}
		} else {
			//递归解析文件
			let { codeText: subCodeText, ast: subAst, nameList: nameList2 } = await parseWxs(srcWxsFolder, targetWxsFolder, file_wxs);
			subAst = removeAstModuleExports(subAst);
			subAst = removeAstNameList(subAst, nameList2);

			//如果文件已经读取了，就存入内存，下次直接用这个，增删
			global.wxsFileList[file_wxs] = {
				ast: clone(subAst),
				codeText: subCodeText,
				nameList: nameList
			};
			// const fileContent = generate(ast).code;
			// //写入文件
			// fs.writeFile(targetWxsFile, fileContent, () => {
			// 	console.log(`Convert ${file_wxs}.wxss success!`);
			// });
			if (path && path.parentPath) {
				path.parentPath.replaceWithMultiple(subAst.program.body);
				babelUtil.addComment(subAst.program.body[0], "/////////////////////////////////" + nodePath.relative(global.miniprogramRoot, file_wxs) + "/////////////////////////////////")
			}
		}
	}

	let subAst = removeAstModuleExports(ast);

	global.wxsFileList[srcWxsFile] = {
		ast: subAst || ast,
		codeText,
		nameList
	};

	ast = removeAstNameList(ast, nameList);
	codeText = generate(ast).code;
	return { codeText, ast, nameList };
}

module.exports = combineWxsHandle;
