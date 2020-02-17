<template>
<uni-shadow-root class="vant-tag-index"><view :class="'custom-class '+(utils.bem('tag', [type, size, { mark, plain, round }]))+' '+(plain ? 'van-hairline--surround' : '')" :style="(color && !plain ? 'background-color: ' + color + ';' : '')+(textColor || (color && plain) ? 'color: ' + (textColor || color) : '')">
  <slot></slot>
  <van-icon v-if="closeable" name="cross" custom-class="van-tag__close" @click="onClose"></van-icon>
</view></uni-shadow-root>
</template>
<wxs src="../wxs/utils.wxs" module="utils"></wxs>
<script>
import VanIcon from '../icon/index.vue'
global['__wxVueOptions'] = {components:{'van-icon': VanIcon}}

global['__wxRoute'] = 'vant/tag/index'
import { VantComponent } from '../common/component';
VantComponent({
    props: {
        size: String,
        mark: Boolean,
        color: String,
        plain: Boolean,
        round: Boolean,
        textColor: String,
        type: {
            type: String,
            value: 'default'
        },
        closeable: Boolean
    },
    methods: {
        onClose() {
            this.$emit('close');
        }
    }
});
export default global['__wxComponents']['vant/tag/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-tag{display:-webkit-inline-flex;display:inline-flex;-webkit-align-items:center;align-items:center;line-height:normal;padding:.2em .5em;padding:var(--tag-padding,.2em .5em);color:#fff;color:var(--tag-text-color,#fff);font-size:10px;font-size:var(--tag-font-size,10px);border-radius:.2em;border-radius:var(--tag-border-radius,.2em)}.van-tag:after{border-color:currentColor;border-radius:.2em * 2;border-radius:var(--tag-border-radius,.2em) * 2}.van-tag--default{background-color:#969799;background-color:var(--tag-default-color,#969799)}.van-tag--default.van-tag--plain{color:#969799;color:var(--tag-default-color,#969799)}.van-tag--danger{background-color:#ee0a24;background-color:var(--tag-dander-color,#ee0a24)}.van-tag--danger.van-tag--plain{color:#ee0a24;color:var(--tag-dander-color,#ee0a24)}.van-tag--primary{background-color:#1989fa;background-color:var(--tag-primary-color,#1989fa)}.van-tag--primary.van-tag--plain{color:#1989fa;color:var(--tag-primary-color,#1989fa)}.van-tag--success{background-color:#07c160;background-color:var(--tag-success-color,#07c160)}.van-tag--success.van-tag--plain{color:#07c160;color:var(--tag-success-color,#07c160)}.van-tag--warning{background-color:#ff976a;background-color:var(--tag-warning-color,#ff976a)}.van-tag--warning.van-tag--plain{color:#ff976a;color:var(--tag-warning-color,#ff976a)}.van-tag--plain{background-color:#fff;background-color:var(--tag-plain-background-color,#fff)}.van-tag--mark{padding-right:.7em}.van-tag--mark,.van-tag--mark:after{border-radius:0 999px 999px 0;border-radius:0 var(--tag-round-border-radius,999px) var(--tag-round-border-radius,999px) 0}.van-tag--round,.van-tag--round:after{border-radius:999px;border-radius:var(--tag-round-border-radius,999px)}.van-tag--medium{font-size:12px;font-size:var(--tag-medium-font-size,12px)}.van-tag--large{font-size:14px;font-size:var(--tag-large-font-size,14px)}.van-tag__close{margin-left:2px}
</style>