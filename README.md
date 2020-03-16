# 微信小程序转换为uni-app项目   
   
输入小程序项目路径，输出uni-app项目。
   
实现项目下面的js+wxml+wxss转换为vue文件，模板语法、生命周期函数等进行相应转换，其他文件原样复制，生成uni-app所需要的配置文件。  
    
PS:   
很多人问：wx.xxx()为什么不替换为uni.xxx()呢？   
答: 暂时不需要，不是替换不了，而是uni-app早已对wx相关函数进行兼容，所以可以直接使用，而不需要再调整了。   
   
再PS：最新版本已经可以添加-r参数，达到替换wx.xxx()为uni.xxx()的目的。
   
        
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
  -z, --vant        transform vant-weapp project to uni-app, automatic check [是否支持转换vant项目，无需添加参数，自动识别是否为vant项目]
  -r, --rename      rename wx.xxx() to uni.xxx(), which default value is false [是否转换wx.xxx()为uni.xxx()，默认false]

```

Examples:

```sh
$ wtu -i miniprogramProject
```

vue-cli mode [转换项目为vue-cli项目(因vue-cli项目门槛较高，且该功能长时间未维护，不推荐使用)]:
```sh
$ wtu -i miniprogramProject -c
```

Transform wxs file to js file [转换项目并将wxs文件转换为js文件(因uni-app已支持wxs，此功能未维护)]:
```sh
$ wtu -i miniprogramProject -w
```

## 使用指南

本插件详细使用教程，请参照：[miniprogram-to-uniapp使用指南](http://ask.dcloud.net.cn/article/36037)。

对于使用有疑问或建议，欢迎加入QQ群：780359397 进行讨论。

<a target="_blank" href="http://shang.qq.com/wpa/qunwpa?idkey=6cccd111e447ed70ee0c17672a452bf71e7e62cfa6b427bbd746df2d32297b64"><img border="0" src="http://pub.idqqimg.com/wpa/images/group.png" alt="小程序转uni-app讨论群" title="小程序转uni-app讨论群"></a>

## 已完成   
* 支持无云开发的小程序项目转换为uni-app项目
* 支持有云开发的小程序项目转换为uni-app项目(cloudfunctions目录将被忽略，uni-app结合小程序云开发见：[使用uni-app进行微信小程序云开发经验分享](https://ask.dcloud.net.cn/article/35933))   
* 支持解析TypeScript小程序项目   
* 支持解析使用npm模块的小程序项目   
* 支持解析include标签   
* 支持解析template标签   
* 支持解析Behavior文件为mixins文件   
* 支持*.js', *.wxml和*.wxss文件进行相应转换，并做了大量的优化   
* 支持识别App、Page、Component、VantComponent、Behavior和纯Javascript文件的转换   
* ~~App.vue里，this.globalData.xxx替换为this.$options.globalData.xxx(后续uni-app可以支持时，此功能将回滚，已回滚)~~   
* ~~导出```<template data="abc"/>``` 标签为abc.vue，并注册为全局组件~~   
* 使用[jyf-parser](https://ext.dcloud.net.cn/plugin?id=805)替换wxParse(感谢网友 “爱瑞巴勒康忙北鼻” 的建议)   
* 搜索未在data声明，而直接在setData()里使用的变量，并修复   
* 合并使用require导入的wxs文件   
* 因uni-app会将所有非static目录的资源文件删除，因此将所有资源文件移入static目录，并修复所有能修复到的路径(**文件不存在时路径将不会转换，在变量或数组里的路径也不会转换，需自行处理** )   
* 修复变量名与函数重名的情况(目前uni编译时会将非static目录的文件复制一份到static目录，但并不完全，因此本功能仍保留)   
* 支持wxs文件转换，可以通过参数配置(-w)，默认为false(目前uni-app已支持wxs，不再推荐转换wxs)   
* 支持vue-cli模式，可以通过参数配置(-c)，默认为false，即生成为vue-cli项目，转换完成需运行npm -i安装包，然后再导入hbuilder x里开发(建议爱折腾人士使用)  
* 支持vant转换，可以通过参数配置(-z)，默认为false：自动识别（无须添加参数，工具已支持自动识别vant项目），~~如果需要转换使用vant-weapp组件的小程序项目，必须配置这个参数，否则转换后有问题。~~（另外，转换后的项目，目前仅支持v3和h5两个平台）  
* 支持wx.xxx()转换为uni.xxx()，可以通过参数配置(-r)，默认为false（因uni已经对wx相关函数做了兼容，但仍有很多朋友有此需求，特作为可配置项，按需自取）  
   
   
## 更新记录   
### v1.0.60(20200316)   
* [优化] 进一步转换在变量或数组里面的资源路径，减少漏网之鱼   
* [新增] ```capture-bind:tap```转换为```@tap.stop```(uniapp无对应的语法，只能合二为一)   
* [修复] 重名标签属性id时，导致```e.currentTarget.id```拿不到的bug(不再转换:id为:idAttr)   

### v1.0.59(20200313)   
* 【重要】 自动检测是否为vant项目，而无须添加-z参数，并在转换结束后增加检测vant项目的提示   
* [优化] wx:key为表达式时的解析(如```<block wx:for="{{rechargelist}}" wx:for-item="items" wx:key="index<=6">```)   
* [优化] 清除css里失效的iconfont字体文件引用  
* [修复] 关键字wx替换不完全的bug   
* [修复] js代码未添加script标签的bug   
* [修复] wxml仅有单标签slot时，解析出的bug   
* [修复] ```t.globalData.approot``` 转换为 ```t.approot```   
* [修复] 使用网络链接的图片路径被误添加相对路径的bug   
* [修复] 文件mixins/transition.js被添加script标签的bug   
* [修复] 模板里两个00而引起编译报错的bug(如```<text>{{countDownHour || 00}}</text>```)   
* [修复] 项目中使用ES2015标准的import语句时导致解析失败的bug(如```import 'moment';```等)   
* [修复] 解析函数```formSubmit: util.throttle(function (e) {...}, 1000)```未正确放置到methods的bug   
* [修复] template里存在单个引号导致编译报错的bug(如```<view style="line-height: 48rpx\""></view>```)，同时处理了含\"的代码(如```<view style="background: url(\"{{ui.home_red_pack_bg}}\")"></view>```)   

### v1.0.58(20200229)   
* [优化] 增加参数(-r，默认为false)，以替换wx.xxx()为uni.xxx()   
* [优化] 资源路径替换时，替换后的路径相对于根路径，以减少路径引用复杂度(因官方对于tabbar里iconPath路径并未替换，路径替换功能暂不准备弃用)   
* [优化] 如js文件为webpack打包后的文件(你懂得~)，转换后增加script标签包裹，避免因此而编译报错      
* [优化] 将原来用于替换wxParse的组件gaoyia-parse，改为使用[jyf-parser](https://ext.dcloud.net.cn/plugin?id=805)   
* [优化] "catchtap" 由 "@tap.native.stop" 改为 "@tap.stop"(因前者仅支持微信小程序，测试范围app、h5、微信小程序)   
* [优化] 解析vant项目时，将富文本组件使用v3的v-html替代(残余wxPrase需手动调整)   
* [修复] van开头的组件没有被加入的bug   
* [修复] 替换wxParse时，数据变量未在data里声明的bug   


## [历史更新记录](ReleaseNote.md)   

## [miniprogram to uniapp 工具答疑](https://github.com/zhangdaren/articles/blob/master/miniprogram-to-uniapp%E5%B7%A5%E5%85%B7%E7%AD%94%E7%96%91.md)

## 感谢   
* 感谢转转大佬的文章：[[AST实战]从零开始写一个wepy转VUE的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)， 本项目基于此文章里面的代码开发，在此表示感谢~   
* 感谢网友[没有好名字了]给予帮助。   
* 感谢官方大佬DCloud_heavensoft的文章：[微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)，补充了我一些未考虑到的规则。   
* this.setData()代码出处：https://ask.dcloud.net.cn/article/35020，在些表示感谢~  
* 工具使用[jyf-parser](https://ext.dcloud.net.cn/plugin?id=805)替换wxParse，表示感谢~
* 感谢为本项目提供建议以及帮助的热心网友们~~   
    
      
## 参考资料   
0. [[AST实战]从零开始写一个wepy转VUE的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)   此文获益良多   
1. [https://astexplorer.net/](https://astexplorer.net/)   AST可视化工具   
2. [Babylon-AST初探-代码生成(Create)](https://summerrouxin.github.io/2018/05/22/ast-create/Javascript-Babylon-AST-create/)   系列文章(作者还是个程序媛噢~)   
3. [Babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-inserting-into-a-container)  中文版Babel插件手册   
5. [Babel官网](https://babeljs.io/docs/en/babel-types)   有问题直接阅读官方文档哈   
6. [微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)  补充了我一些未考虑到的规则。   
7. 更新babel版本，命令：npx babel-upgrade --write
8. 发布npm版本：npm publish --acces=public
   
   
## 最后
如果觉得帮助到你的话，点个赞呗~

打赏一下的话就更好了~

![微信支付](src/img/WeChanQR.png)![支付宝支付](src/img/AliPayQR.png)


## LICENSE
This repo is released under the [MIT](http://opensource.org/licenses/MIT).
