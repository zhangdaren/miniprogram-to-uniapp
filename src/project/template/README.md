# miniprogram-to-uniapp 转换说明

## 0x00 转换模式
根据转换模式，转换后的项目使用相应的工具打开，目前有两种模式：

### HBuilder X 模式
转换后的目录(以_uni结尾的目录), 需使用HBuilder X导入，进行运行和调试。
如果项目使用了npm模块，需先使用npm install等命令进行安装，然后再运行

### Vue-cli 模式
转换后的目录(以_vue-cli结尾的目录), 需使用命令行安装依赖、运行和打包。
详见文档：https://uniapp.dcloud.io/quickstart-cli.html#%E8%BF%90%E8%A1%8C%E3%80%81%E5%8F%91%E5%B8%83uni-app

注：
上述两种项目类型，可以相互转换。
[uni-app HBuilderX 工程与 vue-cli 工程相互转换](https://ask.dcloud.net.cn/article/35750)


## 0x01 调试建议
如果您想转换小程序为uni-app项目，并发布为App，
建议运行到H5平台，因为H5平台速度快，而且与App平台贴合度更高。
只有当强依赖硬件时，才使用真机调试，这样可以节约时间！


## 0x02 常见问题
### 1.命令行提示：“'wtu'不是内部或外部命令, 也不是可运行的程序”
一般是node未安装在默认目录导致的，参照文章 [解决“npm不是内部或外部命令“](https://www.cnblogs.com/ldq678/p/10291824.html) 解决。


### 2.PowerShell里提示：无法加载文件 XXXXXXXXX.ps1，因为在此系统上禁止运行脚本。
以管理员身份运行`powershell`，执行
```
set-executionpolicy remotesigned
```
输入 y 即可
或者，在PowerShell输入 `cmd` 后回车也行


### 3.setData为什么没有转换？需要我手动改吗？那我有100多个页面怎么改呀？
`setData`函数已内置，在main.js通过mixin全局混入，所以不用转换，可直接使用`setData`函数！！！


### 4.命令行报错："cannot read property ‘某某某’ of undefined"
报错解释：有代码“`xx.某某某`”，但xx的值是undefined，因此，需要进报错的页面，调试调试，为啥xx为undefined，相应的调试代码即可。
常见原因：可能接口跨域，可能真的没值，也可能没声明变量，也可能是工具转换问题等。


### 5.为什么我运行到H5或app时，拿不到小程序用户的信息？为什么登录失败？
转换后的uni-app项目，如需运行到其他小程序、H5和App时，登录和支付功能均需“重新对接”，需要增加 “新” 接口！


### 6.跨域问题：为什么我的接口都没有返回数据呀？
控制台有“CORS”、“Access-Control-Allow-Origin”等关键字时，不要犹豫，果断判断是因为跨域，导致访问接口失败。
跨域，前端老生常谈，有N种解决办法，最简单的办法是运行到“内置浏览器”。
PS: 仅仅 H5 平台存在跨域问题！发布后上传到服务器无此问题！


### 7.Vant项目怎么转换呀？

Vant项目比较常见的报错是：代码`<button class="{{ utils.bem('action-sheet__item', { disabled: item.disabled || item.loading }) }} {{ item.className || '' }}"></button>`转到后，运行会报错，因为uni-app不支持在class里面写函数）

由于Vant的一些语法uni-app并不支持，因此需要特殊处理一下，这里分享三种方案，可以根据自己的情况进行选择。

#### 方案一：【替换Vant组件】
转换前，将vant组件全部用别的组件库替换掉再转换。

#### 方案二：【替换Vant组件】
转换后，将vant组件使用uview1.x替换掉同功能组件。

#### 方案三：【不替换Vant组件】
转换后，按uniapp引入小程序组件文档重新引入vant组件（小程序自定义组件支持：
https://uniapp.dcloud.io/tutorial/miniprogram-subject.html#%E5%B0%8F%E7%A8%8B%E5%BA%8F%E8%87%AA%E5%AE%9A%E4%B9%89%E7%BB%84%E4%BB%B6%E6%94%AF%E6%8C%81）


### 8.小程序转换为uni-app项目后，还能转换成其他小程序项目吗？
当然可以，必须可以！
小程序转换为uni-app项目后，就是uni-app项目了，uni-app项目能做啥就能做啥，
能再次生成为各种小程序、发布H5和App。


### 9.uni-app生成的小程序项目，还能再转换回uni-app项目吗？
不能。不支持这种项目的转换！


### 其他
- 因各种原因，本工具并非100%完美转换！有问题实属正常！
- 如遇运行报错，请在https://github.com/zhangdaren/miniprogram-to-uniapp，将详细情况提交Issue！
