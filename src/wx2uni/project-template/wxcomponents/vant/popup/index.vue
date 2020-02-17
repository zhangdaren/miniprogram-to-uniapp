<template>
<uni-shadow-root class="vant-popup-index"><van-overlay v-if="overlay" :show="show" :z-index="zIndex" :custom-style="overlayStyle" :duration="duration" @click="onClickOverlay"></van-overlay>
<view v-if="inited" :class="'custom-class '+(classes)+' '+(utils.bem('popup', [position, { round, safe: safeAreaInsetBottom, safeTop: safeAreaInsetTop }]))" :style="'z-index: '+(zIndex)+'; -webkit-transition-duration:'+(currentDuration)+'ms; transition-duration:'+(currentDuration)+'ms; '+(display ? '' : 'display: none;')+';'+(customStyle)" @transitionend="onTransitionEnd">
  <slot></slot>
  <van-icon v-if="closeable" :name="closeIcon" :class="'van-popup__close-icon van-popup__close-icon--'+(closeIconPosition)" @click.native="onClickCloseIcon"></van-icon>
</view></uni-shadow-root>
</template>
<wxs src="../wxs/utils.wxs" module="utils"></wxs>
<script>
import VanIcon from '../icon/index.vue'
import VanOverlay from '../overlay/index.vue'
global['__wxVueOptions'] = {components:{'van-icon': VanIcon,'van-overlay': VanOverlay}}

global['__wxRoute'] = 'vant/popup/index'
import { VantComponent } from '../common/component';
import { transition } from '../mixins/transition';
VantComponent({
    classes: [
        'enter-class',
        'enter-active-class',
        'enter-to-class',
        'leave-class',
        'leave-active-class',
        'leave-to-class'
    ],
    mixins: [transition(false)],
    props: {
        round: Boolean,
        closeable: Boolean,
        customStyle: String,
        overlayStyle: String,
        transition: {
            type: String,
            observer: 'observeClass'
        },
        zIndex: {
            type: Number,
            value: 100
        },
        overlay: {
            type: Boolean,
            value: true
        },
        closeIcon: {
            type: String,
            value: 'cross'
        },
        closeIconPosition: {
            type: String,
            value: 'top-right'
        },
        closeOnClickOverlay: {
            type: Boolean,
            value: true
        },
        position: {
            type: String,
            value: 'center',
            observer: 'observeClass'
        },
        safeAreaInsetBottom: {
            type: Boolean,
            value: true
        },
        safeAreaInsetTop: {
            type: Boolean,
            value: false
        }
    },
    created() {
        this.observeClass();
    },
    methods: {
        onClickCloseIcon() {
            this.$emit('close');
        },
        onClickOverlay() {
            this.$emit('click-overlay');
            if (this.data.closeOnClickOverlay) {
                this.$emit('close');
            }
        },
        observeClass() {
            const { transition, position } = this.data;
            const updateData = {
                name: transition || position
            };
            if (transition === 'none') {
                updateData.duration = 0;
            }
            this.setData(updateData);
        }
    }
});
export default global['__wxComponents']['vant/popup/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-popup{position:fixed;box-sizing:border-box;max-height:100%;overflow-y:auto;transition-timing-function:ease;-webkit-animation:ease both;animation:ease both;-webkit-overflow-scrolling:touch;background-color:#fff;background-color:var(--popup-background-color,#fff)}.van-popup--center{top:50%;left:50%;-webkit-transform:translate3d(-50%,-50%,0);transform:translate3d(-50%,-50%,0)}.van-popup--center.van-popup--round{border-radius:20px;border-radius:var(--popup-round-border-radius,20px)}.van-popup--top{top:0;left:0;width:100%}.van-popup--top.van-popup--round{border-radius:0 0 20px 20px;border-radius:0 0 var(--popup-round-border-radius,20px) var(--popup-round-border-radius,20px)}.van-popup--right{top:50%;right:0;-webkit-transform:translate3d(0,-50%,0);transform:translate3d(0,-50%,0)}.van-popup--right.van-popup--round{border-radius:20px 0 0 20px;border-radius:var(--popup-round-border-radius,20px) 0 0 var(--popup-round-border-radius,20px)}.van-popup--bottom{bottom:0;left:0;width:100%}.van-popup--bottom.van-popup--round{border-radius:20px 20px 0 0;border-radius:var(--popup-round-border-radius,20px) var(--popup-round-border-radius,20px) 0 0}.van-popup--left{top:50%;left:0;-webkit-transform:translate3d(0,-50%,0);transform:translate3d(0,-50%,0)}.van-popup--left.van-popup--round{border-radius:0 20px 20px 0;border-radius:0 var(--popup-round-border-radius,20px) var(--popup-round-border-radius,20px) 0}.van-popup--bottom.van-popup--safe{padding-bottom:env(safe-area-inset-bottom)}.van-popup--safeTop{padding-top:env(safe-area-inset-top)}.van-popup__close-icon{position:absolute;z-index:1;z-index:var(--popup-close-icon-z-index,1);color:#969799;color:var(--popup-close-icon-color,#969799);font-size:18px;font-size:var(--popup-close-icon-size,18px)}.van-popup__close-icon--top-left{top:16px;top:var(--popup-close-icon-margin,16px);left:16px;left:var(--popup-close-icon-margin,16px)}.van-popup__close-icon--top-right{top:16px;top:var(--popup-close-icon-margin,16px);right:16px;right:var(--popup-close-icon-margin,16px)}.van-popup__close-icon--bottom-left{bottom:16px;bottom:var(--popup-close-icon-margin,16px);left:16px;left:var(--popup-close-icon-margin,16px)}.van-popup__close-icon--bottom-right{right:16px;right:var(--popup-close-icon-margin,16px);bottom:16px;bottom:var(--popup-close-icon-margin,16px)}.van-popup__close-icon:active{opacity:.6}.van-scale-enter-active,.van-scale-leave-active{transition-property:opacity,-webkit-transform;transition-property:opacity,transform;transition-property:opacity,transform,-webkit-transform}.van-scale-enter,.van-scale-leave-to{-webkit-transform:translate3d(-50%,-50%,0) scale(.7);transform:translate3d(-50%,-50%,0) scale(.7);opacity:0}.van-fade-enter-active,.van-fade-leave-active{transition-property:opacity}.van-fade-enter,.van-fade-leave-to{opacity:0}.van-center-enter-active,.van-center-leave-active{transition-property:opacity}.van-center-enter,.van-center-leave-to{opacity:0}.van-bottom-enter-active,.van-bottom-leave-active,.van-left-enter-active,.van-left-leave-active,.van-right-enter-active,.van-right-leave-active,.van-top-enter-active,.van-top-leave-active{transition-property:-webkit-transform;transition-property:transform;transition-property:transform,-webkit-transform}.van-bottom-enter,.van-bottom-leave-to{-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0)}.van-top-enter,.van-top-leave-to{-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0)}.van-left-enter,.van-left-leave-to{-webkit-transform:translate3d(-100%,-50%,0);transform:translate3d(-100%,-50%,0)}.van-right-enter,.van-right-leave-to{-webkit-transform:translate3d(100%,-50%,0);transform:translate3d(100%,-50%,0)}
</style>