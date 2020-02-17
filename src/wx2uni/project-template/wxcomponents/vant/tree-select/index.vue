<template>
<uni-shadow-root class="vant-tree-select-index"><view class="van-tree-select" :style="'height: '+(utils.addUnit(height))">
  <scroll-view scroll-y class="van-tree-select__nav">
    <van-sidebar :active-key="mainActiveIndex" @change="onClickNav" custom-class="van-tree-select__nav__inner">
      <van-sidebar-item v-for="(item,index) in (items)" :key="item.index" custom-class="main-item-class" active-class="main-active-class" disabled-class="main-disabled-class" :title="item.text" :disabled="item.disabled"></van-sidebar-item>
    </van-sidebar>
  </scroll-view>
  <scroll-view scroll-y class="van-tree-select__content">
    <slot name="content"></slot>
    <view v-for="(item,index) in (subItems)" :key="item.id" :class="'van-ellipsis content-item-class '+(utils.bem('tree-select__item', { active: wxs.isActive(activeId, item.id), disabled: item.disabled }))+' '+(wxs.isActive(activeId, item.id) ? 'content-active-class' : '')+' '+(item.disabled ? 'content-disabled-class' : '')" :data-item="item" @click="onSelectItem">
      {{ item.text }}
      <van-icon v-if="wxs.isActive(activeId, item.id)" name="checked" size="16px" class="van-tree-select__selected"></van-icon>
    </view>
  </scroll-view>
</view></uni-shadow-root>
</template>
<wxs src="../wxs/utils.wxs" module="utils"></wxs><wxs src="./index.wxs" module="wxs"></wxs>
<script>
import VanIcon from '../icon/index.vue'
import VanSidebar from '../sidebar/index.vue'
import VanSidebarItem from '../sidebar-item/index.vue'
global['__wxVueOptions'] = {components:{'van-icon': VanIcon,'van-sidebar': VanSidebar,'van-sidebar-item': VanSidebarItem}}

global['__wxRoute'] = 'vant/tree-select/index'
import { VantComponent } from '../common/component';
VantComponent({
    classes: [
        'main-item-class',
        'content-item-class',
        'main-active-class',
        'content-active-class',
        'main-disabled-class',
        'content-disabled-class'
    ],
    props: {
        items: {
            type: Array,
            observer: 'updateSubItems'
        },
        activeId: null,
        mainActiveIndex: {
            type: Number,
            value: 0,
            observer: 'updateSubItems'
        },
        height: {
            type: [Number, String],
            value: 300
        },
        max: {
            type: Number,
            value: Infinity
        }
    },
    data: {
        subItems: []
    },
    methods: {
        // 当一个子项被选择时
        onSelectItem(event) {
            const { item } = event.currentTarget.dataset;
            const isArray = Array.isArray(this.data.activeId);
            // 判断有没有超出右侧选择的最大数
            const isOverMax = isArray && this.data.activeId.length >= this.data.max;
            // 判断该项有没有被选中, 如果有被选中，则忽视是否超出的条件
            const isSelected = isArray
                ? this.data.activeId.indexOf(item.id) > -1
                : this.data.activeId === item.id;
            if (!item.disabled && (!isOverMax || isSelected)) {
                this.$emit('click-item', item);
            }
        },
        // 当一个导航被点击时
        onClickNav(event) {
            const index = event.detail;
            const item = this.data.items[index];
            if (!item.disabled) {
                this.$emit('click-nav', { index });
            }
        },
        // 更新子项列表
        updateSubItems() {
            const { items, mainActiveIndex } = this.data;
            const { children = [] } = items[mainActiveIndex] || {};
            return this.set({ subItems: children });
        }
    }
});
export default global['__wxComponents']['vant/tree-select/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-tree-select{position:relative;display:-webkit-flex;display:flex;-webkit-user-select:none;user-select:none;font-size:14px;font-size:var(--tree-select-font-size,14px)}.van-tree-select__nav{-webkit-flex:1;flex:1;background-color:#fafafa;background-color:var(--tree-select-nav-background-color,#fafafa);--sidebar-padding:12px 8px 12px 12px}.van-tree-select__nav__inner{width:100%!important;height:100%}.van-tree-select__content{-webkit-flex:2;flex:2;background-color:#fff;background-color:var(--tree-select-content-background-color,#fff)}.van-tree-select__item{position:relative;font-weight:700;padding:0 32px 0 16px;padding:0 32px 0 var(--padding-md,16px);line-height:44px;line-height:var(--tree-select-item-height,44px)}.van-tree-select__item--active{color:#ee0a24;color:var(--tree-select-item-active-color,#ee0a24)}.van-tree-select__item--disabled{color:#c8c9cc;color:var(--tree-select-item-disabled-color,#c8c9cc)}.van-tree-select__selected{position:absolute;top:50%;-webkit-transform:translateY(-50%);transform:translateY(-50%);right:16px;right:var(--padding-md,16px)}
</style>