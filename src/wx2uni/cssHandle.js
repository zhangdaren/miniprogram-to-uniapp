const fs = require('fs-extra');
const path = require('path');

const utils = require('../utils/utils.js');
const pathUtil = require('../utils/pathUtil.js');



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

			//wxss文件所在目录
			let fileDir = path.dirname(file_wxss);
			let reg_import = /@import +['"](.*?).wxss['"]/g;  //应该没有写单引号的呗？(服输，还真可能有单引号)
			fileContent = fileContent.replace(reg_import, function (match, pos, orginText) {
				//先转绝对路径，再转相对路径
				let filePath = pos;
				filePath = pathUtil.relativePath(filePath, global.miniprogramRoot, fileDir);

				//虽可用path.posix.前缀来固定为斜杠，然而改动有点小多，这里只单纯替换一下
				return '@import "' + filePath + '.css"';
			});

			//修复图片路径
			// background-image: url('../../images/bg_myaccount_top.png');
			// background-image: url('https://www.jxddsx.com/wxImgs/myPage/bg_myaccount_top.png');

			//低版本node不支持零宽断言这种写法，只能换成下面的写法(已测v10+是支持的)
			// let reg_url = /url\(['"](?<filePath>.*?)\.(?<extname>jpg|jpeg|gif|svg|png)['"]\)/gi;
			let reg_url = /url\(['"](.*?)\.(jpg|jpeg|gif|svg|png)['"]\)/gi;
			fileContent = fileContent.replace(reg_url, function (...args) {
				//const groups = args.slice(-1)[0];
				//let src = groups.filePath + "." + groups.extname;

				let src = args[1] + "." + args[2];

				let reg = /\.(jpg|jpeg|gif|svg|png)$/;  //test时不能加/g

				// //image标签，处理src路径
				//忽略网络素材地址，不然会转换出错
				if (src && !utils.isURL(src) && reg.test(src)) {
					if (global.isVueAppCliMode) {
						//
					} else {
						//static路径
						let staticPath = path.join(global.miniprogramRoot, "static");

						//当前处理文件所在目录
						let wxssFolder = path.dirname(file_wxss);
						var pFolderName = pathUtil.getParentFolderName(src);
						// console.log("pFolderName ", pFolderName)
						var fileName = path.basename(src);
						// console.log("fileName ", fileName)
						//
						let filePath = path.resolve(staticPath, "./" + pFolderName + "/" + fileName);
						src = path.relative(wxssFolder, filePath);
						// 修复路径
						src = src.split("\\").join("/");
					}
					if (!/^\//.test(src)) {
						src = "./" + src;
					}
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
