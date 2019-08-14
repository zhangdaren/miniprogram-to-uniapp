const fs = require('fs-extra');
const path = require('path');
const {
	isURL
} = require('../utils/utils.js');
const {
	getParentFolderName
} = require('../utils/pathUtil.js');

/**
 * 处理css文件 
 * 1.内部引用的wxss文件修改为css文件
 * 2.修正引用的wxss文件的路径
 * 
 * @param {*} fileContent       css文件内容
 * @param {*} file_wxss         当前处理的文件路径
 */
async function cssHandle(fileContent, file_wxss) {
	let content = "";
	try {
		content = await new Promise((resolve, reject) => {
			//rpx不再转换
			// let reg = /(\d+)rpx/g;
			// fileContent = fileContent.replace(reg, "$1upx");
			//删除掉import app.wxss的代码
			fileContent = fileContent.replace(/@import ?["'].*?app.wxss["'];?/g, "");
			fileContent = fileContent.replace(/\.wxss/g, ".css");

			//wxss文件所在目录
			let fileDir = path.dirname(file_wxss);
			let reg_import = /@import +['"](.*?)['"]/g;  //应该没有写单引号的呗？(服输，还真可能有单引号)
			fileContent = fileContent.replace(reg_import, function (match, pos, orginText) {
				//先转绝对路径，再转相对路径
				let filePath;

				if (/^\//.test(pos)) {
					//如果是以/开头的，表示根目录
					filePath = path.join(global.miniprogramRoot, pos);
				} else {
					filePath = path.join(fileDir, pos);
				}
				filePath = path.relative(fileDir, filePath);
				//虽可用path.posix.前缀来固定为斜杠，然而改动有点小多，这里只单纯替换一下
				return '@import "' + filePath.split("\\").join("/") + '"';
			});


			//修复图片路径
			// background-image: url('../../images/bg_myaccount_top.png');
			// background-image: url('https://www.jxddsx.com/wxImgs/myPage/bg_myaccount_top.png');

			let reg_url = /url\(['"](?<filePath>.*?)\.(?<extname>jpg|jpeg|gif|svg|png)['"]\)/gi;
			fileContent = fileContent.replace(reg_url, function (...args) {
				const groups = args.slice(-1)[0];
				let src = groups.filePath + "." + groups.extname;

				let reg = /\.(jpg|jpeg|gif|svg|png)$/;  //test时不能加/g

				// //image标签，处理src路径
				// var src = node.attribs.src;
				// //这里取巧一下，如果路径不是以/开头，那么就在前面加上./
				// if (!/^\//.test(src)) {
				// 	src = "./" + src;
				// }
				//忽略网络素材地址，不然会转换出错
				if (src && !isURL(src) && reg.test(src)) {
					//static路径
					let staticPath = path.join(global.miniprogramRoot, "static");

					//当前处理文件所在目录
					let wxssFolder = path.dirname(file_wxss);
					var pFolderName = getParentFolderName(src);
					// console.log("pFolderName ", pFolderName)
					var fileName = path.basename(src);
					// console.log("fileName ", fileName)


					let filePath = path.resolve(staticPath, "./" + pFolderName + "/" + fileName);
					src = path.relative(wxssFolder, filePath);


					//忽略网络素材地址，不然会转换出错
					// if (!isURL(src)) {
					// 	//当前处理文件所在目录
					// 	let wxssFolder = path.dirname(file_wxss);
					// 	//src资源完整路径
					// 	let filePath = path.resolve(wxssFolder, src);
					// 	//src资源文件相对于src所在目录的相对路径
					// 	let relativePath = path.relative(global.miniprogramRoot, filePath);
					// 	//处理images或image目录在pages下面的情况 
					// 	relativePath = relativePath.replace(/^pages\\/, "");
					// 	//资源文件路径
					// 	let newImagePath = path.join(global.miniprogramRoot, "static/" + relativePath);
					// 	newImagePath = path.relative(wxssFolder, newImagePath);
					// 	//修复路径
					// 	newImagePath = newImagePath.split("\\").join("/");
					// 	src = newImagePath;
					// }
				}

				return 'url("' + src + '")';
			});
			// fileContent = fileContent.replace(/@import +"\//g, '@import "./');
			resolve(fileContent);
		});
	} catch (err) {
		console.log(err);
	}
	return content;
}

module.exports = cssHandle;
