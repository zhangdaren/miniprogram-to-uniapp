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

### 转换注意事项   

* 小程序并不能与uni-app完全对应，转换也并非100%，只希望能尽量减少大家的工作量。我一直在努力，也许有那么一天可以完美转换~~~   
* 小程序使用wxParse组件时，转换难度挺大，建议手动替换为uni-app所对应的插件   


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
   
   
    
## Todolist   
* [已完成] wxml含有import语法时(```<import src="../../../common/head.wxml" />```)，此行未转换，仅原样复制（尽量下一版将完善）   
* [todo] 配置参数，支持指定目录、指定文件方式进行转换   
* [todo] 文件操作的同步方法添加try catch    
* [todo] 未去掉转换产生的空生命周期    
* [todo] 页面/组件里data(){}里面的变量，如含有图片素材，将进行替换    
* [todo] 将pages下面的子目录所包含图片复制到static目录     
* [todo] globalData在app.vue里无法赋值的问题     
   
   
## 更新记录   
### v1.0.13(20190727)   
* [修复] 修复转换到uni-app再生成小程序后，素材路径不对的问题。   
规则：   
1.识别小程序目录下/images、/image、/pages/images或/page/image等目录，将里面的素材复制到/static目录；   
2.修复配置文件里tabbar下面iconPath和selectedIconPath等路径   
3.修复```<image src='../images/abc.png'></image>```里面的src路径   
4.修复wxss文件里所引用的素材文件的路径   
   
注意：   
1.图片素材可能会有同名的，请在转换前重名，否则将直接替换，程序也会显示对应日志，请注意查看！   
2.识别到图片文件再进行复制时，使用的是定式目录，以便保留文件夹结构，如素材目录有其他写法，请告知，感谢~   
3.仅针对页面/组件里data(){}里面的变量，如含有图片素材，将进行替换，而如果代码里含有```return "../images/icn-abc.png";```类似代码，将不会进行替换，切记~   
* [修复] 修复一个wxml文件里包含多个根节点和根元素含有wx:for属性的问题   
* [修复] 修复wx:else含条件的情况   
* [修复] 修复自定义组件使用中划线命名导致语法错误   
* [修复] 修复模板绑定里使用单引号包含双引号导致转换失败(如: ```<view style='height:{{screenHeight+"px"}}'>```)   
* [修复] 修复wx:for、wx:for-item、wx:for-key、wx:for-items等属性   
* [注意] 小程序使用wxParse组件时，转换难度挺大，建议手动替换为uni-app所对应的插件
   

### v1.0.12(20190723)   
* [修复] 晕了，是自己写错代码了。   

   
### v1.0.11(20190723)   
* [新增] 新增this.triggerEvent()转换为this.$emit()   
* [修复] 因uni-app推荐使用rpx替代upx，所以rpx将不再转换    
* [修复] 修复引入全局组件的路径连接符为\\的问题   
* [修复] 修复 wx:else 转换为 v-else="" 的问题(引申：当标签属性的值为“”时，将不再保留值)   
* [修复] 修复解析自闭合标签(如```<image />```)异常的问题   
* [修复] 因setData()实际情况过于复杂(有三元表达式、t.setData()等形式)，回归最初的支持方式：额外添加setData()方法   
* [修复] 修复解析wxml时将标签属性变为小写的问题、解决scrollY等属性对应不上的问题(如scrollY --> scroll-y)   
* [修复] 修复在App()或page()外部定义的函数遗漏的问题   
* [修复] 解决转换computed串到methods的问题   
   

### v1.0.10(20190711)   
* [修复] 修复ReferenceError: chalk is not defined     


### v1.0.9(20190703)   
* [修复] 移动fun(){}这类函数至methods里   
* [修复] 模板语法v-for的索引key重名为index(这里需注意: 小程序的wx:for的索引默认为index)   
* [修复] 将js文件data下面的变量，如果含有路由，将转换为相对路径(因小程序是多页面，而vue是单页面，导致相对路径不一样，当前这项目修复仍未完美，请看下条注意！)   
* [注意！！！] 在转换微信新版含云开发小程序时，发现默认小程序是含有images和sytle目录的，原样复制这俩目录是没毛病的，转换到uni-app后，当再次编译成小程序时，发现uni-app编译时，将这俩目录删除，并且将pages下面的子目录里所包含的png文件也一并删除，导致无法找到资源文件。ps: 此功能将评估后进行优化更新，敬请期待~
   

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
* 感谢转转大佬的文章：[[AST实战]从零开始写一个wepy转VUE的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)，* 本项目基于此文章里面的代码开发，在此表示感谢~   
* 感谢网友[没有好名字了]给予帮助。   
* 感谢官方大佬DCloud_heavensoft的文章：[微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)，补充了我一些未考虑到的规则。   
* 感谢为本项目提供建议以及帮助的热心网友们~~
   

   
   
### 参考资料   
0.[[AST实战]从零开始写一个wepy转VUE的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)   此文获益良多   
1.[https://astexplorer.net/](https://astexplorer.net/)   AST可视化工具   
2.[Babylon-AST初探-代码生成(Create)](https://summerrouxin.github.io/2018/05/22/ast-create/Javascript-Babylon-AST-create/)   系列文章(作者是个程序媛噢~)   
3.[Babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-inserting-into-a-container)  中文版Babel插件手册   
5.[Babel官网](https://babeljs.io/docs/en/babel-types)   有问题直接阅读官方文档哈   
6.[微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)  补充了我一些未考虑到的规则。   
   
   
## LICENSE
This repo is released under the [MIT](http://opensource.org/licenses/MIT).