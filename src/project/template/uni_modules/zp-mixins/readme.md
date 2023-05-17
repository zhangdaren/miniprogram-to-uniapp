# zp-mixins
本插件，基本无法单独使用。

为方便miniprogram-to-uniapp(小程序转uniapp项目)工具后续升级，特单独摘出做成插件，便于后续更新。


注意：

1.本插件仅限于miniprogram-to-uniapp(小程序转uni-app项目)转换工具使用，

2.如果是新项目或uni-app项目，建议还是使用vue/uni-app它自身支持的方式实现，效率更高些。

3.目前仅支持vue2/vue3的options写法。至于setup，因其天生弱化mixin，也无this，建议直接import导入按需使用吧~

# 安装

点击右侧 “使用 HBuilderX 导入插件” 按钮，并选择对应项目。

# 使用

在main.js文件里面增加引用，即可全局使用这些函数，如下所示：


```
import App from './App'

// 添加zpMixins
import zpMixins from '@/uni_modules/zp-mixins/index.js'

// #ifndef VUE3
import Vue from 'vue'

Vue.use(zpMixins)

Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
    ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  app.mixin(zpMixins)
  return {
    app
  }
}
// #endif
```

注意：vue3项目仅支持Options API方式(setup API写法有点不同，不支持这种方式使用，建议直接通过import引入使用)。

# 功能介绍

## pageLifetimes(组件所在页面的生命周期)
处理组件里的pageLifetimes

## clone(深拷贝)
深拷贝的简单版本，未处理循环引用。

## handleDataset
用于处理dataset

在自定义组件的事件里，是获取不到e.currentTarget.dataset的

因此收集data-参数，手动传进去

## html2Escape 普通字符转换成转义符
用于替换wxParse为mp-html时使用

## escape2Html 转义符换成普通字符
暂未用上

## parseEventDynamicCode
解析事件里的动态函数名，这种没有()的函数名，在uniapp不被执行

比如：<view bindtap="{{openId==undefined?'denglu':'hy_to'}}">立即</view>

## getTabBar
实现小程序自定义组件的this.getTabBar().setData()函数

## getRelationNodes
获取组件间关系this.getRelationNodes()

注意：

1.须与p-f-unicom配合使用！

2.并不能与小程序的getRelationNodes相提并论，因为底层实现不一样

## selectComponent
## selectAllComponents
抹平各平台差异，实现类似于小程序的selectComponent和selectAllComponents函数。

使用方式与小程序一致。

注：新项目建议还是使用ref这种方式，获取组件实例。

## setData
1.实现setData函数，让uni-app也能支持使用setData函数。
2.实现微信“简易双向绑定”

注意：本函数仅为小程序转换uniapp项目所作的支撑，如uni-app项目里，最好还是使用this.xx这种方式。
