Page({
  data: {
    user: {}
  },

  onShow() {
    this.setData({ user: wx.getStorageSync("user") || {} });
  },

  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },

  goNewItem() {
    wx.navigateTo({ url: "/pages/item-edit/item-edit" });
  },

  goNewGroup() {
    wx.navigateTo({ url: "/pages/group-edit/group-edit" });
  },

  logout() {
    wx.removeStorageSync("access_token");
    wx.removeStorageSync("user");
    getApp().globalData.accessToken = "";
    getApp().globalData.user = null;
    this.setData({ user: {} });
  }
});
