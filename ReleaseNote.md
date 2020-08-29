# Miniprogram to uni-app - Release Notes

======================================

## v1.0.67(20200619)

-   [修复] 因代码导致转换失败的 bug
-   [修复] 转换后运行到 h5 白屏的 bug
-   [修复] 解析 app.js 时，含有 `{...utils}` 时漏掉的 bug
-   [修复] 重复声明 app 变量时，导致转换 getApp 异常的 bug(试运行)

## v1.0.66(20200522)

-   [修复] app.js 未解析的 bug
-   [优化] 忽略对 wx:key 标签的处理

## v1.0.65(20200519)

-   [新增] template 套娃的处理
-   [新增] 命令行[-m]参数，用于将 wxss 并入 vue 文件，默认为 false(即不并入 vue 文件)
-   [更新] this.properties.xxx 转换为 this.xxx
-   [更新] jyf-parser 的版本为 v2.12.0(2020-05-13)
-   [更新] 补上 subPackages 分包页面遗漏的 style 样式
-   [更新] 增强版 setData 代码，解决变量未在 data 定义而进行 setData 时报错的问题(感谢网友 ☆_☆ 的研究)
-   [优化] getApp()转换方式
-   [优化] 调整 vant 组件加载方式
-   [优化] 不再自动识别是否为 vant 项目，请手动添加参数[-z]
-   [修复] app.vue 里代码转换有问题的 bug
-   [修复] wxss 里含 DINCond-Medium.ttf 字体的处理
-   ~~[修复] 项目仅含 app.js 和 app.wxss，而无 app.wxml 的情况~~
-   [修复] 小程序插件加载逻辑，解决小程序第三方插件找不到的问题
-   [修复] 支持转换 `t.requirejs("jquery"),Page({...}})` 或 `getApp,Page({...})` 这类代码
-   [修复] wxss 替换异常的 bug
-   [修复] wxParse 未被替换掉的 bug

## v1.0.63(20200509)

-   [新增] 支持解析 slot 动态插槽
-   [新增] include 套娃的处理(感谢网友 yiheyang 提交代码)
-   [更新] jyf-parser 的版本为 v2.11.2
-   [优化] getApp 的转换方式
-   [优化] wx 转换为 uni 的替换方式
-   [优化] 去掉老版 vant-ui 的判断
-   [优化] setData 函数(支持多级数组，感谢网友 ☆_☆ 提供代码)
-   [优化] wxss 里失效字体文件的引用
-   [优化] 当 js 体积超过 300kb 时，忽略转换(防止转换时间过长)
-   [优化] 去掉判断 prop 是否为 js 关键字并替换的操作(为减少代码侵入度及增加转换精确度，因此需转换后根据编译信息手动修复)
-   [优化] 代码` ` `<view wx:for="{{tabs}}" wx:for-item="tabItem" wx:key="id">{{tabItem.name}}</view>` ` `转换为` ` `<view v-for="(tabItem, index) in tabs" :key="index">{{tabItem.name}}</view>` ` `(即 id -> index)
-   [修复] 当函数与变量同名时 wxml 属性被误替换的 bug
-   [修复] 没有精确判断 vant 项目，导致其他项目也解析为 vant 项目的 bug
-   [修复] triggerEvent 转换为\$emit 后，获取不到参数的 bug(实际为：小程序里取参数是取 e.detail.xxx，而 uniapp 则是直接取 e.xxx；因此工具转换时，将在参数外面增加 detail 节点，以适应引用处的代码)
-   [修复] 代码` ` `<block wx:key="" wx:for="{{compon.slideimgs}}" wx:for-item="slideimg"></block>` ` `转换后误把 slideimg 替换为 item 的 bug
-   [修复] 标签上只存在 wx:key 时，未进行转换的 bug

## v1.0.62(20200321)

-   [更新] jyf-parser 的版本为 v2.8.1
-   [优化] 注释 css 里已失效字体文件(含 iconfont 和 GuildfordPro)
-   [优化] 对 template 里引号的处理(例:` ` `<view style="top:{{StatusBar}}px; {{bgImage?'background-image:url(' + bgImage+')':''}}"></view>` ` `)
-   [修复] 另一种 00 未转换的问题(如` ` `<view wx:if="{{countDownHour == 00 && countDownMinute == 00 && countDownSecond == 00}}"></view>` ` `)
-   [修复] 音频不能播放的问题(音频资源(\*.mp3)移动到 static 目录，并修复路径引用)
-   [修复] 变量与 methods 重名时，对 methods 进行 setData 导致工具转换失败的 bug(` ` `this.setData({methods: methods})` ` `)
-   [修复] 试处理一则 wxparse 转换异常情况(` ` `WxParse.wxParse('editors.editor' + item.id, 'html', item.fulltext, this)` ` `)

## v1.0.60(20200316)

-   [优化] 进一步转换在变量或数组里面的资源路径，减少漏网之鱼
-   [新增] ` ` `capture-bind:tap` ` `转换为` ` `@tap` ` `，` ` `capture-catch:tap` ` `转换为` ` `@tap.stop` ` `(uniapp 无对应的语法，只能合二为一)
-   [修复] 重名标签属性 id 时，导致` ` `e.currentTarget.id` ` `拿不到的 bug(不再转换:id 为:idAttr)

## v1.0.59(20200313)

-   【重要】 自动检测是否为 vant 项目，而无须添加-z 参数，并在转换结束后增加检测 vant 项目的提示
-   [优化] wx:key 为表达式时的解析(如` ` `<block wx:for="{{rechargelist}}" wx:for-item="items" wx:key="index<=6">` ` `)
-   [优化] 清除 css 里失效的 iconfont 字体文件引用
-   [修复] 关键字 wx 替换不完全的 bug
-   [修复] js 代码未添加 script 标签的 bug
-   [修复] wxml 仅有单标签 slot 时，解析后编译报错的 bug
-   [修复] ` ` `t.globalData.approot` ` ` 转换为 ` ` `t.approot` ` `
-   [修复] 使用网络链接的图片路径被误添加相对路径的 bug
-   [修复] 文件 mixins/transition.js 被添加 script 标签的 bug
-   [修复] 模板里两个 00 而引起编译报错的 bug(如` ` `<text>{{countDownHour || 00}}</text>` ` `)
-   [修复] 项目中使用 ES2015 标准的 import 语句时导致解析失败的 bug(如` ` `import 'moment';` ` `等)
-   [修复] 解析函数` ` `formSubmit: util.throttle(function (e) {...}, 1000)` ` `未正确放置到 methods 的 bug
-   [修复] template 里存在单个引号导致编译报错的 bug(如` ` `<view style="line-height: 48rpx\""></view>` ` `)，同时处理了含\"的代码(如` ` `<view style="background: url(\"{{ui.home_red_pack_bg}}\")"></view>` ` `)

## v1.0.58(20200229)

-   [优化] 增加参数(-r，默认为 false)，以替换 wx.xxx()为 uni.xxx()
-   [优化] 资源路径替换时，替换后的路径相对于根路径，以减少路径引用复杂度(因官方对于 tabbar 里 iconPath 路径并未替换，路径替换功能暂不准备弃用)
-   [优化] 如 js 文件为 webpack 打包后的文件(你懂得~)，转换后增加 script 标签包裹，避免因此而编译报错
-   [优化] 将原来用于替换 wxParse 的组件 gaoyia-parse，改为使用[jyf-parser](https://ext.dcloud.net.cn/plugin?id=805)
-   [优化] "catchtap" 由 "@tap.native.stop" 改为 "@tap.stop"(因前者仅支持微信小程序，测试范围 app、h5、微信小程序)
-   [优化] 解析 vant 项目时，将富文本组件使用 v3 的 v-html 替代(残余 wxPrase 需手动调整)
-   [修复] van 开头的组件没有被加入的 bug
-   [修复] 替换 wxParse 时，数据变量未在 data 里声明的 bug

## v1.0.56(20200216)

-   [新增] 支持转换使用 vant 的小程序项目(命令行后增加"-z"参数，当前因 uni-app 限制，仅支持 v3 和 h5 平台。现为预览版，时间紧迫，未做 wxParse 等适配)
-   [更新] manifest.json 配置
-   [修复] 当 wxml 里都是注释的时候，输出后没有 template 的 bug
-   [修复] 当 methods 里含有{...abc}导致转换报错的 bug
-   [修复] 转换 wxs 的条件默认为 true 的 bug

## v1.0.55(20200211)

-   [修复] 个别页面不存在导致转换报错的 bug

## v1.0.54(20200205)

-   [优化] 将 setData 在 main.js 进行全局混入 mixins，不再在每个 page.vue 文件里插入 setData()代码
-   [优化] 将 manifest.json 里的 mp-weixin 里添加 permission 字段，解决微信小程序提示‘getLocation 需要在 app.json 中声明 permission 字段’(感谢网友 donke 提示)
-   [优化] 处理混淆过的 js 代码时，getApp()变量的别名在与函数参数同名时，识别不准确的问题
-   [优化] app.js 里 data 变量的引用关系
-   [还原] 还原 setData 代码(新代码在一些时候还有问题，暂还原)

## v1.0.53(20200119)

-   [修复] 转换报错

## v1.0.50(20200111)

-   [优化] 不再转换 hidden
-   [优化] setData 支持数组下标，但不支持连续下标(如支持` ` `this.setData({'list[0].item[1].src': "hello"})` ` `，但不支持` ` `this.setData({'list[0][1].src': "hello"})` ` `)

## v1.0.49(20200107)

-   [优化] data 作为组件属性时(如` ` `<abc :data="area"></abc>` ` `)，不再进行替换。id 和 data 都能作为组件的属性，但 uni-app 编译时提示：“id|data 作为属性保留名, 不允许在自定义组件 abc 中定义为 props”，经测试 id 或:id 在组件时都无法接收到值，但 data 是可以接收到值的，因此将 data 从判断逻辑里去除。

## v1.0.48(20200106)

-   [优化] 文案调整
-   [修复] hidden="xx"转换 v-if="!(xx)"
-   [修复] json 解析失败

## v1.0.47(20200103)

-   [修复] 多个 include 标签引用同一个 wxml 时，页面里有遗漏未被替换的 bug

## v1.0.46(20200102)

-   [优化] 移动所有资源文件到 static 目录，优化路径引用关系，并解决之前可能会覆盖掉同名资源文件的 bug
-   [修复] 生成了多个嵌套 template 的 bug

## v1.0.45(20191230)

-   [修复] 解析代码` ` `var util = require("../helper.js"), utils = getApp().helper;` ` `报错的 bug

## v1.0.44(20191230)

-   [重大更新!] 重写解析 template 标签的代码，解析 template 后并替换相关变量
-   [优化] 增加部分单元测试，减少 bug 发生
-   [优化] getApp()的转换
-   [优化] include 转换后的容器标签由 template 改为 block
-   [修复] 解析多元表达式时引号解析错误的 bug
-   [修复] 因取页面 this 别名的代码漏删导致转换报错的 bug
-   [修复] wxss 文件不存时，生成的 vue 文件多余 undefined 的 bug
-   [修复] project.config.json 里没有字段 miniprogramRoot 时报错的 bug
-   [修复] wx:key 为一个表达式时转换错误(测试代码：` ` `<view wx:for="{{5-num}}" wx:key="{{num + index}}"></view>` ` `)

## v1.0.42(20191224)

-   [新增] 支持解析 TypeScript 小程序项目
-   [新增] 支持解析使用 npm 模块的小程序项目
-   [新增] 支持解析 Behavior 文件为 mixins 文件
-   [优化] 判断 ast 类型的逻辑
-   [优化] 更新 uParse 修复版的版本为 v1.2.0
-   [修复] 解析 template 时多余引号的 bug
-   [修复] require 路径没有扩展名，编译时找不到文件的 bug(默认加上.js)
-   [修复] 单个字符作为 this 的别名时，page 和 component 页面未做相应替换的 bug
-   [修复] 当 properties 下面的属性是字符串时导致转换失败(如` ` `properties: {'pullRefresh':{type: Boolean}` ` `)

## v1.0.40(20191220)

-   [优化] wx:key 和 wx:for-index 共存时，优先使用 wx:for-index 作为 key
-   [修复] 支持 hidden 属性转换为 v-if
-   [修复] ` ` `wx:item="{{item}}"` ` `未被转换的 bug

## v1.0.39(20191219)

-   [优化] 日志展示样式
-   [修复] 标签上仅有 wx:key 时，转换出错的 bug
-   [修复] 根目录包含图片资源时，导致 pages 未进行转换的 bug

## v1.0.38(20191218)

-   [优化] 提取页面里所有 this 的别名，进行近乎精确的替换
-   [修复] 更多的 getApp()的转换
-   [修复] css 里资源路径被遗漏处理的 bug
-   [修复] app.js 转换变量出现错乱的 bug(如 this、globalData 等)
-   [试处理]] ` ` `<button sessionFrom="{'nickname': '{{userInfo.nickname}}', 'avatarUrl': '{{userInfo.avatar}}'}"></button>` ` `

## v1.0.37(20191217)

-   [修复] wx:for 与 wx:key 值相同的情况
-   [修复] Component 里 lifetimes 未处理的 bug
-   [修复] 转换出现 getApp().globalData.globalData 的 bug
-   [修复] template 含 wxs 标签时，转换后多添加 view 标签的 bug
-   [修复] 替换 template 里 data、id 或 default 变量未替换完全的 bug
-   [修复] ` ` `<template is="wxParse" data="{{wxParseData:articleNodes}}"/>` ` `未被正确解析的 bug
-   [修复] ` ` `@import"/wxss/6.wxss";` ` `import 后面没空格导致没转换到的 bug
-   [修复] template 里面是对象时，解析出错的 bug(` ` `<button sessionFrom="{'nickname': '{{userInfo.nickname}}'}"></button>` ` `)

## v1.0.36(20191216)

-   [修复] 调整变量时误加 Fun 的 bug
-   [修复] 识别单独 app 变量
-   [修复] 单 js 文件里未替换 getApp()为 getApp().globalData
-   [修复] 进一步完善：变量与函数同步的情况
-   [修复] 进一步完善：重命名以\_和\$开头以及使用 js 系统关键字命名
-   [试运行] 替换 template 里 data、id 或 default 变量(目前仅支持 Component 里替换)

## v1.0.35(20191214)

-   [优化] 优化 wxs 引用的路径
-   [优化] 支持 this 的别名为单个字符的情况(一般是混淆的源码/摊手~~)
-   [优化] 当 data 或:id 作为组件参数时，对这类关键字在 template 和 js 里进行重名(在 uni-app 里，data 和:id 等是不能作为参数名的)
-   [修复] bind 里引号为空时误删的 bug
-   [修复] ++this.xxx.xxx 转换有误的 bug
-   [修复] Component 里 lifetimes 没处理到的 bug
-   [修复] app.js 里生命周期的代码调用 globalData 里函数的引用关系(变量引用)
-   [修复] wxparse 样式未删除完全的 bug
-   [试处理] 修复 template 里多余引号时转换失败的 bug(如代码：` ` `<view url="/page/url/index={{item.id}}&data='abc'"></view>` ` `)

## v1.0.34(20191209)

-   [修复] 生成多余 template 标签的问题(代码串掉的问题)
-   [修复] 重命名以\_和\$开头以及使用 js 系统关键字命名(如 import 和 default 等)的函数名("\_abc(){}"-->"abcFun(){}", "import(){}"-->"importFun(){}")
-   [修复] pages 为空的 bug
-   [修复] 清除 wxParse 相关的 css 引用
-   [修复] 页面没有 json 时，也应记录到 pages 里
-   [修复] 单独 js 里，当 import 导入包的路径，没有相对路径标识时，添加相对标识
-   [修复] bind 字符串里多余的引号(试处理：` ` `<view url="/page/url/index={{item.id}}&data='abc'"></view>` ` `)
-   [修复] app.js 里生命周期的代码调用 globalData 里函数的引用关系(函数引用)
-   [修复] ` ` `<view>{{x<10?"吃瓜1":"吃瓜2">}}<text>我也来吃瓜</text></view>` ` `解决出错的问题(原因是小于号"<"后没有空格，暂不支持` ` `<view>{{x<10}}<text>吃瓜群众</text></view>` ` `)

## v1.0.33(20191125)

-   [修复] pages 为空的 bug
-   [修复] wxParseData 不为 xxx.nodes 的形态，导致转换报错的 bug

## v1.0.32(20191125)

-   [新增] 支持` ` `<include src="url"></include>` ` `标签
-   [优化] 更新 babel 版本
-   [优化] 漏网之鱼里对 url 的提示
-   [优化] 组件里 Behavior 转换为 mixins
-   [优化] 重构转换流程来适应 include 标签转换
-   [优化] 变量名和函数名为 JS 关键字时，对其重命名
-   [优化] 不再推荐转换为 vue 项目(因为初始化太繁琐，让给有时间的人去折腾吧)
-   [优化] 更新 u-parse，修复百度小程序解析 img 不显示、富文本解析不出来的 bug
-   [优化] 重新转换时，不删除 unpackage 和 node_modules 目录，减少因文件占用而清空文件夹失败的机率
-   [修复] catchtap 事件转换
-   [修复] 单引号含双引号的属性
-   [修复] app.vue 也添加了组件的 bug
-   [修复] 单独 js 文件里路径没有处理的 bug
-   [修复] Vue.component()组件名对应不上的 bug
-   [修复] url('{{}}xxx')含引号，导致转换错误的 bug
-   [修复] 当 package.json 内容为空时解析报错的 bug
-   [修复] wxParseData 含三元/二元表达式的变量提取
-   [修复] ` ` `var app = getApp(), http = app.http;` ` `转换失败的 bug
-   [修复] setData()时，props 含此变量，但 data 里没有，而导致变量重复声明的 bug(此问题未完美解决，因为 props 里变量不能 setData)

## v1.0.31(20191119)

-   [优化] setData()支持回调函数
-   [修复] 解析 app 时判断 prop 报错的 bug
-   [修复] 一些小 bug

## v1.0.30(20191118)

-   [优化] 重构大部分代码，优化页面类型判断逻辑，app、page 和 component 分别进行解析
-   [优化] 组件里生命周期的转换(ready-->mounted，ready-->mounted)、pageLifetimes、lifetimes、behaviors、externalClasses、relations 和 options 等节点处理
-   [优化] 组件里 observer 和 observers 替换换为 watch
-   [修复] 组件名同时包含驼峰和短横线转换时转换错误，导致找不到组件的 bug(如` ` `diy-imageSingle` ` `应转换为` ` `diyImageSingle` ` `)
-   [修复] 替换 wxParse 时，参数里 this 的指向问题，以及优化 wxParse 代码的判断
-   [修复] 模板绑定里使用单引号包含双引号导致转换失败(如: ` ` `<view style='font-family: "Guildford Pro"; '></view>` ` `)
-   [修复] props 里默认值字段名 value 替换为 default; 当 type 为 Array 或 Object 时，默认值使用工厂函数返回

## v1.0.29(20191030)

-   [调整] 暂时屏蔽命令行里的-o 命令，导出路径默认为“输入目录\_uni”(此前版本当输入输出为同一目录或其他非空目录时，可能会引起误删文件的隐患)
-   [优化] 程序入口 app 的判断逻辑
-   [优化] 是否转换 wxs 细节调整
-   [回滚] this.globalData 不再转换为 this.\$options.globalData，因为 HBuilderX 已支持(见：[HBuilder X v2.3.7.20191024-alpha] 修复 在 App.vue 的 onLaunch 中，不支持 this.globalData 的 Bug)
-   [修复] getApp().page({...})不能解析的 bug
-   [修复] WxParse.wxParse()没转换到的 bug
-   [修复] wx:for-item 与 wx:key 相等的 bug
-   [修复] 解析` ` `<view style="xx:url(\"{{}}\")"></view>` ` `失败的 bug
-   [修复] 方法名为*init(以*或\$开头的方法名)与 vue 初始方法同名时引起报错的 bug
-   [修复] 因为 vue 文件没有 template 导致报错“Component is not found in path xxx”，(当 wxml 为空文件时，填充` ` `<template><view></view></template>` ` `空标签占位)
-   [修复] getApp()未替换完全的 bug

## v1.0.28(20191018)

-   [修复] 几个小 bug

## v1.0.27(20191018)

-   【重要】 使用插件市场 [uParse](https://ext.dcloud.net.cn/plugin?id=364) 替换 wxParse
-   [新增] 当 wxs 文件内部引用外部 wxs 时，合并所有引用为一个 wxs 文件，并修复引用关系(解决 uni-app 不支持 wxs 内部引用同类文件，后续如果 uni-app 支持，此功能将回滚。为了这个功能，捣腾一天了)
-   [修复] 解析 wxs 标签未写入文件，src 为 undefined 的 bug
-   [修复] main 里使用` ` `Vue.component()` ` `注册组件时，第一个参数为 index 的 bug
-   [修复] const App = getApp()未解析到的 bug(只能算漏掉了，没有判断 A 大写开头)
-   [修复] 函数使用系统关键字(如 delete、import 等，前提是已在 methods 里定义)命名时编译报错的 bug

## v1.0.26(20191013)

-   [修复] ` ` `wx:key="this"` ` `这种情况
-   [修复] 删除 vue.config.js 里的 css 节点
-   [修复] 识别含 VantComponent({})的 js 文件
-   [修复] 未知原因导致没有生成 main.js 的 bug
-   [修复] app.json 不存在导致没有生成 main.js 的 bug
-   [修复] app.js 里非生命周期函数没有放到 globalData 里的 bug
-   [修复] ` ` `style="{{bgImage?'background-image:url('+bgImage+')':''}}"` ` `这种情况
-   [修复] ` ` `wx:for="item in 12"` ` `识别出错的 bug(wx:for 里包含 in，第一次在小程序里见到这种写法)
-   [优化] wxs 引入方式为 script 标签引用
-   [优化] 替换 stringToObject()为[object-string-to-object](https://github.com/zhangdaren/object-string-to-object)

## v1.0.26(20191013)

-   [修复] ` ` `wx:key="this"` ` `这种情况
-   [修复] 删除 vue.config.js 里的 css 节点
-   [修复] 识别含 VantComponent({})的 js 文件
-   [修复] 未知原因导致没有生成 main.js 的 bug
-   [修复] app.json 不存在导致没有生成 main.js 的 bug
-   [修复] app.js 里非生命周期函数没有放到 globalData 里的 bug
-   [修复] ` ` `style="{{bgImage?'background-image:url('+bgImage+')':''}}"` ` `这种情况
-   [修复] ` ` `wx:for="item in 12"` ` `识别出错的 bug(wx:for 里包含 in，第一次在小程序里见到这种写法)
-   [优化] wxs 引入方式为 script 标签引用
-   [优化] 替换 stringToObject()为[object-string-to-object](https://github.com/zhangdaren/object-string-to-object)

## v1.0.25(20190928)

-   [新增] 处理一则代码非常规写法(没法描述……类似: Page((\_defineProperty(\_Page = {})))
-   [修复] 优化函数与 data 里变量重名，导致编译报错的 bug(重名的函数名在后面添加后缀 Fun，如 abc() --> abcFun())
-   [修复] 不复制 index.json 到生成目录
-   [修复] 完善 pages.json 页面的 style(之前只写了标题，这次将页面属性都写入)
-   [修复] 当 attr={{true}}或 attr={{false}}，则不添加 v-bind(如` ` `<scroll-view scroll-x="{{false}}"/>` ` `)
-   [修复] 替换 style="xx:'{{}}'" --> style="xx:{{}}"
-   [修复] 替换 style="background-image: url('{{iconURL}}/abc.png')" --> style="background-image: url({{iconURL}}/abc.png)"
-   [修复] 当单个 js 或 wxss 内容为空时，也创建相应文件，防止编译报错。
-   [修复] style 里包含表达式时(+-_/和三元表达式)，使用括号包起来(如 style="height:{{info.screenHeight _ 105}}px")
-   [修复] 解析前替换掉"export default App; "，防止干扰，导致 app.js 没有转换成功
-   [修复] wx:key="{{item}}"转换为:key="item"的 bug
-   [修复] 转换` ` `<view style="display:{{}}"></view>` ` `时末尾为+的 bug
-   [修复] wxml 里 template 连环嵌套引用，导致生成 vue 代码时 template 为空的 bug
-   [修复] app.js 已含 globalData，导致重复嵌套的 bug
-   [修复] app.js 已含 data 时，移入到 globalData
-   [修复] app.js，支持替换 that.globalData.xx 为 that.\$options.globalData.xxx
-   [修复] app.js 里所有移动到 globalData 里的函数及变量的引用关系
-   [修复] app.js 里 getApp().data.xxx -- this.\$options.globalData.xxx
-   [修复] app.js 引用的组件，初始化时 getApp()为 undefined 的 bug
-   [修复] 外部定义的含 require()的变量里的路径(如：var md5 = require('md5.js'))

规则：

1. 删除 var app = getApp()或 const app = getApp()，作用：不让一加载就引用 getApp()

2.app.globalData.xxx --> getApp().globalData.xxx  
2.app.xxx --> getApp().globalData.xxx  
4.getApp().xxx --> getApp().globalData.xxx  
5.var icon_url = app.dataBase.iconURL; --> var icon_url = getApp().globalData.dataBase.iconURL;
6.getApp().globalData.xxx 保持原样  
注意：如外部定义的变量引用了 getApp()，仍会报错，需手动修复

## v1.0.24(20190918)

-   [新增] 支持 wx-if 转换(对，你没看错，wx:if 和 wx-if 都能用……)
-   [新增] 支持 wx:else="{{xxx}}"转换
-   [新增] 支持 subPackages 分包加载
-   [新增] 识别 app.js 里 exports.default = App({}); 结构
-   [新增] 识别 js 文件是否为 vue 文件结构，通过结构 export default {}识别
-   [新增] 增加*.data.xxx 转换为*.xxx(定义\_为 this 副本)
-   [新增] 忽略组件 plugin:/calendar 转换
-   [新增] 收集页面里 setData()里参数与 data 里的变量进行对比，并将差异增加到 data 里，尽可能修改因未定义变量而直接使用 setData()报错的问题(无法 100%修复，详见“关于不支持转换的语法说明”)
-   [修复] 修复 json 文件里定义的 usingComponents 路径转换
-   [修复] 修复 app.json 里 tabbar 里的路径转换
-   [修复] 修复因为找不到` ` `<template is="abc"/>` ` `这里面的 abc 组件，而出现 undefined.vue 组件的 bug
-   [修复] app.js 里，所有非生命周期函数或变量，均放入到 globalData 里
-   [修复] var app = getApp(); 替换为 var app = getApp().globalData;
-   [修复] 目前 uni-app 对于非 H5 平台，暂无法支持动态组件。因此，转换时，将显式引用的组件使用转换为显式组件引用(如` ` `<template is="abc"/>` ` `)，隐式声明的组件(如` ` `<template is="{{item.id}}"/>` ` `)，暂时无法支持，为了保证转换后能正常运行，将直接注释，并存入转换日志，方便后续修改。
-   [修复] css 由"内嵌"改为 import 方式导入，防止 vue 文件代码行数过长

## v1.0.23(20190907)

-   [修复] @tap 前面被添加冒号的 bug
-   [修复] app.js 没有被转换的 bug
-   [修复] 当解析 js 报错时(如 js 里使用了重载)，将返回原文件内容

## v1.0.22(20190907)

-   [新增] 完善 template 标签转换，除了不支持 data 里含... 扩展运算符外(因 uni-app 现还不支持 v-bind="")，其他都已支持(含... 的 data，已重名为 error-data，需手工调整：换一种方式导入自定义组件或显式调用组件)
-   [新增] 将含有内置关键字的组件名替换为别名
-   [修复] -c 模式下，输出目录不存在而报错的 bug
-   [修复] 增加解析 js 文件错误提示
-   [修复] 修复当同一组文件(js/wxml/wxss)内容都为空时，影响后面流程不能生成 pages.json 等配置文件的 bug
-   [修复] 无遗漏处理 bind 前缀事件名称
-   [修复] 将 manifest.json 里的 name 字段，如果为中文，转换为拼音。修复含中文导致 HBX 识别不到 manifest.json 的 bug
-   [修复] 转换 wxss 代码 import \*.wxss 里的文件路径为相对路径
-   [修复] 转换 js 代码 import xxx from "\*.js"里的文件路径为相对路径
-   [修复] 转换 js 代码 require('./util')里的文件路径为相对路径
-   [修复] 删除绑定的值为空的标签属性(如` ` `<view value={{}}>` ` `)

[注意！！！] 如 HBX 运行时提示“项目下缺少 manifest.json 文件”，请在项目上右键【重新识别项目类型】

## v1.0.21(20190830)

-   [新增] 【-c】命令，支持生成 vue-cli 项目，默认为【false】，生成后请在生成目录里执行 npm i 安装 npm 包(大概需要 200+s)，然后可以直接将整个目录拖入到 HBuilderX 里二次开发或运行，如 HBX 运行时提示“项目下缺少 manifest.json 文件”，请在项目上右键【重新识别项目类型】
-   [新增] vue-cli 项目，支持配置静态目录(在 vue.config.js 里 alias 节点设置)，目前已配置【'@' --> './src'】和 【'assets' --> './src/static'】
-   [新增] 【-w】命令，支持转换 wxs 为 js 文件，默认为【false】，因 uni-app 已在 app 和小程序平台支持 wxs 标签，而 wxs 近期也将支持 H5 平台，所以默认不再转换(还有一个原因是因为遇到同一个目录里，同时包含 utils.js 和 utils.wxss，显然转换为 js 文件时，两个文件会合为一个，so……)
-   [新增] 处理属性 bind:tap-->@tap
-   [新增] 转换完成后，在生成目录里，生成 transform_log.log 文件(每次转换都会重新生成！)
-   [修复] 处理标签 class 属性含多个{{}}或有三元表达式的情况(如：` ` `<view class="abc abc-{{item.id}} {{selId===item.id?'active':''}}"></view>` ` `)
-   [修复] 删除 page.json 里的 usingComponents 节点。通过 import 导入组件时，不需要在 page.json 里重复注册
-   [修复] 删除 wx:for-index 标签

## v1.0.20(20190823)

-   [修复] 去掉引用组件时的后缀名(如：Vue.component('navbar.vue', navBar))，转换组件名为驼峰全名
-   [修复] 修改搜索资源路径的正则表达式，以兼容低版本 Node.js
-   [修复] 修复当页面里的 onLoad 为 onLoad: function() {}时，处理 wxs 而报错的 bug
-   [修复] 转换结束后，增加 template 和 image 的提示
-   [修复] 对于小程序目录，project.config.json 不存在也可进行转换

## v1.0.19(20190822)

-   [新增] 支持 wxs 语法转换，查阅文档仅看到正则和日期与 js 稍有不同，暂未发现其他

wxs 语法转换规则：  
1.getDate() --> new Date()  
2.getRegExp() --> new RegExp()

## v1.0.18(20190821)

-   [新增] 支持 wxs 文件转换(两种方式：module 和 src)。

wxs 转换规则：

1. 将 wxs 文件转换为.js 文件

2.module 标签里如果包含代码则生成为 js 文件

3. 使用第二步的 js 文件地址或 src 属性，生成 import 代码插入到 vue 文件的` ` `<script/>` ` `里
4. 给生命周期 onLoad()/created()里添加一行代码：` ` `this.xxx=xxx;` ` `(关键代码！)

-   [修复] 组件生命周期函数 attached 转换为 beforeMount
-   [修复] 修复转换` ` `that.triggerEvent("action");` ` `报错的 bug
-   [修复] 修复 css 里资源路径斜杠未转换的 bug
-   [注意!!] wxs 转 js 语法下版完善~

## v1.0.17(20190814)

-   [新增] 新增支持 workers 目录转换(约定 workers 目录就位于小程序根目录，复制到 static 目录，并修复相关路径)
-   [新增] 新增将所有资源文件全部移入到 static 目录下，并尽量保持目录结构，修复 wxml 和 wxss 文件里的相对路径(js 文件里的资源路径情况太多，本版本暂不支持数组里面的资源路径转换)
-   [修复] 修复生成组件时，props 为[undefined]的 bug
-   [修复] 强化 css 里用来搜索资源路径的正则表达式
-   [修复] 修复绑定属性增加了绑定属性而未能将原属性删除的 bug
-   [修复] 修复全局组件不含后缀名导致解析出错的 bug
-   [重要！！！] 现在已经能完美转换[微信小程序官方 Demo]https://github.com/wechat-miniprogram/miniprogram-demo， (wxs 标签暂不支持转换，需手动调整)

## v1.0.16(20190812)

-   [修复] 修复 App.vue 里 import 路径不带./的问题
-   [修复] 修复 class="{{xxx}}"的情况
-   [修复] catchtap 转换为@click.stop
-   [修复] 修复` ` `<template name="foot"/>` ` `生成为嵌套 template 的问题
-   [修复] import 导入组件时，将组件名转换为驼峰命名方式
-   [修复] 删除掉 wxss 文件里导入 app.wxss 的相关代码(因 uni-app 为单页，所以可以共用 app.vue 里面的样式)
-   [修复] wx:key="*this"-->:key="index"， wx:key="*item"-->:key="index" 注意！！！注意小程序源代码里\*this 这种关键字，现在默认转换为 index，如需其他写法，请先调整好小程序源代码！
-   [修复] 支持多级 wx:for，自动调整 key 为 “index + 数字” 的形式进行递增
-   [修复] 修复当页面位于 image 目录会被误当成资源目录而操作
-   [修复] 实现部分 import \*.wxml 的转换

## v1.0.15(20190802)

-   [新增] 组件生命周期转换(attached-->onLoad、properties-->props 和 methods)，修复 import xxx from "/components/xxx/"转换后路径不对的问题
-   [修复] 修复识别没有协议头的资源地址
-   [修复] 修复 key="{{item.id}}"的情况
-   [修复] 修复 bindtap 事件有{{}}的情况
-   [修复] 修复 TypeError: Property left of AssignmentExpression expected node to be of a type ["LVal"] but instead got "ThisExpression"(原因是替换 this.data 不严谨)
-   [修复] 自动识别关键字 this.data.xxx、\_this.data.xxx 和 that.data.xxx 等关键字替换为[this|_this|that].xxx(因 this 可以使用变量替代，且写法不一，没法做到匹配所有情况)

## v1.0.14(20190729)

-   [修复] 修复 App.vue 里没法使用 this.globalData.xxx 的方式来设置 globalData 数据(注意：后期如 uni-app 修复这个问题，那此项修复将回滚)
-   [修复] 修复 this.data.xxx 为 this.xxx(这两次更新不小心干掉了 ∙̆ .̯ ∙̆ )

## v1.0.13(20190727)

-   [修复] 修复转换到 uni-app 再生成小程序后，素材路径不对的问题。

规则：

1. 识别小程序目录下/images、/image、/pages/images 或/page/image 等目录，将里面的素材复制到/static 目录；
2. 修复配置文件里 tabbar 下面 iconPath 和 selectedIconPath 等路径
3. 修复` ` `<image src='../images/abc.png'></image>` ` `里面的 src 路径
4. 修复 wxss 文件里所引用的素材文件的路径

注意：

1. 图片素材可能会有同名的，请在转换前重名，否则将直接替换，程序也会显示对应日志，请注意查看！
2. 识别到图片文件再进行复制时，使用的是定式目录，以便保留文件夹结构，如素材目录有其他写法，请告知，感谢~
3. 仅针对页面/组件里 data(){}里面的变量，如含有图片素材，将进行替换，而如果代码里含有` ` `return "../images/icn-abc.png";` ` `类似代码，将不会进行替换，切记~

-   [修复] 修复一个 wxml 文件里包含多个根节点和根元素含有 wx:for 属性的问题
-   [修复] 修复 wx:else 含条件的情况
-   [修复] 修复自定义组件使用中划线命名导致语法错误
-   [修复] 修复模板绑定里使用单引号包含双引号导致转换失败(如: ` ` `<view style='height:{{screenHeight+"px"}}'>` ` `)
-   [修复] 修复 wx:for、wx:for-item、wx:for-key、wx:for-items 等属性
-   [注意] 小程序使用 wxParse 组件时，转换难度挺大，建议手动替换为 uni-app 所对应的插件

## v1.0.12(20190723)

-   [修复] 晕了，是自己写错代码了。

## v1.0.11(20190723)

-   [新增] 新增 this.triggerEvent()转换为 this.\$emit()
-   [修复] 因 uni-app 推荐使用 rpx 替代 upx，所以 rpx 将不再转换
-   [修复] 修复引入全局组件的路径连接符为\\的问题
-   [修复] 修复 wx:else 转换为 v-else="" 的问题(引申：当标签属性的值为“”时，将不再保留值)
-   [修复] 修复解析自闭合标签(如` ` `<image />` ` `)异常的问题
-   [修复] 因 setData()实际情况过于复杂(有三元表达式、t.setData()等形式)，回归最初的支持方式：额外添加 setData()方法
-   [修复] 修复解析 wxml 时将标签属性变为小写的问题、解决 scrollY 等属性对应不上的问题(如 scrollY --> scroll-y)
-   [修复] 修复在 App()或 page()外部定义的函数遗漏的问题
-   [修复] 解决转换 computed 串到 methods 的问题

## v1.0.10(20190711)

-   [修复] 修复 ReferenceError: chalk is not defined

## v1.0.9(20190703)

-   [修复] 移动 fun(){}这类函数至 methods 里
-   [修复] 模板语法 v-for 的索引 key 重名为 index(这里需注意: 小程序的 wx:for 的索引默认为 index)
-   [修复] 将 js 文件 data 下面的变量，如果含有路由，将转换为相对路径(因小程序是多页面，而 vue 是单页面，导致相对路径不一样，当前这项目修复仍未完美，请看下条注意！)
-   [注意！！！] 在转换微信新版含云开发小程序时，发现默认小程序是含有 images 和 sytle 目录的，原样复制这俩目录是没毛病的，转换到 uni-app 后，当再次编译成小程序时，发现 uni-app 编译时，将这俩目录删除，并且将 pages 下面的子目录里所包含的 png 文件也一并删除，导致无法找到资源文件。ps: 此功能将评估后进行优化更新，敬请期待~

## v1.0.8(20190702)

-   [新增] 支持识别 "that.setData()"
-   [新增] 模板语法 v-for 增加:key 属性
-   [新增] 支持自定义组件嵌入
-   [新增] 支持全局组件引用
-   [修复] 修复 this.setData 里，key 为字符串导致转换失败的情况(测试代码如下)

```javasctipt
this.setData({
    "show":true,
    ["swiperConfig.current"]: event.detail.current
})
```

-   [修复] getApp()代码不作转换
-   [修复] globalData 存入生命周期里
-   [修复] 修复多个 template 在一个 wxml 文件里时转换失败
-   [修复] 修复 wxml、wxss 里面 import 的路径为相对路径（因 uni-app 不支持/根目录表达方式）

## v1.0.7(20190626)

-   修复函数里的函数会被提取到全局的问题

## v1.0.6(20190626)

-   修复局部变量会被提取到全局变量的 bug
-   忽略` ` `<template/>` ` `上面的的属性转换
