import Vue from 'vue'
import App from './App'

Vue.config.productionTip = false

App.mpType = 'app'

//这里将globalData挂载到vue的原型上，
//解决其他页面globalData引用不到的问题，后面考虑使用vuex来实现。
Vue.prototype.globalData = {}

const app = new Vue({
    ...App
})
app.$mount()
