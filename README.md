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

### 使用方法

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
 ##### 转换项目为vue-cli项目:

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

##### 格式化vue、css等文件:

```sh
$ wtu -i ./miniprogram-project -ff
```

## HbuilderX 插件安装

请参考项目：[【HBuilder X 插件】 转换各种小程序为 uni-app 项目](https://ext.dcloud.net.cn/plugin?id=2656) 进行食用。

目前这种方式，不支持转换 vant 项目，如需转换 vant 项目，请使用 Npm 安装 方式。

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
-   支持对输出项目进行代码格式化

## 不支持转换的功能及组件

-   不支持转换使用 uni-app 发布的小程序项目
-   不支持转换使用 redux 开发的小程序(代表为：网易云信小程序 DEMO)
-   不支持转换使用 wxpage 开发的小程序(https://github.com/tvfe/wxpage)
-   不支持转换使用腾讯 omi 开发的小程序(https://github.com/Tencent/omi)
-   不支持转换小程序抽象节点 componentGenerics
-   不支持转换组件间关系relations
-   不支持转换 echarts 组件，需手动替换 echarts 为其他组件
-   不支持 component 里的 pageLifetimes 生命周期，请手动绕过
-   不支持使用 js 系统关键字作为函数或变量名(如 default、import、return、switch、continue、delete 等)
-   不支持以\$开头的变量名称，如 `Page({data:{$data:{name:"hello"}}})` ，刚好\$data 是 vue 内置变量，so 不支持，需手动修复
-   不支持以动态绑定的函数`<input @input="test{{index+1}}">`，需手动修复
-   更多，请参照[miniprogram to uniapp 工具答疑](https://github.com/zhangdaren/articles/blob/master/miniprogram-to-uniapp%E5%B7%A5%E5%85%B7%E7%AD%94%E7%96%91.md)

## 更新记录
### v1.1.6(20210713)
- [新增] -ff参数，使用prettier格式化输出代码，尽可能还原HBuilderX格式化风格（注：需多一倍转换时间，自行选择）
- [修复] 尝试修复 `this.setData({ ["info.jishilist[" + index + "].ifguanzhu"]: 0 });` 这类代码
- [修复] 组件的behaviors，直接放入生命周期，替换 'wx://form-field' 为 'uni://form-field'
- [修复] 代码`<view class="['legend','col-9',{{actTabIndex===0? 'show':'none'}}]">活动</view>`转换引号有问题的bug
- [修复] 分包未加入配置的bug


判断有问题！！！！！！！！！！
late对应的wxml实际为vue文件(至少包含wxml和

E:\zpWork\Project_self\miniprogram-to-uniapp\demo\2.0.10\xgc_music\resource\template


---------------
分包的json里面的东西没加进去


vant 转换时  slot --> view
<template>
<slot></slot>
</template>



忽略目录
cloud.zip
node_modules


//待测试~~~~~~~~~~~~~
hshzhj_xcx


    app.globalData.checkIsHome('/' + _this.$scope.route);

        app.globalData.checkIsHome('/' + _this.$vm.route);


        //this的定义在page之外




同一个页面
<import src="../../../template/calendarTemplate/calendarTemplate.wxml"></import>
var a = function(a) {
    return a && a.__esModule ? a : {
        default: a
    };
}(require("../../../template/calendarTemplate/calendarTemplate")), t = new getApp(), e = t.siteInfo.uniacid;




hshzhj_xcx


在onshow中调用app会报
chunk-vendors.js:4194 [Vue warn]: Error in onShow hook: "TypeError: Cannot read property 'globalData' of undefined"

          onShow() {
    if (this.coupon_id && !this.indexShowCoupon) {
      let ticket = wx.getStorageSync('ticket');

      if (ticket) {
        if (wx.getStorageSync('couponshow')) {
          wx.removeStorageSync('couponshow');
        } else {
          this.getCouponInfo();
          this.indexShowCoupon = true;
        }
      }
    }
    app.globalData.checkIsHome('/' + _this.$vm.route);
    if (!this.loadRecommendGoods) {
      this.setData({
        loadRecommendGoods: true //根据购物车添加状况重新显示推荐商品

      });
    }

h5
chunk-vendors.js:4194 [Vue warn]: Error in data(): "TypeError: Cannot read property 'systemInfo' of undefined"

const app = getApp();
var common = require("../utils/common.js");

export default {
  data() {
    return {
      isIphoneX: app.globalData.systemInfo.model.indexOf('iPhone X') != -1 || app.globalData.systemInfo.model.indexOf("unknown<iPhone12,3>") != -1 ? true : false
    };
  },






uniapp集成方法，跟小程序wx.getLocation不同，可直接获取经纬度及城市信息（当前你也可以先获取经纬度再解析成具体城市）

uni.getLocation({
			    type: 'wgs84',
				geocode:true,//设置该参数为true可直接获取经纬度及城市信息
			    success: function (res) {
					console.log(res)
					that.addrDel = res;
			    },
				fail: function () {
					uni.showToast({
					    title: '获取地址失败，将导致部分功能不可用',
						icon:'none'
					});
				}
			});
开启Maps权限：manifest.json文件中选择App模块配置，勾选Maps，选择高德或百度（官方推荐高德，我这里也是使用的高德地图）


那个scope有时候还是要加上，就像上面的图，同样一个名字class外面影响到里面了
微信小程序用插件转换后，发现导航栏错位了，加了scoped就正常了。

      <template is="nav" data="{{list:nav.nav, bindClick:'onClickNav'}}"></template>

<template name="nav">
    <view class="nav-wrap">
        <view class="nav-item-wrap" wx:for="{{list}}" wx:key="index">
            <v-nav class="item" src="/images/icon-home-{{index+1}}.png" text="{{item.name}}"
                   data="{{item}}" bind:click="{{bindClick}}"/>
        </view>
    </view>
</template>


使用模板字符串
<view class="weui-toptips {{className}} {{extClass}} {{show ? 'weui-toptips_show' :  ''}}">


https://play.gogocode.io/#code/N4IglgdgDgrgLgYQPYBMCmIBcIAEOA8caAtlADYCGRAfADoR574AyFAnkvDpgNZpsBeWiAAGAI3hwkEAM4iA1DglwpsnIooA6ZapnqcWndJnb9h7ZOPC6DRvhRgAbjkcBaMADMhII7M1k0CABzOAALa2BgHEBpW0BV6N89AF9E-AB6B0cbRgIMl1cPJAAnbwAKMCJiABocSHQADwBKGoYEiKiEhJxktIysu17ACZUhnqc+tNYOeBs0ivIqNGmZAGNCsCg4G3o05dX16hBKkAB3Ip5kdCwQDxgIJbgwaRw4QopZAsLiEo8wAIBJCAK1QoUDA1SQ6wesiawHoeCWxjgOAAJDgBAYQZogkgsfD0LCcPDZIiZJxCks0KicN8-gCkJoSTAyWh8alUjhABTqgE34wAziYAV+MAe2qAA3lAPiugAQjQAhboBjuUAgB74wpoOCMhhIkoMpnVKJQCiFGRoADyEOMmBwUUowRgFCCaGNAHJHDA0DauokGvjNN8ICgSjbCCQ5jQZn7KDQba7bO7at78EiAPpIgCMyLjACZvLGkQBmaxpdPx6iht1oChLUIlOCW1HUE34vCsnCALATAOPx9cAsomAMm9AGvKgD0dQDkBjWnpbNMQqCWANoZgC67qKAFFi6XiJXq7Zsp4cCUAITETQQVBoTSEogQOBDkelm0JUNNeWKwoQADcODrgFg5QCgyoBqFQSgEYdG9K-t4bdd3QA9pCPRE0SfNlAE2-XtAB4FQBpWMABtNYP-ZESkAvcQOPQI4AaCNPW9S8mjrQAwHTgwAQTUAMBdAC45AArGRAAsIwA++MAeH1UM0IsSzKColxhFdshqDx13KEhNC1eVjxKPCgP3OA2CgCkBDRG0AFkSDENBChnOooHlGQZEhJ0ADIjJqCoxO1HCpJ3TDdPBTS5J3ChiEU5SiOXASBLrQAgzUAHPMEkAejNAGqIwBgGMACldAE7TQAYf+fQBOU0ADeVUOyX873vJKunSusEoSeLAHnE6iKDEJZ0pE7cqGeb0IGcx1qhtQqlgLfi8BddjCiQJA4Ck9irQgTT5i6-iWtsIa8ExQI+qIAbEnoA5wGgeBWGCS5QjgYgyFm0IKBkAAFG97k0rAPAoMhdUOeFSEsvV4FgOAsGeB1EiAA

https://www.cnblogs.com/xinxingyu/p/5736244.html

超过200KB 的文件，转换的时候会很耗时。这些文件一般是lib库文件，可以选择不转换这些文件。


小程序端不支持eval函数,有替代的函数吗?

试试eval5，100%支持es5语法：https://github.com/bplok20010/eval5

https://developers.weixin.qq.com/community/develop/doc/0008e2aa184bc82935f7af6bf56400


//isRepair 与getApp有冲突!!!!!!!!!!!

如果，已经有项目存在，是否覆盖，还是替换。


var day = 1
var type = 'sign'
this.setData({
    ['setting.day' + day + '.' + type]:'value'
})


https://www.wuxui.com/#/animation-group

  <wux-animation-group wux-class="example" in="{{ example.in }}" enter="{{ example.enter }}" exit="{{ example.exit }}" class-names="{{ example.classNames }}" bind:click="onClick" bind:enter="onEnter" bind:entering="onEntering" bind:entered="onEntered" bind:exit="onExit"
            bind:exiting="onExiting" bind:exited="onExited">

    properties: {
        show: {
            // 是否开启弹窗
            type: Boolean,
            value: false,
            observer: '_showChange'
        },
    }


//bindClick 没替换

<input bindinput="value = true" />
<view bindtap="{{openId==undefined?'denglu':'hy_to'}}" class="fs28 hy_to cf">立即{{ hyinfo.banli }}</view>
 <input @input="bindCustomfrom{{index+1}}"



目前其他平台未统一支持，可以先使用条件编译，单独在小程序平台使用 this.$scope.animate

this.animate('.index-page__logo', [
      {
        borderRadius: '0',
        borderColor: 'red',
        transform: 'scale(1) translateY(-20px)',
        offset: 0,
      }, {
        borderRadius: '25%',
        borderColor: 'blue',
        transform: 'scale(.65) translateY(-20px)',
        offset: .5,
      }], 2000, {
      scrollSource: '#scroller',
      timeRange: 2000,
      startScrollOffset: 0,
      endScrollOffset: 85,
    })



就在当前目录下面
import Base64 from './base64'
import iconData from './icondata'



miniprogram_npm  做成组件！！！！！！！！！！！！！！！！！！！！！！

去miniprogram_npm找
如果带了.js就在当前目录找
且没有/ 且，没有.js



在miniprogram_npm目录下

    "mp-icon": "weui-miniprogram/icon/icon",
    "mp-dialog": "weui-miniprogram/dialog/dialog",
    "com-mask":"../../components/mask/mask"


"mp-dialog": "weui-miniprogram/dialog/dialog",
   "mp-gallery": "../gallery/gallery"


import PubSub, { publish } from 'pubsub-js'
import moment from "moment"


base64

app.vue 里面已有 函数，然后使用

   wx.getStorage({
       时，

       出现 uni.globaldata.getStorage


<script>
// app.js
// let app = getApp();
let BLE = require('./common/ble.js');
let dateObj = new Date();

在app.vue 里会报错
不要在定义于 App() 内的函数中，或调用 App 前调用 getApp() ，可以通过 this.$scope 获取对应的app实例


weui 转换貌似有点问题

 Error: Cannot find module './weui-miniprogram/icon/icon'
transform(path.join(__dirname, './weixin_miniprograme'), {



import mpIcon from './weui-miniprogram/icon/icon';
import mpIcon from '@/miniprogram_npm/weui-miniprogram/icon/icon';


路径有问题！！！！！

20 import mpCells from '/weui-miniprogram/cells/cells';


替换进来的可能没定义msg。。。


https://blog.csdn.net/YingDaoMonkey/article/details/110659368

wxsortxxxx

Vue里面函数用下划线开头好像是没问题的，只是变量不行


template wxml+wxss+js

src="/images/icon-{{xx}}.png"

https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/observer.html




                            function compareVersion(v1, v2) {
	v1 = v1.split('.');
	v2 = v2.split('.');
	const len = Math.max(v1.length, v2.length);
	while (v1.length < len) {
		v1.push('0');
	}
	while (v2.length < len) {
		v2.push('0');
	}
	for (let i = 0; i < len; i++) {
		const num1 = parseInt(v1[i], 10);
		const num2 = parseInt(v2[i], 10);
		if (num1 > num2) {
			return 1;
		}
		if (num1 < num2) {
			return -1;
		}
	}
	return 0;
}

function gte(version) {
	const system = getSystemInfoSync();
	return compareVersion(system.SDKVersion || "", version) >= 0;
}

system.SDKVersion H5 上面没有定义这个值



15:59:27.925 (3270:1) @import must precede all other statements (besides @charset)

.text-shadow {
    text-shadow: 2rpx 4rpx 6rpx rgba(0,0,0,0.4);
}

@import "./wuBaseWxss/2.css";

@import must precede all other statements
@导入必须在所有其他语句之前


v-show在微信小程序中也有问题； H5表现正常， 微信小程序v-show失效； 我的解决方案是根据条件编译不同的指令来解决；
这个问题的原因我没有明白， 楼主搞明白为什么会出现这种问题的原因了吗
回复 m13593661404@163.com: 现在的v-show在小程序如果是内置组件是没问题，但是自定义组件是有问题的
v-show 只适用基本组件,uni-app 会将v-show 的组件添加hidden属性，而在组件中添加hidden属性，不会起作用


[](https://www.bbsmax.com/A/pRdBgENPzn/)


props存在的变量  也被加入
    <view style="width:{{100/footer.list.length}}%;" wx:for="{{footer.list}}" wx:key="footer">
Component({
    properties: {
        footerindex: {
            type: String,
            value: 0
        },
        footer: {
            type: Object,
            value: ""
        },
        js_footerindex: {
            type: String,
            value: 0
        },
        persontype: {
            type: String,
            value: 0
        }
    },



selectSeed--变量重名函数
[](http://localhost:8080/#/kundian_farm/pages/land/detail/confirm?land_id=62)

		<view class="f26 flex" v-else><view class="cf93">暂无优惠券</view></view>
		</view>
		<view class="plt30 flexSb bgff coupon" v-if="!selectSeed && land.sow_status == 0">
			<view>
				<text class="iconfont icon-shumiao f44" :style="'color:' + bgColor + ';margin-left:10rpx'"></text>
				<text class="f26 new-tag">选择种子</text>
			</view>
			<view @tap="selectSeed" class="f26 flex">
				选择
				<text class="iconfont icon-right right-icon"></text>
			</view>
		</view>
		<view class="user_container" v-if="selectSeed && land.sow_status == 0">
			<view class="land_title plt40 flexSb">
				<view>种子信息</view>
				<view @tap="selectSeed" class="f26 flex" style="height:50rpx;">
					选择
					<text class="iconfont icon-right right-icon"></text>
				</view>
			</view>
			<view v-for="(item, index) in selectSeed" :key="index" class="seed-li flex">
				<image :src="item.cover"></image>


log文件提示报错




(1). 绑定事件时不能带参数 不能带括号 以下为错误写法
<input bindinput="handleInput(100)" />
复制代码
(2). 事件传值 通过标签⾃定义属性的⽅式 和 value
<input bindinput="handleInput" data-item="100" />
复制代码
(3). 事件触发时获取数据
 handleInput: function(e) {
    // {item:100}
   console.log(e.currentTarget.dataset)

    // 输入框的值
   console.log(e.detail.value);
 }




-------
函数与变量重名，生成报错/*



Page(vvv) 添加提示

hbx 命令行报错了，捕获不到 ！！！！！！

！！！！ 同一个项目，hbx插件，转换不全！！！！！！！！！？？？？？？



template对应的wxml实际为vue文件，忽略掉
[Error] template对应的wxml实际为vue文件(至少包含wxml和js文件)，请转换完后，手动调整 -->    file --> wxParse/wxParse


app 小程序 onshow 处理情况



----------------------------
2.42前端

[绑定值命名替换]:  'box-shadow:' + (noborder ? 'none' : '0px 0px 3rpx #ccc') + '';  -->  'box-shadow:' + (!0 ? 'none' : '0px 0px 3rpx #ccc') + '';
[绑定值命名替换]:  'box-shadow:' + (noborder ? 'none' : '0px 0px 3rpx #ccc') + '';  -->  'box-shadow:' + (!0 ? 'none' : '0px 0px 3rpx #ccc') + '';
[绑定值命名替换]:  'goodlist1 ' + (style2 ? 'style2' : 'style1');  -->  'goodlist1 ' + (!0 ? 'style2' : 'style1');



    uni.showToast = (function(oriLogFunc) {
        return function(options) {
            //  #ifdef APP-PLUS
            if (!options.icon || options.icon === "none") {
                var navtiveOptions = {
                    duration: options.duration || 1500,
                    verticalAlign: options.position || "center",
                }
                plus.nativeUI.toast(options.title, navtiveOptions);
            } else {
                oriLogFunc.call(oriLogFunc, options);
            }
            // #endif

            //  #ifndef APP-PLUS
            oriLogFunc.call(oriLogFunc, options);
            // #endif
        };
    })(uni.showToast)
//未完


<view bindtap="{{openId==undefined?'denglu':'hy_to'}}" class="fs28 hy_to cf">立即{{ hyinfo.banli }}</view>


 <input @input="bindCustomfrom{{index+1}}"


<view v-for="(it, in) in item.list" :key="in" @tap="chooseCity" class="i-index-demo-item" :data-city="it.city">




		for (var t = 0; t < r.length; t++)
							if (r[t].day == a.data.day) {
								r[t].choosed = true;
							}





//全是这种要提示的
@font-face {
    font-family:remixicon;src:url(//cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.eot?t=1590207869815#iefix) format("embedded-opentype"),url(//cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.woff2?t=1590207869815) format("woff2"),url(//cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.woff?t=1590207869815) format("woff"),url(//cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.ttf?t=1590207869815) format("truetype"),url(//cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.svg?t=1590207869815#remixicon) format("svg");font-display:auto;
}


uni.getAccountInfoSync() is not a function  H5







my 没有转换为uni  勾选了配置


<button type="default" bindtap="chooseVideo" bindtap='uploadvideo' class="right" type="warn" form-type='reset'>保存</button>

两个：bindtap  ，保留后面的



			if ('' != i && void 0 != i) {
				if ('' != d && void 0 != d) {



        ----以下已处理




avoid using JavaScript keyword as property name: "continue"
----continue
  <text class="text" bindtap="continue">继续购买</text>



<view class="list_item" data-commentid="{{comment_item.commuity_id}}" data-id="{{comment_item.id}}" data-idx="{{tie_index}}"
 data-name="{{comment_item[0][0].username}}" data-path="{{comment_item.path}}"
  wx:if="{{item.is_open==1?index<2:index<999999999}}"
   wx:for="{{item.comment}}" wx:for-item="comment_item" wx:key="index">
                                    <view wx:if="{{comment_item.pid==0}}">
                                        <text>{{comment_item[0][0].username}}</text>：{{comment_item.content}}
                    </view>
                                    <view wx:else>
                                        <text>{{comment_item[0][0].username}}</text>回复<text>{{comment_item[1][0].username}}</text>：{{comment_item.content}}
                    </view>
                                </view>


                                //wx:for-item="comment_item" 忽略转换

 <text>{{comment_item[0][0].username}}</text>回复<text>{{comment_item[1][0].username}}</text>：{{comment_item.content}}
                    </view>

  comment_item[0]: [{
        username: { }
      }],


未转换到！！！！！
    wx.setNavigationBarTitle({
          title: `${this.properties.book}-校对(${(pageNumber - 1) * 100 + 1}至${pageNumber * 100})`,
        });

proofreadList.js


而且在小程序里observers都是初始后立即执行，转为uniapp后不是立即执行，很多地方都出错了。
建议转成immediate:true
https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/observer.html
哦哦，小程序转换过来的很多都是observer多个值，现在都用不了了



_406494324_3  用来录制视频 二分删除


if (1 == a.is_open_sku) o=4; else o=5;

if(a){
  a=5;
}else{
  b=0;
}


	let target_click = `specs[${father}].items[${self}].click`

		this.setData({
		    [target_click]: false
		})






### v1.1.5(20210703)
- [优化] 过滤ts文件
- [修复] app.js里data原样移入globalData
- [修复] 将整个表达式在data里创建变量的bug(`<view wx:if='(plugins_coupon_data || null) != null'></view>`)
...等等

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
-   感谢为本项目给予赞助及提供建议的网友们~~

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
