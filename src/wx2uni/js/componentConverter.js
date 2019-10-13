const t = require('@babel/types');
const nodePath = require('path');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const Vistor = require("./Vistor");
const clone = require('clone');
const pathUtil = require('../../utils/pathUtil');

const lifeCycleFunction = {
	onLoad: true,
	onReady: true,
	onShow: true,
	onHide: true,
	onUnload: true,
	onPullDownRefresh: true,
	onReachBottom: true,
	onShareAppMessage: true,
	onLaunch: true,
	onError: true,
	// submit:true,
	// globalData:true,
}

var vistors = {
	props: new Vistor(),
	data: new Vistor(),
	events: new Vistor(),
	computed: new Vistor(),
	components: new Vistor(),
	watch: new Vistor(),
	methods: new Vistor(),
	lifeCycle: new Vistor(),
}

//外部定义的变量
let declareStr = '';
//data对象
let dataValue = {};
//globalData对象
let globalData = {};
//computed对象
let computedValue = {};
//wacth对象
let watchValue = {};
//判断当前文件类型，true表示页面，false表示组件
let isPage = true;
let isAppFile = false; //表示是否为app页面

//当前处理的js文件路径
let file_js = "";
//当前文件所在目录
let fileDir = "";


/**
 * 根据name创建一个空的objectProperty，retrun name:{}
 * @param {*} name 
 */
function createObjectProperty(name) {
	return t.objectProperty(t.identifier(name), t.objectExpression([]));
}

/*
 *
 * 注：为防止深层遍历，将直接路过子级遍历，所以使用enter进行全遍历时，孙级节点将跳过
 * 
 */
const componentVistor = {
	ExpressionStatement(path) {
		if (t.isCallExpression(path.node.expression)) {

			const calleeName = t.isIdentifier(path.node.expression.callee) ? path.node.expression.callee.name.toLowerCase() : "";
			if (!calleeName || calleeName == "component") {
				isPage = false;
			}

			if (calleeName == "app") isAppFile = true;

			//判断当前文件是Page还是Component(还有第三种可能->App，划分到Page)
			// if (t.isProgram(path.parent)) {
			// 	let callee = path.get('expression.callee');
			// 	//这里不严谨，有等于App的情况，按页面处理得了
			// 	if (callee && callee.node && t.isIdentifier(callee.node, { name: "Component" })) {
			// 		isPage = false;
			// 	}
			// }

			const parent = path.parentPath.parent;
			if (t.isFile(parent) && calleeName != "app" && calleeName != "page" && calleeName != "component" && calleeName != "vantcomponent") {
				//定义的外部函数
				declareStr += `${generate(path.node).code}\r\n`;
				path.skip();
			}
		} else if (t.isAssignmentExpression(path.node.expression)) {
			//有可能app.js里是这种结构，exports.default = App({});
			//path.node 为AssignmentExpression类型，所以这里区分一下

			const exp = path.node.expression;
			const calleeName = (exp.right && exp.right.callee && exp.right.callee.name) ? exp.right.callee.name.toLowerCase() : "";
			if (calleeName == "app") isAppFile = true;
		}
	},
	ImportDeclaration(path) {
		//定义的导入的模块
		// vistors.importDec.handle(path.node);
		//
		//处理import模板的路径，转换当前路径以及根路径为相对路径
		let filePath = path.node.source.value;
		filePath = nodePath.join(nodePath.dirname(filePath), pathUtil.getFileNameNoExt(filePath)); //去掉扩展名
		filePath = pathUtil.relativePath(filePath, global.miniprogramRoot, fileDir);
		path.node.source.value = filePath;

		//处理导入的是wxss的情况，替换.wxss为.css即可。
		var str = `${generate(path.node).code}\r\n`;
		//
		declareStr += str;
		path.skip();
	},
	VariableDeclaration(path) {
		//将require()里的地址都处理一遍
		traverse(path.node, {
			noScope: true,
			CallExpression(path2) {
				let callee = path2.node.callee;
				if (t.isIdentifier(callee, { name: "require" })) {
					let arguments = path2.node.arguments;
					if (arguments && arguments.length) {
						if (t.isStringLiteral(arguments[0])) {
							let filePath = arguments[0].value;
							filePath = pathUtil.relativePath(filePath, global.miniprogramRoot, fileDir);
							path2.node.arguments[0] = t.stringLiteral(filePath);
						}
					}
				} else if (t.isIdentifier(callee, { name: "getApp" })) {
					/**
					 * var app = getApp(); 
					 * 替换为:
					 * var app = getApp().globalData;
					 */
					let arguments = path2.node.arguments;
					if (arguments.length == 0) {
						//一般来说getApp()是没有参数的。
						path2.replaceWith(t.memberExpression(t.callExpression(t.identifier("getApp"), []), t.identifier("globalData")));
						path2.skip();
					}
				}
			},
			VariableDeclarator(path) {
				if (t.isMemberExpression(path.node.init) && path.node.init.object) {
					let id = path.node.id;
					let init = path.node.init;
					let property = init.property;
					let path2 = path.node.init.object;
					let subOject = path2.object;
					let subProperty = path2.property;
					if (t.isIdentifier(subOject, { name: "app" })) {
						//这里没法调babelUtil.globalDataHandle()，子节点没有replaceWidth方法了(或许有转换方法，暂未知)
						let getApp = t.callExpression(t.identifier('getApp'), []);
						let subMe = t.MemberExpression(t.MemberExpression(getApp, t.identifier('globalData')), subProperty);
						let me = t.MemberExpression(subMe, property);
						let vd = t.variableDeclarator(path.node.id, me);
						path.replaceWith(vd);
						path.skip();
					}
				} else if (t.isCallExpression(path.node.init)) {
					//处理外部声明的require，如var md5 = require("md5.js");
					const path2 = path.node.init;
					let callee = path2.callee;
					if (t.isIdentifier(callee, { name: "require" })) {
						let arguments = path2.arguments;
						if (arguments && arguments.length) {
							if (t.isStringLiteral(arguments[0])) {
								let filePath = arguments[0].value;
								filePath = pathUtil.relativePath(filePath, global.miniprogramRoot, fileDir);
								path2.arguments[0] = t.stringLiteral(filePath);
							}
						}
					}
				}
			}
		});
		const parent = path.parentPath.parent;
		if (t.isFile(parent)) {
			//定义的外部变量
			// vistors.variable.handle(path.node);
			declareStr += `${generate(path.node).code}\r\n`;
			path.skip();
		}
	},
	FunctionDeclaration(path) {
		const parent = path.parentPath.parent;
		if (t.isFile(parent)) {
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
				if (lifeCycleFunction[name]) {
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
		switch (name) {
			case 'data':
				if (isAppFile) {
					if (globalData.value && globalData.value.properties) {
					} else {
						globalData = createObjectProperty("globalData");
						vistors.lifeCycle.handle(globalData);
					}
					if (path.node.value && path.node.value.properties) {
						globalData.value.properties = [...globalData.value.properties, ...path.node.value.properties];
					}
					path.skip();
				} else {
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
			case 'globalData':
				//只让第一个globalData进来，暂时不考虑其他奇葩情况
				if (JSON.stringify(globalData) == "{}") {
					//第一个data，存储起来
					globalData = path.node;
					vistors.lifeCycle.handle(globalData);
				} else {
					globalData.value.properties = [...globalData.value.properties, ...path.node.value.properties];
				}
				path.skip();
				break;
			case 'attached':
				//组件特有生命周期: attached-->beforeMount
				let newPath_a = clone(path);
				newPath_a.node.key.name = "beforeMount";
				vistors.lifeCycle.handle(newPath_a.node);
				path.skip();
				break;
			case 'moved':
				//组件特有生命周期: moved-->moved  //这个vue没有对应的生命周期
				let newPath_m = clone(path);
				newPath_m.node.key.name = "moved";
				vistors.lifeCycle.handle(newPath_m.node);
				path.skip();
				break;
			case 'properties':
				//组件特有生命周期: properties-->props
				var properties = path.node.value.properties;
				if (properties) {
					properties.forEach(function (item) {
						vistors.props.handle(item);
					});
				}
				path.skip();
				break;
			case 'methods':
				// console.log(name)
				// console.log(name)
				//组件特有生命周期: methods
				var properties = path.node.value.properties;
				if (properties) {
					properties.forEach(function (item) {
						vistors.methods.handle(item);
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
						if (lifeCycleFunction[name]) {
							// console.log("add lifeCycle： ", name);
							vistors.lifeCycle.handle(path.node);
							//跳过生命周期下面的子级，不然会把里面的也给遍历出来
						} else if (value == computedValue) {
							vistors.computed.handle(path.node);
						} else if (value == watchValue) {
							vistors.watch.handle(path.node);
						} else {
							//App.vue
							if (isAppFile && globalData.value && globalData.value.properties) {
								globalData.value.properties.push(path.node);
							} else {
								if (node.properties) {
									if (isAppFile) {
										globalData = createObjectProperty("globalData");
										vistors.lifeCycle.handle(globalData);
										globalData.value.properties.push(path.node);
									} else {
										//如果是对象，就放入data
										vistors.data.handle(path.node);
									}
								} else {
									vistors.methods.handle(path.node);
								}
							}
						}
						path.skip();
					} else if (t.isCallExpression(node)) {
						if (isAppFile && globalData.value && globalData.value.properties) {
							globalData.value.properties.push(path.node);
						} else {
							if (isAppFile) {
								globalData = createObjectProperty("globalData");
								vistors.lifeCycle.handle(globalData);
								globalData.value.properties.push(path.node);
							} else {
								vistors.lifeCycle.handle(path.node);
							}
						}
					} else {
						if (isAppFile) {
							if (globalData.value && globalData.value.properties) {
							} else {
								globalData = createObjectProperty("globalData");
								vistors.lifeCycle.handle(globalData);
							}
							globalData.value.properties.push(path.node);
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
				}
				break;
		}
	},


}

/**
 * 转换
 * @param {*} ast               ast
 * @param {*} _miniprogramRoot  小程序目录
 * @param {*} _file_js          当前转换的文件路径
 * @param {*} isVueFile         是否为vue文件
 */
const componentConverter = function (ast, _miniprogramRoot, _file_js, isVueFile) {
	//清空上次的缓存
	declareStr = '';
	//data对象
	dataValue = {};
	//globalData对象
	globalData = {};
	//computed对象
	computedValue = {};
	//wacth对象
	watchValue = {};
	//
	isPage = true;
	isAppFile = false;
	//
	miniprogramRoot = _miniprogramRoot;
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

	return {
		convertedJavascript: isVueFile ? ast : traverse(ast, componentVistor),
		vistors: vistors,
		declareStr, //定义的变量和导入的模块声明
		isPage
	}
}

module.exports = componentConverter;
