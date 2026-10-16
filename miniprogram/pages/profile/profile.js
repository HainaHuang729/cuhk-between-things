const { getContactLogs } = require("../../services/contact-service");
const { getItem, isItemOwner, listFavoriteItems, listItems } = require("../../services/item-service");
const { getCurrentUser, mockLogout, isCloudMode } = require("../../services/user-service");
const { readResult, combineResults } = require("../../utils/service-result");

Page({
  data: {
    contactedItems: [],
    favoriteItems: [],
    myItems: [],
    user: {},
    loading: false,
    error: "",
    loginLabel: isCloudMode() ? "微信登录" : "模拟登录"
  },

  onShow() {
    this.loadProfile();
  },

  loadProfile() {
    const user = getCurrentUser();
    const requestId = (this._loadId = (this._loadId || 0) + 1);
    const logs = user
      ? getContactLogs().filter((log) => log.viewer_id === user.id || (!log.viewer_id && !isCloudMode()))
      : [];
    const ids = [...new Set(logs.map((log) => log.item_id))];
    this.setData({
      loading: true,
      error: "",
      user: user || {},
      myItems: [],
      contactedItems: [],
      favoriteItems: []
    });
    return readResult(
      () =>
        combineResults([
          listFavoriteItems(),
          user ? listItems({ status: "all", mine: true }) : [],
          ...ids.map(getItem)
        ]),
      ([favoriteItems, items, ...contacted]) => {
        if (requestId !== this._loadId || (getCurrentUser() || {}).id !== (user || {}).id) return;
        if (!user) {
          this.setData({
            contactedItems: [],
            favoriteItems,
            myItems: [],
            user: {},
            loading: false
          });
          return;
        }

        const myItems = items.filter(isItemOwner);
        const contactedItems = contacted.filter(Boolean);

        this.setData({
          contactedItems,
          favoriteItems,
          myItems,
          user,
          loading: false
        });
      },
      (error) => {
        if (requestId === this._loadId)
          this.setData({ loading: false, user: getCurrentUser() || {}, error: error.message || "加载失败，请重试" });
      }
    );
  },

  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },

  goNewItem() {
    wx.navigateTo({ url: "/pages/item-edit/item-edit" });
  },

  goItem(event) {
    wx.navigateTo({ url: `/pages/item-detail/item-detail?id=${event.currentTarget.dataset.id}` });
  },

  logout() {
    mockLogout();
    getApp().globalData.accessToken = "";
    getApp().globalData.user = null;
    this._loadId = (this._loadId || 0) + 1;
    this.setData({
      contactedItems: [],
      favoriteItems: [],
      myItems: [],
      user: {}
    });
    this.loadProfile();
    wx.showToast({ title: "已退出", icon: "none" });
  }
});
