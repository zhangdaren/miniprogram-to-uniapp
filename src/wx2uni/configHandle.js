const fs = require('fs-extra');
const path = require('path');
const t = require('@babel/types');
const generate = require('@babel/generator').default;
const {
	toCamel2
} = require('../utils/utils.js');


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
			let appJson = fs.readJsonSync(json_app);
			//app.json里面引用的全局组件
			let globalUsingComponents = appJson.usingComponents;
			globalUsingComponents = { ...globalUsingComponents, ...global.globalUsingComponents };

			//将pages节点里的数据，提取routerData对应的标题，写入到pages节点里
			let pages = [];
			for (const key in appJson.pages) {
				let pagePath = appJson.pages[key];
				let rkey = path.join(targetFolder, pagePath);
				let data = routerData[rkey];

				let navigationBarTitleText = "";
				let usingComponents = {};

				if (data && JSON.stringify(data) != "{}") {
					navigationBarTitleText = data.navigationBarTitleText;
					usingComponents = data.usingComponents;
				}

				let obj = {
					"path": pagePath,
					"style": {
						"navigationBarTitleText": navigationBarTitleText,
						"usingComponents": usingComponents
					}
				};
				pages.push(obj);
			}
			appJson.pages = pages;

			//替换window节点为globalStyle
			appJson["globalStyle"] = appJson["window"];
			delete appJson["window"];

			//sitemap.json似乎在uniapp用不上，删除！
			delete appJson["sitemapLocation"];

			//usingComponents节点，上面删除缓存，这里删除
			delete appJson["usingComponents"];
			
			//workers处理，简单处理一下
			if(appJson["workers"]) appJson["workers"] = "static/" + appJson["workers"];

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
					if (item.iconPath) item.iconPath = "./static/" + item.iconPath;
					if (item.selectedIconPath) item.selectedIconPath = "./static/" + item.selectedIconPath;
				}
			}

			//写入pages.json
			let file_pages = path.join(targetFolder, "pages.json");
			fs.writeFile(file_pages, JSON.stringify(appJson, null, '\t'), () => {
				console.log(`write ${file_pages} success!`);
			});

			////////////////////////////write manifest.json/////////////////////////////

			//注：因json里不能含有注释，因些template/manifest.json文件里的注释已经被删除。
			let file_manifest = path.join(__dirname, "/template/manifest.json");
			let manifestJson = fs.readJsonSync(file_manifest);
			//
			manifestJson.name = configData.name;
			manifestJson.description = configData.description;
			manifestJson.versionName = configData.version;
			manifestJson["mp-weixin"].appid = configData.appid;

			//manifest.json
			file_manifest = path.join(targetFolder, "manifest.json");
			fs.writeFile(file_manifest, JSON.stringify(manifestJson, null, '\t'), () => {
				console.log(`write ${file_manifest} success!`);
			});


			////////////////////////////write main.js/////////////////////////////
			let file_main_temp = path.join(__dirname, "/template/main.js");

			let mainContent = "import Vue from 'vue';\r\n";
			mainContent += "import App from './App';\r\n\r\n";

			//全局引入自定义组件
			//import firstcompoent from '../firstcompoent/firstcompoent'
			for (const key in globalUsingComponents) {
				let filePath = globalUsingComponents[key];
				let extname = path.extname(filePath);
				if(extname) filePath = filePath.replace(extname, ".vue");
				filePath = filePath.replace(/^\//g, "./"); //相对路径处理
				let node = t.importDeclaration([t.importDefaultSpecifier(t.identifier(key))], t.stringLiteral(filePath));
				mainContent += `${generate(node).code}\r\n`;
				let name = path.basename(filePath);
				name = toCamel2(name);
				mainContent += `Vue.component('${name}', ${key});\r\n\r\n`;
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
				console.log(`write ${file_main} success!`);
			});

			//////////////////////////////////////////////////////////////////////
			resolve();
		});
	} catch (err) {
		console.log(err);
	}
}

module.exports = configHandle;
