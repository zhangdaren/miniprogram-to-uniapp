
# 关于不支持转换的语法说明   

* 小程序并不能与uni-app完全对应，转换也并非100%，只希望能尽量减少大家的工作量。
* 此工具基于语法转换，一定会有部分代码是uni-app没法支持，或暂时没有找到替代方案，请手动调整。   


~~## wxParse不支持转换~~   
~~建议手动替换为插件市场里的wxParse(已支持)~~    

~~## 变量名与函数名重名~~
~~报错：[Vue warn]: Method "xxx" has already been defined as a data property.~~
~~解决：在小程序里，data里变量与函数可以同名，而在vue里当场报错，需手动将函数名重名，并修改template里所绑定的函数名(已支持)。~~

~~## main.js加入的组件，里面包含getApp()~~
~~遇到这种，建议手动修复，因为main里加载的时候，还没有getApp()(已支持)~~   

~~## <view @tap="delete"/>~~ 
~~编译报错：语法错误: Unexpected token~~   
~~这种在uni-app里没法编译过去~~    
~~因未能找到关键字列表及相关文档，建议手动重名(工具已针对delete、import等做了处理)~~   

~~## require('./bem.wxs')~~   
~~uni-app暂不支持在 wxs、sjs、filter.js 中调用其他同类型文件，建议手动处理(已支持合并wxs)~~   

~~## Method "_init" conflicts with an exsting Vue instance method, avoid defining component methods that start with _ or $.~~
~~方法名与vue内置方法名重名了，需手动修改（工具已做相关修复）~~   

~~## include标签
~~include标签不是蛮好转换，看过几份源代码，仅有一份代码里，使用了它。~~   
~~建议手动将内容拷贝进来。~~   


## 小程序里使用了npm库，暂时无法转换
遇到的这类小程序太少了，而我对于这类不太熟，如果有朋友愿意提供demo，那么可以支持的。


## ```<import src="*.wxml"/>```支持部分语法处理   

常规我们见到的代码是这样的(摘自官方小程序示例demo)：   
```
<import src="../../../common/head.wxml" />
<view class="container">
    <template is="head" data="{{title: 'action-sheet'}}"/>
</view>
```

为了解决这个问题，我收集到一些```<template/>```的写法：   

*    ```<template is="msgItem"  data="{{'abc'}}"/>```
*    ```<template is="t1" data="{{newsList, type}}"/>``` 【目前支持转换的写法】  
*    ```<template is="head" data="{{title: 'action-sheet'}}"/>``` 【目前支持转换的写法】   
*    ```<template is="head" wx:if="{{index%2 === 0}}" data="{{title: 'action-sheet'}}"/>``` 【目前支持转换的写法】   
*    ```<template is="courseLeft" wx:if="{{index%2 === 0}}" data="{{...item}}"></template>```
*    ```<template is="{{index%2 === 0 ? 'courseLeft' : 'courseRight'}}" data="{{...item}}"></template>```
* ```<template is="stdInfo" wx:for="{{stdInfo}}" data="{{...stdInfo[index], ...{index: index, name: item.name} }}"></template>```

目前仅针对第二、三、四种写法可以实现完美转换。而其它写法，目前uni-app并不支持v-bind=""和动态组件语法，暂无法支持。   
如有大佬对此有完美解决方案，请不吝赐教，谢谢~~   
   
目前的处理规则：   
1. 将wxml里```<tempate name="abc">```内容提取，生成vue文件，并注册为全局组件   
2. 将```<template is="head" data="{{title: 'action-sheet'}}"/>```转换为```<component :is="head" title="'action-sheet'"`/>``   
3. 删除```<import src="../../../common/head.wxml" />```   
4. 因uni-app暂时还不支持动态组件，导致:is="xxx"这种语法并不能支持，为保证转换后能跑起来，已经屏蔽相关代码，且写入日志，方便查看   

## wxaSortPicker不支持转换   
建议手动替换为插件市场里的wxaSortPicker     


## 未在data里声明，而直接使用setData赋值   
报错：Avoid adding reactive properties to a Vue instance or its root $data at runtime - declare it upfront in the data option.
解决：工具尽可能的收集了页面里的setData({})里的参数，与data里的变量进行对比，并添加，一般情况不会报这个错。出现这个错，可能是页面里将this传到其他文件里，并调用了setData()函数导致的，需手动修改。   


## 使用别名代替this，导致this.data.xxx没法替换   
报错： Cannot read property 'xxx' of undefined   
解决：可能是使用了o、a、i、e等变量缓存了this，导致工具没法转换o.data.xxx为o.xxx。   
btw：碰到一个源码就是这种单个字符，应该是被工具压缩过代码。   
目前工具已经支持转换的变量关键字为：   
this.data.xxx   ==>  this.xxx   
that.data.xxx   ==>  that.xxx   
self.data.xxx   ==>  self.xxx   
_.data.xxx      ==>  _.xxx   
_this.data.xxx  ==>  _this.xxx   



## wx:if="{{}}"   
遇到这种，建议手动修复   


## var appInstance = getApp(); 
建议手动处理 


## 运行wtu -V报错   
$ wtu -v   
/usr/local/lib/node_modules/miniprogram-to-uniapp/src/index.js:297   
async function filesHandle(fileData, miniprogramRoot) {   
^^^^^^^^   
SyntaxError: Unexpected token function   
......   
原因：当前nodejs版本不支持es6语法   
解决：升级nodejs版本，建议v9以上   

   
## 语法错误: This experimental syntax requires enabling the parser plugin: 'dynamicImport'   
可能是函数名使用了系统保留关键字，如```<input @input="import"></input>```   
暂时建议手动处理一下，毕竟还只遇到一例   

   
## vant组件不支持转换    
经过研究，由于VantComponent({})与小程序结构差异较大，且组件内部强耦合，加上uni-app现在不支持 ```:class="bem('xxx')"```这种语法，虽然可以勉强做出一版来，但是考虑到vant后续更新，需要花费的力气不少，建议手动替换组件。   


## 属性没有定义，导致报错   
[Vue warn]:Property or method "toJSON" is not defined on the instance but referenced during render. Make sure that this property is reactive, either in the data option, or for class-based components, by initializing the property. See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.   
常见的是在data里没有声明，而直接使用(一般是在setData()调用的)，在小程序里没问题，在vue里可就不行了。   


## 提示：data 作为属性保留名,不允许在自定义组件 diy-sharp-goods 中定义为 props   
示例：   
```<abc data="{{ item.data }}"></abc>```
```properties: { data: Object }```
因为data作了为属性名，导致失效，目前建议手动修改属性名(连同template所引用的属性名)      
   

## SyntaxError: Unexpected keyword 'class' (13:12)
wxs里使用class关键字来声明变量，手动改名   


## unexpected token default 不能使用default
如```<text>{{default}}</text>```，编译报错，建议手动改名   


## 小程序组件不支持的语法   
* relations暂不支持，原样复制   
* moved生命周期uni-app暂不支持，原样复制   
* ~~behaviors暂不支持，原样复制~~   
* ~~pageLifetimes(组件所在页面的生命周期函数),原样复制~~   


## 通过selectComponent(selector)选择的页面，在使用setData时，需注意   

解决：仍需手动调整处理。   

``` javascript
var pages = getCurrentPages();
var ctx = pages[pages.length - 1];
var pageCtx = ctx.selectComponent(selector);
pageCtx.setData({show:true}); 

```

上述代码报错：   
[Vue warn]: Avoid mutating a prop directly since the value will be overwritten whenever the parent component re-renders. 
Instead, use a data or computed property based on the prop's value. Prop being mutated: "show"   

   
正确调用方式：   
``` javascript
var pages = getCurrentPages();
var ctx = pages[pages.length - 1];
var pageCtx = ctx.selectComponent(selector);
pageCtx.$vm.setData({show:true}); 

```
   
使用this来选择又不一样了，上面是使用当前页面的方式   

``` javascript
var o = e().selectComponent("#top-tips");

const nav = target.selectComponent('.nav-instance')

this.selectComponent("#app-share").showShareModal()

this.uploader = this.selectComponent("#uploader"); 
```
需换成```this.$scope.selectComponent();```



---

倒是可以一刀切：
```
ctx.selectComponent(selector);  
替换为
ctx.selectComponent(selector).$vm;
```
暂未并入工具，现在手动修改。   
（原因是ctx.selectComponent(selector)为null时，会报错Cannot read property '$vm' of null）   


## props default 数组／对象的默认值应当由一个工厂函数返回(工具已修复)
Invalid default value for prop "slides": Props with type Object/Array must use a factory function to return the default value.   
```javascript
proE: {
    type: Array,
    value: []
}
// -->
proE: {
    type: Array,
    default: () => []
}

proE: {
    type: Object,
    value: {}
}
// -->
proE: {
    type: Object,
    default: () => ({})
}
```

### 引号或括号不匹配
如
```
<view style="line-height: 48rpx\""></view>
<view style="width:{{percent}}% }};"></view>
```
原始代码就有问题，需自己手动调整。

### UnhandledPromiseRejectionWarning: TypeError: Cannot read property 'buildError' of undefined
原因：
可能是因为代码里，let和var对同名变量先后进行了声明导致。
如：
```
let a = 1;
var a = 4;
```

## ```<solt :name="tabItem"></solt>```
v-slot 不支持动态插槽名，只发现一例


## <template is="wxParse" data="{{ wxParseData:item.html }}"></template>


## 返回顶部不生效
可参考：[scroll-view](https://uniapp.dcloud.io/component/scroll-view)里的写法

同样也可以简单粗暴的修改代码为：```this.scrollTop = Math.random();```
原理见：[scroll-view组件返回顶部不生效！（附第三方解决方案）](https://ask.dcloud.net.cn/article/36612)


## 组件里properties里的变量在代码里使用this.setData()去修改导致报错
data里没有currentIndex,，对比出来，误在data里增加了currentIndex，导致报错   

``` javascript
//转换后的微信小程序代码：
Component({
    properties: {
        currentIndex: {
            type: Number,
            value: 0
        },
    },
    methods: {
        bannerChange: function(e) {
            this.setData({
                currentIndex: e.detail.current
            });           
        }      
    }
});

//转换后的uni-app代码：
export default {
    props: {
        currentIndex: {
            type: Number,
            default: 0
        }
    },
    methods: {
        bannerChange: function(e) {
            this.setData({
                currentIndex: e.detail.current
            });
        }
    }
}
```

观察上面代码可以发现：   
1.properties里面声明了currentIndex   
2.在bannerChange里使用setData进行修改，导致报错:   
[Vue warn]: Avoid adding reactive properties to a Vue instance or its root $data at runtime - declare it upfront in the data option. (变量没有在data里面声明)   

原因是小程序里properties和data指向的是同一个对象，而vue里面就不一样了，分得很开，子组件没有权限对props里面的变量进行修改的。   
解决方案：自行修改代码，将props里面的变量在data里面进行重名并缓存一份，需要修改template和js代码。   

>https://www.jianshu.com/p/422a05e2f0f4
>其实在小程序里，properties和data指向的是同一个js对象，换一种说法，我们可以理解为：小程序会把properties对象和data对象合并成一个对象，
>所以我们得出一个结论：我们不要把data和properties里的变量设置成同一个名字，如果他们名字相同，properties里的会覆盖data里的。
