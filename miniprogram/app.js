App({
  globalData: {
    accessToken: "",
    user: null
  },

  onLaunch() {
    const accessToken = isCloudMode() ? "" : wx.getStorageSync("access_token");
    const user = getCurrentUser();
    this.globalData.accessToken = accessToken || "";
    this.globalData.user = user || null;
  }
});
const { getCurrentUser, isCloudMode } = require("./services/user-service");
