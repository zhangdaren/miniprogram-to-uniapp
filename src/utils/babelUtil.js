const t = require('@babel/types');
const clone = require('clone');
const parse = require('@babel/parser').parse;
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;


/**
 * 
 */
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
}


/**
 * 替换globalData
 * 1. app.globalData.xxx = "123";  -->  getApp().globalData.xxx = "123";
 * 2. app.xxx --> getApp().globalData.xxx
 * @param {*} path 
 */
function globalDataHandle(path) {
    if (t.isMemberExpression(path)) {
        const object = path.object ? path.object : path.get("object");
        const property = path.property ? path.property : path.get("property");

        const objectNode = object.node ? object.node : object;
        const propertyNode = property.node ? property.node : property;

        if (t.isIdentifier(objectNode, { name: "app" }) || t.isIdentifier(objectNode, { name: "App" })) {
            if (t.isIdentifier(propertyNode, { name: "globalData" })) {
                //app.globalData.xxx = "123";  -->  getApp().globalData.xxx = "123";
                let me = t.MemberExpression(t.callExpression(t.identifier('getApp'), []), propertyNode);
                path.replaceWith(me);
                path.skip();
            } else {
                //app.xxx --> getApp().globalData.xxx
                let getApp = t.callExpression(t.identifier('getApp'), []);
                let me = t.MemberExpression(t.MemberExpression(getApp, t.identifier('globalData')), propertyNode);
                path.replaceWith(me);
                path.skip();
            }
        } else if (t.isIdentifier(objectNode.callee, { name: "getApp" }) && propertyNode.name !== "globalData") {
            //getApp().xxx --> getApp().globalData.xxx
            let getApp = t.callExpression(t.identifier('getApp'), []);
            let me = t.MemberExpression(t.MemberExpression(getApp, t.identifier('globalData')), propertyNode);
            path.replaceWith(me);
            path.skip();
        }
    }
}

/**
 * 给当前代码行上方添加注释
 * @param {*} path     path
 * @param {*} comment  注释内容
 */
function addComment(path, comment) {
    let pathLoc;
    let start;
    if (path.node) {
        pathLoc = path.node.loc;
        start = path.node.start;
    } else {
        pathLoc = path.loc;
        start = path.start;
    }

    const locStart = pathLoc.start;
    const locEnd = pathLoc.end;
    const commentObject = {
        loc: {
            start: {
                line: locStart.line - 1, column: locStart.column - 1
            },
            end: {
                line: locEnd.line - 1
            },
        },
        start: start,
        type: "CommentLine",
        value: comment
    };

    if (path.node) {
        if (!path.container.leadingComments) path.container.leadingComments = [];
        path.container.leadingComments.push(commentObject);
    } else {
        if (!path.leadingComments) path.leadingComments = [];
        path.leadingComments.push(commentObject);
    }
}

/**
 * 获取ast类型
 * 目前支持识别四种类型:
 * 1.App
 * 2.Page
 * 3.Component
 * 4.VantComponent 
 * @param {*} ast 
 */
function getAstType(ast, _file_js) {
    let type = "";
    traverse(ast, {
        ExpressionStatement(path) {
            const exp = path.get("expression");
            if (t.isCallExpression(exp) && t.isIdentifier(exp.node.callee)) {
                type = exp.node.callee.name;
                path.stop();  //完全停止遍历，目前还没有遇到什么奇葩情况~
            }
        }
    });
    console.log("文件类型: " + type + '       路径: ' + _file_js);
    return type;
}

/**
 * 遍历path下面的所有的MemberExpression，然后处理getApp()语法
 * @param {*} path 
 */
function getAppFunHandle(path) {
    traverse(path.node, {
        noScope: true,
        MemberExpression(path) {
            globalDataHandle(path);
        }
    });
}


/**
 * 判断是否为vue文件，小程序项目里，有可能会有含vue语法的文件，如https://github.com/dmego/together/
 * @param {*} ast 
 */
function checkVueFile(ast) {
    let isVueFile = false;
    if (ast && ast.program && ast.program.body) {
        const body = ast.program.body;
        for (const key in body) {
            const obj = body[key];
            if (t.isExportDefaultDeclaration(obj)) {
                isVueFile = true;
            }
        }
    }
    return isVueFile;
}


/**
 * 将ast属性数组组合为ast对象
 * @param {*} pathAry 
 */
function arrayToObject(pathAry) {
    return t.objectExpression(pathAry);
}


var setDataFunAST = null;
/**
 * 获取setData()的AST
 * 暂未想到其他好的方式来实现将setData插入到methods里。
 */
function getSetDataFunAST() {
    if (setDataFunAST) return clone(setDataFunAST);
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
    setDataFunAST = result;
    return result;
}


/**
 * 根据name创建一个空的objectProperty，retrun name:{}
 * @param {*} name 
 */
function createObjectProperty(name) {
	return t.objectProperty(t.identifier(name), t.objectExpression([]));
}


///////////////////////////////////////////////////////////////////////////////////////////

/**
 * 调整ast里指定变量或函数名引用的指向(已弃用)
 * @param {*} ast 
 * @param {*} keyList  变量或函数名列表对象
 */
function repairValueAndFunctionLink(ast, keyList) {
    traverse(ast, {
        noScope: true,
        MemberExpression(path) {
            //this.uploadAnalysis = false --> this.$options.globalData.uploadAnalysis = false;
            //this.clearStorage() --> this.$options.globalData.clearStorage();
            const object = path.node.object;
            const property = path.node.property;
            const propertyName = property.name;
            if (keyList.hasOwnProperty(propertyName)) {
                if (t.isThisExpression(object) || t.isIdentifier(object, { name: "that" }) || t.isIdentifier(object, { name: "_this" }) || t.isIdentifier(object, { name: "self" }) || t.isIdentifier(object, { name: "_" })) {
                    let subMe = t.MemberExpression(t.MemberExpression(object, t.identifier('$options')), t.identifier('globalData'));
                    let me = t.MemberExpression(subMe, property);
                    path.replaceWith(me);
                    path.skip();
                }
            }
        }
    });
}

/**
 * 修复app.js函数和变量的引用关系(已弃用)
 * 1.this.uploadAnalysis = false --> this.$options.globalData.uploadAnalysis = false;
 * 2.this.clearStorage() --> this.$options.globalData.clearStorage();
 * @param {*} vistors 
 */
function repairAppFunctionLink(vistors) {
    //当为app.js时，不为空；globalData下面的key列表，用于去各种函数里替换语法
    let globalDataKeyList = {};
    const liftCycleArr = vistors.lifeCycle.getData();
    const methodsArr = vistors.methods.getData();

    //获取globalData中所有的一级字段
    for (let item of liftCycleArr) {
        let name = item.key.name;
        if (name == "globalData") {
            if (t.isObjectProperty(item)) {
                const properties = item.value.properties;
                for (const op of properties) {
                    const opName = op.key.name;
                    globalDataKeyList[opName] = opName;
                }
            }
        }
    }

    //进行替换生命周期里的函数
    for (let item of liftCycleArr) {
        let name = item.key.name;
        if (name !== "globalData") repairValueAndFunctionLink(item, globalDataKeyList);
    }

    //进行替换methods下面的函数, app.js已经不存在methods了
    // for (let item of methodsArr) {
    // 	let name = item.key.name;
    // 	repairValueAndFunctionLink(item, globalDataKeyList);
    // }
}


/**
 * 处理this.setData(已弃用)
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



module.exports = {
    lifeCycleFunction,
    globalDataHandle,
    addComment,
    getAstType,
    getAppFunHandle,

    checkVueFile,
    arrayToObject,
    getSetDataFunAST,
    createObjectProperty,
}