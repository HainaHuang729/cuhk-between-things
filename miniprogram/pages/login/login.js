const { request } = require("../../utils/request");

Page({
  data: {
    email: "",
    token: ""
  },

  onEmailInput(event) {
    this.setData({ email: event.detail.value });
  },

  onTokenInput(event) {
    this.setData({ token: event.detail.value });
  },

  async requestOtp() {
    try {
      await request({
        url: "/auth/request-otp",
        method: "POST",
        data: { email: this.data.email }
      });
      wx.showToast({ title: "已发送" });
    } catch (error) {
      wx.showToast({ title: error.error || "发送失败", icon: "none" });
    }
  },

  async verifyOtp() {
    try {
      const res = await request({
        url: "/auth/verify-otp",
        method: "POST",
        data: { email: this.data.email, token: this.data.token }
      });
      wx.setStorageSync("access_token", res.session.access_token);
      wx.setStorageSync("user", res.user);
      getApp().globalData.accessToken = res.session.access_token;
      getApp().globalData.user = res.user;
      wx.navigateBack();
    } catch (error) {
      wx.showToast({ title: error.error || "登录失败", icon: "none" });
    }
  }
});
