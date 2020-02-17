<template>
<uni-shadow-root class="vant-cell-index"><view :class="'custom-class '+(utils.bem('cell', [size, { center, required, borderless: !border, clickable: isLink || clickable }]))" hover-class="van-cell--hover hover-class" hover-stay-time="70" :style="customStyle" @click="onClick">
  <van-icon v-if="icon" :name="icon" class="van-cell__left-icon-wrap" custom-class="van-cell__left-icon"></van-icon>
  <slot v-else name="icon"></slot>

  <view :style="titleWidth ? 'max-width:' + titleWidth + ';min-width:' + titleWidth : ''" class="van-cell__title title-class">
    <block v-if="title">{{ title }}</block>
    <slot v-else name="title"></slot>

    <view v-if="label || useLabelSlot" class="van-cell__label label-class">
      <slot v-if="useLabelSlot" name="label"></slot>
      <block v-else-if="label">{{ label }}</block>
    </view>
  </view>

  <view class="van-cell__value value-class">
    <block v-if="value || value === 0">{{ value }}</block>
    <slot v-else></slot>
  </view>

  <van-icon v-if="isLink" :name="arrowDirection ? 'arrow' + '-' + arrowDirection : 'arrow'" class="van-cell__right-icon-wrap right-icon-class" custom-class="van-cell__right-icon"></van-icon>
  <slot v-else name="right-icon"></slot>

  <slot name="extra"></slot>
</view></uni-shadow-root>
</template>
<wxs src="../wxs/utils.wxs" module="utils"></wxs>
<script>
import VanIcon from '../icon/index.vue'
global['__wxVueOptions'] = {components:{'van-icon': VanIcon}}

global['__wxRoute'] = 'vant/cell/index'
import { link } from '../mixins/link';
import { VantComponent } from '../common/component';
VantComponent({
    classes: [
        'title-class',
        'label-class',
        'value-class',
        'right-icon-class',
        'hover-class'
    ],
    mixins: [link],
    props: {
        title: null,
        value: null,
        icon: String,
        size: String,
        label: String,
        center: Boolean,
        isLink: Boolean,
        required: Boolean,
        clickable: Boolean,
        titleWidth: String,
        customStyle: String,
        arrowDirection: String,
        useLabelSlot: Boolean,
        border: {
            type: Boolean,
            value: true
        }
    },
    methods: {
        onClick(event) {
            this.$emit('click', event.detail);
            this.jumpLink();
        }
    }
});
export default global['__wxComponents']['vant/cell/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-cell{position:relative;display:-webkit-flex;display:flex;box-sizing:border-box;width:100%;padding:10px 16px;padding:var(--cell-vertical-padding,10px) var(--cell-horizontal-padding,16px);font-size:14px;font-size:var(--cell-font-size,14px);line-height:24px;line-height:var(--cell-line-height,24px);color:#323233;color:var(--cell-text-color,#323233);background-color:#fff;background-color:var(--cell-background-color,#fff)}.van-cell:after{position:absolute;box-sizing:border-box;-webkit-transform-origin:center;transform-origin:center;content:" ";pointer-events:none;top:auto;right:0;bottom:0;left:16px;border-bottom:1px solid #ebedf0;-webkit-transform:scaleY(.5);transform:scaleY(.5)}.van-cell--borderless:after{display:none}.van-cell-group{background-color:#fff;background-color:var(--cell-background-color,#fff)}.van-cell__label{margin-top:3px;margin-top:var(--cell-label-margin-top,3px);font-size:12px;font-size:var(--cell-label-font-size,12px);line-height:18px;line-height:var(--cell-label-line-height,18px);color:#969799;color:var(--cell-label-color,#969799)}.van-cell__value{overflow:hidden;text-align:right;vertical-align:middle;color:#969799;color:var(--cell-value-color,#969799)}.van-cell__title,.van-cell__value{-webkit-flex:1;flex:1}.van-cell__title:empty,.van-cell__value:empty{display:none}.van-cell__left-icon-wrap,.van-cell__right-icon-wrap{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;height:24px;height:var(--cell-line-height,24px);font-size:16px;font-size:var(--cell-icon-size,16px)}.van-cell__left-icon-wrap{margin-right:5px}.van-cell__right-icon-wrap{margin-left:5px;color:#969799;color:var(--cell-right-icon-color,#969799)}.van-cell__left-icon{vertical-align:middle}.van-cell__left-icon,.van-cell__right-icon{line-height:24px;line-height:var(--cell-line-height,24px)}.van-cell--clickable.van-cell--hover{background-color:#f2f3f5;background-color:var(--cell-active-color,#f2f3f5)}.van-cell--required{overflow:visible}.van-cell--required:before{position:absolute;content:"*";left:8px;left:var(--padding-xs,8px);font-size:14px;font-size:var(--cell-font-size,14px);color:#ee0a24;color:var(--cell-required-color,#ee0a24)}.van-cell--center{-webkit-align-items:center;align-items:center}.van-cell--large{padding-top:12px;padding-top:var(--cell-large-vertical-padding,12px);padding-bottom:12px;padding-bottom:var(--cell-large-vertical-padding,12px)}.van-cell--large .van-cell__title{font-size:16px;font-size:var(--cell-large-title-font-size,16px)}.van-cell--large .van-cell__label{font-size:14px;font-size:var(--cell-large-label-font-size,14px)}
</style>