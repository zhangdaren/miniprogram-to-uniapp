# 转换各种小程序为 uni-app 项目 v2.0

支持转换**微信、QQ、头条/抖音、支付宝/钉钉和百度等小程序**转换到 uni-app 项目

输入小程序项目路径，即可输出 uni-app 项目。

工具同时支持 Npm 安装 和 HbuilderX 插件(不依赖环境) 两种形式安装，安装方式如下：

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
  -c, --cli              the type of output project is vue-cli, which default value is false [是否转换为vue-cli项目，默认false]
  -m, --merge            merge wxss file into vue file, which default value is false [是否合并wxss到vue文件，默认false]
  -t, --template         transform template and include to component, which default value is false [转换template和include为单独组件，默认false]

```

#### 示例:

##### 默认转换:

```sh
$ wtu -i "./miniprogram-project"
```

注："./miniprogram-project" 是要转换的小程序项目目录，如路径中有空格应该用引号引起来。

##### 将 wxss 合并入 vue 文件:

```sh
$ wtu -i "./miniprogram-project" -m
```

##### 转换项目为 vue-cli 项目:

```sh
$ wtu -i "./miniprogram-project" -c
```

##### 将 template 里面的 import/template 和 include 标签转换为单独组件(实验性):

```sh
$ wtu -i "./miniprogram-project" -t
```

待命令行运行结束，会在小程序项目的同级目录有以 小程序项目名 + "\_uni" 或 小程序目录名 + "\_uni-cli" 目录，即是转换好的 uni-app 项目，转换好后，请使用 HBuilderX 导入并运行。

## HbuilderX 插件安装

请参考项目：[【HBuilder X 插件】 转换各种小程序为 uni-app 项目](https://ext.dcloud.net.cn/plugin?id=2656) 进行食用。

<!-- 目前这种方式，不支持转换 vant 项目，如需转换 vant 项目，请使用 Npm 安装 方式。 -->

## 说明文档

关于本工具转换原理及常见问题，请见：[miniprogram-to-uniapp文档](https://l4rz4zwpx7.k.topthink.com/@kmrvzg72lx/)

## 问题答疑

对于使用有疑问或建议，欢迎加入 QQ 群进行指导和交流。

交流 QQ 群：

1 群：780359397 <a target="_blank" href="http://shang.qq.com/wpa/qunwpa?idkey=6cccd111e447ed70ee0c17672a452bf71e7e62cfa6b427bbd746df2d32297b64"><img border="0" src="http://pub.idqqimg.com/wpa/images/group.png" alt="小程序转uni-app讨论群" title="小程序转uni-app讨论群"></a> (已满)

2 群：361784059 <a target="_blank" href="https://qm.qq.com/cgi-bin/qm/qr?k=vpt4K1r6Witx29ZsKcb_tqvinhcZzVhK&jump_from=webapi"><img border="0" src="http://pub.idqqimg.com/wpa/images/group.png" alt="小程序转uni-app研究二群" title="小程序转uni-app研究二群"></a> (已满)

3 群：603659851 <a target="_blank" href="https://jq.qq.com/?_wv=1027&k=3GSqQMIB"><img border="0" src="http://pub.idqqimg.com/wpa/images/group.png" alt="小程序转uni-app研究三群" title="小程序转uni-app研究三群"></a> (已满)

4 群：555691239 <a target="_blank" href="https://jq.qq.com/?_wv=1027&k=aQrtEG9W"><img border="0" src="http://pub.idqqimg.com/wpa/images/group.png" alt="小程序转uni-app研究四群" title="小程序转uni-app研究四群"></a>


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
