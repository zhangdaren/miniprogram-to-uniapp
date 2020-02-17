<template>
<uni-shadow-root class="vant-radio-group-index"><slot></slot></uni-shadow-root>
</template>

<script>

global['__wxRoute'] = 'vant/radio-group/index'
import { VantComponent } from '../common/component';
VantComponent({
    field: true,
    relation: {
        name: 'radio',
        type: 'descendant',
        linked(target) {
            this.children = this.children || [];
            this.children.push(target);
            this.updateChild(target);
        },
        unlinked(target) {
            this.children = this.children.filter((child) => child !== target);
        }
    },
    props: {
        value: {
            type: null,
            observer: 'updateChildren'
        },
        disabled: {
            type: Boolean,
            observer: 'updateChildren'
        }
    },
    methods: {
        updateChildren() {
            (this.children || []).forEach((child) => this.updateChild(child));
        },
        updateChild(child) {
            const { value, disabled } = this.data;
            child.setData({
                value,
                disabled: disabled || child.data.disabled
            });
        }
    }
});
export default global['__wxComponents']['vant/radio-group/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';
</style>