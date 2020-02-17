<template>
<uni-shadow-root class="vant-notify-index"><van-transition name="slide-down" :show="show" custom-class="van-notify__container" :custom-style="'z-index: '+(zIndex)+';'" @click.native="onTap">
  <view :class="'van-notify van-notify--'+(type)" :style="'background:'+(background)+';color:'+(color)+';'">
    <view v-if="safeAreaInsetTop" :style="'height: '+(statusBarHeight)+'px'"></view>
    <text>{{ message }}</text>
  </view>
</van-transition></uni-shadow-root>
</template>

<script>
import VanTransition from '../transition/index.vue'
global['__wxVueOptions'] = {components:{'van-transition': VanTransition}}

global['__wxRoute'] = 'vant/notify/index'
import { VantComponent } from '../common/component';
import { WHITE } from '../common/color';
VantComponent({
    props: {
        message: String,
        background: String,
        type: {
            type: String,
            value: 'danger'
        },
        color: {
            type: String,
            value: WHITE
        },
        duration: {
            type: Number,
            value: 3000
        },
        zIndex: {
            type: Number,
            value: 110
        },
        safeAreaInsetTop: {
            type: Boolean,
            value: false
        }
    },
    created() {
        const { statusBarHeight } = wx.getSystemInfoSync();
        this.setData({ statusBarHeight });
    },
    methods: {
        showNotify() {
            const { duration, onOpened } = this.data;
            clearTimeout(this.timer);
            this.setData({ show: true });
            wx.nextTick(onOpened);
            if (duration > 0 && duration !== Infinity) {
                this.timer = setTimeout(() => {
                    this.hide();
                }, duration);
            }
        },
        hide() {
            const { onClose } = this.data;
            clearTimeout(this.timer);
            this.setData({ show: false });
            wx.nextTick(onClose);
        },
        onTap(event) {
            const { onClick } = this.data;
            if (onClick) {
                onClick(event.detail);
            }
        }
    }
});
export default global['__wxComponents']['vant/notify/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-notify{text-align:center;word-wrap:break-word;padding:6px 15px;padding:var(--notify-padding,6px 15px);font-size:14px;font-size:var(--notify-font-size,14px);line-height:20px;line-height:var(--notify-line-height,20px)}.van-notify__container{position:fixed;top:0;box-sizing:border-box;width:100%}.van-notify--primary{background-color:#1989fa;background-color:var(--notify-primary-background-color,#1989fa)}.van-notify--success{background-color:#07c160;background-color:var(--notify-success-background-color,#07c160)}.van-notify--danger{background-color:#ee0a24;background-color:var(--notify-danger-background-color,#ee0a24)}.van-notify--warning{background-color:#ff976a;background-color:var(--notify-warning-background-color,#ff976a)}
</style>