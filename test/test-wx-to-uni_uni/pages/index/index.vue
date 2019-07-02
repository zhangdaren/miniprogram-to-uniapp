<template>

<view class="container">
  <view class="userinfo">
    <button v-if="!hasUserInfo && canIUse" open-type="getUserInfo" @getuserinfo="getUserInfo"> 获取头像昵称 </button>
    <block v-else="">
      <image @tap="bindViewTap" class="userinfo-avatar" :src="userInfo.avatarUrl" mode="cover"></image>
      <text class="userinfo-nickname">{{userInfo.nickName}}</text>
    </block>
  </view>
  <view class="usermotto">
    <text class="user-motto">{{motto}}</text>
  </view>
</view>

</template>
<script>

export default {
  data() {
    return {
      motto: 'Hello World',
      userInfo: {},
      hasUserInfo: false,
      canIUse: wx.canIUse('button.open-type.getUserInfo'),
      multistageProperty: {
        a: {
          b: "cccccc"
        }
      }
    };
  },

  onLoad: function () {
    if (this.globalData.userInfo) {
      this.userInfo = this.globalData.userInfo;
      this.hasUserInfo = true;
    } else if (this.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.userInfo = res.userInfo;
        this.hasUserInfo = true;
        this.multistageProperty.a.b = "dddddddd";
      };
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          this.globalData.userInfo = res.userInfo;
          this.userInfo = res.userInfo;
          this.hasUserInfo = true;
        }
      });
    }
  },
  props: {},
  methods: {
    //事件处理函数
    bindViewTap: function () {
      wx.navigateTo({
        url: '../logs/logs'
      });
    },
    getUserInfo: function (e) {
      console.log(e);
      this.globalData.userInfo = e.detail.userInfo;
      this.userInfo = e.detail.userInfo;
      this.hasUserInfo = true;
    }
  },
  computed: {},
  watch: {}
};
</script>
<style>
/**index.css**/
.userinfo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.userinfo-avatar {
  width: 128upx;
  height: 128upx;
  margin: 20upx;
  border-radius: 50%;
}

.userinfo-nickname {
  color: #aaa;
}

.usermotto {
  margin-top: 200px;
}
</style>