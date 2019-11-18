# Miniprogram to uni-app - Release Notes   
======================================

## v1.0.28(20191018)   
* [修复] 几个小bug   

## v1.0.27(20191018)   
* 【重要】 使用插件市场 [uParse](https://ext.dcloud.net.cn/plugin?id=364) 替换 wxParse   
* [新增] 当wxs文件内部引用外部wxs时，合并所有引用为一个wxs文件，并修复引用关系(解决uni-app不支持wxs内部引用同类文件，后续如果uni-app支持，此功能将回滚。为了这个功能，捣腾一天了)   
* [修复] 解析wxs标签未写入文件，src为undefined的bug   
* [修复] main里使用```Vue.component()```注册组件时，第一个参数为index的bug   
* [修复] const App = getApp()未解析到的bug(只能算漏掉了，没有判断A大写开头)   
* [修复] 函数使用系统关键字(如delete、import等，前提是已在methods里定义)命名时编译报错的bug   
      
## v1.0.26(20191013)   
* [修复] ```wx:key="this"```这种情况   
* [修复] 删除vue.config.js里的css节点   
* [修复] 识别含VantComponent({})的js文件   
* [修复] 未知原因导致没有生成main.js的bug   
* [修复] app.json不存在导致没有生成main.js的bug   
* [修复] app.js里非生命周期函数没有放到globalData里的bug   
* [修复] ```style="{{bgImage?'background-image:url('+bgImage+')':''}}"```这种情况   
* [修复] ```wx:for="item in 12"```识别出错的bug(wx:for里包含in，第一次在小程序里见到这种写法)   
* [优化] wxs引入方式为script标签引用   
* [优化] 替换stringToObject()为[object-string-to-object](https://github.com/zhangdaren/object-string-to-object)   
   
## v1.0.26(20191013)   
* [修复] ```wx:key="this"```这种情况   
* [修复] 删除vue.config.js里的css节点   
* [修复] 识别含VantComponent({})的js文件   
* [修复] 未知原因导致没有生成main.js的bug   
* [修复] app.json不存在导致没有生成main.js的bug   
* [修复] app.js里非生命周期函数没有放到globalData里的bug   
* [修复] ```style="{{bgImage?'background-image:url('+bgImage+')':''}}"```这种情况   
* [修复] ```wx:for="item in 12"```识别出错的bug(wx:for里包含in，第一次在小程序里见到这种写法)   
* [优化] wxs引入方式为script标签引用   
* [优化] 替换stringToObject()为[object-string-to-object](https://github.com/zhangdaren/object-string-to-object)   
   
## v1.0.25(20190928)   
* [新增] 处理一则代码非常规写法(没法描述……类似:Page((_defineProperty(_Page = {})))   
* [修复] 优化函数与data里变量重名，导致编译报错的bug(重名的函数名在后面添加后缀Fun，如abc() --> abcFun())   
* [修复] 不复制index.json到生成目录   
* [修复] 完善pages.json页面的style(之前只写了标题，这次将页面属性都写入)   
* [修复] 当attr={{true}}或attr={{false}}，则不添加v-bind(如```<scroll-view scroll-x="{{false}}"/>```)   
* [修复] 替换style="xx:'{{}}'" --> style="xx:{{}}"   
* [修复] 替换style="background-image: url('{{iconURL}}/abc.png')" --> style="background-image: url({{iconURL}}/abc.png)"
* [修复] 当单个js或wxss内容为空时，也创建相应文件，防止编译报错。   
* [修复] style里包含表达式时(+-*/和三元表达式)，使用括号包起来(如style="height:{{info.screenHeight * 105}}px")   
* [修复] 解析前替换掉"export default App;"，防止干扰，导致app.js没有转换成功   
* [修复] wx:key="{{item}}"转换为:key="item"的bug   
* [修复] 转换```<view style="display:{{}}"></view>```时末尾为+的bug   
* [修复] wxml里template连环嵌套引用，导致生成vue代码时template为空的bug   
* [修复] app.js已含globalData，导致重复嵌套的bug   
* [修复] app.js已含data时，移入到globalData   
* [修复] app.js，支持替换that.globalData.xx为that.$options.globalData.xxx   
* [修复] app.js里所有移动到globalData里的函数及变量的引用关系   
* [修复] app.js里getApp().data.xxx --  this.$options.globalData.xxx   
* [修复] app.js引用的组件，初始化时getApp()为undefined的bug   
* [修复] 外部定义的含require()的变量里的路径(如：var md5 = require('md5.js'))   
规则：   
1.删除var app = getApp()或const app = getApp()，作用：不让一加载就引用getApp()   
2.app.globalData.xxx --> getApp().globalData.xxx   
2.app.xxx --> getApp().globalData.xxx   
4.getApp().xxx --> getApp().globalData.xxx   
5.var icon_url = app.dataBase.iconURL; --> var icon_url = getApp().globalData.dataBase.iconURL;   
6.getApp().globalData.xxx保持原样   
注意：如外部定义的变量引用了getApp()，仍会报错，需手动修复   
   
## v1.0.24(20190918)   
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
* [修复] app.js里，所有非生命周期函数或变量，均放入到globalData里   
* [修复] var app = getApp(); 替换为 var app = getApp().globalData;   
* [修复] 目前uni-app对于非H5平台，暂无法支持动态组件。因此，转换时，将显式引用的组件使用转换为显式组件引用(如```<template is="abc"/>```)，隐式声明的组件(如```<template is="{{item.id}}"/>```)，暂时无法支持，为了保证转换后能正常运行，将直接注释，并存入转换日志，方便后续修改。   
* [修复] css由"内嵌"改为import方式导入，防止vue文件代码行数过长   

## v1.0.23(20190907)   
* [修复] @tap前面被添加冒号的bug   
* [修复] app.js没有被转换的bug   
* [修复] 当解析js报错时(如js里使用了重载)，将返回原文件内容   
   
## v1.0.22(20190907)   
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