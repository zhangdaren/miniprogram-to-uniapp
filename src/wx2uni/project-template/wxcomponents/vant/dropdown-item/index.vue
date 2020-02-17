<template>
<uni-shadow-root class="vant-dropdown-item-index"><view v-if="showWrapper" :class="utils.bem('dropdown-item', direction)" :style="wrapperStyle">
  <van-popup :show="showPopup" custom-style="position: absolute;" overlay-style="position: absolute;" :overlay="overlay" :position="direction === 'down' ? 'top' : 'bottom'" :duration="transition ? duration : 0" :close-on-click-overlay="closeOnClickOverlay" @close="onClickOverlay">
    <van-cell v-for="(item,index) in (options)" :key="item.value" :data-option="item" :class="utils.bem('dropdown-item__option', { active: item.value === value } )" clickable :icon="item.icon" @click.native="onOptionTap">
      <view slot="title" class="van-dropdown-item__title" :style="item.value === value  ? 'color:' + activeColor : ''">
        {{ item.text }}
      </view>
      <van-icon v-if="item.value === value" name="success" class="van-dropdown-item__icon" :color="activeColor"></van-icon>
    </van-cell>

    <slot></slot>
  </van-popup>
</view></uni-shadow-root>
</template>
<wxs src="../wxs/utils.wxs" module="utils"></wxs>
<script>
import VanPopup from '../popup/index.vue'
import VanCell from '../cell/index.vue'
import VanIcon from '../icon/index.vue'
global['__wxVueOptions'] = {components:{'van-popup': VanPopup,'van-cell': VanCell,'van-icon': VanIcon}}

global['__wxRoute'] = 'vant/dropdown-item/index'
import { VantComponent } from '../common/component';
VantComponent({
    field: true,
    relation: {
        name: 'dropdown-menu',
        type: 'ancestor',
        linked(target) {
            this.parent = target;
            this.updateDataFromParent();
        },
        unlinked() {
            this.parent = null;
        }
    },
    props: {
        value: {
            type: null,
            observer: 'rerender'
        },
        title: {
            type: String,
            observer: 'rerender'
        },
        disabled: Boolean,
        titleClass: {
            type: String,
            observer: 'rerender'
        },
        options: {
            type: Array,
            value: [],
            observer: 'rerender'
        }
    },
    data: {
        transition: true,
        showPopup: false,
        showWrapper: false,
        displayTitle: ''
    },
    methods: {
        rerender() {
            wx.nextTick(() => {
                this.parent && this.parent.updateItemListData();
            });
        },
        updateDataFromParent() {
            if (this.parent) {
                const { overlay, duration, activeColor, closeOnClickOverlay, direction } = this.parent.data;
                this.setData({
                    overlay,
                    duration,
                    activeColor,
                    closeOnClickOverlay,
                    direction
                });
            }
        },
        onClickOverlay() {
            this.toggle();
            this.$emit('close');
        },
        onOptionTap(event) {
            const { option } = event.currentTarget.dataset;
            const { value } = option;
            const shouldEmitChange = this.data.value !== value;
            this.setData({ showPopup: false, value });
            setTimeout(() => {
                this.setData({ showWrapper: false });
            }, this.data.duration || 0);
            this.rerender();
            if (shouldEmitChange) {
                this.$emit('change', value);
            }
        },
        toggle(show, options = {}) {
            const { showPopup, duration } = this.data;
            if (show == null) {
                show = !showPopup;
            }
            if (show === showPopup) {
                return;
            }
            if (!show) {
                const time = options.immediate ? 0 : duration;
                this.setData({ transition: !options.immediate, showPopup: show });
                setTimeout(() => {
                    this.setData({ showWrapper: false });
                }, time);
                this.rerender();
                return;
            }
            this.parent.getChildWrapperStyle().then((wrapperStyle = '') => {
                this.setData({
                    transition: !options.immediate,
                    showPopup: show,
                    wrapperStyle,
                    showWrapper: true
                });
                this.rerender();
            });
        }
    }
});
export default global['__wxComponents']['vant/dropdown-item/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-dropdown-item{position:fixed;right:0;left:0;overflow:hidden}.van-dropdown-item__option{text-align:left}.van-dropdown-item__option--active .van-dropdown-item__icon,.van-dropdown-item__option--active .van-dropdown-item__title{color:#1989fa;color:var(--dropdown-menu-option-active-color,#1989fa)}.van-dropdown-item--up{top:0}.van-dropdown-item--down{bottom:0}.van-dropdown-item__icon{display:block;line-height:inherit}
</style>