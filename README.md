# 微信小程序转换为uni-app项目   
   
输入小程序项目路径，输出uni-app项目。
   
实现项目下面的js+wxml+wxss转换为vue文件，模板语法、生命周期函数等进行相应转换，其他文件原样复制，生成uni-app所需要的配置文件。   
   
        
## 安装   
   
```js
$ npm install miniprogram-to-uniapp -g
```

## 使用方法

```sh
Usage: wtu [options]

Options:

  -V, --version     output the version number
  -i, --input       the input path for weixin miniprogram project
  -o, --output      the output path for uni-app project, which default value is process.cwd()
  -h, --help        output usage information

```

Examples:

```sh
$ wtu -i miniprogramProject
```

## 使用指南

本插件详细使用教程，请参照：[miniprogram-to-uniapp使用指南](http://ask.dcloud.net.cn/article/36037)。


## 转换规则   
基本参照大佬的文章：[微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)。

因为小程序与uni/vue的语法以及文件结构都有很大的差别，所以做了很多的优化工作，后面再补。
   

## 已完成   
* 支持含云开发的小程序项目(有云开发与无云开发的项目的目录结构有差别)   
* 支持['btn/btn.js', 'btn/btn.wxml', 'btn/btn.wxss']或['btn/btn.js', 'btn/btn.wxml' || 'btn/btn.wxss']转换为'btn/btn.vue' ，模板语法、生命周期函数等进行相应转换  
* 支持['util/util.js']复制为['util/util.js']，原样复制   
* 支持['1.wxss']复制为['1.css']，原样复制，仅对import的模块进行后缀名修改   
* 支持生命周期函数的转换   
* 支持同一目录下有不同名js/wxml/wxss文件转换   
* 区分app.js/component，两者解析规则略有不同   
* 替换rpx为upx   
* this.setData({aa:"123", bb:"456"}); 转换为this.aa="123"; this.bb="456";   
* ~~app.globalData/getApp().golbalData：通过将globalData挂载到vue的原型上来实现此功能，app.fun()这类函数仍保留不变（需要用户自行处理）~~   
   
   
    
## 存在问题 & todolist   
* [已完成] js里含有ES6的扩展运算符(...)时，会解析报错   
* [todo] wxml含有import语法时(```<import src="../../../common/head.wxml" />```)，此行未转换，仅原样复制（尽量下一版将完善）   
* [todo] 配置参数，支持指定目录、指定文件方式进行转换   
* [todo] 文件操作的同步方法添加try catch    
* [todo] 未去掉转换产生的空生命周期    
* [已完成] getApp()的支持    
* [已完成] this在嵌套函数里，并且不是箭头函数里，将无法引用到全局globalData(后面将function转换成=>，或添加that变量)
* [已完成] ```<template is="head" data="{{title: 'addPhoneContact'}}"/>``` template的属性暂不作转换
   

   
## 更新记录   
### v1.0.8(20190702)   
* [新增] 支持识别 "that.setData()"   
* [新增] 模板语法v-for增加:key属性   
* [新增] 支持自定义组件嵌入   
* [新增] 支持全局组件引用   
* [修复] 修复this.setData里，key为字符串导致转换失败的情况(测试代码如下)   
``` javasctipt
this.setData({
    "show":true,
    ["swiperConfig.current"]: event.detail.current
})
```
* [修复] getApp()代码不作转换   
* [修复] globalData 存入生命周期里   
* [修复] 修复多个template在一个wxml文件里时转换失败   
* [修复] 修复wxml、wxss里面import的路径为相对路径（因uni-app不支持/根目录表达方式）  


### v1.0.7(20190626)   
* 修复函数里的函数会被提取到全局的问题   

   
### v1.0.6(20190626)   
* 修复局部变量会被提取到全局变量的bug   
* 忽略```<template/>```上面的的属性转换   
   
    
## 感谢   
感谢转转大佬的文章：[[AST实战]从零开始写一个wepy转VUE的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)，本项目基于此文章里面的代码开发，在此表示感谢~   
感谢网友[没有好名字了]给予帮助。   
感谢官方大佬DCloud_heavensoft的文章：[微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)，补充了我一些未考虑到的规则。   
   
   
   
### 参考资料   
0.[[AST实战]从零开始写一个wepy转VUE的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)   此文获益良多   
1.[https://astexplorer.net/](https://astexplorer.net/)   AST可视化工具   
2.[Babylon-AST初探-代码生成(Create)](https://summerrouxin.github.io/2018/05/22/ast-create/Javascript-Babylon-AST-create/)   系列文章(作者是个程序媛噢~)   
3.[Babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-inserting-into-a-container)  中文版Babel插件手册   
5.[Babel官网](https://babeljs.io/docs/en/babel-types)   有问题直接阅读官方文档哈   
6.[微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)  补充了我一些未考虑到的规则。   
   
   
## LICENSE
This repo is released under the [MIT](http://opensource.org/licenses/MIT).