# 微信小程序转换为uni-app项目   
   
输入小程序项目路径，输出uni-app项目。
   
实现项目下面的js+wxml+wxss转换为vue文件，模板语法、生命周期函数等进行相应转换，其他文件原样复制，生成uni-app所需要的配置文件。   
   
        
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
  -o, --output      the output path for uni-app project, which default value is process.cwd() [输出目录]
  -h, --help        output usage information [帮助信息]
  -c, --cli         the type of output project is vue-cli, which default value is false [是否转换为vue-cli项目，默认false]
  -w, --wxs         transform wxs file to js file, which default value is false [是否将wxs文件转换为js文件，默认false]

```

Examples:

```sh
$ wtu -i miniprogramProject
```

vue-cli mode [转换为vue-cli项目]:
```sh
$ wtu -i miniprogramProject -c
```

Transform wxs file to js file [将wxs文件转换为js文件]:
```sh
$ wtu -i miniprogramProject -w
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
* 解析wxss文件，修复import *.wxss语句及引用的资源路径修复   
* 支持生命周期函数的转换   
* 支持同一目录下有不同名js/wxml/wxss文件转换   
* 区分app.js/component，两者解析规则略有不同   
* 添加setData()函数于methods下，解决this.setData()【代码出处：https://ask.dcloud.net.cn/article/35020】  
* App.vue里，this.globalData.xxx替换为this.$options.globalData.xxx(后续uni-app可以支持时，此功能将回滚)   
* 支持wxs文件转换，可以通过参数配置(-w)，默认为false
* 支持vue-cli模式，即生成为vue-cli项目，转换完成需运行npm -i安装包，然后再导入hbuilder x里开发  
* 导出```<template data="abc"/>``` 标签为abc.vue，并注册为全局组件
   
    
## Todolist   
* [todo] 配置参数，支持指定目录、指定文件方式进行转换，增加参数-p 支持子目录转换   
* [todo] 文件操作的同步方法添加try catch    
* [todo] template标签转换为vue文件   
* [todo] 浏览小程序文档，发现生命周期函数可以写在lifetimes或pageLifetimes字段时，需要兼容一下(https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/component.html)   
* [todo] 小程序组件还有其他生命周期函数转换   
* [todo] 组件批量注册   
* [todo] 删除生成目录里的空白目录   

[TODO： 下一版实现]
+ 支持解析下面这种写法   
···
"usingComponents": {
   "pwdPay": "plugin://bbgPay/pwdPay"
}
···
+ 支持subPackages节点，目前有点小问题，已经被干掉了   
+ 支持含双引号代码的转换，如```<view class='citem' style='background-image:url("{{item.photo}}")'>```   
+ 转换前先格式化代码   
   
   

## 关于不支持转换的语法说明   

### ```<import src="*.wxml"/>```支持部分语法处理   

常规我们见到的代码是这样的(摘自官方小程序示例demo)：   
```
<import src="../../../common/head.wxml" />
<view class="container">
    <template is="head" data="{{title: 'action-sheet'}}"/>
</view>
```

为了解决这个问题，我收集到一些```<template/>```的写法：   

*	```<template is="msgItem"  data="{{'这是一个参数'}}"/>```
*	```<template is="t1" data="{{newsList, type}}"/>``` 【目前支持转换的写法】  
*	```<template is="head" data="{{title: 'action-sheet'}}"/>``` 【目前支持转换的写法】   
*	```<template is="head" wx:if="{{index%2 === 0}}" data="{{title: 'action-sheet'}}"/>``` 【目前支持转换的写法】   
*	```<template is="courseLeft" wx:if="{{index%2 === 0}}" data="{{...item}}"></template>```
*	```<template is="{{index%2 === 0 ? 'courseLeft' : 'courseRight'}}" data="{{...item}}"></template>```
* ```<template is="stdInfo" wx:for="{{stdInfo}}" data="{{...stdInfo[index], ...{index: index, name: item.name} }}"></template>```

目前仅针对第二、三、四种写法可以实现完美转换。而其它写法，目前uni-app并不支持v-bind=""语法，暂无法支持。   
如有大佬对此有完美解决方案，请不吝赐教，谢谢~~   
   
目前的处理规则：   
1. 将wxml里```<tempate name="abc">```内容提取，生成vue文件，并注册为全局组件   
2. 将```<template is="head" data="{{title: 'action-sheet'}}"/>```转换为```<component :is="head" title="'action-sheet'"`/>``   
3. 删除```<import src="../../../common/head.wxml" />```   

      
### wxParse不支持转换   
因uni-app有更好的同类组件，计划使用那个进行替换这个      
  
   
## 更新记录   
### v1.0.22(20190907)   
* [新增] 完善template标签转换，除了不支持data里含...扩展运算符外(因uni-app现还不支持v-bind="")，其他都已支持(含...的data，已重名为error-data，需手工调整：换一种方式导入自定义组件或显式调用组件)  
* [新增] 将含有内置关键字的组件名替换为别名   
* [修复] -c模式下，输出目录不存在而报错的bug   
* [修复] 增加解析js文件错误提示   
* [修复] 修复当同一组文件(js/wxml/wxss)内容都为空时，影响后面流程不能生成pages.json等配置文件的bug   
* [修复] 无遗漏处理bind前缀事件名称   
* [修复] 将manifest.json里的name字段，如果为中文，转换为拼音。修复含中文导致HBX识别不到manifest.json的bug   
* [修复] 转换wxss代码import *.wxss里的文件路径为相对路径   
* [修复] 转换js代码import xxx from "*.js"里的文件路径为相对路径   
* [修复] 转换js代码require('./util')里的文件路径为相对路径   
* [修复] 删除绑定的值为空的标签属性(如```<view value={{}}>```)   
[注意！！！] 如HBX运行时提示“项目下缺少manifest.json文件”，请在项目上右键【重新识别项目类型】  
   
   
### v1.0.21(20190830)   
* [新增] 【-c】命令，支持生成vue-cli项目，默认为【false】，生成后请在生成目录里执行 npm i 安装npm包(大概需要200+s)，然后可以直接将整个目录拖入到HBuilderX里二次开发或运行，如HBX运行时提示“项目下缺少manifest.json文件”，请在项目上右键【重新识别项目类型】   
* [新增] vue-cli项目，支持配置静态目录(在vue.config.js里alias节点设置)，目前已配置【'@' --> './src'】和 【'assets' --> './src/static'】   
* [新增] 【-w】命令，支持转换wxs为js文件，默认为【false】，因uni-app已在app和小程序平台支持wxs标签，而wxs近期也将支持H5平台，所以默认不再转换(还有一个原因是因为遇到同一个目录里，同时包含utils.js和utils.wxss，显然转换为js文件时，两个文件会合为一个，so……)   
* [新增] 处理属性bind:tap-->@tap   
* [新增] 转换完成后，在生成目录里，生成transform_log.log文件(每次转换都会重新生成！)   
* [修复] 处理标签class属性含多个{{}}或有三元表达式的情况(如：```<view class="abc abc-{{item.id}} {{selId===item.id?'active':''}}"></view>```)   
* [修复] 删除page.json里的usingComponents节点。通过import导入组件时，不需要在page.json里重复注册   
* [修复] 删除wx:for-index标签   
      
### v1.0.20(20190823)   
* [修复] 去掉引用组件时的后缀名(如：Vue.component('navbar.vue', navBar))，转换组件名为驼峰全名    
* [修复] 修改搜索资源路径的正则表达式，以兼容低版本Node.js   
* [修复] 修复当页面里的onLoad为onLoad: function() {}时，处理wxs而报错的bug   
* [修复] 转换结束后，增加template和image的提示   
* [修复] 对于小程序目录，project.config.json不存在也可进行转换   

### 历史更新记录已移入ReleaseNote.md   
    

## 感谢   
* 感谢转转大佬的文章：[[AST实战]从零开始写一个wepy转VUE的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)，* 本项目基于此文章里面的代码开发，在此表示感谢~   
* 感谢网友[没有好名字了]给予帮助。   
* 感谢官方大佬DCloud_heavensoft的文章：[微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)，补充了我一些未考虑到的规则。   
* 感谢为本项目提供建议以及帮助的热心网友们~~   
* this.setData()代码出处：https://ask.dcloud.net.cn/article/35020，在些表示感谢~   
   
      
## 参考资料   
0. [[AST实战]从零开始写一个wepy转VUE的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)   此文获益良多   
1. [https://astexplorer.net/](https://astexplorer.net/)   AST可视化工具   
2. [Babylon-AST初探-代码生成(Create)](https://summerrouxin.github.io/2018/05/22/ast-create/Javascript-Babylon-AST-create/)   系列文章(作者是个程序媛噢~)   
3. [Babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-inserting-into-a-container)  中文版Babel插件手册   
5. [Babel官网](https://babeljs.io/docs/en/babel-types)   有问题直接阅读官方文档哈   
6. [微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)  补充了我一些未考虑到的规则。   
   
   
## 最后
如果觉得帮助到你的话，点个赞呗~

打赏一下的话就更好了~

![微信支付](src/img/WeChanQR.png)![支付宝支付](src/img/AliPayQR.png)


## LICENSE
This repo is released under the [MIT](http://opensource.org/licenses/MIT).
