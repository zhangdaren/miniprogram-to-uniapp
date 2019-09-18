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

#### 转换注意事项   

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

[TODO： 待实现]
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

目前仅针对第二、三、四种写法可以实现完美转换。而其它写法，目前uni-app并不支持v-bind=""和动态组件语法，暂无法支持。   
如有大佬对此有完美解决方案，请不吝赐教，谢谢~~   
   
目前的处理规则：   
1. 将wxml里```<tempate name="abc">```内容提取，生成vue文件，并注册为全局组件   
2. 将```<template is="head" data="{{title: 'action-sheet'}}"/>```转换为```<component :is="head" title="'action-sheet'"`/>``   
3. 删除```<import src="../../../common/head.wxml" />```   
4. 因uni-app暂时还不支持动态组件，导致:is="xxx"这种语法并不能支持，为保证转换后能跑起来，已经屏蔽相关代码，且写入日志，方便查看   

      
### wxParse不支持转换   
目前能跑起来，未详测。但因uni-app有更好的同类组件，计划使用那个进行替换这个      


### 变量名与函数名重名
报错：[Vue warn]: Method "xxx" has already been defined as a data property.
解决：在小程序里，data里变量与函数可以同名，而在vue里当场报错，需手动将函数名重名，并修改template里所绑定的函数名。


### 未在data里声明，而直接使用setData赋值   
报错：Avoid adding reactive properties to a Vue instance or its root $data at runtime - declare it upfront in the data option.
解决：工具尽可能的收集了页面里的setData({})里的参数，与data里的变量进行对比，并添加，一般情况不会报这个错。出现这个错，可能是页面里将this传到其他文件里，并调用了setData()函数导致的，需手动修改。
   

   
## 更新记录   
### v1.0.24(20190918)   
* [新增] 支持wx-if转换(对，你没看错，wx:if和wx-if都能用……)   
* [新增] 支持wx:else="{{xxx}}"转换   
* [新增] 支持subPackages分包加载   
* [新增] 识别app.js里exports.default = App({});结构   
* [新增] 识别js文件是否为vue文件结构，通过结构export default {}识别   
* [新增] 增加_.data.xxx转换为_.xxx(定义_为this副本)   
* [新增] 忽略组件plugin:/calendar转换   
* [新增] 收集页面里setData()里参数与data里的变量进行对比，并将差异增加到data里，尽可能修改因未定义变量而直接使用setData()报错的问题(无法100%修复，详见“关于不支持转换的语法说明”)   
* [修复] 修复json文件里定义的usingComponents路径转换   
* [修复] 修复app.json里tabbar里的路径转换   
* [修复] 修复因为找不到```<template is="abc"/>```这里面的abc组件，而出现undefined.vue组件的bug   
* [修复] app.js里，所以非生命周期函数或变量，均放入到globalData里   
* [修复] var app = getApp(); 替换为 var app = getApp().globalData;   
* [修复] 目前uni-app对于非H5平台，暂无法支持动态组件。因此，转换时，将显式引用的组件使用转换为显式组件引用(如```<template is="abc"/>```)，隐式声明的组件(如```<template is="{{item.id}}"/>```)，暂时无法支持，为了保证转换后能正常运行，将直接注释，并存入转换日志，方便后续修改。   
* [修复] css由"内嵌"改为import方式导入，防止vue文件代码行数过长   


  
### v1.0.23(20190907)   
* [修复] @tap前面被添加冒号的bug   
* [修复] app.js没有被转换的bug   
* [修复] 当解析js报错时(如js里使用了重载)，将返回原文件内容   
   

### 历史更新记录已移入ReleaseNote.md   
    

## 感谢   
* 感谢转转大佬的文章：[[AST实战]从零开始写一个wepy转VUE的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)，* 本项目基于此文章里面的代码开发，在此表示感谢~   
* 感谢网友[没有好名字了]给予帮助。   
* 感谢官方大佬DCloud_heavensoft的文章：[微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)，补充了我一些未考虑到的规则。   
* this.setData()代码出处：https://ask.dcloud.net.cn/article/35020，在些表示感谢~  
* 感谢为本项目提供建议以及帮助的热心网友们~~   
    
      
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
