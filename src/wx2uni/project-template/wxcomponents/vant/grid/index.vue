<template>
<uni-shadow-root class="vant-grid-index"><view :class="'van-grid '+(border && !gutter ? 'van-hairline--top' : '')" :style="style">
  <slot></slot>
</view></uni-shadow-root>
</template>

<script>

global['__wxRoute'] = 'vant/grid/index'
import { VantComponent } from '../common/component';
import { addUnit } from '../common/utils';
VantComponent({
    relation: {
        name: 'grid-item',
        type: 'descendant',
        linked(child) {
            this.children.push(child);
        },
        unlinked(child) {
            this.children = this.children.filter((item) => item !== child);
        }
    },
    props: {
        square: {
            type: Boolean,
            observer: 'updateChildren'
        },
        gutter: {
            type: [Number, String],
            value: 0,
            observer: 'updateChildren'
        },
        clickable: {
            type: Boolean,
            observer: 'updateChildren'
        },
        columnNum: {
            type: Number,
            value: 4,
            observer: 'updateChildren'
        },
        center: {
            type: Boolean,
            value: true,
            observer: 'updateChildren'
        },
        border: {
            type: Boolean,
            value: true,
            observer: 'updateChildren'
        }
    },
    beforeCreate() {
        this.children = [];
    },
    created() {
        const { gutter } = this.data;
        if (gutter) {
            this.setData({
                style: `padding-left: ${addUnit(gutter)}`
            });
        }
    },
    methods: {
        updateChildren() {
            this.children.forEach((child) => {
                child.updateStyle();
            });
        }
    }
});
export default global['__wxComponents']['vant/grid/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-grid{position:relative;box-sizing:border-box;overflow:hidden}
</style>