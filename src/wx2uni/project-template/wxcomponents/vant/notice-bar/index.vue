<template>
<uni-shadow-root class="vant-notice-bar-index"><view v-if="show" :class="'custom-class '+(utils.bem('notice-bar', { withicon: mode, wrapable }))" :style="'color: '+(color)+'; background-color: '+(backgroundColor)+';'" @click="onClick">
  <van-icon v-if="leftIcon" size="16px" :name="leftIcon" class="van-notice-bar__left-icon"></van-icon>
  <slot v-else name="left-icon"></slot>

  <view class="van-notice-bar__wrap">
    <view :class="'van-notice-bar__content '+(!scrollable && !wrapable ? 'van-ellipsis' : '')" :animation="animationData">
      {{ text }}
    </view>
  </view>

  <van-icon v-if="mode === 'closeable'" class="van-notice-bar__right-icon" name="cross" @click.native.stop.prevent="onClickIcon"></van-icon>
  <navigator v-else-if="mode === 'link'" :url="url" :open-type="openType">
    <van-icon class="van-notice-bar__right-icon" name="arrow"></van-icon>
  </navigator>
  <slot v-else name="right-icon"></slot>
</view></uni-shadow-root>
</template>
<wxs src="../wxs/utils.wxs" module="utils"></wxs>
<script>
import VanIcon from '../icon/index.vue'
global['__wxVueOptions'] = {components:{'van-icon': VanIcon}}

global['__wxRoute'] = 'vant/notice-bar/index'
import { VantComponent } from '../common/component';
const FONT_COLOR = '#ed6a0c';
const BG_COLOR = '#fffbe8';
VantComponent({
    props: {
        text: {
            type: String,
            value: '',
            observer() {
                wx.nextTick(() => {
                    this.init();
                });
            },
        },
        mode: {
            type: String,
            value: ''
        },
        url: {
            type: String,
            value: ''
        },
        openType: {
            type: String,
            value: 'navigate'
        },
        delay: {
            type: Number,
            value: 1
        },
        speed: {
            type: Number,
            value: 50,
            observer() {
                wx.nextTick(() => {
                    this.init();
                });
            }
        },
        scrollable: {
            type: Boolean,
            value: true
        },
        leftIcon: {
            type: String,
            value: ''
        },
        color: {
            type: String,
            value: FONT_COLOR
        },
        backgroundColor: {
            type: String,
            value: BG_COLOR
        },
        wrapable: Boolean
    },
    data: {
        show: true
    },
    created() {
        this.resetAnimation = wx.createAnimation({
            duration: 0,
            timingFunction: 'linear'
        });
    },
    destroyed() {
        this.timer && clearTimeout(this.timer);
    },
    methods: {
        init() {
            Promise.all([
                this.getRect('.van-notice-bar__content'),
                this.getRect('.van-notice-bar__wrap')
            ]).then((rects) => {
                const [contentRect, wrapRect] = rects;
                if (contentRect == null ||
                    wrapRect == null ||
                    !contentRect.width ||
                    !wrapRect.width) {
                    return;
                }
                const { speed, scrollable, delay } = this.data;
                if (scrollable && wrapRect.width < contentRect.width) {
                    const duration = (contentRect.width / speed) * 1000;
                    this.wrapWidth = wrapRect.width;
                    this.contentWidth = contentRect.width;
                    this.duration = duration;
                    this.animation = wx.createAnimation({
                        duration,
                        timingFunction: 'linear',
                        delay
                    });
                    this.scroll();
                }
            });
        },
        scroll() {
            this.timer && clearTimeout(this.timer);
            this.timer = null;
            this.setData({
                animationData: this.resetAnimation
                    .translateX(this.wrapWidth)
                    .step()
                    .export()
            });
            setTimeout(() => {
                this.setData({
                    animationData: this.animation
                        .translateX(-this.contentWidth)
                        .step()
                        .export()
                });
            }, 20);
            this.timer = setTimeout(() => {
                this.scroll();
            }, this.duration);
        },
        onClickIcon() {
            this.timer && clearTimeout(this.timer);
            this.timer = null;
            this.setData({ show: false });
        },
        onClick(event) {
            this.$emit('click', event);
        }
    }
});
export default global['__wxComponents']['vant/notice-bar/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-notice-bar{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;height:40px;height:var(--notice-bar-height,40px);padding:0 16px;padding:var(--notice-bar-padding,0 16px);font-size:14px;font-size:var(--notice-bar-font-size,14px);color:#ed6a0c;color:var(--notice-bar-text-color,#ed6a0c);line-height:24px;line-height:var(--notice-bar-line-height,24px);background-color:#fffbe8;background-color:var(--notice-bar-background-color,#fffbe8)}.van-notice-bar--withicon{position:relative;padding-right:40px}.van-notice-bar--wrapable{height:auto;padding:8px 16px;padding:var(--notice-bar-wrapable-padding,8px 16px)}.van-notice-bar--wrapable .van-notice-bar__wrap{height:auto}.van-notice-bar--wrapable .van-notice-bar__content{position:relative;white-space:normal}.van-notice-bar__left-icon{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;margin-right:4px;vertical-align:middle}.van-notice-bar__left-icon,.van-notice-bar__right-icon{font-size:16px;font-size:var(--notice-bar-icon-size,16px);min-width:22px;min-width:var(--notice-bar-icon-min-width,22px)}.van-notice-bar__right-icon{position:absolute;top:10px;right:15px}.van-notice-bar__wrap{position:relative;-webkit-flex:1;flex:1;overflow:hidden;height:24px;height:var(--notice-bar-line-height,24px)}.van-notice-bar__content{position:absolute;white-space:nowrap}.van-notice-bar__content.van-ellipsis{max-width:100%}
</style>