<template>

<view class="container log-list">
  <block v-for="(item,key) in logs" wx:for-item="log">
    <text class="log-item">{{index + 1}}. {{log}}</text>
  </block>
</view>

</template>
<script>
//logs.js
const util = require('../../utils/util.js');

export default {
  data() {
    return {
      logs: []
    };
  },

  onLoad: function () {
    this.logs = (wx.getStorageSync('logs') || []).map(log => {
      return util.formatTime(new Date(log));
    });
  },
  props: {},
  methods: {},
  computed: {},
  watch: {}
};
</script>
<style>
.log-list {
  display: flex;
  flex-direction: column;
  padding: 40upx;
}
.log-item {
  margin: 10upx;
}

</style>