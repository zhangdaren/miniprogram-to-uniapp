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
  -o, --output      the output path for uni-app project, which default value is process.cwd() [输出目录，可不写，默认为原文件目录加上_uni后缀]
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

* 小程序并不能与uni-app完全对应，转换也并非100%，只希望能尽量减少大家的工作量。
* 此工具基于语法转换，一定会有部分代码是uni-app没法支持，或暂时没有找到替代方案，请手动调整。   
~~* 小程序使用wxParse组件时，转换难度挺大，建议手动替换为uni-app所对应的插件（已支持）~~   


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
* 使用[uParse修复版](https://ext.dcloud.net.cn/plugin?id=364)替换wxParse   
* 搜索未在data声明，而直接在setData()里使用的变量，并修复   
* 合并使用require导入的wxs文件   
* 因uni-app会将所有非static目录的资源文件删除，因此将所有资源文件移入static目录，并修复所有能修复到的路径   
* 修复变量名与函数重名的情况   
   
    
## Todolist   
* [todo] 配置参数，支持指定目录、指定文件方式进行转换，增加参数-p 支持子目录转换   
* [todo] 文件操作的同步方法添加try catch    
* [todo] template标签转换为vue文件   
* [todo] 浏览小程序文档，发现生命周期函数可以写在lifetimes或pageLifetimes字段时，需要兼容一下(https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/component.html)   
* [todo] 小程序组件还有其他生命周期函数转换   
* [todo] 组件批量注册   
* [todo] 删除生成目录里的空白目录   
* [todo] 转换前先格式化代码   
* [todo] 变量没有在data里声明
  <text class="col-7">{{order.address.region.province}} {{order.address.region.city}} {{order.address.region.region}} {{address.detail}}</text>
  <text class="col-7">{{order.extract_shop.region.province}} {{order.extract_shop.region.city}} {{order.extract_shop.region.region}} {{order.extract_shop.address}}</text>
* [todo] setData时，data里面没有的就不赋值(一般是接口返回的数据，都往data里填)
  
   
## 更新记录   
### v1.0.27(20191018)   
* 【重要】 使用插件市场 [uParse](https://ext.dcloud.net.cn/plugin?id=364) 替换 wxParse   
* [新增] 当wxs文件内部引用外部wxs时，合并所有引用为一个wxs文件，并修复引用关系(解决uni-app不支持wxs内部引用同类文件，后续如果uni-app支持，此功能将回滚。为了这个功能，捣腾一天了)   
* [修复] 解析wxs标签未写入文件，src为undefined的bug   
* [修复] main里使用```Vue.component()```注册组件时，第一个参数为index的bug   
* [修复] const App = getApp()未解析到的bug(只能算漏掉了，没有判断A大写开头)   
* [修复] 函数使用系统关键字(如delete、import等，有个前提是已在methods里定义)命名时报错的bug   
   
   
### v1.0.26(20191013)   
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
   

### 历史更新记录已移入ReleaseNote.md   
    

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

      
~~### wxParse不支持转换~~   
~~建议手动替换为插件市场里的wxParse(已支持)~~      


### wxaSortPicker不支持转换   
建议手动替换为插件市场里的wxaSortPicker      


~~### 变量名与函数名重名~~
~~报错：[Vue warn]: Method "xxx" has already been defined as a data property.~~
~~解决：在小程序里，data里变量与函数可以同名，而在vue里当场报错，需手动将函数名重名，并修改template里所绑定的函数名(已支持)。~~


### 未在data里声明，而直接使用setData赋值   
报错：Avoid adding reactive properties to a Vue instance or its root $data at runtime - declare it upfront in the data option.
解决：工具尽可能的收集了页面里的setData({})里的参数，与data里的变量进行对比，并添加，一般情况不会报这个错。出现这个错，可能是页面里将this传到其他文件里，并调用了setData()函数导致的，需手动修改。   


### 使用别名代替this，导致this.data.xxx没法替换   
报错： Cannot read property 'xxx' of undefined   
解决：可能是使用了o、a、i、e等变量缓存了this，导致工具没法转换o.data.xxx为o.xxx。   
btw：碰到一个源码就是这种单个字符，应该是被工具压缩过代码。   
目前工具已经支持转换的变量关键字为：   
this.data.xxx   ==>  this.xxx   
that.data.xxx   ==>  that.xxx   
self.data.xxx   ==>  self.xxx   
_.data.xxx      ==>  _.xxx   
_this.data.xxx  ==>  _this.xxx   


### include标签
include标签不是蛮好转换，看过几份源代码，仅有一份代码里，使用了它。   
建议手动将内容拷贝进来。   

### wx:if="{{}}"   
遇到这种，建议手动修复   

~~### main.js加入的组件，里面包含getApp()~~
~~遇到这种，建议手动修复，因为main里加载的时候，还没有getApp()(已支持)~~~   

~~### <view @tap="delete"/>~~ 
~~编译报错：语法错误: Unexpected token~~   
~~这种在uni-app里没法编译过去~~    
~~因未能找到关键字列表及相关文档，建议手动重名(工具已针对delete、import等做了处理)~~   

### var appInstance = getApp(); 
建议手动处理 

### 运行wtu -V报错   
$ wtu -v   
/usr/local/lib/node_modules/miniprogram-to-uniapp/src/index.js:297   
async function filesHandle(fileData, miniprogramRoot) {   
^^^^^^^^   
SyntaxError: Unexpected token function   
......   
原因：当前nodejs版本不支持es6语法   
解决：升级nodejs版本，建议v9以上   
   
### 语法错误: This experimental syntax requires enabling the parser plugin: 'dynamicImport'   
可能是函数名使用了系统保留关键字，如```<input @input="import"></input>```   
暂时建议手动处理一下，毕竟还只遇到一例   
   

~~### require('./bem.wxs')~~   
~~uni-app暂不支持在 wxs、sjs、filter.js 中调用其他同类型文件，建议手动处理(已支持)~~   

   
### vant组件不支持转换    
经过研究，由于VantComponent({})与小程序结构差异较大，且组件内部强耦合，加上uni-app现在不支持 ```:class="bem('xxx')"```这种语法，虽然可以勉强做出一版来，但是考虑到vant后续更新，需要花费的力气不少，建议手动替换组件。   


### 属性没有定义，导致报错   
[Vue warn]:Property or method "toJSON" is not defined on the instance but referenced during render. Make sure that this property is reactive, either in the data option, or for class-based components, by initializing the property. See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.   
常见的是在data里没有声明，而直接使用(一般是在setData()调用的)，在小程序里没问题，在vue里可就不行了。   


### 提示：data 作为属性保留名,不允许在自定义组件 diy-sharp-goods 中定义为 props   
示例：   
```<abc data="{{ item.data }}"></abc>```
```properties: { data: Object }```
因为data作了为属性名，导致失效，目前建议手动修改属性名(连同template所引用的属性名)   
   
  
## 感谢   
* 感谢转转大佬的文章：[[AST实战]从零开始写一个wepy转VUE的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)， 本项目基于此文章里面的代码开发，在此表示感谢~   
* 感谢网友[没有好名字了]给予帮助。   
* 感谢官方大佬DCloud_heavensoft的文章：[微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)，补充了我一些未考虑到的规则。   
* this.setData()代码出处：https://ask.dcloud.net.cn/article/35020，在些表示感谢~  
* 工具使用[uParse修复版](https://ext.dcloud.net.cn/plugin?id=364)替换wxParse，表示感谢~
* 感谢为本项目提供建议以及帮助的热心网友们~~   
    
      
## 参考资料   
0. [[AST实战]从零开始写一个wepy转VUE的工具](https://juejin.im/post/5c877cd35188257e3b14a1bc#heading-14)   此文获益良多   
1. [https://astexplorer.net/](https://astexplorer.net/)   AST可视化工具   
2. [Babylon-AST初探-代码生成(Create)](https://summerrouxin.github.io/2018/05/22/ast-create/Javascript-Babylon-AST-create/)   系列文章(作者还是个程序媛噢~)   
3. [Babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-inserting-into-a-container)  中文版Babel插件手册   
5. [Babel官网](https://babeljs.io/docs/en/babel-types)   有问题直接阅读官方文档哈   
6. [微信小程序转换uni-app详细指南](http://ask.dcloud.net.cn/article/35786)  补充了我一些未考虑到的规则。   
   
   
## 最后
如果觉得帮助到你的话，点个赞呗~

打赏一下的话就更好了~

![微信支付](src/img/WeChanQR.png)![支付宝支付](src/img/AliPayQR.png)


## LICENSE
This repo is released under the [MIT](http://opensource.org/licenses/MIT).
