const fs = require('fs-extra');
const path = require('path');


/**
 * 生成CopyWebpackPlugin所需要的数组的字符串
 * @param {*} assetsFolderObject  包含有静态文件的目录列表的对象
 */
function createStaticPlugin(assetsFolderObject) {
	var result = [];
	for (let item of assetsFolderObject.values()) {
		result.push(`{
					from: path.join(__dirname, 'src/${item}'),
					to: path.join(__dirname, 'dist', process.env.NODE_ENV === 'production' ? 'build' : 'dev', process.env.UNI_PLATFORM,
						'${item}'),
					ignore: ["*.vue", "*.js", "*.wxs", "*.css"]
				}`);
	}
	return result.join(",");
}


/**
 * 处理uni-app cli项目配置文件
 * @param {*} configData           小程序配置数据
 * @param {*} outputFolder         输出目录
 * @param {*} assetsFolderObject   包含有静态文件的目录列表的对象
 * @param {*} isUniAppCliMode      是否为uni-app cli模式，这里默认为true
 */
async function uniAppCliHandle(configData, outputFolder, assetsFolderObject, isUniAppCliMode) {
	try {
		await new Promise((resolve, reject) => {
			if (isUniAppCliMode) {
				const pathArray = [
					{
						source: "uni_app_cli/public/index.html",
						target: "public/index.html"
					},
					{
						source: "uni_app_cli/.gitignore",
						target: ".gitignore"
					},
					{
						source: "uni_app_cli/babel.config.js",
						target: "babel.config.js"
					},
					{
						source: "uni_app_cli/package.json",
						target: "package.json",
						raplaceArray: [
							"<%= PROJECT_NAME %>"
						],
					},
					{
						source: "uni_app_cli/package-lock.json",
						target: "package-lock.json",
						raplaceArray: [
							"<%= PROJECT_NAME %>"
						],
					},
					{
						source: "uni_app_cli/postcss.config.js",
						target: "postcss.config.js"
					},
					{
						source: "uni_app_cli/README.md",
						target: "README.md",
						raplaceArray: [
							"<%= PROJECT_NAME %>"
						],
					},
					{
						source: "uni_app_cli/vue.config.js",
						target: "vue.config.js",
						raplaceArray: [
							"<%= COPY_WEBPACK_PLUGIN %>"
						],
					},
				]

				for (const key in pathArray) {
					const obj = pathArray[key];
					const source = obj.source;
					const target = obj.target;
					const raplaceArray = obj.raplaceArray;
					const file_source = path.join(__dirname, source);
					const file_target = path.join(outputFolder, target);
					if (raplaceArray) {
						let fileContent = fs.readFileSync(file_source, 'utf-8');
						for (const key2 in raplaceArray) {
							const flag = raplaceArray[key2];
							// console.log(flag);
							switch (flag) {
								case "<%= PROJECT_NAME %>":
									fileContent = fileContent.replace(flag, configData.name);
									break;
								case "<%= COPY_WEBPACK_PLUGIN %>":
									fileContent = fileContent.replace(flag, createStaticPlugin(assetsFolderObject));
									break;
								default:
									break;
							}
						}

						fs.writeFile(file_target, fileContent, () => {
							console.log(`write ${target} success!`);
						});
					} else {
						fs.copySync(file_source, file_target);
						console.log(`copy ${target} success!`);
					}
				}
			}

			//////////////////////////////////////////////////////////////////////
			resolve();
		});
	} catch (err) {
		console.log(err);
	}
}

module.exports = uniAppCliHandle;
