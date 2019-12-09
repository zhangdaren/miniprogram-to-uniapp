const fs = require('fs-extra');
const path = require('path');
const t = require('@babel/types');
const generate = require('@babel/generator').default;

const utils = require('../utils/utils.js');
const pathUtil = require('../utils/pathUtil.js');

const pinyin = require("node-pinyin");

const clone = require('clone');


/**
 * 将小程序subPackages节点处理为uni-app所需要的节点
 * @param {*} subPackages 
 */
function subPackagesHandle(subPackages) {
	let reuslt = [];
	for (const key in subPackages) {
		const obj = subPackages[key];
		const root = obj.root;
		const pages = obj.pages;
		let newPages = [];
		for (const subKey in pages) {
			const subObj = pages[subKey];
			newPages.push({
				"path": subObj
			})
		}

		reuslt.push({
			"root": root,
			"pages": newPages
		});
	}
	return reuslt;
}

/**
 * 处理配置文件
 * 生成配置文件: pages.json、manifest.json、main.js
 * @param {*} configData        小程序配置数据
 * @param {*} routerData        所有的路由页面数据
 * @param {*} miniprogramRoot   小程序主体所在目录
 * @param {*} targetFolder      最终要生成的目录
 */
async function configHandle(configData, routerData, miniprogramRoot, targetFolder) {
	try {
		await new Promise((resolve, reject) => {
			////////////////////////////write pages.json/////////////////////////////

			//app.json文件路径
			let json_app = path.join(miniprogramRoot, "app.json");
			let appJson = {
				"pages": {},
				"tabBar": {},
				"globalStyle": {},
				"usingComponents": {},
			}
			if (fs.existsSync(json_app)) {
				appJson = fs.readJsonSync(json_app);
			} else {
				let str = "Error： 找不到app.json文件(不影响转换)";
				console.log(str);
				global.log.push("\r\n" + str + "\r\n");
			}
			//app.json里面引用的全局组件
			let globalUsingComponents = appJson.usingComponents || {};
			globalUsingComponents = { ...globalUsingComponents, ...global.globalUsingComponents };

			//将pages节点里的数据，提取routerData对应的标题，写入到pages节点里
			let pages = [];
			for (const key in appJson.pages) {
				let pagePath = appJson.pages[key];
				pagePath = utils.normalizePath(pagePath);
				let data = routerData[pagePath];

				// let usingComponents = {};

				// if (data && JSON.stringify(data) != "{}") {
				// 	usingComponents = data.usingComponents;
				// }

				let obj;
				if (data) {
					let dataBak = clone(data);
					delete dataBak.usingComponents;

					obj = {
						"path": pagePath,
						"style": {
							...dataBak
						}
					};
				} else {
					obj = {
						"path": pagePath,
						"style": {}
					};
				}
				pages.push(obj);
			}
			appJson.pages = pages;

			//替换window节点为globalStyle
			appJson["globalStyle"] = appJson["window"];
			delete appJson["window"];

			//sitemap.json似乎在uniapp用不上，删除！
			delete appJson["sitemapLocation"];

			//处理分包加载subPackages
			let subPackages = appJson["subPackages"];
			appJson["subPackages"] = subPackagesHandle(subPackages);


			//usingComponents节点，上面删除缓存，这里删除
			delete appJson["usingComponents"];

			//workers处理，简单处理一下
			if (appJson["workers"]) appJson["workers"] = "static/" + appJson["workers"];

			//tabBar节点
			//将iconPath引用的图标路径进行修复
			let tabBar = appJson["tabBar"];
			if (tabBar && tabBar.list && tabBar.list.length) {
				for (const key in tabBar.list) {
					let item = tabBar.list[key];
					/**
					 * 目前已知的规则：
					 * iconPath和selectedIconPath字段是使用/images下面的文件
					 * 而 /pages/images下面的文件是用于页面里的
					 * 其余情况后面发现再加入
					 */
					const iconPath = item.iconPath;
					if (iconPath) {
						if (!global.isVueAppCliMode && iconPath.indexOf("static/") == -1) {
							item.iconPath = "./static/" + iconPath;
						}
						item.iconPath = pathUtil.relativePath(item.iconPath, global.miniprogramRoot, global.miniprogramRoot);
					}
					const selectedIconPath = item.selectedIconPath;
					if (selectedIconPath) {
						if (!global.isVueAppCliMode && selectedIconPath.indexOf("static/") == -1) {
							item.selectedIconPath = "./static/" + selectedIconPath;
						}
						item.selectedIconPath = pathUtil.relativePath(item.selectedIconPath, global.miniprogramRoot, global.miniprogramRoot);
					}
				}
			}

			//写入pages.json
			let file_pages = path.join(targetFolder, "pages.json");
			fs.writeFile(file_pages, JSON.stringify(appJson, null, '\t'), () => {
				console.log(`write ${path.relative(global.targetFolder, file_pages)} success!`);
			});

			////////////////////////////write manifest.json/////////////////////////////

			//注：因json里不能含有注释，因些template/manifest.json文件里的注释已经被删除。
			let file_manifest = path.join(__dirname, "/template/manifest.json");
			let manifestJson = fs.readJsonSync(file_manifest);
			//
			let name = pinyin(configData.name, { style: "normal" }).join("");
			manifestJson.name = name;
			manifestJson.description = configData.description;
			manifestJson.versionName = configData.version || "1.0.0";
			manifestJson["mp-weixin"].appid = configData.appid;

			//manifest.json
			file_manifest = path.join(targetFolder, "manifest.json");
			fs.writeFile(file_manifest, JSON.stringify(manifestJson, null, '\t'), () => {
				console.log(`write ${path.relative(global.targetFolder, file_manifest)} success!`);
			});


			////////////////////////////write main.js/////////////////////////////
			let mainContent = "import Vue from 'vue';\r\n";
			mainContent += "import App from './App';\r\n\r\n";

			//全局引入自定义组件
			//import firstcompoent from '../firstcompoent/firstcompoent'
			for (const key in globalUsingComponents) {
				//key可能含有后缀名，也可能是用-连接的，统统转成驼峰
				let newKey = utils.toCamel2(key);
				newKey = newKey.split(".vue").join(""); //去掉后缀名
				let filePath = globalUsingComponents[key];
				let extname = path.extname(filePath);
				if (extname) filePath = filePath.replace(extname, ".vue");
				filePath = filePath.replace(/^\//, "./"); //相对路径处理
				let node = t.importDeclaration([t.importDefaultSpecifier(t.identifier(newKey))], t.stringLiteral(filePath));
				mainContent += `${generate(node).code}\r\n`;
				mainContent += `Vue.component("${key}", ${newKey});\r\n\r\n`;
			}

			//全局引入uParse
			if (global.hasWxParse) {
				mainContent += 'import uParse from "./components/gaoyia-parse/parse.vue";\r\n';
				mainContent += `Vue.component("u-parse", uParse);\r\n\r\n`;
			}

			//
			mainContent += "Vue.config.productionTip = false;\r\n\r\n";
			mainContent += "App.mpType = 'app';\r\n\r\n";
			mainContent += "const app = new Vue({\r\n";
			mainContent += "    ...App\r\n";
			mainContent += "});\r\n";
			mainContent += "app.$mount();\r\n";
			//
			let file_main = path.join(targetFolder, "main.js");
			fs.writeFile(file_main, mainContent, () => {
				console.log(`write ${path.relative(global.targetFolder, file_main)} success!`);
			});

			//////////////////////////////////////////////////////////////////////
			resolve();
		});
	} catch (err) {
		console.log(err);
	}
}

module.exports = configHandle;
