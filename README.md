# 转换各种小程序为 uni-app 项目

支持转换微信、QQ、头条/抖音、支付宝/钉钉和百度等小程序转换到 uni-app 项目

输入小程序项目路径，即可输出 uni-app 项目。

## 安装(请在 CMD 或终端里直接输入即可安装，无须下载代码！！！)

```sh
$ npm install miniprogram-to-uniapp -g
```

## 升级版本

```sh
$ npm update miniprogram-to-uniapp -g
```

## 使用方法

```sh
Usage: wtu [options]

Options:

  -V, --version           output the version number [版本信息]
  -i, --input <target>    the input path for weixin miniprogram project [输入目录]
  -h, --help              output usage information [帮助信息]
  -c, --cli               the type of output project is vue-cli, which default value is false [是否转换为vue-cli项目，默认false]
  -w, --wxs               transform wxs file to js file, which default value is false [是否将wxs文件转换为js文件，默认false]
  -z, --vant              transform vant-weapp project to uni-app, automatic check [是否支持转换vant项目，默认为false]
  -r, --rename            rename wx.xxx() to uni.xxx(), which default value is true [是否转换wx.xxx()为uni.xxx()，默认true]
  -m, --merge             merge wxss file into vue file, which default value is true [是否合并wxss到vue文件，默认true]

```

#### 示例:

```sh
$ wtu -i ./miniprogram-project
```

#### vant 小程序转换为 uni-app 项目:

```sh
$ wtu -i ./miniprogram-project -z
```

<!-- #### 将 wx.xxx 转换为 uni.xxx:

```sh
$ wtu -i ./miniprogram-project -r
```

#### 将 wxss 合并入 vue 文件:

```sh
$ wtu -i ./miniprogram-project -m
```

#### 既转换 vant 小程序，又转换 wx 关键字，还将 wxss 合并入 vue 文件:

```sh
$ wtu -i ./miniprogram-project -z -r -m
``` -->

<!-- #### vue-cli mode[vue-cli模式]
转换项目为vue-cli项目(因vue-cli项目门槛较高，且该功能长时间未维护，不推荐使用):

``` sh
$ wtu -i ./miniprogram-project -c
```

#### Transform wxs file to js file

转换项目并将wxs文件转换为js文件(因uni-app已支持wxs，此功能未维护):

```sh
$ wtu -i ./miniprogram-project -w
``` -->

## 使用指南

本插件详细使用教程，请参照：[miniprogram-to-uniapp 使用指南](http://ask.dcloud.net.cn/article/36037)。

使用时遇到问题，请仔细阅读： [miniprogram to uniapp 工具答疑](https://github.com/zhangdaren/articles/blob/master/miniprogram-to-uniapp%E5%B7%A5%E5%85%B7%E7%AD%94%E7%96%91.md)

对于使用有疑问或建议，欢迎加入 QQ 群：780359397 进行讨论。

<a target="_blank" href="http://shang.qq.com/wpa/qunwpa?idkey=6cccd111e447ed70ee0c17672a452bf71e7e62cfa6b427bbd746df2d32297b64"><img border="0" src="http://pub.idqqimg.com/wpa/images/group.png" alt="小程序转uni-app讨论群" title="小程序转uni-app讨论群"></a>

## 已完成

-   支持微信、QQ、头条/抖音、支付宝/钉钉和百度等小程序转换到 uni-app 项目
-   支持有/无云开发的小程序项目转换为 uni-app 项目(cloudfunctions 目录将被忽略，uni-app 结合小程序云开发见：[使用 uni-app 进行微信小程序云开发经验分享](https://ask.dcloud.net.cn/article/35933))
-   支持解析 TypeScript 小程序项目
-   支持解析使用 npm 模块的小程序项目
-   支持解析 include 标签
-   支持解析 template 标签
-   支持解析 Behavior 文件为 mixins 文件
-   支持*.js', *.wxml 和\*.wxss 文件进行相应转换，并做了大量的优化
-   支持识别 App、Page、Component、VantComponent、Behavior 和纯 Javascript 文件的转换
-   修复变量名与函数重名的情况
-   合并使用 require 导入的 wxs 文件
-   setData() polyfill
-   搜索未在 data 声明，而直接在 setData()里使用的变量，并修复
-   使用[jyf-parser](https://ext.dcloud.net.cn/plugin?id=805)替换 wxParse(感谢网友 “爱瑞巴勒康忙北鼻” 的建议)
-   因 uni-app 会将所有非 static 目录的资源文件删除，因此将所有资源文件移入 static 目录，并修复所有能修复到的路径(目前 uni 编译时会将非 static 目录的文件复制一份到 static 目录，但并不完全，因此本功能仍保留)
-   支持 wxs 文件转换，可以通过参数配置(-w)，默认为 false(目前 uni-app 已支持 wxs，不再推荐转换 wxs)
-   支持 vue-cli 模式，可以通过参数配置(-c)，默认为 false，即生成为 vue-cli 项目，转换完成需运行 npm -i 安装包，然后再导入 hbuilder x 里开发(建议爱折腾人士使用)
-   支持 vant 转换，可以通过参数配置(-z)，默认为 false：（转换后的项目，目前仅支持 app 和 h5 两个平台）
-   支持 wx.xxx()转换为 uni.xxx()，可以通过参数配置(-r)，默认为 false（虽然 uni 已经对 wx 相关函数做了兼容，但仍有很多朋友有此需求，特作为可配置项，按需自取）

## 不支持转换的功能及组件

-   不支持转换反编译后的小程序项目
-   不支持转换使用 uni-app 编译的小程序项目
-   不支持转换使用 redux 开发的小程序(代表为：网易云信小程序 DEMO)
-   不支持转换使用 wxpage 开发的小程序(https://github.com/tvfe/wxpage)
-   不支持转换使用腾讯 omi 开发的小程序(https://github.com/Tencent/omi)
-   不支持转换小程序抽象节点 componentGenerics
-   不支持 component 里的 pageLifetimes 生命周期，请手动绕过
-   不支持使用 js 系统关键字作为函数或变量名(如 default、import、return、switch 等)
-   不支持以\$开头的变量名称，如 `Page({data:{$data:{name:"hello"}}})` ，刚好\$data 是 vue 内置变量，so 不支持，需手动修复
-   不支持以动态绑定的函数`<input @input="test{{index+1}}">`，需手动修复
-   更多，请参照[miniprogram to uniapp 工具答疑](https://github.com/zhangdaren/articles/blob/master/miniprogram-to-uniapp%E5%B7%A5%E5%85%B7%E7%AD%94%E7%96%91.md)

## 更新记录

### v1.0.72(20200901)

-   [修复] 可能导致转换后只剩 css 的问题

### v1.0.71(20200829)

-   [更新] jyf-parser 的版本为 2.15.3（2020-07-29）
-   [修复] 试解决转换后只剩下 css 的问题
-   [修复] properties 里面的 value 为函数时的处理
-   [优化] npm 包引用和体积
-   [优化] writeFile-->writeFileSync
-   [优化] 解析 js 的体积上限调为 500kb
-   [优化] npm 包优化以支持 hbuilder x 插件
-   [优化] 项目目录位在输入目录的子目录的情况
-   [优化] 默认 wxss 合并入 vue 文件，即不需要加命令参数-m
-   [优化] 不再对 iconfont 里面可能失效的字体文件进行注释，需手动修复
-   [优化] 默认将 wx/qq/tt/my/swan 等关键字重名为 uni，即不需要再加命令参数-r
-   [优化] 支持解析混淆过变量名的 wxParse(如`t.wxParse('article', 'html', article, that, 5)`)

### v1.0.68(20200707)

-   [新增] 支持转换 qq 小程序、头条小程序、支付宝/钉钉小程序和百度小程序转换到 uni-app 项目(基于语法转换)
-   [优化] 对齐微信，开启 watch 首次赋值监听

## [历史更新记录](ReleaseNote.md)

## 感谢

-   感谢转转大佬的文章：[[AST 实战]从零开始写一个 wepy 转 VUE 的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)， 本项目基于此文章里面的代码开发，在此表示感谢~
-   感谢网友[没有好名字了]给予帮助。
-   感谢 DCloud 官方大佬[安静]给予帮助。
-   感谢网友[☆_☆]给予帮助。
-   感谢网友[☆_☆]提供增强版 setData。
-   感谢官方大佬 DCloud_heavensoft 的文章：[微信小程序转换 uni-app 详细指南](http://ask.dcloud.net.cn/article/35786)，补充了我一些未考虑到的规则。
-   工具使用[jyf-parser](https://ext.dcloud.net.cn/plugin?id=805)替换 wxParse，表示感谢~
-   感谢为本项目提供建议以及帮助的热心网友们~~

## 参考资料

0. [[AST 实战]从零开始写一个 wepy 转 VUE 的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14) 此文获益良多
1. [https://astexplorer.net/](https://astexplorer.net/) AST 可视化工具
1. [Babylon-AST 初探-代码生成(Create)](https://summerrouxin.github.io/2018/05/22/ast-create/Javascript-Babylon-AST-create/) 系列文章(作者还是个程序媛噢~)
1. [Babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-inserting-into-a-container) 中文版 Babel 插件手册
1. [Babel 官网](https://babeljs.io/docs/en/babel-types) 有问题直接阅读官方文档哈
1. [微信小程序转换 uni-app 详细指南](http://ask.dcloud.net.cn/article/35786) 补充了我一些未考虑到的规则。
1. 更新 babel 版本，命令：npx babel-upgrade --write

## 最后

如果觉得帮助到你的话，可以支持一下作者，请作者喝杯咖啡哈~  
这样会更有动力更新哈~~  
非常感谢~~

![微信支付](https://zhangdaren.gitee.io/articles/img/WeChanQR.png)![支付宝支付](https://zhangdaren.gitee.io/articles/img/AliPayQR.png)

## LICENSE

This repo is released under the [MIT](http://opensource.org/licenses/MIT).
