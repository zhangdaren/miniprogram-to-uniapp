# 转换各种小程序为 uni-app 项目 v2.0

支持转换**微信、QQ、头条/抖音、支付宝/钉钉和百度等小程序**转换到 uni-app 项目

输入小程序项目路径，即可输出 uni-app 项目。

PS: 目前工具转换支持度最好的为：微信小程序和 QQ 小程序。

工具暂不支持 vant 项目，如果有含 vant 组件的小程序项目，请转换后，将 vant 的组件全部替换为 uview 或其他同功能组件。（个人不太建议转换 vant 项目！）

同时支持 Npm 安装 和 HbuilderX 插件(不依赖环境) 两种形式安装，安装方式如下：

## Npm 安装

```sh
$ npm install miniprogram-to-uniapp -g
```

### 使用方法

```sh
Usage: wtu [options]

Options:

  -V, --version          output the version number [版本信息]
  -i, --input <target>   the input path for weixin miniprogram project [输入目录]
  -h, --help             output usage information [帮助信息]
#   -c, --cli              the type of output project is vue-cli, which default value is false [是否转换为vue-cli项目，默认false]
  -m, --merge            merge wxss file into vue file, which default value is false [是否合并wxss到vue文件，默认false]

```

#### 示例:

##### 默认转换:

```sh
$ wtu -i ./miniprogram-project
```

##### 将 wxss 合并入 vue 文件:

```sh
$ wtu -i ./miniprogram-project -m
```

<!-- ##### 转换项目为 vue-cli 项目:

```sh
$ wtu -i ./miniprogram-project -c
``` -->

## HbuilderX 插件安装

请参考项目：[【HBuilder X 插件】 转换各种小程序为 uni-app 项目](https://ext.dcloud.net.cn/plugin?id=2656) 进行食用。

<!-- 目前这种方式，不支持转换 vant 项目，如需转换 vant 项目，请使用 Npm 安装 方式。 -->

## 使用指南

本插件详细使用教程，请参照：[miniprogram-to-uniapp 使用指南](http://ask.dcloud.net.cn/article/36037)。

使用时遇到问题，请仔细阅读： [miniprogram to uniapp 工具答疑文档.md](https://www.yuque.com/docs/share/0166a691-6877-4138-818b-2a5ef77216b7)

对于使用有疑问或建议，欢迎加入 QQ 群进行指导和交流。

交流 QQ 群：

1 群：780359397 <a target="_blank" href="http://shang.qq.com/wpa/qunwpa?idkey=6cccd111e447ed70ee0c17672a452bf71e7e62cfa6b427bbd746df2d32297b64"><img border="0" src="http://pub.idqqimg.com/wpa/images/group.png" alt="小程序转uni-app讨论群" title="小程序转uni-app讨论群"></a> (已满)

2 群：361784059 <a target="_blank" href="https://qm.qq.com/cgi-bin/qm/qr?k=vpt4K1r6Witx29ZsKcb_tqvinhcZzVhK&jump_from=webapi"><img border="0" src="http://pub.idqqimg.com/wpa/images/group.png" alt="小程序转uniapp研究二群" title="小程序转uniapp研究二群"></a>(已满)

3 群：603659851 <a target="_blank" href="https://jq.qq.com/?_wv=1027&k=3GSqQMIB"><img border="0" src="http://pub.idqqimg.com/wpa/images/group.png" alt="小程序转uniapp研究三群" title="小程序转uniapp研究三群"></a>

## 功能进度

### 1.小程序转换支持度

| 小程序       | 转换支持 | 转换文档 |
| :----------- | :------: | :------: |
| 微信小程序   |    ✔     |          |
| QQ 小程序    |    ✔     |          |
| 头条小程序   |    ✔     |          |
| 支付宝小程序 |    ✔     |          |
| 百度小程序   |    ✔     |          |

### 2.第三方组件支持度

| 组件                     | 转换支持 | 转换文档 |
| :----------------------- | :------: | :------: |
| mode 为 region 的 picker |    ✔     |          |
| wxParse                  |    ✔     |          |
| We-UI                    |  开发中  |          |
| Vant                     |    ✖️    |          |

### 3.小程序功能转换完成度

| 功能                                                         | 转换支持 | 转换文档 |
| :----------------------------------------------------------- | :------: | -------- |
| 微信小程序云开发                                             |    ✔     |          |
| TS 小程序                                                    |    ✔     |          |
| include 标签解析                                             |    ✔     |          |
| template 标签解析                                            |    ✔     |          |
| Behavior 解析                                                |    ✔     |          |
| setData 函数(polyfill)                                       |    ✔     |          |
| 代码反混淆                                                   |    ✔     |          |
| 关键字语义化(如 var t = this; => var that = this;)           |    ✔     |          |
| 输出代码自动格式化(与 HBuilderX 格式化一致)                  |    ✔     |          |
| 对 template 和 js 里面**未声明的变量**进行声明               |    ✔     |          |
| 函数与变量名重名处理                                         |    ✔     |          |
| 函数与 prop 属性重名处理                                     |    ✔     |          |
| 变量名与 prop 属性重名处理                                   |    ✔     |          |
| 第三方组件的参数类型修复                                     |    ✔     |          |
| this.data.xxx 转换为 this.xxx                                |    ✔     |          |
| app.xxx 转换为 app.globalData.xxx                            |    ✔     |          |
| getApp().xxx 转换为 getApp().globalData.xxx                  |    ✔     |          |
| polyfill                                                     |    ✔     |          |
| 资源文件处理及路径修复                                       |    ✔     |          |
| js 系统关键字作为函数或变量名(如 default、switch、delete 等) |    ✔     |          |
| 以$开头的变量                                                |    ✔     |          |
| 动态绑定的函数`<input @input="test{{index+1}}">`             |    ✔     |          |
| 合并 wxs 文件                                                |    ✖️    |          |
| globalData 变量与函数重名处理                                |    ✖️    |          |
| globalData 未变量处理                                        |    ✖️    |          |

### 3.暂不支持的项目、组件和语法

| 功能                                                                       | 转换支持 | 转换文档 |
| :------------------------------------------------------------------------- | :------: | -------- |
| <font color="red" size="4" face="bold">使用 uniapp 发布的小程序项目</font> |    ✖️    |          |
| 使用 redux 开发的小程序(代表为：网易云信小程序 DEMO)                       |    ✖️    |          |
| 使用 wxpage 开发的小程序(https://github.com/tvfe/wxpage)                   |    ✖️    |          |
| 使用腾讯 omi 开发的小程序(https://github.com/Tencent/omi)                  |    ✖️    |          |
| 小程序抽象节点 componentGenerics                                           |    ✖️    |          |
| 组件间关系 relations                                                       |    ✖️    |          |
| component 里的 pageLifetimes 生命周期                                      |    ✖️    |          |
| echarts 组件                                                               |    ✖️    |          |

文档正在完善中，敬请期待~

## 参考资料

0. [GoGoCode](https://gogocode.io/) 工具主要转换逻辑依赖 GoGoCode 构建
1. 工具使用[mp-html](https://ext.dcloud.net.cn/plugin?id=805)替换 wxParse
2. 工具使用[全兼容官方 picker mode=region 城市选择器](https://ext.dcloud.net.cn/plugin?id=1536)替换 `<picker mode="region"></picker>`
3. [[AST 实战]从零开始写一个 wepy 转 VUE 的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)
4. [https://astexplorer.net/](https://astexplorer.net/) AST 可视化工具
5. [Babylon-AST 初探-代码生成(Create)](https://summerrouxin.github.io/2018/05/22/ast-create/Javascript-Babylon-AST-create/) 系列文章
6. [Babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-inserting-into-a-container) 中文版 Babel 插件手册
7. [Babel 官网](https://babeljs.io/docs/en/babel-types) 有问题直接阅读官方文档哈
8. [微信小程序转换 uni-app 详细指南](http://ask.dcloud.net.cn/article/35786) 补充了我一些未考虑到的规则。

## 最后

如果觉得帮助到你的话，可以支持一下作者，请作者喝杯咖啡哈~

这样会更有动力更新哈~~

非常感谢~~

![微信支付](https://zhangdaren.gitee.io/articles/img/WeChanQR.png)
![支付宝支付](https://zhangdaren.gitee.io/articles/img/AliPayQR.png)

## LICENSE

This repo is released under the [MIT](http://opensource.org/licenses/MIT).
