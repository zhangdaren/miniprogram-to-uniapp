  
# Todolist   
* [todo] 配置参数，支持指定目录、指定文件方式进行转换，增加参数-p 支持子目录转换   
* [todo] 文件操作的同步方法添加try catch    
* ~~[todo] 浏览小程序文档，发现生命周期函数可以写在lifetimes或pageLifetimes字段时，需要兼容一下(https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/component.html)~~   
* [todo] 组件批量注册   
* [todo] 删除生成目录里的空白目录   
* [todo] 转换前先格式化代码   
* [todo] 变量没有在data里声明
  <text class="col-7">{{order.address.region.province}} {{order.address.region.city}} {{order.address.region.region}} {{address.detail}}</text>
  <text class="col-7">{{order.extract_shop.region.province}} {{order.extract_shop.region.city}} {{order.extract_shop.region.region}} {{order.extract_shop.address}}</text>
* [todo] setData时，data里面没有的就不赋值(一般是接口返回的数据，都往data里填)   
* [todo] 导出目录检测，有文件是否覆盖，，是 否   
~~* [todo] wx-charts替换   ~~
~~* [todo] ```<form-id :id="item.id" ></form-id>```~~
~~* ```:data = "content"```~~
* 组件里：behaviors: ['wx://form-field']


2020
import作为事件名

include　套娃

抽象节点
componentGenerics

QQ 小程序
qs文件 qq标签

qq:if
qq.login

vue to uni

使用omix框架的小程序


增加导出目录存在后将覆盖的提示
定义命令的回调函数 用法示例：.action(fn)

program
    .command('rm <dest> [otherDirs...]')
    .alias('r')
    .option('-r, --recursive', 'Remove recursively')
    .option('-d --drink [drink]', 'Drink','Beer')
    .action(function (d, otherD,cmd) {
        console.log('remove ' + d ,(cmd.drink ),(cmd.recursive ))
        if (otherD) {
            otherD.forEach(function (oDir) {
                console.log('rmdir %s', oDir);
            });
        }

    })
#output
 ✗ gp-cli rm ./aa bb cc  -d -r
remove ./aa Beer true
rmdir bb
rmdir cc


getApp().page({
    data: (_data = {


////////////////////////////////////

* 存入static的资源进行全局存放，然后针对性的进行优化

* 分包/////////////////////////////////

mmt
   似乎小程序和uni两个版本的数据字段不一样，不是太好替换。

替换思路：
与wxParse一致

1.wxaSortPicker目录忽略？，不忽略

判断标签 class
<template name="wxaSortPickerItem">  
  <block wx:if='{{dataType == "object"}}'>
    <block wx:for="{{item.textArray}}" wx:for-item="child" wx:key="">
        <view class="wxaSortPickerItem" data-text="{{child.name}}" data-value="{{child.value}}"  catchtap= "wxaSortPickerItemTap">
          {{child.name}}       
        </view>
    </block>
  </block>
</template>

取出以下三组数据，放入全局变量
data-text="{{child.name}}" 
data-value="{{child.value}}"  
catchtap= "wxaSortPickerItemTap"

2.替换掉var wxaSortPicker = require('../../utils/wxaSortPicker/wxaSortPicker.js');

3.
    var that = this
		wxaSortPicker.init([
			"澳大利亚", "阿富汗", "巴哈马"
		], that);

替换为：
	 var that = this
	 			that.$refs["sortPickerList"].initPage([
			"澳大利亚", "阿富汗", "巴哈马"
		])

4.methods:

  wxaSortPickerItemTap: function(e){
    console.log(e.target.dataset.text);
    console.log(e.target.dataset.value);//字符串数组无此字段
  },
  替换为

wxaSortPickerItemTap(data) {
	console.log('获取名：' + data.label)  //这里的替换是个难点！
	console.log('获取名：' + data.value)
}



//////////////////////////////////



* prop里有data 生命周期也有data

模板里，所有{{}}内的都提取（去除不含.的和很多点的）
<template is="stdInfo" wx:for="{{stdInfo}}" data="{{...stdInfo[index], ...{index: index, name: item.name} }}"></template>

解析，!= == === ? / % 等切割,存入全局对象，以最前面那个？？？  感觉这里还是有点问题，多层怎么办？

<view class="i-divider i-class" :style="parse.getStyle(color,size,height)">


文件大小---大于500k就当纯js处理？


///两种情况，一种是props里就
data{defaultVal:""}
  watch:{
	  default:function(oldVal, newVal){
		  this.defaultVal = newVal;
	  }
  },

还有就是data里的，


  globalData: {
    onLaunch: onLaunch("123"),
    onShow: require("./core/appOnShow.js"),
    onHide: require("./core/appOnHide.js"),


/////////////////////////

data里没有currentIndex,，对比出来，误在data里增加了currentIndex，导致报错
The data property "currentIndex" is already declared as a prop. Use prop default value instead.

  properties: {
    currentIndex: {
      type: Number,
      value: 0
    },
  },
  bannerChange: function (e) {
    this.setData({
      currentIndex: e.detail.current
    });
  }

[Vue warn]: Avoid adding reactive properties to a Vue instance or its root $data at runtime - declare it upfront in the data option.


https://www.jianshu.com/p/422a05e2f0f4
其实在小程序里，properties和data指向的是同一个js对象，换一种说法，我们可以理解为：小程序会把properties对象和data对象合并成一个对象，

所以我们得出一个结论：我们不要把data和properties里的变量设置成同一个名字，如果他们名字相同，properties里的会覆盖data里的。



组件嵌套组件时，page->actionsheet->btn
btn的事件，只能取到当前它的对象，而不是取到actionsheet，但小程序里是可以的。。。
@btnclick="handleBtnClick"


this.$emit('actionclick', {
  index: index
});

在外部，小程序里用e.detail.index   ，uni用e.index


使用了npm库的小程序   有个src目录


//替换，，用函数、

小程序 typescript




/////////////////////////////

template解析

两种情况：
* <template is="xxx"></template>
<import src="../../resource/template/activityModule/activityModule.wxml" />
<template is="activityModule" data="{{listName:list,ImgRoot:imgroot}}" ></template>

* <template name="xxx"></template>

解析细节：
0.<template is="xxx"> 当作include标签处理
1.记录<template name="tabBar"> 
2.并且需要记录{{listName:list,ImgRoot:imgroot}}，变量的重名信息，那么...data直接不用处理了。
3.替换掉变量的重名
4.wxparse分开处理


//不支持，is不是静态的
<template is="{{ item.type }}" data="{{ item }}"/>


//这里都不需要特殊操作
<template is="bbgRuleDialog" data="{{...bbgRuleDialog}}" />
<template is="wxaSortPickerItem" data="{{item,dataType}}"/>
<template is="wxaSortPickerTemTags" data="{{wxaSortPickerData}}"/>
<template wx:if="{{setting.is_kefu==1}}" data="{{setting:setting}}" is="kefu_02"></template> 
<template data="{{...authorizeItem}}" is="pop" />


<template is="diyform" data="{{diyform:order}}"></template>
<template  data="{{leftIndex:index+1,section3Title:item.title}}" is="section3TopDescription" />
<template is="head" data="{{title: 'action-sheet'}}" /> 
<template data="{{...item,className:'huadong',canIUse:canIUse}}" is="banner" />
<template data="{{...banginfo,className:'rule data-v-f893cda0',canIUse:canIUse}}" is="navigatorfuli" />
<template data="{{...kaipinglist,className:'ad-content',canIUse:canIUse}}" is="navigator" />
<template data="{{type:'detail',isEnd:false,time:[day,hour,minute,seconds],infos:infos}}" is="activity" />
<template data="{{type:isShowPH?'ph':'list',infos:item}}" is="activity" />
<template is="activityModule" data="{{listName:list,ImgRoot:imgroot}}"></template>
<template is="head" data="{{title: 'open/get/Setting'}}" />


item.type
...bbgRuleDialog

item,dataType

setting:setting

title: 'open/get/Setting'

diyform:order

listName:list,ImgRoot:imgroot


/\w+:.*?,|\w+:.*?$/
type:isShowPH?'ph':'list',infos:item
type:isShowPH?'ph':'list',infos:item?1:2,index:111,ac:"ccc"

type:'detail',isEnd:false,time:[day,hour,minute,seconds],infos:infos

...kaipinglist,className:'ad-content',canIUse:canIUse

leftIndex:index+1,section3Title:item.title


...stdInfo[index], ...{index: index, name: item.name}

/\.\.\.\w.*?,|\.\.\.\w.*?$/
/\.\.\.{.*?}/  --> {$1}


////////////////////////////////////
第一步：
/\.\.\.{.*?}/  --> {$1}
2.
/\.\.\.\w.*?,|\.\.\.\w.*?$/  -->解析

3.
/\w+:.*?,|\w+:.*?$/  拆分

三元表达式拆分？


/////////////////////////////////////////////////////////



wxSearch

template样式文件带入---------------------

小程序自定义tabbar

* qq小程序
* include套娃 测试


抛出一个语法错误
如果您想用babel-code-frame和一个消息抛出一个错误：

export default function({ types: t }) {
  return {
    visitor: {
      StringLiteral(path) {
        throw path.buildCodeFrameError("Error message here");
      }
    }
  };
}
该错误看起来像：

file.js: Error message here
   7 |
   8 | let tips = [
>  9 |   "Click on any AST node with a '+' to expand it",
     |   ^
  10 |
  11 |   "Hovering over a node highlights the \
  12 |    corresponding part in the source code",


VM2429:1 [Vue warn]: Avoid replacing instance root $data. Use nested data properties instead.

export default {
  data() {
    return {
      $data: {
        stickyFlag: false,
        scrollTop: 0,
        overPageNum: 1,
        loadOver: false,
        hasOverGoods: false,
        countDownMap: {},
        actEndMap: {},
        timer: {},
        scrollHeight: 1300,
        stickyTop: 0,
        hasCommingGoods: true
      },
    }
var that = this;
      that.$data = { ...that.$data,
        ...{
          overPageNum: 1,
          loadOver: false,
          hasOverGoods: false,
          countDownMap: {},
          actEndMap: {},
          timer: {}
        }
      }


key $data is reserved  提示：

$data 是vue的变量名。。。。
 that.$data.hasOverGoods = false;


---------------------------------------------------------------------------------
直接scope.rename????????
转换为 $data -->  dataBak



https://ask.dcloud.net.cn/article/37086



QQ 小程序
qs文件 qq标签

qq:if
qq.login

好像小程序转了 uniapp之后  van-datetime-picker， van-area 这些都无法使用啊@No.3389 大佬

