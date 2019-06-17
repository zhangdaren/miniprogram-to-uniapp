const fs = require('fs-extra');
const path = require('path');

/*
*
* 处理css文件 
* 替换rpx为upx
*/
async function cssHandle(fileContent) {
	try {
		await new Promise((resolve, reject) => {
			let reg = /(\d+)rpx/g;
			fileContent = fileContent.replace(reg, "$1upx");
			resolve(fileContent);
		});
	} catch (err) {
		console.log(err);
	}
}

module.exports = cssHandle;
