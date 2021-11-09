/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2021-10-30 16:43:51
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: /miniprogram-to-uniapp2/src/utils/configUtils.js
 *
 */
const path = require('path');
const fs = require('fs-extra');

var appRoot = "../.."
const utils = require(appRoot + '/src/utils/utils.js');


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
            console.log(`[Error] 解析project.config.json报错：` + error);
        }

        if (data.cloudfunctionRoot) {
            //有云函数的
            projectConfig.cloudfunctionRoot = data.cloudfunctionRoot
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
        // console.log(`Warning： 找不到project.config.json文件(不影响转换，无视这条)`);
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
            console.log(`[Error] 解析package.json报错：` + error);
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
        // console.log(`Warning： 找不到package.json文件(不影响转换，无视这条)`);
        // global.log.push("\r\nWarning： 找不到package.json文件(不影响转换，无视这条)\r\n");
    }
    return projectConfig;
}


module.exports = {
    getProjectConfig
};
