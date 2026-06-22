const { getContactLogs } = require("../../services/contact-service");
const { getItem, listFavoriteItems, listItems } = require("../../services/item-service");
const { getCurrentUser, mockLogout } = require("../../services/user-service");

Page({
  data: {
    contactedItems: [],
    favoriteItems: [],
    myItems: [],
    user: {}
  },

  onShow() {
    this.loadProfile();
  },

  loadProfile() {
    const user = getCurrentUser();
    const favoriteItems = listFavoriteItems();
    if (!user) {
      this.setData({
        contactedItems: [],
        favoriteItems,
        myItems: [],
        user: {}
      });
      return;
    }

    const items = listItems({ status: "all" });
    const myItems = items.filter((item) => item.seller_id === user.id || item.owner_id === user.id);
    const seen = {};
    const contactedItems = getContactLogs()
      .filter((log) => !log.viewer_id || log.viewer_id === user.id)
      .reduce((result, log) => {
        if (seen[log.item_id]) return result;

        const item = getItem(log.item_id);
        seen[log.item_id] = true;
        if (item) result.push({ ...item, contacted_at: log.created_at });
        return result;
      }, []);

    this.setData({
      contactedItems,
      favoriteItems,
      myItems,
      user
    });
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
    this.setData({
      contactedItems: [],
      favoriteItems: listFavoriteItems(),
      myItems: [],
      user: {}
    });
    wx.showToast({ title: "已退出", icon: "none" });
  }
});
