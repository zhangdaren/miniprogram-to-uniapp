const t = require("@babel/types");
const nodePath = require("path");
const generate = require("@babel/generator").default;
const traverse = require("@babel/traverse").default;
const Vistor = require("./Vistor");
const clone = require("clone");
const pathUtil = require("../../utils/pathUtil");
const babelUtil = require("../../utils/babelUtil");

//
let vistors = {};

//外部定义的变量
let declareNodeList = [];

//data对象
let dataValue = {};

//globalData对象
let globalData = {};

//当前文件所在目录
let fileDir = "";

//key
let fileKey = "";


/**
 * 初始化globalData数据
 */
function initGlobalData () {
  if (globalData.value && globalData.value.properties) {
  } else {
    globalData = babelUtil.createObjectProperty("globalData");
    vistors.lifeCycle.handle(globalData);
  }
}

/*
 * 注：为防止深层遍历，将直接路过子级遍历，所以使用enter进行全遍历时，孙级节点将跳过
 *
 */
const vistor = {
  ExpressionStatement (path) {
    const parent = path.parentPath.parent;
    if (t.isCallExpression(path.node.expression)) {
      const calleeName = t.isIdentifier(path.node.expression.callee)
        ? path.node.expression.callee.name.toLowerCase()
        : "";
      if (
        t.isFile(parent) &&
        calleeName != "app" &&
        calleeName != "page" &&
        calleeName != "component" &&
        calleeName != "vantcomponent"
      ) {
        //定义的外部函数
        declareNodeList.push(path);;

        path.skip();
      }
      // } else if (t.isAssignmentExpression(path.node.expression)) {
      // 	//有可能app.js里是这种结构，exports.default = App({});
      // 	//path.node 为AssignmentExpression类型，所以这里区分一下
      // 	if (t.isFile(parent)) {
      // 		declareNodeList += `${generate(path.node).code}\r\n`;
      // 	}
    } else {
      if (t.isFile(parent)) {
        //定义的外部函数
        declareNodeList.push(path);;
      }
    }
  },
  ImportDeclaration (path) {
    //定义的导入的模块
    // vistors.importDec.handle(path.node);
    //
    //处理import模板的路径，转换当前路径以及根路径为相对路径
    let filePath = path.node.source.value;
    filePath = nodePath.join(
      nodePath.dirname(filePath),
      pathUtil.getFileNameNoExt(filePath)
    ); //去掉扩展名
    filePath = pathUtil.relativePath(filePath, global.miniprogramRoot, fileDir);
    path.node.source.value = filePath;

    //定义的外部函数

    declareNodeList.push(path);;

    path.skip();
  },
  VariableDeclaration (path) {
    const parent = path.parentPath.parent;
    if (t.isFile(parent)) {
      //将require()里的地址都处理一遍
      traverse(path.node, {
        noScope: true,
        CallExpression (path2) {
          let callee = path2.get("callee");
          let property = path2.get("property");
          if (t.isIdentifier(callee.node, { name: "require" })) {
            let arguments = path2.node.arguments;
            if (arguments && arguments.length) {
              if (t.isStringLiteral(arguments[0])) {
                let filePath = arguments[0].value;
                filePath = pathUtil.relativePath(
                  filePath,
                  global.miniprogramRoot,
                  fileDir
                );
                path2.node.arguments[0] = t.stringLiteral(filePath);
              }
            }
          }
        },
        VariableDeclarator (path2) {
          babelUtil.globalDataHandle2(path2);
          if (t.isCallExpression(path2.node && path2.node.init)) {
            //处理外部声明的require，如var md5 = require("md5.js");
            const initPath = path2.node.init;
            let callee = initPath.callee;
            if (t.isIdentifier(callee, { name: "require" })) {
              let arguments = initPath.arguments;
              if (arguments && arguments.length) {
                if (t.isStringLiteral(arguments[0])) {
                  let filePath = arguments[0].value;
                  filePath = pathUtil.relativePath(
                    filePath,
                    global.miniprogramRoot,
                    fileDir
                  );
                  initPath.arguments[0] = t.stringLiteral(filePath);
                }
              }
            }
          }
        }
      });

      //定义的外部函数

      declareNodeList.push(path);;

      path.skip();
    }
  },
  FunctionDeclaration (path) {
    const parent = path.parentPath.parent;
    if (t.isFile(parent)) {
      //定义的外部函数
      declareNodeList.push(path);;
      path.skip();
    }
  },
  SpreadElement (path) {
    initGlobalData();
    globalData.value.properties.push(path.node);
  },
  ObjectMethod (path) {
    const parent = path.parentPath.parent;
    const value = parent.value;
    const name = path.node.key.name;
    // console.log("add methods： ", name);
    if (value) {
      //async函数
      //app.js里面的函数，除生命周期外全部放入到gloabalData里
      initGlobalData();
      globalData.value.properties.push(path.node);
    } else {
      //这里function
      if (babelUtil.lifeCycleFunction[name]) {
        //value为空的，可能是app.js里的生命周期函数
        vistors.lifeCycle.handle(path.node);
      } else {
        //类似这种函数 fun(){}
        initGlobalData();
        globalData.value.properties.push(path.node);
      }
    }
    path.skip();
  },

  ObjectProperty (path) {
    const name = path.node.key.name;
    // console.log("name", path.node.key.name)
    // console.log("name", path.node.key.name)
    switch (name) {
      case "data":
        initGlobalData();
        if (path.node.value && path.node.value.properties) {
          globalData.value.properties = [
            ...globalData.value.properties,
            ...path.node.value.properties
          ];
        }
        path.skip();
        break;
      case "globalData":
        //只让第一个globalData进来，暂时不考虑其他奇葩情况
        if (JSON.stringify(globalData) == "{}") {
          //第一个data，存储起来
          globalData = path.node;
          vistors.lifeCycle.handle(globalData);
        } else {

          //TODO
          //这里会报错：path.node.value.properties
          //path.node.value.properties is not iterable
          globalData.value.properties = [
            ...globalData.value.properties,
            ...path.node.value.properties
          ];
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
          if (path.node.value && t.isArrayExpression(path.node.value))
            path.skip();
        } else {
          const node = path.node.value;
          if (
            t.isFunctionExpression(node) ||
            t.isArrowFunctionExpression(node) ||
            t.isObjectExpression(node)
          ) {
            //这里function
            if (babelUtil.lifeCycleFunction[name]) {
              // console.log("add lifeCycle： ", name);
              vistors.lifeCycle.handle(path.node);
              //跳过生命周期下面的子级，不然会把里面的也给遍历出来
            } else {
              initGlobalData();
              globalData.value.properties.push(path.node);
            }
            path.skip();
            // } else if (t.isCallExpression(node)) {
            // 	if (globalData.value && globalData.value.properties) {
            // 	} else {
            // 		globalData = babelUtil.createObjectProperty("globalData");
            // 		vistors.lifeCycle.handle(globalData);
            // 	}
            // 	globalData.value.properties.push(path.node);
          } else {
            initGlobalData();
            globalData.value.properties.push(path.node);
          }
        }
        break;
    }
  }
};

/**
 * 转换
 * @param {*} ast               ast
 * @param {*} _file_js          当前转换的文件路径
 * @param {*} isVueFile         是否为vue文件
 */
const appConverter = function (ast, _file_js, isVueFile) {
  //清空上次的缓存
  declareNodeList = [];
  //data对象
  dataValue = {};
  //globalData对象
  globalData = {};
  fileDir = nodePath.dirname(_file_js);
  fileKey = pathUtil.getFileKey(_file_js);
  //
  vistors = {
    props: new Vistor(),
    data: new Vistor(),
    events: new Vistor(),
    computed: new Vistor(),
    components: new Vistor(),
    watch: new Vistor(),
    methods: new Vistor(),
    lifeCycle: new Vistor()
  };

  //记录使用过的this别名，暂时使用这种办法先，或者正则提取也行，计划用正则
  // traverse(ast, {
  // 	noScope: true,
  // 	VariableDeclarator(path) {
  // 		if (t.isThisExpression(path.node.init)) {
  // 			//记录当前文件里使用过的this别名
  // 			if (!global.pagesData[fileKey]) global.pagesData[fileKey] = {};
  // 			if (!global.pagesData[fileKey]["thisNameList"]) global.pagesData[fileKey]["thisNameList"] = [];
  // 			global.pagesData[fileKey]["thisNameList"].push(path.node.id.name);
  // 		}
  // 	}
  // });

  traverse(ast, vistor);

  return {
    convertedJavascript: ast,
    vistors: vistors,
    declareNodeList //定义的变量和导入的模块声明
  };
};

module.exports = appConverter;
