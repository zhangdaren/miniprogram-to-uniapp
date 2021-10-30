/*
 * @Author: zhang peng
 * @Date: 2021-10-19 23:47:44
 * @LastEditTime: 2021-10-19 23:48:07
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp2\src\utils\regUtils.js
 *
 */


//静态资源后缀名正则
const staticAssetsReg = /^\.(jpe?g|gif|svg|png|mp3|mp4|ttf|eot|woff)$/i

//支持的文件的正则，用于替换引入路径
const assetsFileReg = /^((\/|\.+\/).*?\.(jpe?g|gif|svg|png|mp3|mp4|ttf|eot|woff))$/i

const multiSssetsFileReg = /['"]?((\/|\.+\/).*?\.(jpe?g|gif|svg|png|mp3|mp4|ttf|eot|woff))['"]?/gi


module.exports = {
    staticAssetsReg,
    assetsFileReg,
}
