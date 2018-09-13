/**
 * 微信小程序登录服务抽取
 * @author lemon.he
 * @description vue mixin
 */

function authLogin(self, resolve, reject) {
  wx.login({
    timeout: 5000,
    success: function(res) {
      console.log('wechat do login success', res);
      if (res.code) {
        self.loginCode = res.code;
        if (!self.loginByWechatCode) {
          throw '请实现loginByWechatCode方法'
        }
        self.loginByWechatCode({
          code: self.loginCode,
          from: 'COMMUNITY'
        }).then(result => {
          console.log('login by wechat code success', result);
          // have userid
          // if (result.userId) {
          //   resolve()
          //   return;
          // }
          // unionid widthout userid,      have no userid but have unionid if success 
          if (result.unionId) {
            self.unionId = result.unionId;
            self.loginByUnionId({
              Act: 'GetUserByUnionId',
              UnionId: self.unionId
            }).then(result => {// get userinfo success( userid, unionid)
              resolve();
              console.log("get user by unionId", result);
            })
            resolve();
          } else {// without unionid, without userid
            reject()
          }
        }, err => {
          console.log("login by wechat code failed", err);
          wx.showToast({
            title: '服务器错误！',
            icon: 'none'
          })
        })
      }
    }
  })
}

function checkSessionAndLogin(self) {
  return new Promise((resolve, reject) => {
    wx.checkSession({
      success: function(e) {
          console.log('check user session success', e);
          if (userAuth.getUnionId()) {
              self.unionId = userAuth.getUnionId();
              resolve();
          } else {
              authLogin(self, resolve, reject);
          }
      },
      fail: function() {
          console.log('check user session failed');
          authLogin(self, resolve, reject);
      }
    })
  })
}

function submit(self, userInfo) {
 
  wx.showLoading({
      mask: true,
      title: '登录中'
  })
  self.loginByAuthCode({
      Act: 'LoginByActivity',
      UserName: self.phone,
      AuthCode: self.validCode,
      IsInvite: 1
  }).then(data => {
      console.log("login by auth code", data);
      let backUrl = self.$route.query.backUrl || '/pages/profile/index';
      let isNeedBindFor = !!(self.unionId && self.$route.query.from != 'switchAccount');
      let isReg = data.ResponseData.IsRegister;
      if (isNeedBindFor && isReg == 1) {
          self.bindUserIdAndUnionId({
              UserId: data.ResponseData.UserId,
              UnionId: self.unionId,
              Act: 'BindUserIdAndUnionId',
              noLoading: true
          }).then(data => {
              wx.hideLoading();
              if (self.$route.query.storeName) {
                  let nextFun = bridgeHandler.getStore(self.$route.query.storeName);
                  console.log("nextFun", nextFun)
                  nextFun && nextFun();
              }
              self.saveWechatInfo(userInfo);
              wx.redirectTo({
                  url: '/pages/auth/protocol?backUrl=' + backUrl
              })
          }, err => {
              wx.hideLoading();
              console.log("BindUserIdAndUnionId error", err);
              // wx.showToast({
              //     title: '一个微信账号不能同时绑定两个波奇帐号',
              //     icon: 'none'
              // })
              wx.showModal({
                  title: '提示',
                  content: '一个微信账号不能同时绑定两个波奇帐号',
                  showCancel: false,
                  success: function(res) {
                      if (res.confirm) {
                          console.log('用户点击确定')
                          if (self.$route.query.storeName) {
                              let nextFun = bridgeHandler.getStore(self.$route.query.storeName);
                              console.log("nextFun", nextFun)
                              nextFun && nextFun();
                          }
                          console.log("mmmmmddddddddssssss", userInfo)
                          self.saveWechatInfo(userInfo);
                          wx.redirectTo({
                              url: '/pages/auth/protocol?backUrl=' + backUrl
                          })
                      }
                  }
              })
          })
      }
      self.getProfile({
          params: {
              uid: 'me'
          }
      }).then(data => {
          console.log("isNeedBindFor", isNeedBindFor)
          wx.hideLoading();
          
          if (isNeedBindFor && isReg == 1) {

          } else {
              if (isReg == 1) {
                  self.saveWechatInfo(userInfo);
                  if (self.$route.query.storeName) {
                      let nextFun = bridgeHandler.getStore(self.$route.query.storeName);
                      console.log("nextFun", nextFun)
                      nextFun && nextFun();
                  }
                  wx.redirectTo({
                      url: '/pages/auth/protocol?backUrl=' + backUrl
                  })
              } else {
                  wx.navigateBack();
              }
          }
      })
  }, err => {
      // wx.hideLoading();
  })
}
export default {
	data() {
		return {
			
		}
	},
	onShow() {
  },
  /**
   * resolve userid,
   * reject without userid
   * this.checkUserAuth();
   * this.checkUserAuth().then(result=>{ //with unionid}, err=>{})
   */
	methods: {
    checkUserAuth() {
      return new Promise( (resolve,reject)=>{
        wx.checkSession({
          success: function(e) {
            console.log('check user session success', e);
            if (userAuth.getUnionId()) {
              if (!userAuth.getUserId()) {
                self.loginByUnionId({
                  Act: 'GetUserByUnionId',
                  UnionId: userAuth.getUnionId()
                }).then(result => {
                  console.log("get user by unionId", result);
                  if(result instanceof Array && result.length==0) return;
                  console.log('login by union id', result);
                  userAuth.set({UserId: result.userId, Uid: result.uid || ''});
                  resolve()
                })
              }
            } else {
              authLogin(self, resolve,reject);
            }
          },
          fail: function() {
            console.log('check user session failed');
            authLogin(self, resolve,reject);
          }
        })
      })
    },
    doLogin(e) {
      let self = this;
      console.log("get user phone by auth", e.target.userInfo.avatarUrl, e.target.userInfo.nickName);
      if (e.target.errMsg.indexOf('fail') > -1) return;
      checkSessionAndLogin(self).then(() => {
        if (!this.check()) {
          return
        }
        submit(e.target.userInfo);
      }, err => {
        if (!this.check()) {
          return
        }
        submit(e.target.userInfo);
      });
    }
	},
	onHide() {
	},
	onUnload() {
	}
}
