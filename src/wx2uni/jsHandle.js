/*
 *
 * 处理js文件
 * 
 */
const t = require('@babel/types');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const template = require('@babel/template').default;
const path = require('path');
const fs = require('fs');
const JavascriptParser = require('./js/JavascriptParser');
const componentConverter = require('./js/componentConverter');

//将ast属性数组组合为ast对象
function arrayToObject(pathAry) {
	return t.objectExpression(pathAry);
}

const componentTemplate =
	`
export default {
  data() {
    return DATA
  },
  props:PROPS,
  methods: METHODS,
  computed: COMPUTED,
  watch:WATCH,
}
`;

const componentTemplateApp =
	`
export default {
  data() {
    return DATA
  },
}
`;

//output "let = right;"
function buildAssignment(left, right) {
	return t.assignmentExpression("=", left, right);
}
//output "this.let = right;"
function buildAssignmentWidthThis(left, right) {
	return t.assignmentExpression("=", t.memberExpression(t.thisExpression(), left), right);
}

const componentTemplateBuilder = function (ast, vistors, isApp) {
	// console.log("--- componentTemplateBuilder1");
	let buildRequire = null;
	if (isApp) {
		//是app.js文件,要单独处理
		buildRequire = template(componentTemplateApp);
		//app.js目前看到有data属性的，其余的还未看到。
		ast = buildRequire({
			DATA: arrayToObject(vistors.data.getData())
		});
	} else {
		//非app.js文件
		buildRequire = template(componentTemplate);

		ast = buildRequire({
			PROPS: arrayToObject(vistors.props.getData()),
			DATA: arrayToObject(vistors.data.getData()),
			METHODS: arrayToObject(vistors.methods.getData()),
			COMPUTED: arrayToObject(vistors.computed.getData()),
			WATCH: arrayToObject(vistors.watch.getData()),
		});

	}
	//久久不能遍历，搜遍google，template也没有回调，后面想着源码中应该会有蛛丝马迹，果然，在templateVisitor里找到了看到这么一个属性noScope，有点嫌疑
	//noScope: 从babel-template.js中发现这么一个属性，因为直接转出来的ast进行遍历时会报错，找了官方文档，没有这个属性的介绍信息。。。
	// Error: You must pass a scope and parentPath unless traversing a Program/File. Instead of that you tried to traverse a ExportDefaultDeclaration node without passing scope and parentPath.
	//babel-template直接转出来的ast只是完整ast的一部分
	traverse(ast, {
		noScope: true,
		ObjectMethod(path) {
			// console.log("--------", path.node.key.name);
			if (path.node.key.name === 'data') {
				var liftCycleArr = vistors.lifeCycle.getData();
				for (let key in liftCycleArr) {
					// console.log(liftCycleArr[key]);
					path.insertAfter(liftCycleArr[key]);
				}
				//停止，不往后遍历了
				path.skip();

				if (isApp) {
					var methodsArr = vistors.methods.getData();
					for (let key in methodsArr) {
						// console.log(liftCycleArr[key]);
						path.insertAfter(methodsArr[key]);
					}
				}
			}
		},
		MemberExpression(path) {
			//解决this.setData的问题
			let object = path.get('object');
			let property = path.get('property');
			//
			let parent = path.parent;

			if (t.isThisExpression(object)) {
				if (t.isIdentifier(property.node, { name: "setData" })) {
					let nodeArr = [];
					if (parent.arguments) {
						parent.arguments.forEach(function (obj) {
							obj.properties.forEach(function (item) {
								let node = t.expressionStatement(buildAssignmentWidthThis(item.key, item.value));
								nodeArr.push(node);
							});
						});
						if (nodeArr.length > 0) {
							//将this.setData({})进行替换
							//!!!!!!!!这里找父级使用递归查找，有可能path的上一级会是CallExpression!!!!!
							parent = path.findParent((parent) => parent.isExpressionStatement())
							parent.replaceWithMultiple(nodeArr);
						}
					}

				} else if (t.isIdentifier(property.node, { name: "data" })) {
					//将this.data替换为this
					path.replaceWith(t.thisExpression());
				}
			}
		},
		enter(path) {
			// console.log("enter -----  ", path.node);
		}
	});
	return ast;
}

async function jsHandle(fileData, isApp) {
	//先反转义
	let javascriptContent = fileData;

	//初始化一个解析器
	let javascriptParser = new JavascriptParser();

	//去除无用代码
	javascriptContent = javascriptParser.beforeParse(javascriptContent);

	//解析成AST
	let javascriptAst = await javascriptParser.parse(javascriptContent);

	//进行代码转换
	let {
		convertedJavascript,
		vistors,
		declareStr
	} = componentConverter(javascriptAst);

	//放到预先定义好的模板中
	convertedJavascript = componentTemplateBuilder(javascriptAst, vistors, isApp);

	//生成文本并写入到文件
	let codeText = `<script>\r\n${declareStr}\r\n${generate(convertedJavascript).code}\r\n</script>\r\n`;

	return codeText;
}
module.exports = jsHandle;
