<template>
<uni-shadow-root class="vant-slider-index"><view :class="'custom-class '+(utils.bem('slider', { disabled }))" :style="inactiveColor ? 'background:' + inactiveColor : ''" @click="onClick">
  <view class="van-slider__bar" :style="(barStyle)+'; '+(activeColor ? 'background:' + activeColor : '')">
    <view class="van-slider__button-wrapper" @touchstart="onTouchStart" @touchmove.stop.prevent="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchEnd">
      <slot v-if="useButtonSlot" name="button"></slot>
      <view v-else class="van-slider__button"></view>
    </view>
  </view>
</view></uni-shadow-root>
</template>
<wxs src="../wxs/utils.wxs" module="utils"></wxs>
<script>

global['__wxRoute'] = 'vant/slider/index'
import { VantComponent } from '../common/component';
import { touch } from '../mixins/touch';
import { addUnit } from '../common/utils';
VantComponent({
    mixins: [touch],
    props: {
        disabled: Boolean,
        useButtonSlot: Boolean,
        activeColor: String,
        inactiveColor: String,
        max: {
            type: Number,
            value: 100
        },
        min: {
            type: Number,
            value: 0
        },
        step: {
            type: Number,
            value: 1
        },
        value: {
            type: Number,
            value: 0,
            observer(value) {
                this.updateValue(value, false);
            }
        },
        barHeight: {
            type: null,
            value: '2px'
        }
    },
    created() {
        this.updateValue(this.data.value);
    },
    methods: {
        onTouchStart(event) {
            if (this.data.disabled)
                return;
            this.touchStart(event);
            this.startValue = this.format(this.data.value);
            this.dragStatus = 'start';
        },
        onTouchMove(event) {
            if (this.data.disabled)
                return;
            if (this.dragStatus === 'start') {
                this.$emit('drag-start');
            }
            this.touchMove(event);
            this.dragStatus = 'draging';
            this.getRect('.van-slider').then((rect) => {
                const diff = (this.deltaX / rect.width) * 100;
                this.newValue = this.startValue + diff;
                this.updateValue(this.newValue, false, true);
            });
        },
        onTouchEnd() {
            if (this.data.disabled)
                return;
            if (this.dragStatus === 'draging') {
                this.updateValue(this.newValue, true);
                this.$emit('drag-end');
            }
        },
        onClick(event) {
            if (this.data.disabled)
                return;
            const { min } = this.data;
            this.getRect('.van-slider').then((rect) => {
                const value = ((event.detail.x - rect.left) / rect.width) * this.getRange() + min;
                this.updateValue(value, true);
            });
        },
        updateValue(value, end, drag) {
            value = this.format(value);
            const { barHeight, min } = this.data;
            const width = `${((value - min) * 100) / this.getRange()}%`;
            this.setData({
                value,
                barStyle: `
          width: ${width};
          height: ${addUnit(barHeight)};
          ${drag ? 'transition: none;' : ''}
        `,
            });
            if (drag) {
                this.$emit('drag', { value });
            }
            if (end) {
                this.$emit('change', value);
            }
        },
        getRange() {
            const { max, min } = this.data;
            return max - min;
        },
        format(value) {
            const { max, min, step } = this.data;
            return Math.round(Math.max(min, Math.min(value, max)) / step) * step;
        }
    }
});
export default global['__wxComponents']['vant/slider/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-slider{position:relative;border-radius:999px;border-radius:var(--border-radius-max,999px);background-color:#ebedf0;background-color:var(--slider-inactive-background-color,#ebedf0)}.van-slider:before{position:absolute;right:0;left:0;content:"";top:-8px;top:-var(--padding-xs,8px);bottom:-8px;bottom:-var(--padding-xs,8px)}.van-slider__bar{position:relative;border-radius:inherit;transition:width .2s;transition:width var(--animation-duration-fast,.2s);background-color:#1989fa;background-color:var(--slider-active-background-color,#1989fa)}.van-slider__button{width:24px;height:24px;border-radius:50%;box-shadow:0 1px 2px rgba(0,0,0,.5);background-color:#fff;background-color:var(--slider-button-background-color,#fff)}.van-slider__button-wrapper{position:absolute;top:50%;right:0;-webkit-transform:translate3d(50%,-50%,0);transform:translate3d(50%,-50%,0)}.van-slider--disabled{opacity:.5}
</style>