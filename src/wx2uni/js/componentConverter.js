const t = require('@babel/types');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const Vistor = require("./Vistor");

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
/*
 *
 * 注：因为遍历时，会因为防止深层遍历，而直接路过子级遍历，所以如果添加enter进行全遍历时，孙级节点将跳过
 * 
 */
const componentVistor = {
	ImportDeclaration(path) {
		//定义的导入的模块
		// vistors.importDec.handle(path.node);
		//
		//处理导入的是wxss的情况，替换.wxss为.css即可。
		var str = `${generate(path.node).code}\r\n`;
		str = str.split(".wxss").join(".css");
		//
		declareStr += str;
	},
	VariableDeclaration(path) {
		const parent = path.parentPath.parent;
		if (!parent) {	
			//定义的外部变量
			// vistors.variable.handle(path.node);
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
				//value为空的，可能是app.js里的生命周期函数
				vistors.lifeCycle.handle(path.node);
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
					//第一个data，存储起来
					computedValue = path.node.value;
				}
				break;
			case 'watch':
				//只让第一个watch进来，暂时不考虑其他奇葩情况
				if (JSON.stringify(watchValue) == "{}") {
					//第一个data，存储起来
					watchValue = path.node.value;
				}
				break;
			case 'globalData':
				//方案一：
				//全局变量，因为uni-app没有对应的结构，所以这里直接存入到data里，至少代码不会报错!!!
				//vistors.data.handle(path.node);

				//方案二：
				//挂载vue的原型上，改动较少，后面再使用vuex
				//在这里直接忽略globalData
				break;
			default:
				const parent = path.parentPath.parent;
				const value = parent.value;
				//如果父级不为data时，那么就加入

				if (value == dataValue) {
					vistors.data.handle(path.node);
				} else {
					const node = path.node.value;
					if (t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) {
						//这里function
						if (lifeCycleFunction[name]) {
							// console.log("add lifeCycle： ", name);
							vistors.lifeCycle.handle(path.node);
							//跳过生命周期下面的子级，不然会把里面的也给遍历出来
							path.skip();
						} else if (value == computedValue) {
							vistors.computed.handle(path.node);
						} else if (value == watchValue) {
							vistors.watch.handle(path.node);
						} else {
							vistors.methods.handle(path.node);
							path.skip();
						}
					}
				}
				break;
		}
	}
}
const componentConverter = function (ast) {
	//清空上次的缓存
	declareStr = '';
	//data对象
	dataValue = {};
	//computed对象
	computedValue = {};
	//wacth对象
	watchValue = {};
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
		declareStr //定义的变量和导入的模块声明
	}
}

module.exports = componentConverter;
