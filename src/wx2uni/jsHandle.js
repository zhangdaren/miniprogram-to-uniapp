/*
 *
 * 处理js文件
 * 
 */
const t = require('@babel/types');
const nodePath = require('path');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const template = require('@babel/template').default;
const JavascriptParser = require('./js/JavascriptParser');

const utils = require('../utils/utils.js');
const pathUtil = require('../utils/pathUtil.js');
const babelUtil = require('../utils/babelUtil.js');

const appConverter = require('./js/appConverter');
const pageConverter = require('./js/pageConverter');
const componentConverter = require('./js/componentConverter');
const singleJSConverter = require('./js/singleJSConverter');
const behaviorConverter = require('./js/behaviorConverter');


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
  watch:WATCH,
  computed: COMPUTED,
  methods: METHODS,
}
`;

/**
 * Behavior的模板
 */
const behaviorTemplate =
	`
module.exports = {
  data() {
    return DATA
  },
  props:PROPS,
  watch:WATCH,
  computed: COMPUTED,
  methods: METHODS,
}
`;

/**
 * Behavior的模板2
 * 这种形式的代码：
 * export const transition = function (showDefaultValue) {
 *    return Behavior({})
 * }
 */
const behaviorTemplate2 =
	`	
export default function(PARAMS) {
	return {
		data() {
			return DATA
		},
		props:PROPS,
		watch:WATCH,
		computed: COMPUTED,
		methods: METHODS
	};
}
`;

/**
 * App页面的模板
 */
const appTemplate =
	`
export default {
	methods: METHODS,
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
 * 根据funName在liftCycleArr里查找生命周期函数，找不到就创建一个，给onLoad()里加入wxs所需要的代码
 * @param {*} liftCycleArr  生命周期函数数组
 * @param {*} key           用于查找当前编辑的文件组所对应的key
 * @param {*} funName       函数名："onLoad" or "beforeMount"
 */
function handleOnLoadFun(liftCycleArr, key, funName) {
	var node = null;
	for (let i = 0; i < liftCycleArr.length; i++) {
		const obj = liftCycleArr[i];
		if (obj.key.name == funName) {
			node = obj;
			break;
		}
	}
	let pageWxsInfo = global.pageWxsInfo[key];
	if (pageWxsInfo) {
		if (!node) {
			node = t.objectMethod("method", t.identifier(funName), [], t.blockStatement([]));
			liftCycleArr.unshift(node);
		}
		pageWxsInfo.forEach(obj => {
			let left = t.memberExpression(t.thisExpression(), t.identifier(obj.module));
			let right = t.identifier(obj.module);
			let exp = t.expressionStatement(t.assignmentExpression("=", left, right));
			if (node.body) {
				//处理 onLoad() {}
				node.body.body.unshift(exp);
			} else {
				//处理 onLoad: function() {}
				node.value.body.body.unshift(exp);
			}
		});
	}
	return node;
}



/**
 * 处理未在data里面声明的变量
 * @param {*} ast 
 * @param {*} vistors 
 * @param {*} file_js 
 */
function defineValueHandle(ast, vistors, file_js) {
	//处理没有在data里面声明的变量
	var dataArr = vistors.data.getData();
	var propsArr = vistors.props.getData();
	//转为json对象，这样方便查找
	let dataJson = {};
	dataArr.forEach(obj => {
		dataJson[obj.key.name] = obj.value.name;
	});
	let propsJson = {};
	propsArr.forEach(obj => {
		propsJson[obj.key.name] = obj.value.name;
	});
	traverse(ast, {
		noScope: true,
		CallExpression(path) {
			let callee = path.node.callee;
			if (t.isMemberExpression(callee)) {
				let object = callee.object;
				let property = callee.property;
				if (t.isIdentifier(property, { name: "setData" })) {
					let arguments = path.node.arguments;
					for (const key in arguments) {
						const element = arguments[key];
						for (const key2 in element.properties) {
							const subElement = element.properties[key2];
							if (t.isIdentifier(subElement.key)) {
								const name = subElement.key.name;
								const value = subElement.value;
								//与data和props对比
								if (!dataJson.hasOwnProperty(name) && !propsJson.hasOwnProperty(name)) {
									// const logStr = "data里没有的变量:    " + name + " -- " + value.type + "    file: " + nodePath.relative(global.miniprogramRoot, file_js);
									// console.log(logStr);

									//设置默认值
									let initialValue;
									switch (value.type) {
										case "BooleanLiteral":
											initialValue = t.booleanLiteral(false);
											break;
										case "NumericLiteral":
											initialValue = t.numericLiteral(0);
											break;
										case "ArrayExpression":
											initialValue = t.arrayExpression();
											break;
										case "ObjectExpression":
											initialValue = t.objectExpression([]);
											break;
										default:
											//其余全是空
											initialValue = t.stringLiteral("");
											break;
									}

									vistors.data.handle(t.objectProperty(t.identifier(name), initialValue));
									dataJson[name] = name;
								} else {
									//TODO：
									//如果props有个变量abc，使用this.setData({abc:1})会报错，但在小程序里是正确的，
									//如果要改的话，要用一个中间变量，并且把页面里所有的地方都要替换，工作量有点繁琐。
								}
							}
						}
					}
				}
			}
		}
	});
}

/**
 * 修复app.js，globalData对象里的this.globalData引用关系
 * 转换this.globalData.xxx --> this.xxx   
 */
function appGlobalDataFunHandle(ast) {
	traverse(ast, {
		noScope: true,
		MemberExpression(path) {
			let object = path.get('object');
			let property = path.get('property');
			if (babelUtil.isThisExpression(object, global.pagesData["app"]["thisNameList"]) && t.isIdentifier(property.node, { name: "globalData" })) {
				path.replaceWith(object);
				path.skip();
			}
		}
	});
}

/**
 * 修复app.js里生命周期函数里调用的非生命周期函数的引用关系
 */
function applifeCycleFunHandle(ast, appGlobalDataFunNameList, appGlobalDataValueNameList) {
	traverse(ast, {
		noScope: true,
		CallExpression(path) {
			let callee = path.get("callee");
			if (t.isMemberExpression(callee)) {
				//clearInterval(position_timer); 是没有callee.node.property.name的
				let calleeName = callee.node.property.name;
				if (callee.node.object.name !== "wx" && appGlobalDataFunNameList[calleeName]) {
					let me = t.memberExpression(callee.node.object, t.identifier("globalData"));
					let memberExp = t.memberExpression(me, callee.node.property);
					callee.replaceWith(memberExp);
				}
			}
		},
		MemberExpression(path) {
			let object = path.get('object');
			let property = path.get('property');
			// console.log(object.node.name, property.node.name);
			//app.js里非生命周期函数里引用globalData里变量的引用关系修改
			if (babelUtil.isThisExpression(object, global.pagesData["app"]["thisNameList"]) && appGlobalDataValueNameList[property.node.name]) {
				let me = t.MemberExpression(t.MemberExpression(object.node, t.identifier('globalData')), property.node);
				path.replaceWith(me);
				path.skip();
			}
		}
	});
}

/**
 * 组件模板处理
 * @param {*} ast 
 * @param {*} vistors 
 * @param {*} astType          ast类型: App、Page、Component、Behavior和VantComponent
 * @param {*} usingComponents  使用的自定义组件列表
 * @param {*} wxsKey           获取当前文件wxs信息的key
 * @param {*} file_js          当前转换的文件路径
 * @param {*} astInfoObject    经过一次转换后的ast数据
 */
const componentTemplateBuilder = function (ast, vistors, astType, usingComponents, wxsKey, file_js, astInfoObject) {
	let buildRequire = null;

	const isApp = (astType === "App");

	//需要替换的函数名
	let replaceFunNameList = [];

	//存储data的引用，用于后面添加wxparse的数据变量
	let astDataPath = null;

	const fileKey = pathUtil.getFileKey(file_js);

	defineValueHandle(ast, vistors, file_js);

	//
	if (isApp) {
		//app.js文件,要单独处理
		buildRequire = template(appTemplate);

		//20191028 回滚
		//[HBuilder X v2.3.7.20191024-alpha] 修复 在 App.vue 的 onLaunch 中，不支持 this.globalData 的 Bug
		// 修复app.js函数和变量的引用关系
		// repairAppFunctionLink(vistors);

		//收集globalData里的函数
		//然后遍历生命周期里，将函数调整过来
		const lifeCycleArr = vistors.lifeCycle.getData();

		let appGlobalDataFunNameList = {};
		let appGlobalDataValueNameList = {};

		//提取globalData里面变量名和函数名
		for (const item of lifeCycleArr) {
			if (item.key.name === "globalData") {
				let globalDataArr = item.value.properties;
				for (const subItem of globalDataArr) {
					const isFun = t.isObjectMethod(subItem) || (t.isObjectProperty(subItem) && (t.isFunctionExpression(subItem.value) || t.isArrowFunctionExpression(subItem.value)));
					if (isFun) {
						appGlobalDataFunNameList[subItem.key.name] = true;
					} else {
						appGlobalDataValueNameList[subItem.key.name] = true;
					}
				}
			}
		}

		/**
		 * 处理app.js里函数之间的引用关系，globalData引用关系
		 */
		for (const item of lifeCycleArr) {
			if (item.key.name === "globalData") {
				let globalDataArr = item.value.properties;
				for (const subItem of globalDataArr) {
					appGlobalDataFunHandle(subItem);
				}
			} else {
				applifeCycleFunHandle(item, appGlobalDataFunNameList, appGlobalDataValueNameList);
			}
		}

		//占个位
		ast = buildRequire({
			METHODS: babelUtil.arrayToObject([])
		});
	} else {

		//非app.js文件
		if (astType === "Behavior") {
			buildRequire = template(behaviorTemplate);
		} else if (astType === "Behavior2") {
			buildRequire = template(behaviorTemplate2);
		} else {
			buildRequire = template(componentTemplate);
		}

		//处理data下变量名与函数重名的问题，或函数名为系统关键字，如delete等
		const dataArr = vistors.data.getData();
		let dataNameList = {};
		for (const item of dataArr) {
			dataNameList[item.key.name] = true;
		}

		const methods = vistors.methods.getData();
		for (const item of methods) {
			const keyName = item.key.name;
			if (dataNameList[keyName] || utils.isReservedName(keyName)) {
				item.key.name = utils.getFunctionAlias(item.key.name);
				replaceFunNameList.push(keyName);
				//留存全局变量，以便替换template
			}
		}

		//储存全局变量
		let fileKey = pathUtil.getFileKey(file_js);
		if (!global.pagesData[fileKey]) global.pagesData[fileKey] = {};
		global.pagesData[fileKey].replaceFunNameList = replaceFunNameList;

		//
		if (astType === "Behavior2") {
			//Behavior2这种类型时，单独将参数给进去
			ast = buildRequire({
				PROPS: babelUtil.arrayToObject(vistors.props.getData()),
				DATA: babelUtil.arrayToObject(vistors.data.getData()),
				METHODS: babelUtil.arrayToObject(methods),
				COMPUTED: babelUtil.arrayToObject(vistors.computed.getData()),
				WATCH: babelUtil.arrayToObject(vistors.watch.getData()),
				PARAMS: astInfoObject.behaviorParams.join(","),
			});
		} else {
			ast = buildRequire({
				PROPS: babelUtil.arrayToObject(vistors.props.getData()),
				DATA: babelUtil.arrayToObject(vistors.data.getData()),
				METHODS: babelUtil.arrayToObject(methods),
				COMPUTED: babelUtil.arrayToObject(vistors.computed.getData()),
				WATCH: babelUtil.arrayToObject(vistors.watch.getData()),
			});
		}


		if (global.isTransformWXS) {
			//处理wxs里变量的引用问题
			let liftCycleArr = vistors.lifeCycle.getData();
			let funName = "beforeMount";
			if (astType === "Page") funName = "onLoad";
			handleOnLoadFun(liftCycleArr, wxsKey, funName);
		}
	}

	let fileDir = nodePath.dirname(file_js);
	//久久不能遍历，搜遍google，template也没有回调，后面想着源码中应该会有蛛丝马迹，果然，在templateVisitor里找到了看到这么一个属性noScope，有点嫌疑
	//noScope: 从babel-template.js中发现这么一个属性，因为直接转出来的ast进行遍历时会报错，找了官方文档，没有这个属性的介绍信息。。。
	//Error: You must pass a scope and parentPath unless traversing a Program/File. Instead of that you tried to traverse a ExportDefaultDeclaration node without passing scope and parentPath.
	//babel-template直接转出来的ast只是完整ast的一部分
	traverse(ast, {
		noScope: true,
		VariableDeclarator(path) {
			const init = path.get("init");
			if (t.isCallExpression(init) && init.node && t.isCallExpression(init.node)) {
				if (t.isIdentifier(init.node.callee, { name: "getApp" })) {
					/**
					 * var t = getApp();
					 * 替换为:
					 * var t = getApp().globalData;
					 */
					const me = t.memberExpression(t.callExpression(t.identifier("getApp"), []), t.identifier("globalData"));
					init.replaceWith(me);
					path.skip();
				}
			}
		},
		ObjectMethod(path) {
			// console.log("--------", path.node.key.name);
			if (path.node.key.name === 'data') {

				//存储data引用
				if (!astDataPath) astDataPath = path;

				//将require()里的地址都处理一遍
				traverse(path.node, {
					noScope: true,
					CallExpression(path2) {
						babelUtil.requirePathHandle(path2, fileDir);
					}
				});

				if (isApp) {
					var methodsArr = vistors.methods.getData();
					for (let key in methodsArr) {
						let obj = methodsArr[key];
						if (!t.isIdentifier(obj.key, { name: "setData" })) {
							path.insertAfter(obj);
						}
					}
				}

				//停止，不往后遍历了   //还是需要往后遍历，不然后getApp那些没法处理了
				// path.skip();
			}
		},
		ObjectProperty(path) {
			const name = path.node.key.name;
			if (name === 'components') {
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
					let componentName = utils.toCamel2(key);

					path.node.value.properties.push(t.objectProperty(
						t.identifier(componentName),
						t.identifier(componentName),
						false,
						true  //属性名与变量名相同是否可以合并为一个
					));
				}
			} else if (name === 'computed' || name === 'watch') {
				//这两个为空的话，会报错，所以删除，其他的不管先
				if (path.node.value && path.node.value.properties && path.node.value.properties.length == 0) path.remove();
			} else if (name === 'methods') {
				let lifeCycleArr = vistors.lifeCycle.getData();
				for (let key in lifeCycleArr) {
					path.insertBefore(lifeCycleArr[key]);
				}
				//这里不能停止，否则后面的this.data.xxx不会被转换 20190918
				//path.skip();
			}
		},
		CallExpression(path) {
			let callee = path.get("callee");
			if (t.isMemberExpression(callee)) {
				let object = callee.get('object');
				let property = callee.get('property');
				if (t.isIdentifier(object, { name: "wx" }) && t.isIdentifier(property, { name: "createWorker" })) {
					//将wx.createWorker('workers/fib/index.js')转为wx.createWorker('./static/workers/fib/index.js');
					let arguments = path.node.arguments;
					if (arguments && arguments.length > 0) {
						let val = arguments[0].value;
						arguments[0] = t.stringLiteral("./static/" + val);
					}
				}
				//
				let objNode = object.node ? object.node : object;
				let propertyNode = property.node ? property.node : property;
				if (
					(t.isIdentifier(objNode, { name: "WxParse" }) || t.isIdentifier(objNode, { name: "wxParse" }))
					&& t.isIdentifier(propertyNode, { name: "wxParse" })
				) {
					/**
					 * WxParse.wxParse(bindName , type, data, target,imagePadding)
					 * 1.bindName绑定的数据名(必填)
					 * 2.type可以为html或者md(必填)
					 * 3.data为传入的具体数据(必填)
					 * 4.target为Page对象,一般为this(必填)
					 * 5.imagePadding为当图片自适应是左右的单一padding(默认为0,可选)
					 */
					//解析WxParse.wxParse('contentT', 'html', content, this, 0);
					const arguments = path.node.arguments;

					//target为Page对象,一般为this(必填);这里大胆假设一下，只有this或this的别名，报错再说。
					const wxParseArgs = {
						bindName: "article_" + arguments[0].value,  //加个前缀以防冲突
						type: arguments[1].value,
						data: generate(arguments[2]).code,  //这里可能会有多种类型，so，直接转字符串
						target: arguments[3]
					}

					global.log.push("wxParse: " + generate(path).code + "      file: " + file_js);

					//将原来的代码注释
					babelUtil.addComment(path, `${generate(path.node).code}`);

					//替换节点
					//装13之选 ，一堆代码只为还原一行代码: setTimeout(()=>{this.uParseArticle = contentData}, 200);
					const left = t.memberExpression(wxParseArgs.target, t.identifier(wxParseArgs.bindName), false);
					const right = t.identifier(wxParseArgs.data);
					const assExp = t.assignmentExpression("=", left, right);
					const bState = t.blockStatement([t.expressionStatement(assExp)]);
					const args = [t.ArrowFunctionExpression([], bState), t.numericLiteral(200)];  //延时200ms防止百度小程序解析不出来
					const callExp = t.callExpression(t.identifier("setTimeout"), args);
					const expState = t.expressionStatement(callExp);
					path.replaceWith(expState);

					/////////////////////////////////////////////////////////////////
					//填充变量名到data里去，astDataPath理论上会有值，因为根据模板填充，data是居第一个，so，开搂~
					if (astDataPath) {
						try {
							const properties = astDataPath.get("body.body.0.argument.properties");
							const op = t.objectProperty(t.Identifier(wxParseArgs.bindName), t.stringLiteral(""));
							properties.push(op);
						} catch (error) {
							const logStr = "Error:    " + error + "   source: astDataPath.get(\"body.body.0.argument.properties\")" + "    file: " + file_js;
							//存入日志，方便查看，以防上面那么多层级搜索出问题
							utils.log(logStr);
							global.log.push(logStr);
						}
					}
				} else {
					if (!isApp) {
						babelUtil.globalDataHandle(callee, fileKey);
					}
				}
			} else {
				babelUtil.requirePathHandle(path, fileDir);
			}

			// if (t.isIdentifier(callee, { name: "getApp" })) {
			// 	/**
			// 	 * getApp().xxx; 
			// 	 * 替换为:
			// 	 * getApp().globalData.xxx;
			// 	 * 
			// 	 * 注：因为已经把var app = getApp()替换掉了，所以这里可以放心的替换
			// 	 */
			// 	let arguments = path.node.arguments;
			// 	if (arguments.length == 0) {
			// 		const parent = path.parent;
			// 		if (parent && parent.property && t.isIdentifier(parent.property, { name: "globalData" })) {
			// 			//如果已经getApp().globalData就不进行处理了
			// 		} else {
			// 			//一般来说getApp()是没有参数的。
			// 			path.replaceWith(t.memberExpression(t.callExpression(t.identifier("getApp"), []), t.identifier("globalData")));
			// 			path.skip();
			// 		}
			// 	}
			// }
		},
		MemberExpression(path) {
			let object = path.get('object');
			let property = path.get('property');


			if (t.isIdentifier(property.node, { name: "triggerEvent" })) {
				//this.triggerEvent()转换为this.$emit()
				let obj = t.memberExpression(object.node, t.identifier("$emit"));
				path.replaceWith(obj);

			} else if (t.isIdentifier(object.node, { name: "app" }) || t.isIdentifier(object.node, { name: "App" })) {
				//app.xxx ==> app.globalData.xxx
				// let me = t.MemberExpression(t.MemberExpression(object.node, t.identifier('globalData')), property.node);
				// path.replaceWith(me);
				// path.skip();

				//这里先注释，貌似不用走到这里来----------------------------
				// babelUtil.globalDataHandle(object);
			} else if (t.isMemberExpression(object)) {
				let subObject = object.get('object');
				let subProperty = object.get('property');
				if (!isApp && babelUtil.isThisExpression(subObject, global.pagesData[fileKey]["thisNameList"])) {
					if (utils.isReservedAttrName(property.node.name)) {
						//把不支持的属性保留名进行重名(试运行)
						let newAttrName = utils.getAttrAlias(property.node.name);
						const logStr = "[命名替换]:  " + property.node.name + "  -->  " + newAttrName + "    file: " + nodePath.relative(global.sourceFolder, file_js);
						let me = t.MemberExpression(subObject.node, t.identifier(newAttrName));
						path.replaceWith(me);
						path.skip();

						//存入日志，方便查看，以防上面那么多层级搜索出问题
						utils.log(logStr, "base");
						global.logArr.rename.push(logStr);
					}
				}
			} else if (babelUtil.isThisExpression(object, global.pagesData[fileKey]["thisNameList"]) && t.isIdentifier(property.node, { name: "data" })) {
				//将this.data.xxx转换为this.xxx
				let parent = path.parent;
				//如果父级是AssignmentExpression，则不需再进行转换
				if (parent && !t.isAssignmentExpression(parent)) {
					if (t.isUpdateExpression(parent)) {
						//++this.data.notify_count;
						object.replaceWith(object.node.object);
						path.skip();
					} else {
						path.replaceWith(object);
					}
				}
			}

			//如果是在log("ischeck=====", app.data.isCheck);里
			//或在 xx:function(){
			//	that.setData({
			//		isCheck: app.data.isCheck
			//	  });
			//}

			if (!isApp) {
				//替换与data变量重名的函数引用
				for (const item of replaceFunNameList) {
					if (t.isIdentifier(property.node, { name: item })) {
						if (babelUtil.isThisExpression(object, global.pagesData[fileKey]["thisNameList"])) {
							let parent = path.parent;
							//如果父级是AssignmentExpression，则不需再进行转换
							if (parent && !t.isAssignmentExpression(parent)) {
								let newName = utils.getFunctionAlias(item);
								if (newName !== property.node.name) {
									const logStr = "[命名替换]:  " + property.node.name + "  -->  " + newName + "    file: " + nodePath.relative(global.sourceFolder, file_js);

									property.node.name = newName;

									//存入日志，方便查看
									utils.log(logStr, "base");
									global.logArr.rename.push(logStr);
								}
							}
						}
					}
				}

				if (t.isMemberExpression(object)) {
					babelUtil.globalDataHandle(object, fileKey);
				} else {
					babelUtil.globalDataHandle(path, fileKey);
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
		}
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
			if (src && !utils.isURL(src) && reg.test(src)) {
				//static路径
				let staticPath = nodePath.join(global.miniprogramRoot, "static");

				//当前处理文件所在目录
				let jsFolder = nodePath.dirname(file_js);
				var pFolderName = pathUtil.getParentFolderName(src);
				var fileName = nodePath.basename(src);

				let filePath = nodePath.resolve(staticPath, "./" + pFolderName + "/" + fileName);
				let newImagePath = nodePath.relative(jsFolder, filePath);

				path.node = t.stringLiteral(newImagePath);
				// console.log("newImagePath ", newImagePath);
			}
		},
	});
}


/**
 * js 处理入口方法
 * @param {*} fileData          要处理的文件内容 
 * @param {*} isApp             是否为入口app.js文件
 * @param {*} usingComponents   使用的自定义组件列表
 * @param {*} file_js           当前处理的文件路径
 */
async function jsHandle(fileData, isApp, usingComponents, file_js) {

	//初始化一个解析器
	const javascriptParser = new JavascriptParser();

	//先反转义
	let javascriptContent = fileData;

	let fileKey = pathUtil.getFileKey(file_js);

	//缓存当前文件所使用过的getApp别名
	let getAppNamelist = javascriptParser.getAliasGetAppNameList(javascriptContent);
	if (!global.pagesData[fileKey]) global.pagesData[fileKey] = {};
	if (!global.pagesData[fileKey]["getAppNamelist"]) global.pagesData[fileKey]["getAppNamelist"] = {};
	global.pagesData[fileKey]["getAppNamelist"] = getAppNamelist;

	//去除无用代码
	javascriptContent = javascriptParser.beforeParse(javascriptContent);

	//缓存当前文件所使用过的this别名
	let list = javascriptParser.getAliasThisNameList(javascriptContent);

	//保存
	if (!global.pagesData[fileKey]) global.pagesData[fileKey] = {};
	if (!global.pagesData[fileKey]["thisNameList"]) global.pagesData[fileKey]["thisNameList"] = {};
	global.pagesData[fileKey]["thisNameList"] = list;


	let javascriptAst = null;
	let isParseError = false; //标识是否解析报错
	try {
		//解析成AST
		javascriptAst = javascriptParser.parse(javascriptContent);
	} catch (error) {
		isParseError = true;
		const logStr = "Error: 解析文件出错: " + error + "      file: " + file_js;
		utils.log(logStr);
		global.log.push(logStr);
	}

	//是否为vue文件
	const isVueFile = babelUtil.checkVueFile(javascriptAst);

	//判断文件类型
	let astType = babelUtil.getAstType(javascriptAst, nodePath.relative(global.targetFolder, file_js));

	let astInfoObject = null;
	if (!isVueFile) {
		switch (astType) {
			case "App":
				astInfoObject = appConverter(javascriptAst, file_js, false);
				break;
			case "Page":
				astInfoObject = pageConverter(javascriptAst, file_js, true);
				break;
			case "Behavior":
			case "Behavior2":
				astInfoObject = behaviorConverter(javascriptAst, file_js);
				break;
			case "Component":
			case "VantComponent":
				astInfoObject = componentConverter(javascriptAst, file_js, false);
				break;
			case "Webpack":
				break;
			default:
				// console.log("其他类型：", astType);
				astType = "";
				break;
		}
	}

	//进行代码转换
	// let {
	// 	convertedJavascript,
	// 	vistors,
	// 	declareStr
	// } = componentConverter(javascriptAst, miniprogramRoot, file_js, isVueFile);

	let codeText = "";
	let convertedJavascript;
	if (astInfoObject) {
		convertedJavascript = astInfoObject.convertedJavascript;
		let vistors = astInfoObject.vistors;
		let declareStr = astInfoObject.declareStr;

		if (!global.isVueAppCliMode) {
			//处理js里面的资源路径
			handleJSImage(convertedJavascript, file_js);
		}

		let wxsKey = "";
		if (global.isTransformWXS) {
			//添加wxs引用
			wxsKey = nodePath.join(nodePath.dirname(file_js), pathUtil.getFileNameNoExt(file_js));
			let pageWxsInfo = global.pageWxsInfo[wxsKey];
			if (pageWxsInfo) {
				pageWxsInfo.forEach(obj => {
					if (obj.type == "link") declareStr += `import ${obj.module} from '${obj.src}'\r\n`;
				});
			}
		}

		if (astType !== "App") {
			//引入自定义组件
			//import firstcompoent from '../firstcompoent/firstcompoent'
			let jsFolder = nodePath.dirname(file_js);
			for (const key in usingComponents) {
				let filePath = usingComponents[key];

				//相对路径处理
				filePath = pathUtil.relativePath(filePath, global.miniprogramRoot, jsFolder);

				//中划线转驼峰
				let componentName = utils.toCamel2(key);
				//
				let node = t.importDeclaration([t.importDefaultSpecifier(t.identifier(componentName))], t.stringLiteral(filePath));
				declareStr += `${generate(node).code}\r\n`;
			}
		}

		if (!isVueFile) {
			//放到预先定义好的模板中
			convertedJavascript = componentTemplateBuilder(convertedJavascript, vistors, astType, usingComponents, wxsKey, file_js, astInfoObject);
		}
		// console.log(`${generate(convertedJavascript).code}`);

		//生成文本并写入到文件
		if (astType === "Behavior") {
			codeText = `${declareStr}\r\n${generate(convertedJavascript).code}`;
		} else {
			codeText = `<script>\r\n${declareStr}\r\n${generate(convertedJavascript).code}\r\n</script>\r\n`;
		}
	} else {
		// if (astType === "Webpack") {
		// 	//如果代码是webpack编译过的
		// 	let reg = /[a-z]\.default=void 0;(.*?)\};[a-z]\.default=([a-z])/;

		// 	let exportValueName = "";
		// 	fileData.repalce(reg, function (match, $1, $2) {
		// 		console.log(match);
		// 		let reg2 = new RegExp('[a-z]\.default=void 0;(.*?)' + $2 + '=\{(data:function\(\)\{return.*?)\};[a-z]\.default=([a-z])');

		// 		codeText = $1;
		// 		exportValueName = $2;
		// 	});
		// 	codeText = "";
		// } else {
			convertedJavascript = singleJSConverter(javascriptAst, file_js);
			codeText = `${generate(convertedJavascript).code}`;
		// }
	}

	//如果解析报错，那么还是返回原文件内容
	if (isParseError) {
		codeText = fileData;
	}
	return codeText;
}
module.exports = jsHandle;
