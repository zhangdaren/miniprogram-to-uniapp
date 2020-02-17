<template>
<uni-shadow-root class="vant-search-index"><view :class="(utils.bem('search', { withaction: showAction || useActionSlot }))+' custom-class'" :style="'background: '+(background)">
  <view :class="utils.bem('search__content', [shape])">
    <view class="van-search__label" v-if="label">{{ label }}</view>
    <slot v-else name="label"></slot>

    <van-field type="search" :left-icon="(!useLeftIconSlot ? leftIcon : '')" :right-icon="(!useRightIconSlot ? rightIcon : '')" :focus="focus" :error="error" :border="false" confirm-type="search" class="van-search__field field-class" :value="value" :disabled="disabled" :readonly="readonly" :clearable="clearable" :maxlength="maxlength" :input-align="inputAlign" input-class="input-class" :placeholder="placeholder" :placeholder-style="placeholderStyle" custom-style="padding: 5px 10px 5px 0; background-color: transparent;" @blur="onBlur" @focus="onFocus" @change="onChange" @confirm="onSearch" @clear="onClear">
      <slot v-if="useLeftIconSlot" name="left-icon" slot="left-icon"></slot>
      <slot v-if="useRightIconSlot" name="right-icon" slot="right-icon"></slot>
    </van-field>
  </view>

  <view v-if="showAction || useActionSlot" class="van-search__action" hover-class="van-search__action--hover" hover-stay-time="70">
    <slot v-if="useActionSlot" name="action"></slot>
    <view v-else @click="onCancel" class="cancel-class">{{ actionText }}</view>
  </view>
</view></uni-shadow-root>
</template>
<wxs src="../wxs/utils.wxs" module="utils"></wxs>
<script>
import VanField from '../field/index.vue'
global['__wxVueOptions'] = {components:{'van-field': VanField}}

global['__wxRoute'] = 'vant/search/index'
import { VantComponent } from '../common/component';
VantComponent({
    field: true,
    classes: ['field-class', 'input-class', 'cancel-class'],
    props: {
        label: String,
        focus: Boolean,
        error: Boolean,
        disabled: Boolean,
        readonly: Boolean,
        inputAlign: String,
        showAction: Boolean,
        useActionSlot: Boolean,
        useLeftIconSlot: Boolean,
        useRightIconSlot: Boolean,
        leftIcon: {
            type: String,
            value: 'search'
        },
        rightIcon: String,
        placeholder: String,
        placeholderStyle: String,
        actionText: {
            type: String,
            value: '取消'
        },
        background: {
            type: String,
            value: '#ffffff'
        },
        maxlength: {
            type: Number,
            value: -1
        },
        shape: {
            type: String,
            value: 'square'
        },
        clearable: {
            type: Boolean,
            value: true
        }
    },
    methods: {
        onChange(event) {
            this.setData({ value: event.detail });
            this.$emit('change', event.detail);
        },
        onCancel() {
            /**
             * 修复修改输入框值时，输入框失焦和赋值同时触发，赋值失效
             * https://github.com/youzan/@vant/weapp/issues/1768
             */
            setTimeout(() => {
                this.setData({ value: '' });
                this.$emit('cancel');
                this.$emit('change', '');
            }, 200);
        },
        onSearch() {
            this.$emit('search', this.data.value);
        },
        onFocus() {
            this.$emit('focus');
        },
        onBlur() {
            this.$emit('blur');
        },
        onClear() {
            this.$emit('clear');
        },
    }
});
export default global['__wxComponents']['vant/search/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-search{-webkit-align-items:center;align-items:center;box-sizing:border-box;padding:10px 12px;padding:var(--search-padding,10px 12px)}.van-search,.van-search__content{display:-webkit-flex;display:flex}.van-search__content{-webkit-flex:1;flex:1;padding-left:8px;padding-left:var(--padding-xs,8px);border-radius:2px;border-radius:var(--border-radius-sm,2px);background-color:#f7f8fa;background-color:var(--search-background-color,#f7f8fa)}.van-search__content--round{border-radius:17px;border-radius:calc(var(--search-input-height, 34px)/2)}.van-search__label{padding:0 5px;padding:var(--search-label-padding,0 5px);font-size:14px;font-size:var(--search-label-font-size,14px);line-height:34px;line-height:var(--search-input-height,34px);color:#323233;color:var(--search-label-color,#323233)}.van-search__field{-webkit-flex:1;flex:1}.van-search__field__left-icon{color:#969799;color:var(--search-left-icon-color,#969799)}.van-search--withaction{padding-right:0}.van-search__action{padding:0 8px;padding:var(--search-action-padding,0 8px);font-size:14px;font-size:var(--search-action-font-size,14px);line-height:34px;line-height:var(--search-input-height,34px);color:#323233;color:var(--search-action-text-color,#323233)}.van-search__action--hover{background-color:#f2f3f5;background-color:var(--active-color,#f2f3f5)}
</style>