# Miniprogram to uni-app - Release Notes   
======================================
## v1.0.21(20190830)   
* [新增] 【-c】命令，支持生成vue-cli项目，默认为【false】，生成后请在生成目录里执行 npm i 安装npm包(大概需要200+s)，然后可以直接将整个目录拖入到HBuilderX里二次开发或运行，如HBX运行时提示“项目下缺少manifest.json文件”，请在项目上右键【重新识别项目类型】   
* [新增] vue-cli项目，支持配置静态目录(在vue.config.js里alias节点设置)，目前已配置【'@' --> './src'】和 【'assets' --> './src/static'】   
* [新增] 【-w】命令，支持转换wxs为js文件，默认为【false】，因uni-app已在app和小程序平台支持wxs标签，而wxs近期也将支持H5平台，所以默认不再转换(还有一个原因是因为遇到同一个目录里，同时包含utils.js和utils.wxss，显然转换为js文件时，两个文件会合为一个，so……)   
* [新增] 处理属性bind:tap-->@tap   
* [新增] 转换完成后，在生成目录里，生成transform_log.log文件(每次转换都会重新生成！)   
* [修复] 处理标签class属性含多个{{}}或有三元表达式的情况(如：```<view class="abc abc-{{item.id}} {{selId===item.id?'active':''}}"></view>```)   
* [修复] 删除page.json里的usingComponents节点。通过import导入组件时，不需要在page.json里重复注册   
* [修复] 删除wx:for-index标签   
      
   
## v1.0.20(20190823)   
* [修复] 去掉引用组件时的后缀名(如：Vue.component('navbar.vue', navBar))，转换组件名为驼峰全名    
* [修复] 修改搜索资源路径的正则表达式，以兼容低版本Node.js   
* [修复] 修复当页面里的onLoad为onLoad: function() {}时，处理wxs而报错的bug   
* [修复] 转换结束后，增加template和image的提示   
* [修复] 对于小程序目录，project.config.json不存在也可进行转换   
   
## v1.0.19(20190822)   
* [新增] 支持wxs语法转换，查阅文档仅看到正则和日期与js稍有不同，暂未发现其他   
wxs语法转换规则：   
1.getDate() --> new Date()   
2.getRegExp() --> new RegExp()   

## v1.0.18(20190821)   
* [新增] 支持wxs文件转换(两种方式：module和src)。   
wxs转换规则：   
1.将wxs文件转换为.js文件   
2.module标签里如果包含代码则生成为js文件   
3.使用第二步的js文件地址或src属性，生成import代码插入到vue文件的```<script/>```里   
4.给生命周期onLoad()/created()里添加一行代码：```this.xxx=xxx;```(关键代码！)   
* [修复] 组件生命周期函数attached转换为beforeMount   
* [修复] 修复转换```that.triggerEvent("action");```报错的bug   
* [修复] 修复css里资源路径斜杠未转换的bug   
* [注意!!] wxs转js语法下版完善~   
   
   
## v1.0.17(20190814)   
* [新增] 新增支持workers目录转换(约定workers目录就位于小程序根目录，复制到static目录，并修复相关路径)   
* [新增] 新增将所有资源文件全部移入到static目录下，并尽量保持目录结构，修复wxml和wxss文件里的相对路径(js文件里的资源路径情况太多，本版本暂不支持数组里面的资源路径转换)   
* [修复] 修复生成组件时，props为[undefined]的bug   
* [修复] 强化css里用来搜索资源路径的正则表达式   
* [修复] 修复绑定属性增加了绑定属性而未能将原属性删除的bug   
* [修复] 修复全局组件不含后缀名导致解析出错的bug   
* [重要！！！] 现在已经能完美转换[微信小程序官方Demo]https://github.com/wechat-miniprogram/miniprogram-demo， (wxs标签暂不支持转换，需手动调整)   
   
   
## v1.0.16(20190812)   
* [修复] 修复App.vue里import路径不带./的问题   
* [修复] 修复class="{{xxx}}"的情况   
* [修复] catchtap转换为@click.stop   
* [修复] 修复```<template name="foot"/>```生成为嵌套template的问题   
* [修复] import导入组件时，将组件名转换为驼峰命名方式   
* [修复] 删除掉wxss文件里导入app.wxss的相关代码(因uni-app为单页，所以可以共用app.vue里面的样式)   
* [修复] wx:key="*this"-->:key="index"， wx:key="*item"-->:key="index" 注意！！！注意小程序源代码里*this这种关键字，现在默认转换为index，如需其他写法，请先调整好小程序源代码！   
* [修复] 支持多级wx:for，自动调整key为 “index + 数字” 的形式进行递增   
* [修复] 修复当页面位于image目录会被误当成资源目录而操作   
* [修复] 实现部分import *.wxml的转换  
   

## v1.0.15(20190802)   
* [新增] 组件生命周期转换(attached-->onLoad、properties-->props和methods)，修复import xxx from "/components/xxx/"转换后路径不对的问题   
* [修复] 修复识别没有协议头的资源地址   
* [修复] 修复key="{{item.id}}"的情况   
* [修复] 修复bindtap事件有{{}}的情况   
* [修复] 修复TypeError: Property left of AssignmentExpression expected node to be of a type ["LVal"] but instead got "ThisExpression"(原因是替换this.data不严谨)
* [修复] 自动识别关键字this.data.xxx、_this.data.xxx和that.data.xxx等关键字替换为[this|_this|that].xxx(因this可以使用变量替代，且写法不一，没法做到匹配所有情况)   
   

## v1.0.14(20190729)   
* [修复] 修复App.vue里没法使用this.globalData.xxx的方式来设置globalData数据(注意：后期如uni-app修复这个问题，那此项修复将回滚)   
* [修复] 修复this.data.xxx为this.xxx(这两次更新不小心干掉了∙̆ .̯ ∙̆ )   
   

## v1.0.13(20190727)   
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
   

## v1.0.12(20190723)   
* [修复] 晕了，是自己写错代码了。   

   
## v1.0.11(20190723)   
* [新增] 新增this.triggerEvent()转换为this.$emit()   
* [修复] 因uni-app推荐使用rpx替代upx，所以rpx将不再转换    
* [修复] 修复引入全局组件的路径连接符为\\的问题   
* [修复] 修复 wx:else 转换为 v-else="" 的问题(引申：当标签属性的值为“”时，将不再保留值)   
* [修复] 修复解析自闭合标签(如```<image />```)异常的问题   
* [修复] 因setData()实际情况过于复杂(有三元表达式、t.setData()等形式)，回归最初的支持方式：额外添加setData()方法   
* [修复] 修复解析wxml时将标签属性变为小写的问题、解决scrollY等属性对应不上的问题(如scrollY --> scroll-y)   
* [修复] 修复在App()或page()外部定义的函数遗漏的问题   
* [修复] 解决转换computed串到methods的问题   
   

## v1.0.10(20190711)   
* [修复] 修复ReferenceError: chalk is not defined     


## v1.0.9(20190703)   
* [修复] 移动fun(){}这类函数至methods里   
* [修复] 模板语法v-for的索引key重名为index(这里需注意: 小程序的wx:for的索引默认为index)   
* [修复] 将js文件data下面的变量，如果含有路由，将转换为相对路径(因小程序是多页面，而vue是单页面，导致相对路径不一样，当前这项目修复仍未完美，请看下条注意！)   
* [注意！！！] 在转换微信新版含云开发小程序时，发现默认小程序是含有images和sytle目录的，原样复制这俩目录是没毛病的，转换到uni-app后，当再次编译成小程序时，发现uni-app编译时，将这俩目录删除，并且将pages下面的子目录里所包含的png文件也一并删除，导致无法找到资源文件。ps: 此功能将评估后进行优化更新，敬请期待~
   

## v1.0.8(20190702)   
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


## v1.0.7(20190626)   
* 修复函数里的函数会被提取到全局的问题   

   
## v1.0.6(20190626)   
* 修复局部变量会被提取到全局变量的bug   
* 忽略```<template/>```上面的的属性转换   