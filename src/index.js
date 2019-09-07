const path = require('path');
const fs = require('fs-extra');
var moment = require('moment');
moment.locale('zh-cn');
//
const utils = require('./utils/utils.js');
const pathUtil = require('./utils/pathUtil.js');
//
const jsHandle = require('./wx2uni/jsHandle');
const wxmlHandle = require('./wx2uni/wxmlHandle');
const cssHandle = require('./wx2uni/cssHandle');
const configHandle = require('./wx2uni/configHandle');
const wxsHandle = require('./wx2uni/wxsHandle');
const uniAppCliHandle = require('./wx2uni/uniAppCliHandle');

/**
 * 解析小程序项目的配置
 * @param {*} folder        小程序主体所在目录
 * @param {*} sourceFolder  输入目录
 */
function wxProjectParse(folder, sourceFolder) {
	let file_projectConfigJson = path.join(folder, "project.config.json");
	let projectConfig = {
		"name": "",
		"version": "",
		"description": "",
		"appid": "",
		"projectname": "",
		"miniprogramRoot": "",
		"cloudfunctionRoot": "",
		"compileType": "",
		"author": ""
	};
	if (fs.existsSync(file_projectConfigJson)) {
		let data = fs.readJsonSync(file_projectConfigJson);
		if (data.cloudfunctionRoot) {
			//有云函数的
			projectConfig.miniprogramRoot = path.resolve(sourceFolder, data.miniprogramRoot);
			projectConfig.cloudfunctionRoot = path.resolve(sourceFolder, data.cloudfunctionRoot);

			//如果是有云函数的项目，那么工作目录将设置为miniprogramRoot
			// miniprogramRoot = projectConfig.miniprogramRoot;

			//读取package.json
			let file_package = path.join(folder, "package.json");
			if (fs.existsSync(file_package)) {
				let packageJson = fs.readJsonSync(file_package);
				//
				projectConfig.name = packageJson.name;
				projectConfig.version = packageJson.version;
				projectConfig.description = packageJson.description;
				//author用不到，先留着
				projectConfig.author = packageJson.author;
			} else {
				console.log(`Error： 找不到package.json文件`);
				// global.log.push("\r\nError： 找不到package.json文件\r\n");
			}
		} else {
			//无云函数
			projectConfig.miniprogramRoot = folder;
			projectConfig.name = decodeURIComponent(data.projectname);
		}
		projectConfig.appid = data.appid;
		projectConfig.compileType = data.compileType;
	} else {
		projectConfig.miniprogramRoot = sourceFolder;
		console.log(`Error： 找不到project.config.json文件`);
		// global.log.push("\r\nError： 找不到project.config.json文件\r\n");
		// throw (`error： 这个目录${sourceFolder}应该不是小程序的目录，找不到project.config.json文件`)
		// return false;
	}
	return projectConfig;
}



//文件组数据
//数据结构为：
// {
// 	"js": "", 
// 	"wxml": "",
// 	"wxss": "",
// 	"folder": "",  //所在目录
// 	"json": "",  
// 	"fileName": "",  //文件名，不含后缀
// }
let fileData = {};
//路由数据，用来记录对应页面的title和使用的自定义组件
let routerData = {};
//素材目录
let imagesFolder = [];
//workers目录
let workersFolder = "";



/**
 * 遍历目录
 * @param {*} folder           当前要遍历的目录
 * @param {*} miniprogramRoot  小程序主体所在目录
 * @param {*} targetFolder     生成目录
 * @param {*} callback         回调函数
 */
function traverseFolder(folder, miniprogramRoot, targetFolder, callback) {
	fs.readdir(folder, function (err, files) {
		var count = 0
		var checkEnd = function () {
			++count == files.length && callback()
		}
		var tFolder = path.join(targetFolder, path.relative(miniprogramRoot, folder));
		files.forEach(function (fileName) {
			var fileDir = path.join(folder, fileName);
			let newFileDir = path.join(tFolder, fileName);
			let isContinue = false;
			fs.stat(fileDir, function (err, stats) {
				if (stats.isDirectory()) {

					//简单判断是否为workers目录，严格判断需要从app.json里取出workers的路径来(后续再议)
					let isWorkersFolder = path.relative(miniprogramRoot, fileDir) === "workers";

					if (global.isVueAppCliMode) {
						/**
						 * 规则
						 * 1.保持原目录不变
						 * 2.找到资源时，保存路径（相对路径）
						 * 3.
						 */
						if (isWorkersFolder) {
							//处理workers目录，复制到static目录里
							fs.copySync(fileDir, path.join(targetFolder, "static" + "/" + fileName));
							workersFolder = fileDir;
						} else {
							fs.mkdirSync(newFileDir);
						}
					} else {
						// console.log(fileDir, fileName);
						//判断是否为页面文件所在的目录（这个判断仍然还不够十分完美~）
						let isPageFileFolder = fs.existsSync(path.join(fileDir, fileName + ".wxml"));

						if ((fileName == "images" || fileName == "image") && !isPageFileFolder) {
							//处理图片目录，复制到static目录里
							fs.copySync(fileDir, path.join(targetFolder, "static" + "/" + fileName));
							imagesFolder.push(fileDir);
						} else if (isWorkersFolder) {
							//处理workers目录，复制到static目录里
							fs.copySync(fileDir, path.join(targetFolder, "static" + "/" + fileName));
							workersFolder = fileDir;
						} else {
							//如果不是是素材目录或workers目录下面的子目录就复制
							let isInIgnoreFolder = pathUtil.isInFolder(imagesFolder, fileDir) || (workersFolder && fileDir.indexOf(workersFolder) > -1);
							if (isInIgnoreFolder) {
								//
							} else {
								fs.mkdirSync(newFileDir);
							}
						}
					}

					//继续往下面遍历
					return traverseFolder(fileDir, miniprogramRoot, targetFolder, checkEnd);
				} else {
					/*not use ignore files*/
					if (fileName[0] == '.') {

					} else {
						//判断是否为素材目录或workers目录里面的文件
						let isInIgnoreFolder = pathUtil.isInFolder(imagesFolder, fileDir) || (workersFolder && fileDir.indexOf(workersFolder) > -1);
						if (isInIgnoreFolder && !global.isVueAppCliMode) {
							//
						} else {
							//非素材目录里的文件
							//这里处理一下，防止目录名与文件名不一致
							let extname = path.extname(fileName).toLowerCase();
							let fileNameNoExt = pathUtil.getFileNameNoExt(fileName);
							//
							let obj = {};
							//为了适应小程序里的app.json/pages节点的特点，这里也使用同样的规则，key为去掉后缀名的路径
							var key = path.join(tFolder, fileNameNoExt);
							if (extname == ".js" || extname == ".wxml" || extname == ".wxss" || extname == ".json") {
								//如果obj为false，那么肯定是还没有初始化的underfined
								if (!fileData[key]) {
									fileData[key] = {
										"js": "",
										"wxml": "",
										"wxss": "",
										"folder": "",
										"json": "",
										"fileName": "",
										"isAppFile": false
									};
								}
								obj = fileData[key];
								obj["folder"] = tFolder;
								obj["fileName"] = fileNameNoExt;
								//标识是否为app.js入口文件
								obj["isAppFile"] = (fileName == "app.js" || obj["isAppFile"]);
							}
							switch (extname) {
								case ".js":
									obj["js"] = fileDir;
									break;
								case ".wxml":
									obj["wxml"] = fileDir;
									break;
								case ".wxss":
									obj["wxss"] = fileDir;
									break;
								case ".json":
									//粗暴获取上层目录的名称~~~
									let pFolderName = pathUtil.getParentFolderName(fileDir);
									if (fileNameNoExt !== pFolderName && fileName != "app.json") {
										fs.copySync(fileDir, newFileDir);
									}

									///这里要判断是文件名是否为上层目录名，如果是的话就可以
									obj["json"] = fileDir;
									break;
								case ".wxs":
									if (global.isTransformWXS) {
										//这里现场处理一下wxs文件
										let data_wxs = fs.readFileSync(fileDir, 'utf8');
										if (data_wxs) {
											//处理一下
											wxsHandle(data_wxs).then((fileContent) => {
												let targetFile = path.join(tFolder, fileNameNoExt + ".js");
												//写入文件
												fs.writeFile(targetFile, fileContent, () => {
													console.log(`Convert wxs file ${targetFile} success!`);

													global.log.push(`Convert wxs file ${targetFile} success!`);
												});
											}).catch(error => {
												console.log("wxsHandle", error);

												global.log.push("wxsHandle", error);
											});
										}
									} else {
										fs.copySync(fileDir, newFileDir);
									}
									break;
								default:
									// console.log(extname, path.dirname(fileDir));
									// console.log(fileDir, path.basename(path.dirname(fileDir)));

									if (/.(jpg|jpeg|gif|svg|png)$/.test(extname)) {

										//当前文件上层目录
										let pFolder = path.dirname(fileDir);

										if (global.isVueAppCliMode) {
											let relFolder = path.relative(miniprogramRoot, pFolder);
											let key = relFolder.replace(/\\/g, "/");
											global.assetsFolderObject.add(key);
											fs.copySync(fileDir, newFileDir);
										} else {
											//粗暴获取上层目录的名称~~~
											let pFolderName = path.basename(pFolder);
											let isHasWxmlFile = fs.existsSync(path.join(pFolder, pFolderName + ".wxml"));
											let isHasJsFile = fs.existsSync(path.join(pFolder, pFolderName + ".js"));
											let isHasWxssFile = fs.existsSync(path.join(pFolder, pFolderName + ".wxss"));
											if (isHasWxmlFile || isHasJsFile || isHasWxssFile) {
												//直接复制到static目录里
												let targetFile = path.join(targetFolder, "static" + "/" + fileName);
												if (fs.existsSync(targetFile)) {
													console.log("遇到同名文件：" + fileName + " 将直接覆盖！");
													global.log.push("\r\n" + "遇到同名文件：" + fileName + " 将直接覆盖！" + "\r\n");
												}
												fs.copySync(fileDir, path.join(targetFolder, "static" + "/" + fileName));
											} else {
												fs.copySync(pFolder, path.join(targetFolder, "static" + "/" + pFolderName));
												imagesFolder.push(pFolder);
											}
										}
									} else {
										fs.copySync(fileDir, newFileDir);
									}
									break;
							}
						}
					}
					checkEnd();
				}
			})
		})

		//为空时直接回调
		files.length === 0 && callback();
	})
}

/**
 * 处理一组文件（js、wxml、wxss）
 * @param {*} fileData         一组文件数据(即同名的js/wxml/wxss为一组数据)
 * @param {*} miniprogramRoot  小程序主体所在目录
 */
async function filesHandle(fileData, miniprogramRoot) {
	// console.log("--------------", tFolder);
	try {
		return await new Promise((resolve, reject) => {
			let total = Object.keys(fileData).length;
			let count = 0;

			for (let key in fileData) {
				(async function (key) {
					let fileContent = "";
					let obj = fileData[key];
					let file_js = obj["js"];
					let file_wxml = obj["wxml"];
					let file_wxss = obj["wxss"];
					let file_json = obj["json"];
					let tFolder = obj["folder"];
					let fileName = obj["fileName"];
					let isAppFile = obj["isAppFile"];
					//
					if (!fs.existsSync(tFolder)) {
						fs.mkdirSync(tFolder);
					}

					//组装vue文件名
					let targetFilePath = path.join(tFolder, fileName + ".vue");
					// console.log("-------------", targetFilePath);

					// * 单个情况：
					// * 单个wxml的情况-->转换为vue
					// * 单个wxss的情况-->重名为css
					// * 单个js的情况-->直接复制
					var extName = "";
					var hasAllFile = false;
					var onlyJSFile = false;
					var onlyWxssFile = false;
					var onlyWxmlFile = false;

					if ((file_wxml && file_js)) {
						//当有wxml，那必然会有js文件，可能会有wxss文件，单独的.wxml，转为.vue
						extName = ".vue";
						hasAllFile = true;
					} else {
						if (file_wxml) {
							//如果只有一个wxml，就当它是一个组件来处理
							extName = ".vue";
							onlyWxmlFile = true;
						}
						if (file_js) {
							//除了上面至少两种文件存在的情况，那么这里就是单独存在的js文件
							extName = ".js";
							onlyJSFile = true;
						}

						if (file_wxss) {
							//与js文件类似，这里只可能是单独存在的wxss文件
							extName = ".css";
							onlyWxssFile = true;
						}
					}
					targetFilePath = path.join(tFolder, fileName + extName);
					if (isAppFile) targetFilePath = path.join(tFolder, "App.vue");
					//当前文件引用的自定义组件
					let usingComponents = {};

					//解析json
					if (file_json) {
						let data = fs.readJsonSync(file_json);
						//判断是否有引用自定义组件
						if (!data.usingComponents || JSON.stringify(data.usingComponents) == "{}") {
							data.usingComponents = {};
						}

						//处理根路径
						for (const kk in data.usingComponents) {
							const value = data.usingComponents[kk];
							data.usingComponents[kk] = value.replace(/^\//, "./"); //相对路径处理
						}

						routerData[key] = {
							navigationBarTitleText: data.navigationBarTitleText,
							usingComponents: data.usingComponents,
						};
						usingComponents = data.usingComponents;
						// console.log(key + " -- ", data.navigationBarTitleText)
					}

					if (hasAllFile) {
						//读取.wxml文件
						if (file_wxml && fs.existsSync(file_wxml)) {
							let data_wxml = fs.readFileSync(file_wxml, 'utf8');
							if (data_wxml) {
								let data = await wxmlHandle(data_wxml, file_wxml);
								fileContent += data;
								wxsInfoHandle(tFolder, file_wxml);
							}
						}

						//读取.js文件
						if (file_js && fs.existsSync(file_js)) {
							let data_js = fs.readFileSync(file_js, 'utf8');
							if (data_js) {
								let data = await jsHandle(data_js, isAppFile, usingComponents, miniprogramRoot, file_js);
								fileContent += data;
							}
						}

						//读取.wxss文件
						if (file_wxss && fs.existsSync(file_wxss)) {
							let data_wxss = fs.readFileSync(file_wxss, 'utf8');
							if (data_wxss) {
								data_wxss = await cssHandle(data_wxss, file_wxss);
								fileContent += `<style>\r\n${data_wxss}\r\n</style>`;
							}
						}

						if (!fileContent) {
							console.log(fileName + " is empty");
							global.log.push(fileName + " is empty");
							count++;
							return;
						}

						//写入文件
						fs.writeFile(targetFilePath, fileContent, () => {
							console.log(`Convert ${fileName}.vue success!`);
						});
					} else {
						if (onlyWxmlFile) {
							//只有wxml文件时，当组件来处理

							let data_wxml = fs.readFileSync(file_wxml, 'utf8');
							if (data_wxml) {
								let data = await wxmlHandle(data_wxml, file_wxml, onlyWxmlFile);
								fileContent = data;
								if (fileContent) {
									let props = [];
									if (global.props[file_wxml] && global.props[file_wxml].length > 0) {
										props = global.props[file_wxml];
									}
									let wxsImportStr = wxsInfoHandle(tFolder, file_wxml);
									fileContent += `
	<script> 
		${wxsImportStr}
		export default {
			props: [${props}]
		}
	</script> 
									`;

									//写入文件
									targetFilePath = path.join(tFolder, fileName + ".vue");
									fs.writeFile(targetFilePath, fileContent, () => {
										console.log(`Convert component ${fileName}.wxml success!`);
									});
								}
							}
						}
						if (onlyJSFile) {
							//如果是为单名的js文件，即同一个名字只有js文件，没有wxml或wxss文件，下同
							if (file_js && fs.existsSync(file_js)) {
								let data_js = fs.readFileSync(file_js, 'utf8');
								if (data_js) {
									let data = await jsHandle(data_js, isAppFile, usingComponents, miniprogramRoot, file_js, true);
									fileContent = data;

									//写入文件
									targetFilePath = path.join(tFolder, fileName + ".js");
									if (isAppFile) targetFilePath = path.join(tFolder, "App.vue");
									//
									fs.writeFile(targetFilePath, fileContent, () => {
										console.log(`Convert component ${fileName}.js success!`);
									});
								}
							}
						}

						if (onlyWxssFile) {
							//读取.wxss文件
							if (file_wxss && fs.existsSync(file_wxss)) {
								let data_wxss = fs.readFileSync(file_wxss, 'utf8');
								if (data_wxss) {
									data_wxss = await cssHandle(data_wxss, file_wxss);
									let content = `${data_wxss}`;
									//写入文件
									targetFilePath = path.join(tFolder, fileName + ".css");
									fs.writeFile(targetFilePath, content, () => {
										console.log(`Convert ${fileName}.wxss success!`);
									});
								}
							}
						}
					}

					count++;
					if (count >= total) {
						//文件转换结束时
						resolve();
					}
				})(key);
			}
		});
	} catch (err) {
		console.log(err);
	}
}

/**
 * wxs信息处理
 * @param {*} tFolder   目录目录
 * @param {*} file_wxml 当前处理的wxml文件
 */
function wxsInfoHandle(tFolder, file_wxml) {
	let wxmlFolder = path.dirname(file_wxml);
	let key = path.join(wxmlFolder, pathUtil.getFileNameNoExt(file_wxml));

	//提取wxml里面的wxs信息
	let wxsInfoArr = global.wxsInfo[key];
	let str = "";
	if (wxsInfoArr && wxsInfoArr.length > 0) {
		wxsInfoArr.forEach(obj => {
			if (obj.type == "insert") {
				let jsFilePath = path.join(tFolder, obj.name + ".js");
				obj.type = "link"; //改为link
				obj.src = "./" + obj.name + ".js"; //填充src

				str += `import ${obj.name} from '${obj.src}'\r\n`;

				//处理一下
				wxsHandle(obj.content).then((fileContent) => {
					//写入文件
					fs.writeFile(jsFilePath, fileContent, () => {
						console.log(`Convert wxs file ${obj.name}.js success!`);
					});
				}).catch(error => {
					console.log("wxsHandle", error);

					global.log.push("wxsHandle", error);
				});
			}
		});
	}
	return str;
}

/**
 * 写入日志到生成目录时，再次转换将会被删除
 */
function writeLog(folder) {
	let logArr = global.log;
	var logStr = logArr.join("\r\n");

	let file_log = path.join(folder, "transform_log.log");
	//写入文件
	fs.writeFile(file_log, logStr, () => {
		// console.log(`Write log file success!`);
	});
}


/**
 * 转换入口
 * @param {*} sourceFolder    输入目录
 * @param {*} targetFolder    输出目录
 * @param {*} isVueAppCliMode 是否需要生成vue-cli项目，默认为false
 * @param {*} isTransformWXS  是否需要转换wxs文件，默认为true，目前uni-app已支持wxs文件，仅支持app和小程序
 */
async function transform(sourceFolder, targetFolder, isVueAppCliMode, isTransformWXS) {
	fileData = {};
	routerData = {};
	imagesFolderArr = [];

	global.log = []; //记录转换日志，最终生成文件

	let miniprogramRoot = sourceFolder;
	if (!targetFolder) targetFolder = sourceFolder + "_uni";
	//读取小程序项目配置
	const configData = wxProjectParse(miniprogramRoot, sourceFolder);

	//小程序项目目录，不一定就等于输入目录，有无云开发的目录结构是不相同的。
	miniprogramRoot = configData.miniprogramRoot;

	/////////////////////定义全局变量//////////////////////////
	//之前传来传去的，过于麻烦，全局变量的弊端就是过于耦合了。
	global.miniprogramRoot = miniprogramRoot;
	global.sourceFolder = sourceFolder;

	//是否需要生成为vue-cli项目
	global.isVueAppCliMode = isVueAppCliMode;

	//是否需要转换wxs文件，默认为true
	global.isTransformWXS = isTransformWXS || false;

	//记录<template name="abc"></template>内容
	global.globalTemplateComponents = {
		//name: ast
	};

	//两个目录类型和作用不同
	if (global.isVueAppCliMode) {
		//输出目录
		global.outputFolder = targetFolder;
		//src目录
		global.targetFolder = targetFolder = path.join(targetFolder, "src");
		//含资源文件的目录信息，用于写入到vue.config.js里，否则uni-app编译时将删除
		global.assetsFolderObject = new Set();
	} else {
		//输出目录
		global.outputFolder = targetFolder;
		//输出的小程序目录
		global.targetFolder = targetFolder;
	}


	//
	global.log.push("miniprogram to uni-app 转换日志");
	global.log.push("");
	global.log.push("---基本信息---");
	global.log.push("时间: " + moment().format('YYYY-MM-DD HH:mm:ss'));
	global.log.push("转换模式: " + (global.isVueAppCliMode ? "vue-cli" : "Hbuilder X"));
	global.log.push("是否转换wxs文件: " + global.isTransformWXS);
	global.log.push("");
	global.log.push("---小程序基本信息---");
	global.log.push("name: " + configData.name);
	global.log.push("version: " + configData.version);
	global.log.push("description: " + configData.description);
	global.log.push("appid: " + configData.appid);
	global.log.push("projectname: " + configData.projectname);
	global.log.push("compileType: " + configData.compileType);
	global.log.push("author: " + configData.author);
	global.log.push("");
	global.log.push("---目录信息---");
	global.log.push("sourceFolder: " + sourceFolder);
	global.log.push("targetFolder: " + global.targetFolder);
	global.log.push("outputFolder: " + global.outputFolder);
	global.log.push("miniprogramRoot: " + global.miniprogramRoot);
	global.log.push("");
	global.log.push("---日志信息---");

	//
	utils.log("outputFolder = " + global.outputFolder, "log");
	utils.log("targetFolder = " + global.targetFolder, "log");

	global.globalUsingComponents = {};  //后面添加的全局组件
	global.props = {};  //存储wxml组件页面里面，需要对外开放的参数(本想不做全局的，然而传参出现问题，还是全局一把梭)
	//数据格式，简单粗爆
	// {
	// 	"文件路径":[]
	// }
	global.wxsInfo = {}; //存储页面里的wxs信息，数据格式如下所示
	//---数据格式[解析wxs时]
	// {
	// 	"文件路径":[
	//	   {
	//		"name":"module name",
	//		"type":"link or insert",
	//		"content":"路径或内容",
	//	   }
	//  ]
	// }
	//---数据格式[不解析wxs时]
	// {
	// 	"文件路径":[
	//	    wxs内容
	//   ]
	// }
	//

	try {
		if (fs.existsSync(global.outputFolder)) {
			//清空output或src目录，如果之前有下载过node_modules将被保留
			//下截node_modules这一堆文件花了200+s，所以能不删除就不删除吧。
			if (global.isVueAppCliMode && fs.existsSync(path.join(global.outputFolder, "node_modules"))) {
				fs.emptyDirSync(global.targetFolder);
			} else {
				fs.emptyDirSync(global.outputFolder);
			}
		} else {
			fs.mkdirSync(global.outputFolder);
		}
	} catch (error) {
		utils.log(`Error: ${global.outputFolder}可能被其他文件占用，请手动删除再试`);
		return;
	}

	utils.sleep(300);

	if (!fs.existsSync(global.targetFolder)) {
		//创建输出目录，如果是vue-cli模式，那就直接创建src目录，这样输出目录也会一并创建
		fs.mkdirSync(global.targetFolder);
	}

	traverseFolder(miniprogramRoot, miniprogramRoot, targetFolder, () => {
		//处理文件组
		filesHandle(fileData, miniprogramRoot).then(() => {

			//将<template name="abc"/>标签全部存为component组件
			let componentFolder = path.join(targetFolder, "components");
			if (!fs.existsSync(componentFolder)) {
				fs.mkdirSync(componentFolder);
			}
			//
			for (const name in global.globalTemplateComponents) {
				const componentData = global.globalTemplateComponents[name];
				const fileContent = componentData.data;
				const alias = componentData.alias;  //有可能组件名与内置关键字冲突，这里使用别名

				let componentFile = path.join(componentFolder, alias + ".vue");

				//写入到全局组件
				global.globalUsingComponents[alias] = "./components/" + alias + ".vue";

				//写入文件
				fs.writeFile(componentFile, fileContent, () => {
					console.log(`write component file ${alias} success!`);
				});
			}

			//处理配置文件
			configHandle(configData, routerData, miniprogramRoot, targetFolder);

			//生成vue-cli项目所需要的文件
			if (global.isVueAppCliMode) {
				uniAppCliHandle(configData, global.outputFolder, global.assetsFolderObject, true);
			}

			//输出提示
			setTimeout(() => {
				let str = "\r\n";

				if (global.isVueAppCliMode) {
					str += "当前转换模式：【vue-cli】，生成vue-cli项目。\r\n优点：所有资源文件位置与原项目一致，资源引用完美；\r\n缺点：上手有点点难度，转换完成后，需要运行命令：npm i\r\n";
				} else {
					str += "当前转换模式：【Hbuilder X】，生成HbuilderX项目。\r\n优点：上手快，项目结构较简单；\r\n缺点：资源路径会因为表达式而无法全部被修复(推荐vue-cli模式)\r\n";
					str += '注意：当看到"image漏网之鱼"，意味着您需要手动调整对应代码，当image标签的src属性是含变量或表达式，工具还无法做到100%转换，需要手动修改为相对/static目录的路径(使用vue-cli模式可以解决，参数：-c)\r\n';
				}
				str += '另外，代码<template is="abc" data=""/>里data属性，除了不支持...扩展运算符(因uni-app现在还不支持v-bind="")，其余参数形式都支持，望知悉！\r\n';
				str += '日志说明：';
				str += '试图转换template里data参数为Object时报错 --> 表示<template data="abc">里data的属性可能含有...扩展运算符，已将data重命为error-data=""，需转换后手工调整\r\n';
				str += 'image漏网之鱼 --> 为HbuilderX模式时，需要将资源移动到static，并且修复相应文件路径，有可能src为网络文件，有可能为变量或表达式，可能会导致转换后文件找不到，因此提示一下\r\n';

				global.log.push("\r\n转换完成: " + str);

				utils.log(str);

				writeLog(global.outputFolder);

			}, 3000);
		});
	});
}

module.exports = transform;

