# 转换各种小程序为 uni-app 项目

支持转换**微信、QQ、头条/抖音、支付宝/钉钉和百度等小程序**转换到 uni-app 项目

输入小程序项目路径，即可输出 uni-app 项目。

PS: 目前工具转换支持度最好的为：微信小程序和QQ小程序。

同时支持 Npm 安装 和 HbuilderX 插件(不依赖环境) 两种形式安装，安装方式如下：

## Npm 安装

```sh
$ npm install miniprogram-to-uniapp -g
```

<!-- ## 升级版本

```sh
$ npm update miniprogram-to-uniapp -g
``` -->

## 使用方法

```sh
Usage: wtu [options]

Options:

  -V, --version          output the version number [版本信息]
  -i, --input <target>   the input path for weixin miniprogram project [输入目录]
  -h, --help             output usage information [帮助信息]
  -c, --cli              the type of output project is vue-cli, which default value is false [是否转换为vue-cli项目，默认false]
  -w, --wxs              transform wxs file to js file, which default value is false [是否将wxs文件转换为js文件，默认false]
  -z, --vant             transform vant-weapp project to uni-app, automatic check [是否支持转换vant项目，默认为false]
  -r, --rename           rename wx.xxx() to uni.xxx(), which default value is true [是否转换wx.xxx()为uni.xxx()，默认true]
  -m, --merge            merge wxss file into vue file, which default value is false [是否合并wxss到vue文件，默认false]
  -f, --repair           repair javascript, which default value is false [是否对混淆过的js进行尽可能还原，默认false]

```
#### 示例:
##### 默认转换:

```sh
$ wtu -i ./miniprogram-project
```

##### vant 小程序转换为 uni-app 项目:

```sh
$ wtu -i ./miniprogram-project -z
```

<!-- ##### 将 wx.xxx 转换为 uni.xxx:

```sh
$ wtu -i ./miniprogram-project -r
```-->

##### 将 wxss 合并入 vue 文件:

```sh
$ wtu -i ./miniprogram-project -m
```

<!-- ##### 既转换 vant 小程序，又转换 wx 关键字，还将 wxss 合并入 vue 文件:

```sh
$ wtu -i ./miniprogram-project -z -r -m
``` -->
 ##### vue-cli模式
转换项目为vue-cli项目:

``` sh
$ wtu -i ./miniprogram-project -c
```

<!--
##### Transform wxs file to js file

转换项目并将wxs文件转换为js文件(因uni-app已支持wxs，此功能未维护):

```sh
$ wtu -i ./miniprogram-project -w
``` -->

##### 尽可能修复压缩混淆代码(实验阶段):

```sh
$ wtu -i ./miniprogram-project -f
```

### HbuilderX 插件安装

请参考项目：[HBuilder X 插件] 转换各种小程序为 uni-app 项目](https://ext.dcloud.net.cn/plugin?id=2656)进行食用。

目前这种方式，不支持转换 vant 项目，如需转换 vant 项目，请切换为 Npm 安装 方式。

## 使用指南

本插件详细使用教程，请参照：[miniprogram-to-uniapp 使用指南](http://ask.dcloud.net.cn/article/36037)。

使用时遇到问题，请仔细阅读： [miniprogram to uniapp 工具答疑文档.md](https://github.com/zhangdaren/articles/blob/master/miniprogram-to-uniapp%E5%B7%A5%E5%85%B7%E7%AD%94%E7%96%91.md)

对于使用有疑问或建议，欢迎加入 QQ 群进行指导和反馈。

交流 QQ 群：
1 群：780359397 <a target="_blank" href="http://shang.qq.com/wpa/qunwpa?idkey=6cccd111e447ed70ee0c17672a452bf71e7e62cfa6b427bbd746df2d32297b64"><img border="0" src="http://pub.idqqimg.com/wpa/images/group.png" alt="小程序转uni-app讨论群" title="小程序转uni-app讨论群"></a> (已满)
2 群：361784059 <a target="_blank" href="https://qm.qq.com/cgi-bin/qm/qr?k=vpt4K1r6Witx29ZsKcb_tqvinhcZzVhK&jump_from=webapi"><img border="0" src="http://pub.idqqimg.com/wpa/images/group.png" alt="小程序转uniapp研究二群" title="小程序转uniapp研究二群"></a>

## 已完成

<!-- | 微信小程序 | 支付宝小程序 | 百度小程序 | 字节跳动小程序 | QQ 小程序 | 360 小程序 |
| :--------: | :----------: | :--------: | :------------: | :-------: | :--------: |
|     √      |      √       |     √      |       √        |     √     |     x      | -->

-   **支持微信、QQ、头条/抖音、支付宝/钉钉和百度等小程序转换到 uni-app 项目**
-   支持有/无云开发的小程序项目转换为 uni-app 项目
-   支持解析 TypeScript 小程序项目
-   支持解析使用 npm 模块的小程序项目
-   支持解析 include 标签
-   支持解析 template 标签
-   支持解析 Behavior 文件为 mixins 文件
-   合并使用 require 导入的 wxs 文件
-   setData() polyfill， setData 函数无须另外处理！
-   支持识别 App、Page、Component、VantComponent、Behavior 和纯 Javascript 文件的转换
-   使用[mp-html](https://ext.dcloud.net.cn/plugin?id=805)替换 wxParse(感谢网友 “爱瑞巴勒康忙北鼻” 的建议)
-   将所有非 static 目录下资源文件移入 static 目录，并修复所有能修复到的路径
-   对代码语法做了大量的兼容，如修复变量名与函数重名的情况等
-   对混淆代码进行语义化分析，并作反混淆处理
-   搜索template和setData里未声明的变量，智能识别变量类型，并在data里面进行声明！

## 不支持转换的功能及组件

-   不支持转换使用 uni-app 编译的小程序项目
-   不支持转换使用 redux 开发的小程序(代表为：网易云信小程序 DEMO)
-   不支持转换使用 wxpage 开发的小程序(https://github.com/tvfe/wxpage)
-   不支持转换使用腾讯 omi 开发的小程序(https://github.com/Tencent/omi)
-   不支持转换小程序抽象节点 componentGenerics
-   不支持转换组件间关系relations
-   不支持转换 echarts 组件，需手动替换 echarts 为其他组件
-   不支持 component 里的 pageLifetimes 生命周期，请手动绕过
-   不支持使用 js 系统关键字作为函数或变量名(如 default、import、return、switch 等)
-   不支持以\$开头的变量名称，如 `Page({data:{$data:{name:"hello"}}})` ，刚好\$data 是 vue 内置变量，so 不支持，需手动修复
-   不支持以动态绑定的函数`<input @input="test{{index+1}}">`，需手动修复
-   更多，请参照[miniprogram to uniapp 工具答疑](https://github.com/zhangdaren/articles/blob/master/miniprogram-to-uniapp%E5%B7%A5%E5%85%B7%E7%AD%94%E7%96%91.md)

## 更新记录

### v1.1.1(20210430)

-   【重要】 [针对压缩代码]增加 -f 参数，默认为false，用于尽可能修复被混淆过的js代码，提升可读性！
-   【重要】 [针对压缩代码]三元表达式转换为if表达式(需增加-f参数)
-   【重要】 [针对压缩代码]getApp及this的变量名语义化(`var n = this;` ==> `var that = this;`)
-   【重要】 增加小程序大部分API函数的Polyfill，尽量避免调试报错，让项目先跑起来！(实验阶段)
-   【重要】 增加uni.navigateTo、uni.redirectTo不能跳转tabBar页面的Polyfill(不得已而为之)
-   【重要】 搜索template里未声明的变量，智能识别变量类型，并在data里面进行声明！
-   【重要】 升级 jyf-parse 为 mp-html v2.1.2（2021-04-24）
-   【重要】 增加getCurrentPages的处理
<!-- -   [新增] 组件picker的mode属性为region的检测(App和H5未实现region) -->
-   【重要】 使用[全兼容官方 picker mode=region 城市选择器](https://ext.dcloud.net.cn/plugin?id=1536) v1.0.6（2020-06-16）替换 `<picker mode="region"></picker>`
-   [新增] 对We UI组件的检测，并给出解决方案
-   [新增] 未定义函数的处理(增加空函数及console提示)
-   [新增] 当css里面含position:fixed且top:0，在H5平台对top增加header的高度
-   [新增] 使用vue-cli模式时，输入路径后面会增加vue-cli标识，以便与hBuilderX模式区分
-   [新增] 创建onLoad的副本refreshPage3389()，接管所有onLoad的调用(解决函数内直接调用onLoad而报错的问题)
……等等一些微小的工作

## [历史更新记录](ReleaseNote.md)

## 感谢

-   感谢转转大佬的文章：[[AST 实战]从零开始写一个 wepy 转 VUE 的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)， 本项目基于此文章里面的代码开发，在此表示感谢~
-   感谢网友[没有好名字了]给予帮助。
-   感谢 DCloud 官方大佬[安静]给予帮助。
-   感谢网友[☆_☆]给予帮助。
-   感谢网友[☆_☆]提供增强版 setData。
-   感谢官方大佬 DCloud_heavensoft 的文章：[微信小程序转换 uni-app 详细指南](http://ask.dcloud.net.cn/article/35786)，补充了我一些未考虑到的规则。
-   工具使用[mp-html](https://ext.dcloud.net.cn/plugin?id=805)替换 wxParse，表示感谢~
-   工具使用[全兼容官方 picker mode=region 城市选择器](https://ext.dcloud.net.cn/plugin?id=1536)替换 `<picker mode="region"></picker>`，表示感谢~
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
