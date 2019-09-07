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
//computed对象
let computedValue = {};
//wacth对象
let watchValue = {};
//判断当前文件类型，true表示页面，false表示组件
let isPage = true;

//工作目录
let miniprogramRoot = "";
//当前处理的js文件路径
let file_js = "";
//当前文件所在目录
let fileDir = "";


/*
 *
 * 注：为防止深层遍历，将直接路过子级遍历，所以使用enter进行全遍历时，孙级节点将跳过
 * 
 */
const componentVistor = {
	ExpressionStatement(path) {
		//判断当前文件是Page还是Component(还有第三种可能->App，划分到Page)
		if (t.isProgram(path.parent)) {
			let callee = path.get('expression.callee');
			//这里不严谨，有等于App的情况，按页面处理得了
			if (callee && callee.node && t.isIdentifier(callee.node, { name: "Component" })) {
				isPage = false;
			}
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
	},
	VariableDeclaration(path) {
		//将require()里的地址都处理一遍
		traverse(path.node, {
			noScope: true,
			CallExpression(path) {
				let callee = path.node.callee;
				if (t.isIdentifier(callee, { name: "require" })) {
					let arguments = path.node.arguments;
					if (arguments && arguments.length) {
						if (t.isStringLiteral(arguments[0])) {
							let filePath = arguments[0].value;
							filePath = pathUtil.relativePath(filePath, global.miniprogramRoot, fileDir);
							path.node.arguments[0] = t.stringLiteral(filePath);
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
		}
	},
	FunctionDeclaration(path) {
		const parent = path.parentPath.parent;
		if (t.isFile(parent)) {
			//定义的外部函数
			declareStr += `${generate(path.node).code}\r\n`;
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
		switch (name) {
			case 'data':
				if (vistors.data.getData().length == 0) {
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
				//globalData 存入生命周期
				vistors.lifeCycle.handle(path.node);
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
				properties.forEach(function (item) {
					vistors.props.handle(item);
				});
				path.skip();
				break;
			case 'methods':
				//组件特有生命周期: methods
				var properties = path.node.value.properties;
				properties.forEach(function (item) {
					vistors.methods.handle(item);
				});
				path.skip();
				break;
			default:
				const parent = path.parentPath.parent;
				const value = parent.value;

				//console.log("name", name)
				//如果父级不为data时，那么就加入生命周期，比如app.js下面的全局变量
				if (value == dataValue) {
					vistors.data.handle(path.node);
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
							vistors.methods.handle(path.node);
						}
						path.skip();
					}
				}
				break;
		}
	}
}
const componentConverter = function (ast, _miniprogramRoot, _file_js) {
	//清空上次的缓存
	declareStr = '';
	//data对象
	dataValue = {};
	//computed对象
	computedValue = {};
	//wacth对象
	watchValue = {};
	//
	isPage = true;
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
		convertedJavascript: traverse(ast, componentVistor),
		vistors: vistors,
		declareStr, //定义的变量和导入的模块声明
		isPage
	}
}

module.exports = componentConverter;
