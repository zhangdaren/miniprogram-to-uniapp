/*
 *
 * 处理wxs文件
 * 
 */
const t = require('@babel/types');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const JavascriptParser = require('./js/JavascriptParser');

/**
 * wxs 处理入口方法
 * @param {*} fileData  要处理的文件内容 
 */
async function wxsHandle(fileData) {
	//先反转义
	let wxsContent = fileData;

	//初始化一个解析器
	let javascriptParser = new JavascriptParser();

	//解析成AST
	let ast = await javascriptParser.parse(wxsContent);

	/**
	 * 替换代码
	 * 1.getDate() --> new Date() 
	 * 2.getRegExp() --> new RegExp()   
	 */
	traverse(ast, {
		CallExpression(path) {
			let callee = path.node.callee;
			if (t.isIdentifier(callee, { name: "getDate" })) {
				path.node.callee = t.identifier("new Date");
			} else if (t.isIdentifier(callee, { name: "getRegExp" })) {
				path.node.callee = t.identifier("new RegExp");
			}
		}
	});

	//生成文本并写入到文件
	let codeText = generate(ast).code;

	// console.log(codeText);
	return codeText;
}
module.exports = wxsHandle;
