  
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
* [todo] wx-charts替换   
* [todo] ```<form-id :id="item.id" ></form-id>```
* ```:data = "content"```
* 组件里：behaviors: ['wx://form-field']

* 由二次循环改为三次循环，，需要改保存时机，全部代码保存于内存，统一保存
* 分两步走，，
prop data里有的就重名
wxml有的也重名
函数里使用了也重名

* 标签属性上用了也重名

* prop里有data 生命周期也有data

模板里，所有{{}}内的都提取（去除不含.的和很多点的）
<template is="stdInfo" wx:for="{{stdInfo}}" data="{{...stdInfo[index], ...{index: index, name: item.name} }}"></template>

解析，!= == === ? / % 等切割,存入全局对象，以最前面那个？？？  感觉这里还是有点问题，多层怎么办？

<view class="i-divider i-class" :style="parse.getStyle(color,size,height)">



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



Component({
    options: {
        addGlobalClass: !0
    },
    properties: {
        currentIndex: {
            type: Object,
            value: {}
        },
    },
    lifetimes: {
        detached: function() {
            clearInterval(this.appTimeInterval), this.appTimeInterval = null;
        },
        ready: function() {
            this.getTime();
        }
    },
    appTimeInterval: null,  //这个没转换    
        IntervalTime: null,
            fullScreen: !1,
});


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





????????????????
(0, require("../common/component").VantComponent)({
    props: {
        safeAreaInsetBottom: {
            type: Boolean,
            value: !0
        }
    },
    computed: {
        rootClass: function() {
            var o = this.data, t = o.safeAreaInsetBottom, n = o.isIPhoneX;
            return this.classNames("van-goods-action", "custom-class", e({}, "van-goods-action--safe", n && t));
        }
    }
});

(0, i.VantComponent)({
    mixins: [ e.link, n.button, t.openType ],
    props: {
        text: String,
        loading: Boolean,
        disabled: Boolean,
        type: {
            type: String,
            value: "danger"
        }
    },
    methods: {
        onClick: function(i) {
            this.$emit("click", i.detail), this.jumpLink();
        }
    }
});