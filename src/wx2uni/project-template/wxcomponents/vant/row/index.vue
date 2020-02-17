<template>
<uni-shadow-root class="vant-row-index"><view class="custom-class van-row" :style="style">
  <slot></slot>
</view></uni-shadow-root>
</template>

<script>

global['__wxRoute'] = 'vant/row/index'
import { VantComponent } from '../common/component';
VantComponent({
    relation: {
        name: 'col',
        type: 'descendant',
        linked(target) {
            if (this.data.gutter) {
                target.setGutter(this.data.gutter);
            }
        }
    },
    props: {
        gutter: {
            type: Number,
            observer: 'setGutter'
        }
    },
    mounted() {
        if (this.data.gutter) {
            this.setGutter();
        }
    },
    methods: {
        setGutter() {
            const { gutter } = this.data;
            const margin = `-${Number(gutter) / 2}px`;
            const style = gutter
                ? `margin-right: ${margin}; margin-left: ${margin};`
                : '';
            this.setData({ style });
            this.getRelationNodes('../col/index').forEach(col => {
                col.setGutter(this.data.gutter);
            });
        }
    }
});
export default global['__wxComponents']['vant/row/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-row:after{display:table;clear:both;content:""}
</style>