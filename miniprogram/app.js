App({
  globalData: {
    accessToken: "",
    user: null
  },

  onLaunch() {
    const accessToken = wx.getStorageSync("access_token");
    const user = wx.getStorageSync("user");
    this.globalData.accessToken = accessToken || "";
    this.globalData.user = user || null;
  }
});
