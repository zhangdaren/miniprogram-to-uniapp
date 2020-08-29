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
      default:
        // the data argument must be of type string or an instance of buffer typeArray or dataView receive type Number(NaN)
        global.log.push("\r\Error: targetFilePath: " + targetFilePath + " 内容为空！！！ r\n");
        //可能会有某种情况（暂未复现是何种情况出现），会报错
        //因此当文件内容为空时，给它一个空格(有时文件为空，但引用还在，所以不能直接删除)
        fileContent = " ";
        break;
    }

    //写入文件
    fs.writeFileSync(targetFilePath, fileContent);
  }
}


/**
 * 解析小程序项目的配置
 * @param {*} folder        小程序主体所在目录
 * @param {*} sourceFolder  输入目录
 */
function getProjectConfig (folder, sourceFolder) {
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
      utils.log(`Error： 解析project.config.json报错：` + error);
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
    // utils.log(`Warning： 找不到project.config.json文件(不影响转换，无视这条)`);
    global.log.push("\r\nWarning： 找不到project.config.json文件(不影响转换，无视这条)\r\n");
    // throw (`error： 这个目录${sourceFolder}应该不是小程序的目录，找不到project.config.json文件`)
  }

  //读取package.json
  let file_package = path.join(folder, 'package.json');
  if (fs.existsSync(file_package)) {
    let packageJson = null;
    try {
      packageJson = fs.readJsonSync(file_package);
    } catch (error) {
      utils.log(`Error： 解析package.json报错：` + error);
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
    // utils.log(`Warning： 找不到package.json文件(不影响转换，无视这条)`);
    global.log.push("\r\nWarning： 找不到package.json文件(不影响转换，无视这条)\r\n");
  }
  return projectConfig;
}


/**
 * 项目处理
 */
function projectHandle () {
  includeTagHandle();
  templateTagHandle();
  saveAllFile();
}

module.exports = {
  projectHandle,
  getProjectConfig,
};
