# Miniprogram to uni-app - Release Notes   
======================================


## v1.0.63(20200509)   
* [新增] 支持解析slot动态插槽   
* [新增] include套娃的处理(感谢网友yiheyang提交代码)   
* [更新] jyf-parser的版本为v2.11.2   
* [优化] getApp的转换方式   
* [优化] wx转换为uni的替换方式   
* [优化] 去掉老版vant-ui的判断   
* [优化] setData函数(支持多级数组，感谢网友☆_☆提供代码)   
* [优化] wxss里失效字体文件的引用
* [优化] 当js体积超过300kb时，忽略转换(防止转换时间过长)   
* [优化] 去掉判断prop是否为js关键字并替换的操作(为减少代码侵入度及增加转换精确度，因此需转换后根据编译信息手动修复)
* [优化] 代码```<view wx:for="{{tabs}}" wx:for-item="tabItem" wx:key="id">{{tabItem.name}}</view>```转换为```<view v-for="(tabItem, index) in tabs" :key="index">{{tabItem.name}}</view>```(即id -> index)   
* [修复] 当函数与变量同名时wxml属性被误替换的bug   
* [修复] 没有精确判断vant项目，导致其他项目也解析为vant项目的bug   
* [修复] triggerEvent转换为$emit后，获取不到参数的bug(实际为：小程序里取参数是取e.detail.xxx，而uniapp则是直接取e.xxx；因此工具转换时，将在参数外面增加detail节点，以适应引用处的代码)   
* [修复] 代码```<block wx:key="" wx:for="{{compon.slideimgs}}" wx:for-item="slideimg"></block>```转换后误把slideimg替换为item的bug   
* [修复] 标签上只存在wx:key时，未进行转换的bug   


## v1.0.62(20200321)   
* [更新] jyf-parser的版本为v2.8.1   
* [优化] 注释css里已失效字体文件(含iconfont和GuildfordPro)    
* [优化] 对template里引号的处理(例:```<view style="top:{{StatusBar}}px;{{bgImage?'background-image:url(' + bgImage+')':''}}"></view>```)   
* [修复] 另一种00未转换的问题(如```<view wx:if="{{countDownHour == 00 && countDownMinute == 00 && countDownSecond == 00}}"></view>```)   
* [修复] 音频不能播放的问题(音频资源(*.mp3)移动到static目录，并修复路径引用)   
* [修复] 变量与methods重名时，对methods进行setData导致工具转换失败的bug(```this.setData({methods: methods})```)   
* [修复] 试处理一则wxparse转换异常情况(```WxParse.wxParse('editors.editor' + item.id, 'html', item.fulltext, this)```)   


## v1.0.60(20200316)   
* [优化] 进一步转换在变量或数组里面的资源路径，减少漏网之鱼   
* [新增] ```capture-bind:tap```转换为```@tap```，```capture-catch:tap```转换为```@tap.stop```(uniapp无对应的语法，只能合二为一)   
* [修复] 重名标签属性id时，导致```e.currentTarget.id```拿不到的bug(不再转换:id为:idAttr)   

## v1.0.59(20200313)   
* 【重要】 自动检测是否为vant项目，而无须添加-z参数，并在转换结束后增加检测vant项目的提示   
* [优化] wx:key为表达式时的解析(如```<block wx:for="{{rechargelist}}" wx:for-item="items" wx:key="index<=6">```)   
* [优化] 清除css里失效的iconfont字体文件引用  
* [修复] 关键字wx替换不完全的bug   
* [修复] js代码未添加script标签的bug   
* [修复] wxml仅有单标签slot时，解析后编译报错的bug   
* [修复] ```t.globalData.approot``` 转换为 ```t.approot```   
* [修复] 使用网络链接的图片路径被误添加相对路径的bug   
* [修复] 文件mixins/transition.js被添加script标签的bug   
* [修复] 模板里两个00而引起编译报错的bug(如```<text>{{countDownHour || 00}}</text>```)   
* [修复] 项目中使用ES2015标准的import语句时导致解析失败的bug(如```import 'moment';```等)   
* [修复] 解析函数```formSubmit: util.throttle(function (e) {...}, 1000)```未正确放置到methods的bug   
* [修复] template里存在单个引号导致编译报错的bug(如```<view style="line-height: 48rpx\""></view>```)，同时处理了含\"的代码(如```<view style="background: url(\"{{ui.home_red_pack_bg}}\")"></view>```)   

## v1.0.58(20200229)   
* [优化] 增加参数(-r，默认为false)，以替换wx.xxx()为uni.xxx()   
* [优化] 资源路径替换时，替换后的路径相对于根路径，以减少路径引用复杂度(因官方对于tabbar里iconPath路径并未替换，路径替换功能暂不准备弃用)   
* [优化] 如js文件为webpack打包后的文件(你懂得~)，转换后增加script标签包裹，避免因此而编译报错      
* [优化] 将原来用于替换wxParse的组件gaoyia-parse，改为使用[jyf-parser](https://ext.dcloud.net.cn/plugin?id=805)   
* [优化] "catchtap" 由 "@tap.native.stop" 改为 "@tap.stop"(因前者仅支持微信小程序，测试范围app、h5、微信小程序)   
* [优化] 解析vant项目时，将富文本组件使用v3的v-html替代(残余wxPrase需手动调整)   
* [修复] van开头的组件没有被加入的bug   
* [修复] 替换wxParse时，数据变量未在data里声明的bug   



## v1.0.56(20200216)   
* [新增] 支持转换使用vant的小程序项目(命令行后增加"-z"参数，当前因uni-app限制，仅支持v3和h5平台。现为预览版，时间紧迫，未做wxParse等适配)   
* [更新] manifest.json配置
* [修复] 当wxml里都是注释的时候，输出后没有template的bug   
* [修复] 当methods里含有{...abc}导致转换报错的bug   
* [修复] 转换wxs的条件默认为true的bug   

## v1.0.55(20200211)   
* [修复] 个别页面不存在导致转换报错的bug

## v1.0.54(20200205)   
* [优化] 将setData在main.js进行全局混入mixins，不再在每个page.vue文件里插入setData()代码   
* [优化] 将manifest.json里的mp-weixin里添加permission字段，解决微信小程序提示‘getLocation需要在app.json中声明permission字段’(感谢网友donke提示)   
* [优化] 处理混淆过的js代码时，getApp()变量的别名在与函数参数同名时，识别不准确的问题   
* [优化] app.js里data变量的引用关系   
* [还原] 还原setData代码(新代码在一些时候还有问题，暂还原)   
  
## v1.0.53(20200119)   
* [修复] 转换报错   

## v1.0.50(20200111)   
* [优化] 不再转换hidden   
* [优化] setData支持数组下标，但不支持连续下标(如支持```this.setData({'list[0].item[1].src': "hello"})```，但不支持```this.setData({'list[0][1].src': "hello"})```)   

## v1.0.49(20200107)   
* [优化] data作为组件属性时(如```<abc :data="area"></abc>```)，不再进行替换。id和data都能作为组件的属性，但uni-app编译时提示：“id|data 作为属性保留名,不允许在自定义组件 abc 中定义为 props”，经测试id或:id在组件时都无法接收到值，但data是可以接收到值的，因此将data从判断逻辑里去除。   

## v1.0.48(20200106)   
* [优化] 文案调整
* [修复] hidden="xx"转换v-if="!(xx)"   
* [修复] json解析失败   

## v1.0.47(20200103)   
* [修复] 多个include标签引用同一个wxml时，页面里有遗漏未被替换的bug   

## v1.0.46(20200102)   
* [优化] 移动所有资源文件到static目录，优化路径引用关系，并解决之前可能会覆盖掉同名资源文件的bug   
* [修复] 生成了多个嵌套template的bug   

## v1.0.45(20191230)   
* [修复] 解析代码```var util = require("../helper.js"), utils = getApp().helper;```报错的bug   

## v1.0.44(20191230)   
* [重大更新!] 重写解析template标签的代码，解析template后并替换相关变量    
* [优化] 增加部分单元测试，减少bug发生    
* [优化] getApp()的转换    
* [优化] include转换后的容器标签由template改为block    
* [修复] 解析多元表达式时引号解析错误的bug    
* [修复] 因取页面this别名的代码漏删导致转换报错的bug    
* [修复] wxss文件不存时，生成的vue文件多余undefined的bug    
* [修复] project.config.json里没有字段miniprogramRoot时报错的bug    
* [修复] wx:key为一个表达式时转换错误(测试代码：```<view wx:for="{{5-num}}" wx:key="{{num + index}}"></view>```)    


## v1.0.42(20191224)   
* [新增] 支持解析TypeScript小程序项目    
* [新增] 支持解析使用npm模块的小程序项目    
* [新增] 支持解析Behavior文件为mixins文件    
* [优化] 判断ast类型的逻辑    
* [优化] 更新uParse修复版的版本为v1.2.0    
* [修复] 解析template时多余引号的bug    
* [修复] require路径没有扩展名，编译时找不到文件的bug(默认加上.js)    
* [修复] 单个字符作为this的别名时，page和component页面未做相应替换的bug    
* [修复] 当properties下面的属性是字符串时导致转换失败(如```properties: {'pullRefresh':{type: Boolean}```)    

## v1.0.40(20191220)   
* [优化] wx:key和wx:for-index共存时，优先使用wx:for-index作为key    
* [修复] 支持hidden属性转换为v-if    
* [修复] ```wx:item="{{item}}"```未被转换的bug   

## v1.0.39(20191219)   
* [优化] 日志展示样式   
* [修复] 标签上仅有wx:key时，转换出错的bug   
* [修复] 根目录包含图片资源时，导致pages未进行转换的bug   

## v1.0.38(20191218)   
* [优化] 提取页面里所有this的别名，进行近乎精确的替换   
* [修复] 更多的getApp()的转换   
* [修复] css里资源路径被遗漏处理的bug   
* [修复] app.js转换变量出现错乱的bug(如this、globalData等)   
* [试处理]] ```<button sessionFrom="{'nickname': '{{userInfo.nickname}}', 'avatarUrl': '{{userInfo.avatar}}'}"></button>```   

## v1.0.37(20191217)   
* [修复] wx:for与wx:key值相同的情况   
* [修复] Component里lifetimes未处理的bug   
* [修复] 转换出现getApp().globalData.globalData的bug   
* [修复] template含wxs标签时，转换后多添加view标签的bug   
* [修复] 替换template里data、id或default变量未替换完全的bug   
* [修复] ```<template is="wxParse" data="{{wxParseData:articleNodes}}"/>```未被正确解析的bug   
* [修复] ```@import"/wxss/6.wxss";```import后面没空格导致没转换到的bug   
* [修复] template里面是对象时，解析出错的bug(```<button sessionFrom="{'nickname': '{{userInfo.nickname}}'}"></button>```)   

## v1.0.36(20191216)   
* [修复] 调整变量时误加Fun的bug   
* [修复] 识别单独app变量   
* [修复] 单js文件里未替换getApp()为getApp().globalData    
* [修复] 进一步完善：变量与函数同步的情况   
* [修复] 进一步完善：重命名以_和$开头以及使用js系统关键字命名   
* [试运行] 替换template里data、id或default变量(目前仅支持Component里替换)   

## v1.0.35(20191214)   
* [优化] 优化wxs引用的路径    
* [优化] 支持this的别名为单个字符的情况(一般是混淆的源码/摊手~~)    
* [优化] 当data或:id作为组件参数时，对这类关键字在template和js里进行重名(在uni-app里，data和:id等是不能作为参数名的)   
* [修复] bind里引号为空时误删的bug    
* [修复] ++this.xxx.xxx转换有误的bug   
* [修复] Component里lifetimes没处理到的bug    
* [修复] app.js里生命周期的代码调用globalData里函数的引用关系(变量引用)    
* [修复] wxparse样式未删除完全的bug   
* [试处理] 修复template里多余引号时转换失败的bug(如代码：```<view url="/page/url/index={{item.id}}&data='abc'"></view>```)   

## v1.0.34(20191209)   
* [修复] 生成多余template标签的问题(代码串掉的问题)    
* [修复] 重命名以_和$开头以及使用js系统关键字命名(如import和default等)的函数名("_abc(){}"-->"abcFun(){}", "import(){}"-->"importFun(){}")    
* [修复] pages为空的bug    
* [修复] 清除wxParse相关的css引用    
* [修复] 页面没有json时，也应记录到pages里    
* [修复] 单独js里，当import导入包的路径，没有相对路径标识时，添加相对标识    
* [修复] bind字符串里多余的引号(试处理：```<view url="/page/url/index={{item.id}}&data='abc'"></view>```)   
* [修复] app.js里生命周期的代码调用globalData里函数的引用关系(函数引用)   
* [修复] ```<view>{{x<10?"吃瓜1":"吃瓜2">}}<text>我也来吃瓜</text></view>  ```解决出错的问题(原因是小于号"<"后没有空格，暂不支持```<view>{{x<10}}<text>吃瓜群众</text></view>```)   

## v1.0.33(20191125)   
* [修复] pages为空的bug    
* [修复] wxParseData不为xxx.nodes的形态，导致转换报错的bug    

## v1.0.32(20191125)   
* [新增] 支持```<include src="url"></include>```标签
* [优化] 更新babel版本   
* [优化] 漏网之鱼里对url的提示   
* [优化] 组件里Behavior转换为mixins   
* [优化] 重构转换流程来适应include标签转换   
* [优化] 变量名和函数名为JS关键字时，对其重命名   
* [优化] 不再推荐转换为vue项目(因为初始化太繁琐，让给有时间的人去折腾吧)   
* [优化] 更新u-parse，修复百度小程序解析img不显示、富文本解析不出来的bug   
* [优化] 重新转换时，不删除unpackage和node_modules目录，减少因文件占用而清空文件夹失败的机率   
* [修复] catchtap事件转换    
* [修复] 单引号含双引号的属性    
* [修复] app.vue也添加了组件的bug   
* [修复] 单独js文件里路径没有处理的bug   
* [修复] Vue.component()组件名对应不上的bug   
* [修复] url('{{}}xxx')含引号，导致转换错误的bug   
* [修复] 当package.json内容为空时解析报错的bug   
* [修复] wxParseData含三元/二元表达式的变量提取   
* [修复] ```var app = getApp(), http = app.http;```转换失败的bug   
* [修复] setData()时，props含此变量，但data里没有，而导致变量重复声明的bug(此问题未完美解决，因为props里变量不能setData)   

## v1.0.31(20191119)   
* [优化] setData()支持回调函数   
* [修复] 解析app时判断prop报错的bug   
* [修复] 一些小bug   

## v1.0.30(20191118)   
* [优化] 重构大部分代码，优化页面类型判断逻辑，app、page和component分别进行解析       
* [优化] 组件里生命周期的转换(ready-->mounted，ready-->mounted)、pageLifetimes、lifetimes、behaviors、externalClasses、relations和options等节点处理     
* [优化] 组件里observer和observers替换换为watch   
* [修复] 组件名同时包含驼峰和短横线转换时转换错误，导致找不到组件的bug(如```diy-imageSingle```应转换为```diyImageSingle```) 
* [修复] 替换wxParse时，参数里this的指向问题，以及优化wxParse代码的判断   
* [修复] 模板绑定里使用单引号包含双引号导致转换失败(如: ```<view style='font-family: "Guildford Pro";'></view>```)   
* [修复] props里默认值字段名value替换为default; 当type为Array或Object时，默认值使用工厂函数返回   
   
## v1.0.29(20191030)   
* [调整] 暂时屏蔽命令行里的-o命令，导出路径默认为“输入目录_uni”(此前版本当输入输出为同一目录或其他非空目录时，可能会引起误删文件的隐患)   
* [优化] 程序入口app的判断逻辑   
* [优化] 是否转换wxs细节调整   
* [回滚] this.globalData不再转换为this.$options.globalData，因为HBuilderX已支持(见：[HBuilder X v2.3.7.20191024-alpha] 修复 在 App.vue 的 onLaunch 中，不支持 this.globalData 的 Bug)   
* [修复] getApp().page({...})不能解析的bug   
* [修复] WxParse.wxParse()没转换到的bug   
* [修复] wx:for-item与wx:key相等的bug   
* [修复] 解析```<view style="xx:url(\"{{}}\")"></view>```失败的bug   
* [修复] 方法名为_init(以_或$开头的方法名)与vue初始方法同名时引起报错的bug   
* [修复] 因为vue文件没有template导致报错“Component is not found in path xxx”，(当wxml为空文件时，填充```<template><view></view></template>```空标签占位)   
* [修复] getApp()未替换完全的bug   

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