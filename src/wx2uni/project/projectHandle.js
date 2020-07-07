const fs = require('fs-extra');
const path = require('path');

const utils = require('../../utils/utils.js');
const pathUtil = require('../../utils/pathUtil.js');

const includeTagHandle = require('./includeTagHandle');
const templateTagHandle = require('./templateTagHandle');

/**
 * 保存所有未保存的文件
 */
function saveAllFile () {
    let pagesData = global.pagesData;

    //判断类型，然后操作一把 app main 对调处理一下
    if (global.isCompiledProject) {
        let app = pagesData["app"];
        let main = pagesData["common/main"];
        if (app && main) {
            app.data.js = main.data.js;
        }
    }

    for (const key in pagesData) {
        const item = pagesData[key];
        let data = item.data;
        let fileContent = "";
        let targetFilePath = data.path;
        let msg = "";
        switch (data.type) {
            case "all":
                fileContent = data.wxml + data.js + data.css;
                msg = `Convert ${path.relative(global.targetFolder, targetFilePath)} success!`;
                break;
            case "js":
                fileContent = data.js;
                msg = `Convert component ${path.relative(global.targetFolder, targetFilePath)} success!`;
                break;
            case "wxml":
                fileContent = data.wxml + data.js;
                msg = `Convert component ${path.relative(global.targetFolder, targetFilePath)}.wxml success!`;
                break;
            case "css":
                fileContent = data.css;
                msg = `Convert ${path.relative(global.targetFolder, targetFilePath)}.wxss success!`;
                break;
        }

        // the data argument must be of type string or an instance of buffer typeArray or dataView receive type Number(NaN)

        //写入文件
        fs.writeFile(targetFilePath, fileContent, () => {
            console.log(msg);
        });
    }
}


/**
 * 项目处理
 */
function projectHandle () {
    includeTagHandle();
    templateTagHandle();
    saveAllFile();
}

module.exports = projectHandle;
