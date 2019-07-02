// let _url = 'https://tuan.api.ybm100.com/'; //正式
// let _url = 'http://tuan2.test.ybm100.com/'; //测试
// let _url = 'https://tuan.test.ybm100.com/'; //测试
// let _url = 'https://tuan.stage.ybm100.com/'; //预发
let _url = 'http://192.168.131.167:8092/';
//默认定位
let longitude = '',
  latitude = '';
const ajax = (methed, server, params, fun1, fun2) => {
  let token = "";
  let _methed = methed.toUpperCase();
  wx.getStorage({
    key: 'sess_key',
    success: function(res) {
      token = res.data;
    },
    fail: function() {
      token = "";
    },
    complete: function() {
      console.log(token, 'form_submit')
      params.token = token;
      wx.request({
        url: _url + server,
        data: params,
        header: {
          "Content-Type": _methed == "POST" ? "application/x-www-form-urlencoded" : "application/json",
          "userType": 'groupuser',
          "token": token
        },
        method: _methed,
        success: function(res) {
          //判断session是否失效
          if (res.data.code == 2) {
            //服务器session过期
            //wx.hideLoading();
            wx.showToast({
              title: res.data.msg,
              icon: 'none',
              mask: true,
              duration: 1000,
              success: function() {
                setTimeout(() => {
                  fun1(2); //如果是2需要授权登录
                }, 1000);
              }
            })
          } else if (res.data.code == 3) {
            //活动被禁用
            //wx.hideLoading();
            wx.showToast({
              title: res.data.msg,
              icon: 'none',
              mask: true,
              duration: 1000,
              success: function() {}
            })
          } else {
            fun1(res);
          }
        },
        fail: function(error) {
          wx.showToast({
            title: "网络请求超时",
            icon: 'none',
            mask: true,
            duration: 2000,
            success: () => {
              fun2 ? fun2(error) : '';
            }
          })
        },
      })
    }
  })

}
const ajax2 = (methed, server, params, fun1, fun2) => {
  let token = "";
  let _methed = methed.toUpperCase();
  wx.getStorage({
    key: 'sess_key',
    success: function(res) {
      token = res.data;
    },
    fail: function() {
      token = "";
    },
    complete: function() {
      console.log(_methed);
      console.log(token)
      params.token = token;
      wx.request({
        url: _url + server,
        data: params,
        header: {
          "Content-Type": _methed == "POST" || _methed == "DELETE" ? "application/json" : "application/x-www-form-urlencoded",
          "userType": 'groupuser',
          "token": token
        },
        method: _methed,
        success: function(res) {
          //判断session是否失效
          if (res.data.code == 2) {
            //服务器session过期
            //wx.hideLoading();
            wx.showToast({
              title: res.data.msg,
              icon: 'none',
              mask: true,
              duration: 1000,
              success: function() {
                setTimeout(() => {
                  fun1(2); //如果是2需要授权登录
                }, 1000);
              }
            })
          } else if (res.data.code == 3) {
            //活动被禁用
            //wx.hideLoading();
            wx.showToast({
              title: res.data.msg,
              icon: 'none',
              mask: true,
              duration: 1000,
              success: function() {}
            })
          } else {
            fun1(res);
          }
        },
        fail: function(error) {
          wx.showToast({
            title: "网络请求超时",
            icon: 'none',
            mask: true,
            duration: 2000,
            success: () => {
              fun2 ? fun2(error) : '';
            }
          })
        },
      })
    }
  })

}
/*
获取当前位置
出参  callback(longitude, latitude)  经度，维度
 */
const getLocation = (callback) => {
  wx.getLocation({
    type: 'gcj02',
    altitude: true,
    success: (res) => {
      //确定定位
      longitude = res.longitude;
      latitude = res.latitude;
      callback(longitude, latitude)
    },
    fail: function() {
      wx.getSetting({
        success: function(res) {
          console.log('用户授权了')
          console.log(res)
          if (!res.authSetting['scope.userLocation']) {
            //不允许获取定位
            wx.showModal({
              title: '提示',
              content: '拼团服务需要您的地理位置',
              showCancel: false,
              confirmText: '去开启',
              success: function(res) {
                if (res.confirm) {
                  //位置  确定按钮
                  //新版禁用，需要通过按钮触发
                  wx.openSetting({
                    success: function(res) {
                      wx.getLocation({
                        type: 'gcj02',
                        altitude: true,
                        success: function(res) { //  允许获取定位
                          latitude = res.latitude;
                          longitude = res.longitude;
                          callback(res.longitude, res.latitude)
                        }
                      })
                    }
                  })
                }
              }
            })
          } else {
            wx.getSystemInfo({
              success(res) {
                console.log(res.platform)
                if (longitude != '') {
                  //确定定位
                  longitude = res.longitude;
                  latitude = res.latitude;
                  callback(longitude, latitude)
                } else if (res.platform == 'ios') {
                  console.log('用户授权了，但是没有拿到经纬度,说明微信也没拿到')
                  wx.showModal({
                    title: '提示',
                    content: '请打开手机设置-隐私-定位服务，允许微信访问设置',
                    showCancel: false,
                    confirmText: '确定',
                    success: function(res) {
                      if (res.confirm) {
                        callback(longitude, latitude, false);
                      }
                    }
                  })
                } else {
                  callback(longitude, latitude, false);
                }
              }
            })
          }
        },
        fail: function(res) {
          console.log('拿不到经纬度')
        }
      })
    }
  })


}

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/*
参数：
latitude:目标纬度
longitude:目标经度
*/
const open_wechatMap = (latitude, longitude, name, address, scale) => {
  let default_coord = {
    latitude: 30.4555400000,
    longitude: 114.4214600000,
  };
  console.log(latitude, longitude);
  wx.openLocation({
    latitude: latitude ? latitude : default_coord.latitude,
    longitude: longitude ? longitude : default_coord.longitude,
    scale: scale ? scale : 28,
    name: name ? name : '',
    address: address ? address : '',
    success: function(res) {}
  });
};

/* 验证是否登陆(session_key是否存在)，session_key是否过期 */
// const isLogin = (callback) => {
//   let session_key = wx.getStorageSync('sess_key');
//   let userInfo = wx.getStorageSync('userInfo');
//   if (session_key && userInfo.userId) {
//     callback();
//   } else {
//     //如果没有登陆授权，则跳转登陆页
//     wx.showToast({
//       title: '需要先授权登陆',
//       icon: 'none',
//       mask: true,
//       duration: 1000,
//       success: function () {
//         setTimeout(() => {
//           fun1(2);//如果是2需要授权登录
//         }, 1000);
//       }
//     })
//   }
// }

/* 验证是否绑定手机号 */
const isLogonPhone = (fun1) => {
  let userInfo = wx.getStorageSync('userInfo');
  /* if (userInfo && userInfo.phoneType == 0) {
    console.log('手机号已绑定',userInfo);
    callback()
  } else {
    ajax("get", "miniapp/bindPhoneController/checkBind", {}, res => {
      console.log('手机号验证绑定',res);
      //如果没有绑定手机号，则跳转绑定手机号页
      if (res.data.code == 1) {
        wx.showToast({
          title: '需要先绑定手机号',
          icon: 'none',
          mask: true,
          duration: 1000,
          success: function () {
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/logonPhone/logonPhone',
              });
            }, 1000);
          }
        })
      } else {
        let {
          userRole,
          userType
        } = res.data.result;
        wx.setStorage({
          key: 'userInfo',
          data: {
            ...userInfo,
            userRole: userRole,
            //用户身份   0:普通用户,1:小药药销售,2:药店店员,3:药店用户
            userType: userType,
            //是否绑定手机号   0:已绑定,1:未绑定
            phoneType: res.data.code
          },
          success: () => {
            callback()
          }
        });
      }
    })
  } */

  ajax("get", "miniapp/bindPhoneController/checkBind", {},function(res){
    console.log(res);
    if (res == 2) {
      fun1(2);
      return false;
    }
    //如果没有绑定手机号，则跳转绑定手机号页
    if (res.data.code == 1) {
      wx.showToast({
        title: '需要先绑定手机号',
        icon: 'none',
        mask: true,
        duration: 1000,
        success: function () {
          setTimeout(() => {
            // wx.navigateTo({
            //   url: '/pages/logonPhone/logonPhone',
            // });
            // 显示绑定手机号布局
            fun1(true)
          }, 1000);
        }
      })
    } else {
      let {
        userRole,
        userType
      } = res.data.result;
      wx.setStorage({
        key: 'userInfo',
        data: {
          ...userInfo,
          userRole: userRole,
          //用户身份   0:普通用户,1:小药药销售,2:药店店员,3:药店用户
          userType: userType,
          //是否绑定手机号   0:已绑定,1:未绑定
          phoneType: res.data.code
        },
        success: () => {
          fun1(false)
        }
      });
    }
  })
}
//保留两位小数
var filters = {
  toFix: function(value) {
    return value.toFixed(2)
  }
}

module.exports = {
  url: _url,
  ajax: ajax,
  ajax2: ajax2,
  getLocation: getLocation,
  formatTime: formatTime,
  open_wechatMap: open_wechatMap,
  // isLogin: isLogin,
  isLogonPhone: isLogonPhone,
  toFix: filters.toFix
}