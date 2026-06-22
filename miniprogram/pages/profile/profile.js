const { getCurrentUser, mockLogout } = require("../../services/user-service");

Page({
  data: {
    user: {}
  },

  onShow() {
    this.setData({ user: getCurrentUser() || {} });
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
    mockLogout();
    getApp().globalData.accessToken = "";
    getApp().globalData.user = null;
    this.setData({ user: {} });
  }
});
