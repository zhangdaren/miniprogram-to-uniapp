const t = require('@babel/types');
const nodePath = require('path');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const Vistor = require("./Vistor");
const clone = require('clone');
const pathUtil = require('../../utils/pathUtil');
const babelUtil = require('../../utils/babelUtil');
//
let vistors = {};

//外部定义的变量
let declareStr = '';

//data对象
let dataValue = {};

//computed对象
let computedValue = {};

//wacth对象
let watchValue = {};

//当前处理的js文件路径
let file_js = "";

//当前文件所在目录
let fileDir = "";


/*
 * 注：为防止深层遍历，将直接路过子级遍历，所以使用enter进行全遍历时，孙级节点将跳过
 * 
 */
const componentVistor = {
	IfStatement(path) {
		babelUtil.getAppFunHandle(path);
	},
	ExpressionStatement(path) {
		const parent = path.parentPath.parent;
		if (t.isCallExpression(path.node.expression)) {
			const calleeName = t.isIdentifier(path.node.expression.callee) ? path.node.expression.callee.name.toLowerCase() : "";
			if (t.isFile(parent) && calleeName != "app" && calleeName != "page" && calleeName != "component" && calleeName != "vantcomponent") {
				//定义的外部函数
				declareStr += `${generate(path.node).code}\r\n`;
				path.skip();
			}
		// } else if (t.isAssignmentExpression(path.node.expression)) {
		} else {
			//有可能app.js里是这种结构，exports.default = App({});
			//path.node 为AssignmentExpression类型，所以这里区分一下
			if (t.isFile(parent)) {
				declareStr += `${generate(path.node).code}\r\n`;
			}
		}
	},
	ImportDeclaration(path) {
		//定义的导入的模块
		//处理import模板的路径，转换当前路径以及根路径为相对路径
		let filePath = path.node.source.value;
		filePath = nodePath.join(nodePath.dirname(filePath), pathUtil.getFileNameNoExt(filePath)); //去掉扩展名
		filePath = pathUtil.relativePath(filePath, global.miniprogramRoot, fileDir);
		path.node.source.value = filePath;

		var str = `${generate(path.node).code}\r\n`;
		//
		declareStr += str;
		path.skip();
	},
	VariableDeclaration(path) {
		const parent = path.parentPath.parent;
		if (t.isFile(parent)) {

			//将require()里的地址都处理一遍
			traverse(path.node, {
				noScope: true,
				CallExpression(path2) {
					let callee = path2.get("callee");
					let property = path2.get("property");
					if (t.isIdentifier(callee.node, { name: "require" })) {
						let arguments = path2.node.arguments;
						if (arguments && arguments.length) {
							if (t.isStringLiteral(arguments[0])) {
								let filePath = arguments[0].value;
								filePath = pathUtil.relativePath(filePath, global.miniprogramRoot, fileDir);
								path2.node.arguments[0] = t.stringLiteral(filePath);
							}
						}
					} else if (t.isIdentifier(callee.node, { name: "getApp" })) {
						/**
						 * getApp().xxx; 
						 * 替换为:
						 * getApp().globalData.xxx;
						 * 
						 * 虽然var app = getApp()已替换，还是会有漏网之鱼，如var t = getApp();
						 */
						const parent2 = path2.parentPath;
						if (t.isMemberExpression(parent2.node) && parent2.node.property && parent2.node.property.name !== "globalData") {
							const me = t.memberExpression(t.callExpression(t.identifier("getApp"), []), t.identifier("globalData"));
							path2.replaceWith(me);
							path2.skip();
						}
					}
				},
				VariableDeclarator(path2) {
					if (t.isMemberExpression(path2.node.init) && path2.node.init.object) {
						let id = path2.node.id;
						let init = path2.node.init;
						let property = init.property;
						let objectPath = path2.node.init.object;
						let subOject = objectPath.object;
						let subProperty = objectPath.property;
						if (t.isIdentifier(subOject, { name: "app" })) {
							//这里调babelUtil.globalDataHandle(path2.get("init"))即可
							let getApp = t.callExpression(t.identifier('getApp'), []);
							let subMe = t.MemberExpression(t.MemberExpression(getApp, t.identifier('globalData')), subProperty);
							let me = t.MemberExpression(subMe, property);
							let vd = t.variableDeclarator(path2.node.id, me);
							path.replaceWith(vd);
							path.skip();
						}
					} else if (t.isCallExpression(path2.node.init)) {
						//处理外部声明的require，如var md5 = require("md5.js");
						const initPath = path2.node.init;
						let callee = initPath.callee;
						if (t.isIdentifier(callee, { name: "require" })) {
							let arguments = initPath.arguments;
							if (arguments && arguments.length) {
								if (t.isStringLiteral(arguments[0])) {
									let filePath = arguments[0].value;
									filePath = pathUtil.relativePath(filePath, global.miniprogramRoot, fileDir);
									initPath.arguments[0] = t.stringLiteral(filePath);
								}
							}
						}
						//删除var wxParse = require("../../../wxParse/wxParse.js");
						if (path2.node && path2.node.id && path2.node.id.name && path2.node.id.name.toLowerCase() === "wxparse") {
							// babelUtil.addComment(path.parentPath, `${generate(path.node).code}`);  //没法改成注释，只能删除
							path.remove();
						}
					}
				},
				MemberExpression(path) {
					babelUtil.globalDataHandle(path);
				}
			});
			// const parent = path.parentPath.parent;
			// if (t.isFile(parent)) {
			//定义的外部变量
			// vistors.variable.handle(path.node);
			declareStr += `${generate(path.node).code}\r\n`;
			path.skip();
			// }
		}
	},
	FunctionDeclaration(path) {
		const parent = path.parentPath.parent;
		if (t.isFile(parent)) {

			babelUtil.getAppFunHandle(path);

			//定义的外部函数
			declareStr += `${generate(path.node).code}\r\n`;
			path.skip();
		}
	},
	ObjectMethod(path) {
		const parent = path.parentPath.parent;
		const value = parent.value;
		const name = path.node.key.name;
		// console.log("add methods： ", name);
		if (value == computedValue) {
			vistors.computed.handle(path.node);
		} else if (value == watchValue) {
			vistors.watch.handle(path.node);
		} else {
			if (value) {
				//async函数
				vistors.methods.handle(path.node);
			} else {
				//这里function
				if (babelUtil.lifeCycleFunction[name]) {
					//value为空的，可能是app.js里的生命周期函数
					vistors.lifeCycle.handle(path.node);
				} else {
					//类似这种函数 fun(){} 
					vistors.methods.handle(path.node);
				}
			}
		}
		path.skip();
	},

	ObjectProperty(path) {
		const name = path.node.key.name;
		// console.log("name", path.node.key.name)
		// console.log("name", path.node.key.name)
		switch (name) {
			case 'data':
				//只让第一个data进来，暂时不考虑其他奇葩情况
				if (JSON.stringify(dataValue) == "{}") {
					//第一个data，存储起来
					dataValue = path.node.value;
				} else {
					//这里是data里面的data同名属性
					// console.log("add data", name);
					vistors.data.handle(path.node);
					path.skip();
				}
				break;
			case 'computed':
				//只让第一个computed进来，暂时不考虑其他奇葩情况
				if (JSON.stringify(computedValue) == "{}") {
					//第一个computed，存储起来
					computedValue = path.node.value;
				}
				break;
			case 'watch':
				//只让第一个watch进来，暂时不考虑其他奇葩情况
				if (JSON.stringify(watchValue) == "{}") {
					//第一个watch，存储起来
					watchValue = path.node.value;
				}
				break;
			case 'observers':
				//observers移入到watch
				var properties = path.node.value.properties;
				if (properties) {
					properties.forEach(function (item) {
						vistors.watch.handle(item);
					});
				}
				path.skip();
				break;
			default:
				const parent = path.parentPath.parent;
				const value = parent.value;
				// console.log("name", path.node.key.name)
				//如果父级不为data时，那么就加入生命周期，比如app.js下面的全局变量
				if (value && value == dataValue) {
					vistors.data.handle(path.node);
					//如果data下面的变量为数组时，不遍历下面的内容，否则将会一一列出来
					if (path.node.value && t.isArrayExpression(path.node.value)) path.skip();
				} else {
					const node = path.node.value;
					if (t.isFunctionExpression(node) || t.isArrowFunctionExpression(node) || t.isObjectExpression(node)) {
						//这里function
						if (babelUtil.lifeCycleFunction[name]) {
							// console.log("add lifeCycle： ", name);
							vistors.lifeCycle.handle(path.node);
							//跳过生命周期下面的子级，不然会把里面的也给遍历出来
						} else if (value == computedValue) {
							vistors.computed.handle(path.node);
						} else if (value == watchValue) {
							vistors.watch.handle(path.node);
						} else {
							if (node.properties) {
								//如果是对象，就放入data
								vistors.data.handle(path.node);
							} else {
								vistors.methods.handle(path.node);
							}
						}
						path.skip();
					} else if (t.isCallExpression(node)) {
						vistors.lifeCycle.handle(path.node);
					} else {
						//这里判断一下，有些非常规写法，还真没什么好方法来区分，如下代码写法：
						//下面不判断的话，list:e.result.data会被加入到data里，而报错
						// Page((_defineProperty(_Page = {
						// 	data: {
						// 		edit_state: 0,
						// 		select_all_state: !1
						// 	},
						// },_defineProperty(_Page, "onShow", function() {
						// 	var t = this;
						// 	http.post("apicloud/like_list", {}).then(function(e) {
						// 		t.setData({
						// 			list: e.result.data
						// 		});
						// 	});
						// }),_Page));
						if (t.isObjectProperty(path.node)) {
							const value = path.node.value;
							if (value.object && t.isMemberExpression(value.object) && value.object.object.name != "e") {
								vistors.data.handle(path.node);
							}
						} else {
							vistors.data.handle(path.node);
						}
					}
				}
				break;
		}
	}
}

/**
 * 转换
 * @param {*} ast               ast
 * @param {*} _file_js          当前转换的文件路径
 * @param {*} isVueFile         是否为vue文件
 */
const pageConverter = function (ast, _file_js, isVueFile) {
	//清空上次的缓存
	declareStr = '';
	//data对象
	dataValue = {};
	//computed对象
	computedValue = {};
	//wacth对象
	watchValue = {};
	//
	file_js = _file_js;
	fileDir = nodePath.dirname(file_js);
	//
	vistors = {
		props: new Vistor(),
		data: new Vistor(),
		events: new Vistor(),
		computed: new Vistor(),
		components: new Vistor(),
		watch: new Vistor(),
		methods: new Vistor(),
		lifeCycle: new Vistor(),
	}

	traverse(ast, componentVistor);

	return {
		convertedJavascript: ast,
		vistors: vistors,
		declareStr, //定义的变量和导入的模块声明
	}
}

module.exports = pageConverter;
