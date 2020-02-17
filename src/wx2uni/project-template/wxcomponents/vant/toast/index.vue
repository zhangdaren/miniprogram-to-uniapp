<template>
<uni-shadow-root class="vant-toast-index"><van-overlay v-if="mask || forbidClick" :show="show" :z-index="zIndex" :custom-style="mask ? '' : 'background-color: transparent;'"></van-overlay>
<van-transition :show="show" :custom-style="'z-index: '+(zIndex)" custom-class="van-toast__container">
  <view :class="'van-toast van-toast--'+(type === 'text' ? 'text' : 'icon')+' van-toast--'+(position)" @touchmove.stop.prevent="noop">
    
    <text v-if="type === 'text'">{{ message }}</text>

    
    <block v-else>
      <van-loading v-if="type === 'loading'" color="white" :type="loadingType" custom-class="van-toast__loading"></van-loading>
      <van-icon v-else class="van-toast__icon" :name="type"></van-icon>
      <text v-if="message" class="van-toast__text">{{ message }}</text>
    </block>

    <slot></slot>
  </view>
</van-transition></uni-shadow-root>
</template>

<script>
import VanIcon from '../icon/index.vue'
import VanLoading from '../loading/index.vue'
import VanOverlay from '../overlay/index.vue'
import VanTransition from '../transition/index.vue'
global['__wxVueOptions'] = {components:{'van-icon': VanIcon,'van-loading': VanLoading,'van-overlay': VanOverlay,'van-transition': VanTransition}}

global['__wxRoute'] = 'vant/toast/index'
import { VantComponent } from '../common/component';
VantComponent({
    props: {
        show: Boolean,
        mask: Boolean,
        message: String,
        forbidClick: Boolean,
        zIndex: {
            type: Number,
            value: 1000
        },
        type: {
            type: String,
            value: 'text'
        },
        loadingType: {
            type: String,
            value: 'circular'
        },
        position: {
            type: String,
            value: 'middle'
        }
    },
    methods: {
        // for prevent touchmove
        noop() { }
    }
});
export default global['__wxComponents']['vant/toast/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-toast{display:-webkit-flex;display:flex;-webkit-flex-direction:column;flex-direction:column;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;box-sizing:initial;color:#fff;color:var(--toast-text-color,#fff);font-size:14px;font-size:var(--toast-font-size,14px);line-height:20px;line-height:var(--toast-line-height,20px);white-space:pre-wrap;word-wrap:break-word;background-color:rgba(50,50,51,.88);background-color:var(--toast-background-color,rgba(50,50,51,.88));border-radius:4px;border-radius:var(--toast-border-radius,4px)}.van-toast__container{position:fixed;top:50%;left:50%;width:-webkit-fit-content;width:fit-content;-webkit-transform:translate(-50%,-50%);transform:translate(-50%,-50%);max-width:70%;max-width:var(--toast-max-width,70%)}.van-toast--text{min-width:96px;min-width:var(--toast-text-min-width,96px);padding:8px 12px;padding:var(--toast-text-padding,8px 12px)}.van-toast--icon{width:90px;width:var(--toast-default-width,90px);min-height:90px;min-height:var(--toast-default-min-height,90px);padding:16px;padding:var(--toast-default-padding,16px)}.van-toast--icon .van-toast__icon{font-size:48px;font-size:var(--toast-icon-size,48px)}.van-toast--icon .van-toast__text{padding-top:8px}.van-toast__loading{margin:10px 0}.van-toast--top{-webkit-transform:translateY(-30vh);transform:translateY(-30vh)}.van-toast--bottom{-webkit-transform:translateY(30vh);transform:translateY(30vh)}
</style>