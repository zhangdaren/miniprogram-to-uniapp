<template>
<uni-shadow-root class="vant-tab-index"><view :class="'custom-class '+(utils.bem('tab__pane', { active, inactive: !active }))" :style="shouldShow ? '' : 'display: none;'">
  <slot v-if="shouldRender"></slot>
</view></uni-shadow-root>
</template>
<wxs src="../wxs/utils.wxs" module="utils"></wxs>
<script>

global['__wxRoute'] = 'vant/tab/index'
import { VantComponent } from '../common/component';
VantComponent({
    relation: {
        name: 'tabs',
        type: 'ancestor',
        linked(target) {
            this.parent = target;
        },
        unlinked() {
            this.parent = null;
        }
    },
    props: {
        dot: {
            type: Boolean,
            observer: 'update'
        },
        info: {
            type: null,
            observer: 'update'
        },
        title: {
            type: String,
            observer: 'update'
        },
        disabled: {
            type: Boolean,
            observer: 'update'
        },
        titleStyle: {
            type: String,
            observer: 'update'
        },
        name: {
            type: [Number, String],
            value: '',
        }
    },
    data: {
        active: false
    },
    methods: {
        getComputedName() {
            if (this.data.name !== '') {
                return this.data.name;
            }
            return this.index;
        },
        updateRender(active, parent) {
            const { data: parentData } = parent;
            this.inited = this.inited || active;
            this.setData({
                active,
                shouldRender: this.inited || !parentData.lazyRender,
                shouldShow: active || parentData.animated
            });
        },
        update() {
            if (this.parent) {
                this.parent.updateTabs();
            }
        }
    }
});
export default global['__wxComponents']['vant/tab/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.vant-tab-index{-webkit-flex-shrink:0;flex-shrink:0;width:100%}.van-tab__pane,:host{box-sizing:border-box}.van-tab__pane{overflow-y:auto;-webkit-overflow-scrolling:touch}.van-tab__pane--active{height:auto}.van-tab__pane--inactive{height:0;overflow:visible}
</style>