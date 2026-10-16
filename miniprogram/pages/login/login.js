const { login, isCloudMode } = require("../../services/user-service");
const { readResult } = require("../../utils/service-result");

Page({
  data: {
    wechatId: isCloudMode() ? "" : "youwu_demo",
    isCloudMode: isCloudMode(),
    submitting: false
  },

  onWechatInput(event) {
    this.setData({ wechatId: event.detail.value });
  },

  onUnload() {
    this._unloaded = true;
    clearTimeout(this._loginTimer);
  },

  goAfterLogin() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: () => wx.switchTab({ url: "/pages/profile/profile" })
      });
      return;
    }

    wx.switchTab({ url: "/pages/profile/profile" });
  },

  login() {
    if (this.data.submitting) return;
    const wechatId = this.data.wechatId.trim();
    if (!wechatId) {
      wx.showToast({ title: "请输入微信号", icon: "none" });
      return;
    }

    this.setData({ submitting: true });
    return readResult(
      () => login(wechatId),
      (user) => {
        getApp().globalData.accessToken = isCloudMode() ? "" : "mock-access-token";
        getApp().globalData.user = user;
        if (this._unloaded) return;
        wx.showToast({ title: "已登录" });
        this._loginTimer = setTimeout(() => this.goAfterLogin(), 300);
      },
      (error) => {
        if (this._unloaded) return;
        this.setData({ submitting: false });
        wx.showToast({ title: error.message || "登录失败，请重试", icon: "none" });
      }
    );
  }
});
