const path = require('path');
const fs = require('fs-extra');
const {
	getFileNameNoExt,
	getParentFolderName,
	isInFolder
} = require('./utils/pathUtil.js');

const jsHandle = require('./wx2uni/jsHandle');
const wxmlHandle = require('./wx2uni/wxmlHandle');
const cssHandle = require('./wx2uni/cssHandle');
const configHandle = require('./wx2uni/configHandle');

//TODO: 日志，暂未来得及完善


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
				console.log(`error： 找不到package.json文件`)
			}
		} else {
			//无云函数
			projectConfig.miniprogramRoot = folder;
			projectConfig.name = decodeURIComponent(data.projectname);
		}
		projectConfig.appid = data.appid;
		projectConfig.compileType = data.compileType;
	} else {
		throw (`error： 这个目录${sourceFolder}应该不是小程序的目录`)
		return false;
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
					// console.log(fileDir, fileName);
					//判断是否为页面文件所在的目录（这个判断仍然还不错十分完美~）
					let isPageFileFolder = fs.existsSync(path.join(fileDir, fileName + ".wxml"));
					//简单判断是否为workers目录，严格判断需要从app.json里取出workers的路径来(后续再议)
					let isWorkersFolder = path.relative(miniprogramRoot, fileDir) === "workers";
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
						let isInIgnoreFolder = isInFolder(imagesFolder, fileDir) || (workersFolder && fileDir.indexOf(workersFolder) > -1);
						if (isInIgnoreFolder) {
							//
						} else {
							fs.mkdirSync(newFileDir);
						}
					}
					//继续往下面遍历
					return traverseFolder(fileDir, miniprogramRoot, targetFolder, checkEnd);
				} else {
					/*not use ignore files*/
					if (fileName[0] == '.') {

					} else {
						//判断是否为素材目录或workers目录里面的文件
						let isInIgnoreFolder = isInFolder(imagesFolder, fileDir) || (workersFolder && fileDir.indexOf(workersFolder) > -1);
						if (isInIgnoreFolder) {
							//
						} else {
							//非素材目录里的文件
							//这里处理一下，防止目录名与文件名不一致
							let extname = path.extname(fileName).toLowerCase();
							let fileNameNoExt = getFileNameNoExt(fileName);
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
									let pFolderName = getParentFolderName(fileDir);
									if (fileNameNoExt !== pFolderName) {
										fs.copySync(fileDir, newFileDir);
									}

									///这里要判断是文件名是否为上层目录名，如果是的话就可以
									obj["json"] = fileDir;
									break;
								case ".wxs":
									fs.copySync(fileDir, path.join(tFolder, fileNameNoExt + ".js"));
									break;
								default:
									console.log(extname, path.dirname(fileDir));
									console.log(fileDir, path.basename(path.dirname(fileDir)));
									if (/.(jpg|jpeg|gif|svg|png)$/.test(extname)) {
										//当前文件上层目录
										let pFolder = path.dirname(fileDir);
										//粗暴获取上层目录的名称~~~
										let pFolderName = path.basename(pFolder);
										let isHasWxmlFile = fs.existsSync(path.join(pFolder, pFolderName + ".wxml"));
										let isHasJsFile = fs.existsSync(path.join(pFolder, pFolderName + ".js"));
										let isHasWxssFile = fs.existsSync(path.join(pFolder, pFolderName + ".wxss"));
										if (isHasWxmlFile || isHasJsFile || isHasWxssFile) {
											//直接复制到static目录里
											let targetFile = path.join(targetFolder, "static" + "/" + fileName);
											if(fs.existsSync(targetFile))
											{
												console.log("遇到同名文件：" + fileName + " 将直接覆盖！");
											}
											fs.copySync(fileDir, path.join(targetFolder, "static" + "/" + fileName));
										} else {
											fs.copySync(pFolder, path.join(targetFolder, "static" + "/" + pFolderName));
											imagesFolder.push(pFolder);
										}
									} else {
										fs.copySync(fileDir, newFileDir);
									}

									// log.path = {
									// 	...log.path,
									// 	...newFileDir
									// };
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
					let tFolder = obj["folder"];
					let fileName = obj["fileName"];
					let file_json = obj["json"];
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

					if ((file_wxml && file_js) || (file_wxss && file_js)) {
						//当有wxml，那必然会有js文件，可能会有wxss文件，单独的.wxml，转为.vue
						extName = ".vue";
						hasAllFile = true;
					} else if (file_wxml) {
						//如果只有一个wxml，就当它是一个组件来处理
						extName = ".vue";
						onlyWxmlFile = true;
					} else if (file_js) {
						//除了上面至少两种文件存在的情况，那么这里就是单独存在的js文件
						extName = ".js";
						onlyJSFile = true;
					} else if (file_wxss) {
						//与js文件类似，这里只可能是单独存在的wxss文件
						extName = ".css";
						onlyWxssFile = true;
					}
					targetFilePath = path.join(tFolder, fileName + extName);
					if (isAppFile) targetFilePath = path.join(tFolder, "App.vue");
					//当前文件引用的自定义组件
					let usingComponents = {};

					//解析json
					if (file_json) {
						let data = fs.readJsonSync(file_json);
						routerData[key] = {
							navigationBarTitleText: data.navigationBarTitleText,
							usingComponents: data.usingComponents,
						};
						usingComponents = data.usingComponents;
						console.log(key + " -- ", data.navigationBarTitleText)
					}

					if (hasAllFile) {
						//读取.wxml文件
						if (file_wxml && fs.existsSync(file_wxml)) {
							let data_wxml = fs.readFileSync(file_wxml, 'utf8');
							if (data_wxml) {
								let data = await wxmlHandle(data_wxml, file_wxml);
								fileContent += data;
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
								let props = [];
								if (global.props[file_wxml] && global.props[file_wxml].length > 0) {
									props = global.props[file_wxml];
								}
								fileContent += `
<script> 
	export default {
		props: [${props}]
	}
</script> 
								`;

								//写入文件
								fs.writeFile(targetFilePath, fileContent, () => {
									console.log(`Convert component ${fileName}.vue success!`);
								});
							}
						}
						if (onlyJSFile) {
							//如果是为单名的js文件，即同一个名字只有js文件，没有wxml或wxss文件，下同
							if (file_js && fs.existsSync(file_js)) {
								fs.copySync(file_js, targetFilePath);
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
									fs.writeFile(targetFilePath, content, () => {
										console.log(`Convert ${fileName}.vue success!`);
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
 * 转换入口
 * @param {*} sourceFolder 输入目录
 * @param {*} targetFolder 输出目录
 */
async function transform(sourceFolder, targetFolder) {
	fileData = {};
	routerData = {};
	imagesFolderArr = [];

	let miniprogramRoot = sourceFolder;
	if (!targetFolder) targetFolder = sourceFolder + "_uni";
	//读取小程序项目配置
	const configData = wxProjectParse(miniprogramRoot, sourceFolder);

	//小程序项目目录，不一定就等于输入目录，有无云开发的目录结构是不相同的。
	miniprogramRoot = configData.miniprogramRoot;

	//定义全局变量，之前传来传去的，过于麻烦
	global.miniprogramRoot = miniprogramRoot;
	global.sourceFolder = sourceFolder;
	global.targetFolder = targetFolder;
	global.globalUsingComponents = {};  //后面添加的全局组件
	global.props = {};  //存储wxml组件页面里面，需要对外开放的参数(本想不做全局的，然而传参出现问题，还是全局一把梭)
	//数据格式，简单粗爆
	// {
	// 	"文件路径":[]
	// }

	//
	if (fs.existsSync(targetFolder)) {
		//清空output目录
		fs.emptyDirSync(targetFolder);
	} else {
		//不存在就创建
		fs.mkdirSync(targetFolder);
	}

	traverseFolder(miniprogramRoot, miniprogramRoot, targetFolder, function () {
		// console.log(JSON.stringify(fileData));
		// log.data = {
		// 	...log.data,
		// 	...fileData
		// };

		// fs.writeJson("./log.log", log);

		//处理文件组
		filesHandle(fileData, miniprogramRoot).then(() => {
			//处理配置文件
			configHandle(configData, routerData, miniprogramRoot, targetFolder);
		});
	});
}
module.exports = transform;

