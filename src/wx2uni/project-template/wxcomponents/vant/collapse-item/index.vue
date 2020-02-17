<template>
<uni-shadow-root class="vant-collapse-item-index"><view :class="'van-collapse-item custom-class '+(index !== 0 ? 'van-hairline--top' : '')">
  <van-cell :title="title" title-class="title-class" :icon="icon" :value="value" :label="label" :is-link="isLink" :clickable="clickable" :border="border && expanded" :class="utils.bem('collapse-item__title', { disabled, expanded })" right-icon-class="van-cell__right-icon" custom-class="van-cell" hover-class="van-cell--hover" @click="onClick">
    <slot name="title" slot="title"></slot>
    <slot name="icon" slot="icon"></slot>
    <slot name="value"></slot>
    <slot name="right-icon" slot="right-icon"></slot>
  </van-cell>
  <view :class="utils.bem('collapse-item__wrapper', { transition })" :style="'height: '+(contentHeight)+';'" @transitionend="onTransitionEnd">
    <view class="van-collapse-item__content content-class">
      <slot></slot>
    </view>
  </view>
</view></uni-shadow-root>
</template>
<wxs src="../wxs/utils.wxs" module="utils"></wxs>
<script>
import VanCell from '../cell/index.vue'
global['__wxVueOptions'] = {components:{'van-cell': VanCell}}

global['__wxRoute'] = 'vant/collapse-item/index'
import { VantComponent } from '../common/component';
const nextTick = () => new Promise(resolve => setTimeout(resolve, 20));
VantComponent({
    classes: ['title-class', 'content-class'],
    relation: {
        name: 'collapse',
        type: 'ancestor',
        linked(parent) {
            this.parent = parent;
        }
    },
    props: {
        name: null,
        title: null,
        value: null,
        icon: String,
        label: String,
        disabled: Boolean,
        clickable: Boolean,
        border: {
            type: Boolean,
            value: true
        },
        isLink: {
            type: Boolean,
            value: true
        }
    },
    data: {
        contentHeight: 0,
        expanded: false,
        transition: false
    },
    mounted() {
        this.updateExpanded()
            .then(nextTick)
            .then(() => {
            const data = { transition: true };
            if (this.data.expanded) {
                data.contentHeight = 'auto';
            }
            this.setData(data);
        });
    },
    methods: {
        updateExpanded() {
            if (!this.parent) {
                return Promise.resolve();
            }
            const { value, accordion } = this.parent.data;
            const { children = [] } = this.parent;
            const { name } = this.data;
            const index = children.indexOf(this);
            const currentName = name == null ? index : name;
            const expanded = accordion
                ? value === currentName
                : (value || []).some((name) => name === currentName);
            const stack = [];
            if (expanded !== this.data.expanded) {
                stack.push(this.updateStyle(expanded));
            }
            stack.push(this.set({ index, expanded }));
            return Promise.all(stack);
        },
        updateStyle(expanded) {
            return this.getRect('.van-collapse-item__content')
                .then((rect) => rect.height)
                .then((height) => {
                if (expanded) {
                    return this.set({
                        contentHeight: height ? `${height}px` : 'auto'
                    });
                }
                return this.set({ contentHeight: `${height}px` })
                    .then(nextTick)
                    .then(() => this.set({ contentHeight: 0 }));
            });
        },
        onClick() {
            if (this.data.disabled) {
                return;
            }
            const { name, expanded } = this.data;
            const index = this.parent.children.indexOf(this);
            const currentName = name == null ? index : name;
            this.parent.switch(currentName, !expanded);
        },
        onTransitionEnd() {
            if (this.data.expanded) {
                this.setData({
                    contentHeight: 'auto'
                });
            }
        }
    }
});
export default global['__wxComponents']['vant/collapse-item/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-collapse-item__title .van-cell__right-icon{-webkit-transform:rotate(90deg);transform:rotate(90deg);transition:-webkit-transform .3s;transition:transform .3s;transition:transform .3s,-webkit-transform .3s;transition:-webkit-transform var(--collapse-item-transition-duration,.3s);transition:transform var(--collapse-item-transition-duration,.3s);transition:transform var(--collapse-item-transition-duration,.3s),-webkit-transform var(--collapse-item-transition-duration,.3s)}.van-collapse-item__title--expanded .van-cell__right-icon{-webkit-transform:rotate(-90deg);transform:rotate(-90deg)}.van-collapse-item__title--disabled .van-cell,.van-collapse-item__title--disabled .van-cell__right-icon{color:#c8c9cc!important;color:var(--collapse-item-title-disabled-color,#c8c9cc)!important}.van-collapse-item__title--disabled .van-cell--hover{background-color:#fff!important;background-color:var(--white,#fff)!important}.van-collapse-item__wrapper{overflow:hidden}.van-collapse-item__wrapper--transition{transition:height .3s ease-in-out}.van-collapse-item__content{padding:15px;padding:var(--collapse-item-content-padding,15px);color:#969799;color:var(--collapse-item-content-text-color,#969799);font-size:13px;font-size:var(--collapse-item-content-font-size,13px);line-height:1.5;line-height:var(--collapse-item-content-line-height,1.5);background-color:#fff;background-color:var(--collapse-item-content-background-color,#fff)}
</style>