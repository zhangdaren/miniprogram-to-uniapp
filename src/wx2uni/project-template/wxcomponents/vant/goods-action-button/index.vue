<template>
<uni-shadow-root class="vant-goods-action-button-index"><van-button square :id="id" :lang="lang" :type="type" :color="color" :plain="plain" :loading="loading" :disabled="disabled" :open-type="openType" :custom-class="(utils.bem('goods-action-button', [type, { first: isFirst, last: isLast, plain : plain, ordinary: !plain }]))+' '+(rightBorderLess ?'van-goods-action-button--no-right-border': '')" :business-id="businessId" :session-from="sessionFrom" :app-parameter="appParameter" :send-message-img="sendMessageImg" :send-message-path="sendMessagePath" :show-message-card="showMessageCard" :send-message-title="sendMessageTitle" @click="onClick" @error="bindError" @contact="bindContact" @opensetting="bindOpenSetting" @getuserinfo="bindGetUserInfo" @getphonenumber="bindGetPhoneNumber" @launchapp="bindLaunchApp">
  {{ text }}
</van-button></uni-shadow-root>
</template>
<wxs src="../wxs/utils.wxs" module="utils"></wxs>
<script>
import VanButton from '../button/index.vue'
global['__wxVueOptions'] = {components:{'van-button': VanButton}}

global['__wxRoute'] = 'vant/goods-action-button/index'
import { VantComponent } from '../common/component';
import { link } from '../mixins/link';
import { button } from '../mixins/button';
import { openType } from '../mixins/open-type';
VantComponent({
    mixins: [link, button, openType],
    relation: {
        type: 'ancestor',
        name: 'goods-action',
        linked(parent) {
            this.parent = parent;
        }
    },
    props: {
        text: String,
        color: String,
        loading: Boolean,
        disabled: Boolean,
        plain: Boolean,
        type: {
            type: String,
            value: 'danger'
        }
    },
    mounted() {
        this.updateStyle();
    },
    methods: {
        onClick(event) {
            this.$emit('click', event.detail);
            this.jumpLink();
        },
        updateStyle() {
            const { children = [] } = this.parent;
            const { length } = children;
            const index = children.indexOf(this);
            let rightBorderLess = false;
            if (length > 1) {
                rightBorderLess = index !== length - 1;
            }
            this.setData({
                isFirst: index === 0,
                rightBorderLess,
                isLast: index === length - 1
            });
        }
    }
});
export default global['__wxComponents']['vant/goods-action-button/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.vant-goods-action-button-index{-webkit-flex:1;flex:1}.van-goods-action-button{height:40px!important;height:var(--goods-action-button-height,40px)!important;font-weight:500!important;font-weight:var(--font-weight-bold,500)!important;line-height:40px!important;line-height:var(--goods-action-button-height,40px)!important}.van-goods-action-button--first{display:block!important;margin-left:5px;border-top-left-radius:20px!important;border-top-left-radius:var(--goods-action-button-border-radius,20px)!important;border-bottom-left-radius:20px!important;border-bottom-left-radius:var(--goods-action-button-border-radius,20px)!important}.van-goods-action-button--last{display:block!important;margin-right:5px;border-top-right-radius:20px!important;border-top-right-radius:var(--goods-action-button-border-radius,20px)!important;border-bottom-right-radius:20px!important;border-bottom-right-radius:var(--goods-action-button-border-radius,20px)!important}.van-goods-action-button--warning{background:linear-gradient(90deg,#ffd01e,#ff8917);background:var(--goods-action-button-warning-color,linear-gradient(90deg,#ffd01e,#ff8917))}.van-goods-action-button--danger{background:linear-gradient(90deg,#ff6034,#ee0a24);background:var(--goods-action-button-danger-color,linear-gradient(90deg,#ff6034,#ee0a24))}.van-goods-action-button--ordinary{border:none!important}.van-goods-action-button--plain{background:#fff;background:var(--goods-action-button-plain-color,#fff)}.van-goods-action-button--no-right-border{border-right-width:0!important}@media (max-width:321px){.van-goods-action-button{font-size:13px}}
</style>