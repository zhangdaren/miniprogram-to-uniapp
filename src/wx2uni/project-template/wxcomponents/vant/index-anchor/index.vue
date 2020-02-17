<template>
<uni-shadow-root class="vant-index-anchor-index"><view class="van-index-anchor-wrapper" :style="wrapperStyle">
  <view :class="'van-index-anchor '+(active ? 'van-index-anchor--active van-hairline--bottom' : '')" :style="anchorStyle">
    <slot v-if="useSlot"></slot>
    <block v-else>
      <text>{{ index }}</text>
    </block>
  </view>
</view></uni-shadow-root>
</template>

<script>

global['__wxRoute'] = 'vant/index-anchor/index'
import { VantComponent } from '../common/component';
VantComponent({
    relation: {
        name: 'index-bar',
        type: 'ancestor',
        linked(target) {
            this.parent = target;
        },
        unlinked() {
            this.parent = null;
        }
    },
    props: {
        useSlot: Boolean,
        index: null
    },
    data: {
        active: false,
        wrapperStyle: '',
        anchorStyle: ''
    }
});
export default global['__wxComponents']['vant/index-anchor/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-index-anchor{padding:0 16px;padding:var(--index-anchor-padding,0 16px);color:#323233;color:var(--index-anchor-text-color,#323233);font-weight:500;font-weight:var(--index-anchor-font-weight,500);font-size:14px;font-size:var(--index-anchor-font-size,14px);line-height:32px;line-height:var(--index-anchor-line-height,32px);background-color:initial;background-color:var(--index-anchor-background-color,transparent)}.van-index-anchor--active{right:0;left:0;color:#07c160;color:var(--index-anchor-active-text-color,#07c160);background-color:#fff;background-color:var(--index-anchor-active-background-color,#fff)}
</style>