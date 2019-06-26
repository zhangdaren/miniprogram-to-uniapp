const path = require('path');
const fs = require('fs-extra');
const {
	getFileNameNoExt,
} = require('./utils/pathUtil.js');

const jsHandle = require('./wx2uni/jsHandle');
const wxmlHandle = require('./wx2uni/wxmlHandle');
const cssHandle = require('./wx2uni/cssHandle');
const configHandle = require('./wx2uni/configHandle');

//TODO: 日志，暂未来得及完善


/**
 * 解析小程序项目
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


//遍历目录
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
			fs.stat(fileDir, function (err, stats) {
				if (stats.isDirectory()) {
					fs.mkdirSync(newFileDir);
					return traverseFolder(fileDir, miniprogramRoot, targetFolder, checkEnd);
				} else {
					/*not use ignore files*/
					if (fileName[0] == '.') {

					} else {
						//这里处理一下，防止目录名与文件名不一致
						let extname = path.extname(fileName);
						let fileNameNoExt = getFileNameNoExt(fileName);

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
								obj["json"] = fileDir;
								break;
							default:
								fs.copySync(fileDir, newFileDir);
								// log.path = {
								// 	...log.path,
								// 	...newFileDir
								// };
								break;
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


//处理一组文件（js、wxml、wxss）
async function filesHandle(fileData) {
	// console.log("--------------", tFolder);
	try {
		await new Promise((resolve, reject) => {
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
					var hasJSFile = false;
					var hasWxssFile = false;

					if ((file_wxml && file_js) || (file_wxss && file_js) || file_wxml) {
						//当有wxml，那必然会有js文件，可能会有wxss文件，单独的.wxml，转为.vue
						extName = ".vue";
						hasAllFile = true;
					} else if (file_js) {
						//除了上面至少两种文件存在的情况，那么这里就是单独存在的js文件
						extName = ".js";
						hasJSFile = true;
					} else if (file_wxss) {
						//与js文件类似，这里只可能是单独存在的wxss文件
						extName = ".css";
						hasWxssFile = true;
					}
					targetFilePath = path.join(tFolder, fileName + extName);
					if (isAppFile) targetFilePath = path.join(tFolder, "App.vue");

					if (hasAllFile) {
						//读取.wxml文件
						if (file_wxml && fs.existsSync(file_wxml)) {
							let data_wxml = fs.readFileSync(file_wxml, 'utf8');
							if (data_wxml) {
								let data = await wxmlHandle(data_wxml);
								fileContent += data;
							}
						}

						//读取.js文件
						if (file_js && fs.existsSync(file_js)) {
							let data_js = fs.readFileSync(file_js, 'utf8');
							if (data_js) {
								let data = await jsHandle(data_js, isAppFile);
								fileContent += data;
							}
						}

						//读取.wxss文件
						if (file_wxss && fs.existsSync(file_wxss)) {
							let data_wxss = fs.readFileSync(file_wxss, 'utf8');
							if (data_wxss) {
								data_wxss = await cssHandle(data_wxss);
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
						if (hasJSFile) {
							//如果是为单名的js文件，即同一个名字只有js文件，没有wxml或wxss文件，下同
							if (file_js && fs.existsSync(file_js)) {
								fs.copySync(file_js, targetFilePath);
							}
						}
						if (hasWxssFile) {
							//读取.wxss文件
							if (file_wxss && fs.existsSync(file_wxss)) {
								let data_wxss = fs.readFileSync(file_wxss, 'utf8');
								if (data_wxss) {
									data_wxss = await cssHandle(data_wxss);
									let content = `${data_wxss}`;
									//写入文件
									fs.writeFile(targetFilePath, content, () => {
										console.log(`Convert ${fileName}.vue success!`);
									});
								}
							}
						}
					}

					//解析json
					if (file_json) {
						let data = fs.readJsonSync(file_json);
						routerData[key] = {
							navigationBarTitleText: data.navigationBarTitleText,
							usingComponents: data.usingComponents,
						};
						console.log(key + " -- ", data.navigationBarTitleText)
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

////////////////////////////转换入口/////////////////////////////
async function transform(sourceFolder, targetFolder) {
	fileData = {};
	routerData = {};

	let miniprogramRoot = sourceFolder;
	if (!targetFolder) targetFolder = sourceFolder + "_uni";
	//读取小程序项目配置
	const configData = wxProjectParse(miniprogramRoot, sourceFolder);

	//小程序项目目录，不一定就等于输入目录，有无云开发的目录结构是不相同的。
	miniprogramRoot = configData.miniprogramRoot;

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
		filesHandle(fileData);

		//处理配置文件
		configHandle(configData, routerData, miniprogramRoot, targetFolder);
	});
}
module.exports = transform;

