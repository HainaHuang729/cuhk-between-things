const { mockLogin } = require("../../services/user-service");

Page({
  data: {
    wechatId: "youwu_demo"
  },

  onWechatInput(event) {
    this.setData({ wechatId: event.detail.value });
  },

  login() {
    const wechatId = this.data.wechatId.trim();
    if (!wechatId) {
      wx.showToast({ title: "请输入微信号", icon: "none" });
      return;
    }

    const user = mockLogin(wechatId);
    getApp().globalData.accessToken = "mock-access-token";
    getApp().globalData.user = user;
    wx.showToast({ title: "已登录" });
    wx.navigateBack();
  }
});
