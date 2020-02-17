<template>
<uni-shadow-root class="vant-rate-index"><view class="van-rate custom-class" @touchmove="onTouchMove">
  <view v-for="(item,index) in (count)" :key="item.index" class="van-rate__item" :style="'padding-right: '+(index !== count - 1 ? utils.addUnit(gutter) : '')">
    <van-icon :name="index + 1 <= innerValue ? icon : voidIcon" class="van-rate__icon" :style="'font-size: '+(utils.addUnit(size))" custom-class="icon-class" :data-score="index" :color="disabled ? disabledColor : index + 1 <= innerValue ? color : voidColor" @click="onSelect"></van-icon>

    <van-icon v-if="allowHalf" :name="index + 0.5 <= innerValue ? icon : voidIcon" :class="utils.bem('rate__icon', ['half'])" :style="'font-size: '+(utils.addUnit(size))" custom-class="icon-class" :data-score="index - 0.5" :color="disabled ? disabledColor : index + 0.5 <= innerValue ? color : voidColor" @click="onSelect"></van-icon>
  </view>
</view></uni-shadow-root>
</template>
<wxs src="../wxs/utils.wxs" module="utils"></wxs>
<script>
import VanIcon from '../icon/index.vue'
global['__wxVueOptions'] = {components:{'van-icon': VanIcon}}

global['__wxRoute'] = 'vant/rate/index'
import { VantComponent } from '../common/component';
VantComponent({
    field: true,
    classes: ['icon-class'],
    props: {
        value: {
            type: Number,
            observer(value) {
                if (value !== this.data.innerValue) {
                    this.setData({ innerValue: value });
                }
            }
        },
        readonly: Boolean,
        disabled: Boolean,
        allowHalf: Boolean,
        size: null,
        icon: {
            type: String,
            value: 'star'
        },
        voidIcon: {
            type: String,
            value: 'star-o'
        },
        color: {
            type: String,
            value: '#ffd21e'
        },
        voidColor: {
            type: String,
            value: '#c7c7c7'
        },
        disabledColor: {
            type: String,
            value: '#bdbdbd'
        },
        count: {
            type: Number,
            value: 5
        },
        gutter: null,
        touchable: {
            type: Boolean,
            value: true
        }
    },
    data: {
        innerValue: 0
    },
    methods: {
        onSelect(event) {
            const { data } = this;
            const { score } = event.currentTarget.dataset;
            if (!data.disabled && !data.readonly) {
                this.setData({ innerValue: score + 1 });
                this.$emit('input', score + 1);
                this.$emit('change', score + 1);
            }
        },
        onTouchMove(event) {
            const { touchable } = this.data;
            if (!touchable)
                return;
            const { clientX } = event.touches[0];
            this.getRect('.van-rate__icon', true).then((list) => {
                const target = list
                    .sort(item => item.right - item.left)
                    .find(item => clientX >= item.left && clientX <= item.right);
                if (target != null) {
                    this.onSelect(Object.assign(Object.assign({}, event), { currentTarget: target }));
                }
            });
        }
    }
});
export default global['__wxComponents']['vant/rate/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-rate{display:-webkit-inline-flex;display:inline-flex;-webkit-user-select:none;user-select:none}.van-rate__item{position:relative;padding:0 2px;padding:0 var(--rate-horizontal-padding,2px)}.van-rate__icon{display:block;height:1em;font-size:20px;font-size:var(--rate-icon-size,20px)}.van-rate__icon--half{position:absolute;top:0;width:.5em;overflow:hidden;left:2px;left:var(--rate-horizontal-padding,2px)}
</style>