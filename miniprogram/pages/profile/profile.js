const { getMockUser, mockLogout } = require("../../utils/mock-store");

Page({
  data: {
    user: {}
  },

  onShow() {
    this.setData({ user: getMockUser() || {} });
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
