/*
 *
 * 处理js文件
 * 
 */
const t = require('@babel/types');
const path = require('path');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const template = require('@babel/template').default;
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
  components: {},
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
//output "this.left = right;"
function buildAssignmentWidthThis(left, right) {
	return t.assignmentExpression("=", t.memberExpression(t.thisExpression(), left), right);
}
//output "that.left = right;"  //后面有需求再考虑其他关键字
function buildAssignmentWidthThat(left, right, name) {
	return t.assignmentExpression("=", t.memberExpression(t.identifier(name), left), right);
}

//处理this.setData
//isThis，区分前缀是this，还是that
function handleSetData(path, isThis) {
	let parent = path.parent;
	let nodeArr = [];
	if (parent.arguments) {
		parent.arguments.forEach(function (obj) {
			if (obj.properties) {
				obj.properties.forEach(function (item) {
					let left = item.key;
					//有可能key是字符串形式的
					if (t.isStringLiteral(left)) left = t.identifier(left.value);
					//
					let node = null;
					if (isThis) {
						node = t.expressionStatement(buildAssignmentWidthThis(left, item.value));
					} else {
						let object = path.get('object');
						node = t.expressionStatement(buildAssignmentWidthThat(left, item.value, object.node.name));
					}

					nodeArr.push(node);
				});
			}
		});
		if (nodeArr.length > 0) {
			//将this.setData({})进行替换
			//!!!!!!!!这里找父级使用递归查找，有可能path的上一级会是CallExpression!!!!!
			parent = path.findParent((parent) => parent.isExpressionStatement())
			parent.replaceWithMultiple(nodeArr);
		}
	}
}

const componentTemplateBuilder = function (ast, vistors, isApp, usingComponents) {
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
	//Error: You must pass a scope and parentPath unless traversing a Program/File. Instead of that you tried to traverse a ExportDefaultDeclaration node without passing scope and parentPath.
	//babel-template直接转出来的ast只是完整ast的一部分
	traverse(ast, {
		noScope: true,
		enter(path) {
			// console.log(path);
			// console.log(path);
		},

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
		ObjectProperty(path) {
			if (path.node.key.name === 'components') {
				//import firstcompoent from '../firstcompoent/firstcompoent'
				//"firstcompoent": "../firstcompoent/firstcompoent"
				//
				// export default {
				// 	components: {
				// 	  ComponentA,
				// 	  ComponentC
				// 	},
				// }
				for (const key in usingComponents) {
					//这里两个小优化空间
					//1.是否有其他操作这个数组方式
					//2.属性名与变量名相同是否可以合并为一个？ (解决，第三个参数：shorthand：true 即可)
					path.node.value.properties.push(t.objectProperty(
						t.identifier(key),
						t.identifier(key),
						false,
						true
					));
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
					//如果是this.setData()时
					handleSetData(path, true);
				} else if (t.isIdentifier(property.node, { name: "data" })) {
					//将this.data替换为this
					path.replaceWith(t.thisExpression());
				}
			} else if (t.isIdentifier(property.node, { name: "setData" })) {
				if (t.isIdentifier(object.node, { name: "that" })) {
					//如果是that.setData()时
					handleSetData(path);
				}
			}

			//uni-app 支持getApp() 这里不作转换
			// if (t.isIdentifier(object.node, { name: "app" })) {
			// 	if (t.isIdentifier(property.node, { name: "globalData" })) {
			// 		//app.globalData.xxx的情况 
			// 		object.replaceWith(t.thisExpression());
			// 	} else {
			// 		//app.fun()的情况 这种不管
			// 	}
			// } else if (t.isCallExpression(object.node) && t.isIdentifier(path.get('object.callee').node, { name: "getApp" })) {
			// 	//getApp().globalData.userInfo => this.globalData.userInfo
			// 	object.replaceWith(t.thisExpression());
			// }
		}
	});
	return ast;
}

async function jsHandle(fileData, isApp, usingComponents, miniprogramRoot) {
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

	//引入自定义组件
	//import firstcompoent from '../firstcompoent/firstcompoent'
	for (const key in usingComponents) {
		let filePath = usingComponents[key];
		//filePath = filePath.replace(/^\//g, "./"); //相对路径处理
		
		//先转绝对路径，再转相对路径
		filePath = path.join(miniprogramRoot, filePath);
		filePath = path.relative(miniprogramRoot, filePath);
		//
		let node = t.importDeclaration([t.importDefaultSpecifier(t.identifier(key))], t.stringLiteral(filePath));
		declareStr += `${generate(node).code}\r\n`;
	}

	//放到预先定义好的模板中
	convertedJavascript = componentTemplateBuilder(javascriptAst, vistors, isApp, usingComponents);

	//生成文本并写入到文件
	let codeText = `<script>\r\n${declareStr}\r\n${generate(convertedJavascript).code}\r\n</script>\r\n`;

	return codeText;
}
module.exports = jsHandle;
