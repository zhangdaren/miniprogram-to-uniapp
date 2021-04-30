const path = require('path');
const fs = require('fs-extra');
const utils = require('../utils/utils.js');


/**
 * 解析小程序项目的配置
 * @param {*} folder        小程序主体所在目录
 * @param {*} sourceFolder  输入目录
 */
function getProjectConfig(folder, sourceFolder) {
    let file_projectConfigJson = path.join(folder, 'project.config.json');
    let projectConfig = {
        name: '',
        version: '',
        description: '',
        appid: '',
        projectname: '',
        miniprogramRoot: '',
        cloudfunctionRoot: '',
        compileType: '',
        author: ''
    };

    if (fs.existsSync(file_projectConfigJson)) {
        let data = {};
        try {
            data = fs.readJsonSync(file_projectConfigJson);
        } catch (error) {
            utils.log(`[Error] 解析project.config.json报错：` + error);
        }

        if (data.cloudfunctionRoot) {
            //有云函数的
            projectConfig.cloudfunctionRoot = path.resolve(
                sourceFolder,
                data.cloudfunctionRoot
            );
        }

        if (data.miniprogramRoot) {
            projectConfig.miniprogramRoot = path.resolve(
                sourceFolder,
                data.miniprogramRoot
            );
        } else {
            projectConfig.miniprogramRoot = folder;
        }

        projectConfig.appid = data.appid || data.qqappid || ''
        projectConfig.compileType = data.compileType || '';
        projectConfig.name = decodeURIComponent(data.projectname || '');
    } else {
        projectConfig.miniprogramRoot = sourceFolder;
        utils.log(`Warning： 找不到project.config.json文件(不影响转换，无视这条)`);
        // global.log.push("\r\nWarning： 找不到project.config.json文件(不影响转换，无视这条)\r\n");
        // throw (`error： 这个目录${sourceFolder}应该不是小程序的目录，找不到project.config.json文件`)
    }

    //读取package.json
    let file_package = path.join(folder, 'package.json');
    if (fs.existsSync(file_package)) {
        let packageJson = null;
        try {
            packageJson = fs.readJsonSync(file_package);
        } catch (error) {
            utils.log(`[Error] 解析package.json报错：` + error);
        }
        //
        if (packageJson) {
            projectConfig.name = packageJson.name || '';
            projectConfig.version = packageJson.version || '';
            projectConfig.description = packageJson.description || '';
            //author用不到，先留着
            projectConfig.author = packageJson.author || '';
            projectConfig.dependencies = packageJson.dependencies || {}; //安装的npm包

            //判断是否加载了vant
            // global.hasVant = Object.keys(projectConfig.dependencies).some(key => {
            //     return utils.isVant(key);
            // }) || global.hasVant;
        }
    } else {
        utils.log(`Warning： 找不到package.json文件(不影响转换，无视这条)`);
        // global.log.push("\r\nWarning： 找不到package.json文件(不影响转换，无视这条)\r\n");
    }
    return projectConfig;
}


module.exports = {
    getProjectConfig
};
