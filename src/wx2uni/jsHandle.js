/*
 *
 * 处理js文件
 * 
 */
const t = require('@babel/types');
const nodePath = require('path');
const parse = require('@babel/parser').parse;
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const template = require('@babel/template').default;
const JavascriptParser = require('./js/JavascriptParser');
const componentConverter = require('./js/componentConverter');
const {
	isURL,
	toCamel2
} = require('../utils/utils.js');

const {
	getFileNameNoExt, getParentFolderName
} = require('../utils/pathUtil.js');



/**
 * 将ast属性数组组合为ast对象
 * @param {*} pathAry 
 */
function arrayToObject(pathAry) {
	return t.objectExpression(pathAry);
}

/**
 * 子页面/组件的模板
 */
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

/**
 * App页面的模板
 */
const componentTemplateApp =
	`
export default {
  data() {
    return DATA
  },
  methods: METHODS
}
`;

/**
 * 生成"let = right;"表达式
 * @param {*} left 
 * @param {*} right 
 */
function buildAssignment(left, right) {
	return t.assignmentExpression("=", left, right);
}

/**
 * 生成"this.left = right;"表达式
 * @param {*} left 
 * @param {*} right 
 */
function buildAssignmentWidthThis(left, right) {
	return t.assignmentExpression("=", t.memberExpression(t.thisExpression(), left), right);
}

/**
 * 生成"that.left = right;"  //后面有需求再考虑其他关键字
 * @param {*} left 
 * @param {*} right 
 */
function buildAssignmentWidthThat(left, right, name) {
	return t.assignmentExpression("=", t.memberExpression(t.identifier(name), left), right);
}

/**
 * 处理this.setData -- 已弃用
 * @param {*} path 
 * @param {*} isThis 区分前缀是this，还是that
 */
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
			if (parent) {
				parent.replaceWithMultiple(nodeArr);
			} else {
				console.log(`异常-->代码为：${generate(path.node).code}`);
			}
		}
	}
}

/**
 * 获取setData()的AST
 * 暂未想到其他好的方式来实现将setData插入到methods里。
 */
function getSetDataFun() {
	const code = `
	var setData = {
	setData:function(obj){  
		let that = this;  
		let keys = [];  
		let val,data;  
		Object.keys(obj).forEach(function(key){  
				keys = key.split('.');  
				val = obj[key];  
				data = that.$data;  
				keys.forEach(function(key2,index){  
					if(index+1 == keys.length){  
						that.$set(data,key2,val);  
					}else{  
						if(!data[key2]){  
							that.$set(data,key2,{});  
						}  
					}  
					data = data[key2];  
				})  
			});  
		} 
	}
	`;
	const ast = parse(code, {
		sourceType: 'module'
	});

	let result = null;
	traverse(ast, {
		ObjectProperty(path) {
			result = path.node;
		}
	});

	return result;
}

/**
 * 组件模板处理
 * @param {*} ast 
 * @param {*} vistors 
 * @param {*} isApp 是否为app.js文件
 * @param {*} usingComponents  使用的自定义组件列表
 */
const componentTemplateBuilder = function (ast, vistors, isApp, usingComponents) {
	let buildRequire = null;

	//插入setData()
	const node = getSetDataFun();
	vistors.methods.handle(node);
	//
	if (isApp) {
		//是app.js文件,要单独处理
		buildRequire = template(componentTemplateApp);
		//app.js目前看到有data属性的，其余的还未看到。
		ast = buildRequire({
			DATA: arrayToObject(vistors.data.getData()),
			METHODS: arrayToObject(vistors.methods.getData())
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
						let obj = methodsArr[key];
						if (!t.isIdentifier(obj.key, { name: "setData" })) {
							// console.log(liftCycleArr[key]);
							path.insertAfter(obj);
						}
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
					//中划线转驼峰
					let componentName = toCamel2(key);

					//这里两个小优化空间
					//1.是否有其他操作这个数组方式
					//2.属性名与变量名相同是否可以合并为一个？ (解决，第三个参数：shorthand：true 即可)
					path.node.value.properties.push(t.objectProperty(
						t.identifier(componentName),
						t.identifier(componentName),
						false,
						true
					));
				}
			} else if (path.node.key.name === 'computed' || path.node.key.name === 'watch') {
				//这两个为空的话，会报错，所以删除，其他的不管先
				if (path.node.value.properties.length == 0) path.remove();
			}
		},
		CallExpression(path) {
			let callee = path.node.callee;
			//将wx.createWorker('workers/fib/index.js')转为wx.createWorker('./static/workers/fib/index.js');
			if (t.isMemberExpression(callee)) {
				let object = callee.object;
				let property = callee.property;
				if (t.isIdentifier(object, { name: "wx" }) && t.isIdentifier(property, { name: "createWorker" })) {
					let arguments = path.node.arguments;
					if (arguments && arguments.length > 0) {
						let val = arguments[0].value;
						arguments[0] = t.stringLiteral("./static/" + val);
					}
				}
			}
		},
		MemberExpression(path) {
			let object = path.get('object');
			let property = path.get('property');

			//this.triggerEvent()转换为this.$emit()
			if (t.isIdentifier(property.node, { name: "triggerEvent" })) {
				let obj = t.memberExpression(object, t.identifier("$emit"));
				path.replaceWith(obj);
			}

			//将this.data.xxx转换为this.xxx
			if (t.isIdentifier(property.node, { name: "data" })) {
				if (t.isThisExpression(object) || t.isIdentifier(object.node, { name: "that" }) || t.isIdentifier(object.node, { name: "_this" })) {
					path.replaceWith(object);
				}
			}

			if (isApp) {
				//仅在App.vue里将this.globalData.xxx转换为this.$options.globalData.xxx
				//这里是暂时方案，后缀可能屏蔽(现在是uni-app无法支持this.globalData方式)
				if (t.isThisExpression(object)) {
					if (t.isIdentifier(property.node, { name: "globalData" })) {
						let me = t.MemberExpression(t.MemberExpression(object, t.identifier('$options')), t.identifier('globalData'));
						path.replaceWith(me);
					}
				}
			}

			//解决this.setData的问题
			//20190719 
			//因为存在含有操作setData的三元表达式，如：
			//"block" == this.data.listmode ? this.setData({
			// 		listmode: ""
			// }) : this.setData({
			//		 listmode: "block"
			// })
			//和 this使用其他变量代替的情况，所以
			//回归初次的解决方案，使用一个setData()函数来替代。
			//
			// let object = path.get('object');
			// let property = path.get('property');
			// //
			// let parent = path.parent;

			// if (t.isThisExpression(object)) {
			// 	if (t.isIdentifier(property.node, { name: "setData" })) {
			// 		//如果是this.setData()时
			// 		handleSetData(path, true);
			// 	} else if (t.isIdentifier(property.node, { name: "data" })) {
			// 		//将this.data替换为this
			// 		path.replaceWith(t.thisExpression());
			// 	}
			// } else if (t.isIdentifier(property.node, { name: "setData" })) {
			// 	if (t.isIdentifier(object.node, { name: "that" })) {
			// 		//如果是that.setData()时
			// 		handleSetData(path);
			// 	}
			// }
			//
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
		},
	});
	return ast;
}

/**
 * 处理js文件里面所有的符合条件的资源路径
 * @param {*} ast 
  * @param {*} file_js 
 */
function handleJSImage(ast, file_js) {
	traverse(ast, {
		noScope: true,
		StringLiteral(path) {
			let reg = /\.(jpg|jpeg|gif|svg|png)$/;  //test时不能加/g

			//image标签，处理src路径
			var src = path.node.value;

			//这里取巧一下，如果路径不是以/开头，那么就在前面加上./
			if (!/^\//.test(src)) {
				src = "./" + src;
			}

			//忽略网络素材地址，不然会转换出错
			if (src && !isURL(src) && reg.test(src)) {
				//static路径
				let staticPath = nodePath.join(global.miniprogramRoot, "static");

				//当前处理文件所在目录
				let jsFolder = nodePath.dirname(file_js);
				var pFolderName = getParentFolderName(src);
				var fileName = nodePath.basename(src);

				let filePath = nodePath.resolve(staticPath, "./" + pFolderName + "/" + fileName);
				let newImagePath = nodePath.relative(jsFolder, filePath);

				path.node = t.stringLiteral(newImagePath);

				console.log("newImagePath ", newImagePath);

			}
		},
	});
}


/**
 * js 处理入口方法
 * @param {*} fileData          要处理的文件内容 
 * @param {*} isApp             是否为入口app.js文件
 * @param {*} usingComponents   使用的自定义组件列表
 * @param {*} miniprogramRoot   小程序目录
 * @param {*} file_js           当前处理的文件路径
 */
async function jsHandle(fileData, isApp, usingComponents, miniprogramRoot, file_js) {
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
	} = componentConverter(javascriptAst, miniprogramRoot, file_js);

	//处理js里面的资源路径
	handleJSImage(javascriptAst, file_js);

	//引入自定义组件
	//import firstcompoent from '../firstcompoent/firstcompoent'
	let jsFolder = nodePath.dirname(file_js);
	for (const key in usingComponents) {
		let filePath = usingComponents[key];
		filePath = filePath.replace(/^\//g, "./"); //相对路径处理

		let relativeFolder = miniprogramRoot;
		if (/^\//.test(filePath)) {
			relativeFolder = jsFolder;
		}

		//先转绝对路径，再转相对路径
		filePath = nodePath.join(miniprogramRoot, filePath);
		filePath = nodePath.relative(relativeFolder, filePath);
		//相对路径里\\替换为/
		filePath = filePath.split("\\").join("/");

		if (!/^\./.test(filePath)) {
			//路径前面不是以.开始，总不能是网络路径和绝对路径吧！
			filePath = "./" + filePath;
		}

		//中划线转驼峰
		let componentName = toCamel2(key);
		//
		let node = t.importDeclaration([t.importDefaultSpecifier(t.identifier(componentName))], t.stringLiteral(filePath));
		declareStr += `${generate(node).code}\r\n`;
	}

	//放到预先定义好的模板中
	convertedJavascript = componentTemplateBuilder(javascriptAst, vistors, isApp, usingComponents);


	// console.log(`${generate(convertedJavascript).code}`);


	//生成文本并写入到文件
	let codeText = `<script>\r\n${declareStr}\r\n${generate(convertedJavascript).code}\r\n</script>\r\n`;


	// console.log(codeText);
	return codeText;
}
module.exports = jsHandle;
