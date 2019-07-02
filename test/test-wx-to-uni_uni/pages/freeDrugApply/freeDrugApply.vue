<template>

<view class="root-box">
<groupmsg class="group_msg" :list="groupPurchases.logList"></groupmsg>
  
  <view class="swiper-box">
    <swiper indicator-color="#efeff4" indicator-active-color="#f16a33" circular="true" :indicator-dots="swiperConfig.indicatorDots" :autoplay="swiperConfig.autoplay" :interval="swiperConfig.interval" :duration="swiperConfig.duration" bindchange="swiperChange">
      <block v-for="(item,key) in swiperConfig.imgUrls">
        <swiper-item>
          <image :src="item.imgUrl" class="swiper-image" mode="aspectFill">
        </image></swiper-item>
      </block>
    </swiper>
    <view class="swiper-pager">{{swiperConfig.current+1}}/{{swiperConfig.imgUrls.length}}</view>
  </view>

  
  <view class="price-box">
    <text class="sale-pri-content">￥<text class="sale-pri">{{groupPurchases.groupPurchasePric}}</text></text>
    <text class="through-pri-content">￥{{groupPurchases.pric}}</text>
  </view>
  <view class="drug-title-box">{{groupPurchases.productName}} {{groupPurchases.productSpec}}</view>

  
  <view class="apply_for">
    <view class="form_item form_title">免费领药申请表</view>

    

    
    <view class="form_item" :class="name_toast_text == true?'':'form_error'">
      <view class="item_name">您的真实姓名</view>
      <view class="item_con">
        <input @input="user_name" bindfocus="user_name_focus" class="form_input" placeholder="请输入" placeholder-class="phcolor"></input>
      </view>
    </view>

    
    <view class="form_item">
      <view class="item_name">历史处方</view>
      <view class="item_con" @tap="free_upload">
        <view class="city_xz">
          <view class="picker">{{leo_sc_zt}}</view>
        </view>
        <image class="item_icon" :src="imgRelativePath + '/icon-right-arrow.png'"></image>
      </view>
    </view>

    
    <view class="form_item" :class="yb_toast_text == true?'':'form_error'">
      <view class="item_name">医保卡号</view>
      <view class="item_con">
        <input type="number" @input="user_yb_token" bindfocus="user_yb_token_focus" class="form_input" placeholder="请输入" placeholder-class="phcolor"></input>
      </view>
    </view>

    
    <view class="form_item" :class="token_toast_text == true?'':'form_error'">
      <view class="item_name">身份证号</view>
      <view class="item_con">
        <input type="idcard" @input="user_token" bindfocus="user_token_focus" class="form_input" placeholder="请输入" placeholder-class="phcolor"></input>
      </view>
    </view>

    
    <view class="form_item" :class="yd_toast_text == true?'':'form_null'">
      <view class="item_name">选择提货药店</view>
      <view class="item_con" @tap="bindPickerChange">
        <view class="city_xz">
          <view class="picker" :class="leo_yd_text == '请选择'? 'gray': ''">
            {{leo_yd_text}}
          </view>
        </view>
        <image class="item_icon" :src="imgRelativePath + '/icon-right-arrow.png'"></image>
      </view>
    </view>

  </view>

  <view class="free_drug_msg">
    <icon type="warn" size="15" color="#FAAD14">
    <text>审核通过后，请携带身份证、医保卡到药店取药</text>
  </icon></view>

  <view class="bottom-placeholder"></view>
  <buttion class="btn form_submit" @tap="form_submit">提交</buttion>
</view>



<view class="black_box" catchtouchmove="true" v-if="isLayer1Show"></view>
<view class="alert_box" catchtouchmove="true" v-if="isLayer1Show">
  <view class="title">免费领药资格申请成功!</view>
  <view class="detail">我们将在2个工作日内完成您的资格审核，审核结果会以短信形式通知您，审核通过后，请您携带<text style="color:#E4393B">身份证和医保卡</text>到您指定的药店免费领药。</view>
  <view class="btns_box">
    <button class="left" @tap="closeLayerTap">关闭</button>
    <button class="right" open-type="share">邀请好友</button>
  </view>
</view>

</template>
<script>

export default {
  data() {
    return {
      imgRelativePath: '../../../../images',
      drugStoreId: '',
      //url传递的药店id
      drugStore: {},
      //药店信息
      groupPurchases: {},
      //商品信息
      swiperConfig: {
        //广告信息,轮播图配置
        indicatorDots: false,
        autoplay: true,
        interval: 2000,
        duration: 600,
        imgUrls: [],
        current: 0
      },
      //地区
      city_toast_text: true,
      region: {},
      region_zhi: '请选择',
      //地区内容文本
      //真实姓名
      name_toast_text: true,
      user_name: '',
      //历史处方
      leo_sc_zt: '上传处方更容易审核通过哦~',
      //处方上传文案
      leo_cf_img: '',
      //处方上传图片src   待点击提交上传到服务器
      //医保卡号
      yb_toast_text: true,
      user_yb_token: '',
      //用户医保
      //身份证号
      token_toast_text: true,
      user_token: '',
      //用户身份证
      //提货药店
      yd_toast_text: true,
      leo_yd_text: '请选择',
      //药店默认文本
      yd_info: {
        id: '',
        //药店id
        drugstore_name: '' //药店名称

      },
      //药店信息
      pathFlag: 0,
      //0:初始状态,1:onLoad,2:返回时onShow
      isLayer1Show: false //layer_1弹窗是否显示

    };
  },

  onShareAppMessage: function () {
    var that = this; //share=1  分享标识

    var shareObj = {
      title: that.data.groupPurchases.shareTitle,
      path: '/pages/group/groupLoading/goodsDetail/goodsDetail?drugStoreId=' + that.data.drugStoreId + '&goodsId=' + that.data.groupPurchases.id + "&share=1",
      imageUrl: that.data.groupPurchases.shareImage,
      success: function () {},
      fail: function () {}
    };
    console.log(shareObj);
    return shareObj;
  },
  onShow: function () {
    var that = this;

    if (that.data.pathFlag == 2) {
      //药店信息
      that.setData({
        yd_toast_text: true,
        leo_yd_text: that.data.drugStore.drugstore_name,
        ['yd_info.id']: that.data.drugStore.id,
        ['yd_info.drugstore_name']: that.data.drugStore.drugstore_name
      });
    }
  },
  onLoad: function (options) {
    //groupPurchaseId:拼团Id
    //drugStoreId:药店Id
    if (options.groupPurchaseId && options.drugStoreId) {
      this.searchDrugInfo(options.groupPurchaseId, options.drugStoreId);
    } else {
      this.showErrorToast('缺少必要参数');
    }

    this.pathFlag = 1;
    this.drugStoreId = options.drugStoreId;
  },
  props: {},
  methods: {
    swiperChange: function (event) {
      this.swiperConfig.current = event.detail.current;
    },
    //地区
    bindRegionChange: function (e) {
      this.region = e.detail;
      this.region_zhi = e.detail.value.join(' ');
      this.city_toast_text.aaaa = true;
    },
    //真实姓名
    user_name: function (e) {
      this.user_name = e.detail.value;
    },
    //真实姓名获取焦点
    user_name_focus: function () {
      this.name_toast_text = true;
    },
    //历史处方
    free_upload: function () {
      let that = this;
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],

        success(res) {
          // tempFilePath可以作为img标签的src属性显示图片
          const tempFilePaths = res.tempFilePaths;
          wx.showLoading({
            title: '正在上传',
            mask: true
          });
          wx.uploadFile({
            url: util.url + 'groupArea/invoke',
            filePath: tempFilePaths[0],
            name: 'file',
            formData: {
              "index": '20'
            },
            success: function (res) {
              console.log("============上传接口返回begin============");
              console.log(res);
              console.log("============上传接口返回end============");
              res = JSON.parse(res.data);

              if (res && res.code == 0) {
                wx.hideLoading({
                  success: function () {
                    wx.showToast({
                      title: '上传成功',
                      image: '../../../../images/successIcon.png',
                      duration: 2000
                    });
                  }
                });
                that.setData({
                  leo_sc_zt: '已上传',
                  leo_cf_img: res.result.path
                });
              } else {
                wx.hideLoading({
                  success: function () {
                    that.showErrorToast(res.msg);
                  }
                });
              }
            },
            fail: function () {
              wx.hideLoading({
                success: function () {
                  that.showErrorToast('上传失败');
                }
              });
            }
          });
        }

      });
    },
    //医保卡号
    user_yb_token: function (e) {
      this.user_yb_token = e.detail.value;
    },
    //医保卡号获取焦点
    user_yb_token_focus: function () {
      this.yb_toast_text = true;
    },
    //身份证号
    user_token: function (e) {
      this.user_token = e.detail.value;
    },
    //身份证号获取焦点
    user_token_focus: function () {
      this.token_toast_text = true;
    },
    //提货药店
    bindPickerChange: function (e) {
      let that = this;
      this.pathFlag = 2;
      wx.navigateTo({
        url: '/pages/group/groupLoading/storeList/storeList?drugStoreId=' + this.drugStoreId + '&groupId=' + this.groupPurchases.groupPurchaseId //drugStoreId=

      });
    },
    //关闭按钮
    closeLayerTap: function () {
      var that = this;
      wx.navigateBack({
        delta: 1
      });
    },
    // 点击提交btn触发
    form_submit: function () {
      wx.reportAnalytics('free_drug_application', {});
      let that = this;
      let thatData = this;
      var errCount = 0; //判断地区是否选择
      // console.log("=============region===========");
      // console.log(JSON.stringify(thatData.region));
      // if (thatData.region.value && thatData.region.value.length) {
      //   that.setData({
      //     city_toast_text: true
      //   });
      // } else {
      //   that.setData({
      //     city_toast_text: false
      //   });
      //   errCount++;
      // }
      //判断用户名是否为空

      if (thatData.user_name) {
        that.setData({
          name_toast_text: true
        });
      } else {
        that.setData({
          name_toast_text: false
        });
        errCount++;
      } //判断医保卡长度


      if (thatData.user_yb_token.length) {
        //== 16
        that.setData({
          yb_toast_text: true
        });
      } else {
        that.setData({
          yb_toast_text: false
        });
        errCount++;
      } //身份证验证


      let reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;

      if (reg.test(thatData.user_token)) {
        that.setData({
          token_toast_text: true
        });
      } else {
        that.setData({
          token_toast_text: false
        });
        errCount++;
      } //药店默认值


      if (thatData.yd_info.id) {
        that.setData({
          yd_toast_text: true
        });
      } else {
        that.setData({
          yd_toast_text: false
        });
        errCount++;
      }

      if (errCount) {
        return false;
      }

      util.ajax('post', 'YkqFreeReceive/insertYqkFreeUser', {
        //productName: thatData.groupPurchases.productName, //药品名称
        //productSpec: thatData.groupPurchases.productSpec, //药品规格
        //productPrice: thatData.groupPurchases.groupPurchasePric, //拼团价
        //image: thatData.swiperConfig.imgUrls[0].imgUrl, //图片
        groupPurchaseId: thatData.groupPurchases.id,
        //拼团id
        // address: thatData.region.value.join(''), //你所在的地区  1.6.1不传地区了
        realName: thatData.user_name,
        //真实姓名
        prescription: thatData.leo_cf_img,
        //历史处方图片
        cardNo: thatData.user_yb_token,
        //医保卡号
        cardNumbers: thatData.user_token,
        //身份证号
        drugstoreId: thatData.yd_info.id //提货药店

      }, function (res) {
        //success
        res = res.data;
        console.log(res);

        if (res && res.status == 0) {
          that.setData({
            isLayer1Show: true
          });
        } else {
          that.showErrorToast(res.msg || res.result);
        }
      }, function () {
        //error
        that.showErrorToast('网络错误');
      });
    },
    searchDrugInfo: function (groupPurchaseId, drugStoreId) {
      wx.showLoading({
        title: '加载中...'
      });
      var that = this;
      util.ajax('post', 'miniapp/miniappController/groupPurchaseFreeDetail', {
        groupPurchaseId: groupPurchaseId,
        //拼团Id
        drugStoreId: drugStoreId //药店Id

      }, function (res) {
        wx.hideLoading();
        res = res.data;
        console.log(res);

        if (res && res.code == 0 && res.result) {
          that.setData({
            groupPurchases: res.result.groupPurchases,
            ["swiperConfig.imgUrls"]: res.result.groupPurchases.imageUrlList
          });
        } else {
          that.showErrorToast(res.msg);
        }
      }, function () {
        //error
        that.showErrorToast('网络错误');
      });
    },
    showErrorToast: function (msg) {
      var that = this;
      wx.showToast({
        title: msg,
        icon: "none",
        image: that.data.imgRelativePath + '/icon-error-1@2x.png',
        duration: 3000,
        mask: true
      });
    }
  },
  computed: {},
  watch: {}
};
</script>
<style>
@import '../../../../common/tableView.css';
page {
  background-color: #f7f7f7;
}

.root-box {
  width: 100%;
}

.swiper-box {
  width: 100%;
  height: 750upx;
  position: relative;
}

.swiper-box swiper {
  width: 100%;
  height: 100%;
  /*
  position: absolute;
  top: 0;
  left: 0;
  */
}

.swiper-image {
  width: 100%;
  height: 100%;
  /*
  position: absolute;
  top: 50%;
  transform: translate(0, -50%);
  */
}

.swiper-pager {
  width: 84upx;
  height: 35upx;
  line-height: 35upx;
  background: rgba(11, 11, 11, 0.4);
  border-radius: 70upx;
  font-size: 26upx;
  color: #fff;
  text-align: center;
  position: absolute;
  right: 24upx;
  bottom: 30upx;
}

.price-box {
  box-sizing: border-box;
  width: 100%;
  padding: 0 23upx;
  background: #fff;
}

.sale-pri-content {
  font-size: 32upx;
  color: #e3383b;
  font-weight: bold;
}

.sale-pri {
  font-size: 58upx;
}

.through-pri-content {
  font-size: 32upx;
  color: #999;
  text-decoration: line-through;
  margin-left: 15upx;
}

.drug-title-box {
  box-sizing: border-box;
  width: 100%;
  padding: 0 23upx 23upx;
  background: #fff;
  font-size: 33upx;
  font-weight: 600;
  margin-bottom: 20upx;
}

image.image {
  display: block;
  width: 100%;
  height: 100%;
}

.apply_for {
  background-color: #fff;
  font-size: 30upx;
}

.apply_for .form_item {
  padding: 0 23upx;
  box-shadow: inset 0 -1upx 0 0 #eee;
  min-height: 90upx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.apply_for .form_item:last-child {
  box-shadow: none;
}
.apply_for .form_item .item_name {
  /*width: 230upx;*/
  flex-shrink: 0;
}

.apply_for .form_item .item_con {
  width: 100%;
  height: 90upx;
  color: #333333;
  padding-right: 39upx;
  text-align: right;
  flex-shrink: 1;
  position: relative;
}

.apply_for .form_item .item_icon {
  width: 34upx;
  height: 34upx;
  position: absolute;
  right: 0;
  top: 28upx;
}

.apply_for .form_title {
  box-shadow: none;
  font-weight: 600;
}

.free_drug_msg {
  margin-top: 20upx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: #FFFBE6;
  height: 70upx;
  font-size: 28upx;
  color: #999999;
  text-align: center;
}
.free_drug_msg icon {
  margin-right: 15upx;
}
.bottom-placeholder {
  width: 100%;
  height: 100upx;
}

.form_submit {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100upx;
  line-height: 100upx;
  background: #e4393b;
  box-shadow: inset 0 1upx 0 0 #dcdcdc;
  border-radius: 0.6upx;
  font-size: 36upx;
  color: #fff;
  text-align: center;
  z-index: 9;
}

.city_xz {
  width: 100%;
  height: 90upx;
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.city_xz .picker {
  width: 100%;
  display: block;
}

.form_input {
  display: block;
  height: 90upx;
  text-align: right;
  color: #333;
  /*padding-right: 10upx;*/
}

.leo_alert {
  text-align: right;
  color: #f00;
  font-size: 24upx;
  display: flex;
  justify-content: initial;
}

.form_null {
  padding-bottom: 40upx !important;
  position: relative;
}

.form_null::after {
  content: '必填';
  color: #f00;
  position: absolute;
  bottom: 15upx;
  right: 23upx;
  font-size: 24upx;
}

.form_error {
  padding-bottom: 40upx !important;
  position: relative;
}

.form_error::after {
  content: '格式错误';
  color: #f00;
  position: absolute;
  bottom: 15upx;
  right: 23upx;
  font-size: 24upx;
}
.group_msg{
  position: fixed;
  top: 50upx;
  left: 30upx;
  width: 50%;
  z-index: 9;
}
</style>