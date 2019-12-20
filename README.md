# 微信小程序转换为uni-app项目   
   
输入小程序项目路径，输出uni-app项目。
   
实现项目下面的js+wxml+wxss转换为vue文件，模板语法、生命周期函数等进行相应转换，其他文件原样复制，生成uni-app所需要的配置文件。   
PS:
很多人问：wx.xxx()为什么不替换为uni.xxx()呢？
答案是暂时不需要，不是替换不了，而是uni-app早已对wx相关函数进行兼容，所以可以直接使用，而不需要再调整了。
   
        
## 安装   
   
```js
$ npm install miniprogram-to-uniapp -g
```
   
## 升级版本   
   
```js
$ npm update miniprogram-to-uniapp -g
```
   
## 使用方法

```sh
Usage: wtu [options]

Options:

  -V, --version     output the version number [版本信息]
  -i, --input       the input path for weixin miniprogram project [输入目录]
  -h, --help        output usage information [帮助信息]
  -c, --cli         the type of output project is vue-cli, which default value is false [是否转换为vue-cli项目，默认false]
  -w, --wxs         transform wxs file to js file, which default value is false [是否将wxs文件转换为js文件，默认false]

```

Examples:

```sh
$ wtu -i miniprogramProject
```

vue-cli mode [转换项目为vue-cli项目]:
```sh
$ wtu -i miniprogramProject -c
```

Transform wxs file to js file [转换项目并将wxs文件转换为js文件]:
```sh
$ wtu -i miniprogramProject -w
```

## 使用指南

本插件详细使用教程，请参照：[miniprogram-to-uniapp使用指南](http://ask.dcloud.net.cn/article/36037)。

对于使用有疑问或建议，欢迎加入QQ群：780359397进行讨论。


## 已完成   
* 支持有/无云开发的小程序项目转换为uni-app项目   
* 支持*.js', *.wxml和*.wxss文件进行相应转换，并做了大量的优化   
* 支持app.js、page和component生命周期函数的转换   
* 区分app.js/component，两者解析规则略有不同   
* 添加setData()函数于methods下，解决this.setData()【代码出处：https://ask.dcloud.net.cn/article/35020】  
* ~~App.vue里，this.globalData.xxx替换为this.$options.globalData.xxx(后续uni-app可以支持时，此功能将回滚，已回滚)~~   
* 支持wxs文件转换，可以通过参数配置(-w)，默认为false
* 支持vue-cli模式，即生成为vue-cli项目，转换完成需运行npm -i安装包，然后再导入hbuilder x里开发  
* 导出```<template data="abc"/>``` 标签为abc.vue，并注册为全局组件   
* 使用[uParse修复版](https://ext.dcloud.net.cn/plugin?id=364)替换wxParse   
* 搜索未在data声明，而直接在setData()里使用的变量，并修复   
* 合并使用require导入的wxs文件   
* 因uni-app会将所有非static目录的资源文件删除，因此将所有资源文件移入static目录，并修复所有能修复到的路径   
* 修复变量名与函数重名的情况   
* 支持解析include标签
   
   
## 更新记录   
### v1.0.40(20191220)   
* [优化] wx:key和wx:for-index共存时，优先使用wx:for-index作为key    
* [修复] 支持hidden属性转换为v-if    
* [修复] ```wx:item="{{item}}"```未被转换的bug   

### v1.0.39(20191219)   
* [优化] 日志展示样式   
* [修复] 标签上仅有wx:key时，转换出错的bug   
* [修复] 根目录包含图片资源时，导致pages未进行转换的bug   

### v1.0.38(20191218)   
* [优化] 提取页面里所有this的别名，进行近乎精确的替换   
* [修复] 更多的getApp()的转换   
* [修复] css里资源路径被遗漏处理的bug   
* [修复] app.js转换变量出现错乱的bug(如this、globalData等)   
* [试处理]] ```<button sessionFrom="{'nickname': '{{userInfo.nickname}}', 'avatarUrl': '{{userInfo.avatar}}'}"></button>```   

## [历史更新记录](ReleaseNote.md)   
    
## [关于不支持转换的语法说明](Unsupported.md)  

## 感谢   
* 感谢转转大佬的文章：[[AST实战]从零开始写一个wepy转VUE的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)， 本项目基于此文章里面的代码开发，在此表示感谢~   
* 感谢网友[没有好名字了]给予帮助。   
* 感谢官方大佬DCloud_heavensoft的文章：[微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)，补充了我一些未考虑到的规则。   
* this.setData()代码出处：https://ask.dcloud.net.cn/article/35020，在些表示感谢~  
* 工具使用[uParse修复版](https://ext.dcloud.net.cn/plugin?id=364)替换wxParse，表示感谢~
* 感谢为本项目提供建议以及帮助的热心网友们~~   
    
      
## 参考资料   
0. [[AST实战]从零开始写一个wepy转VUE的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)   此文获益良多   
1. [https://astexplorer.net/](https://astexplorer.net/)   AST可视化工具   
2. [Babylon-AST初探-代码生成(Create)](https://summerrouxin.github.io/2018/05/22/ast-create/Javascript-Babylon-AST-create/)   系列文章(作者还是个程序媛噢~)   
3. [Babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-inserting-into-a-container)  中文版Babel插件手册   
5. [Babel官网](https://babeljs.io/docs/en/babel-types)   有问题直接阅读官方文档哈   
6. [微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)  补充了我一些未考虑到的规则。   
7. 更新babel版本，命令：npx babel-upgrade --write
   
   
## 最后
如果觉得帮助到你的话，点个赞呗~

打赏一下的话就更好了~

![微信支付](src/img/WeChanQR.png)![支付宝支付](src/img/AliPayQR.png)


## LICENSE
This repo is released under the [MIT](http://opensource.org/licenses/MIT).
