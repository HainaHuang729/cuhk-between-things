const { request } = require("../../utils/request");

Page({
  data: {
    activeType: "all",
    q: "",
    items: [],
    groups: []
  },

  onLoad() {
    this.loadFeed();
  },

  onPullDownRefresh() {
    this.loadFeed().finally(() => wx.stopPullDownRefresh());
  },

  onSearchInput(event) {
    this.setData({ q: event.detail.value });
  },

  setType(event) {
    this.setData({ activeType: event.currentTarget.dataset.type });
  },

  async loadFeed() {
    try {
      const query = this.data.q ? `?q=${encodeURIComponent(this.data.q)}` : "";
      const [itemsRes, groupsRes] = await Promise.all([
        request({ url: `/items${query}` }),
        request({ url: "/groups" })
      ]);

      this.setData({
        items: itemsRes.data || [],
        groups: groupsRes.data || []
      });
    } catch (error) {
      wx.showToast({ title: error.error || "加载失败", icon: "none" });
    }
  },

  goItem(event) {
    wx.navigateTo({ url: `/pages/item-detail/item-detail?id=${event.currentTarget.dataset.id}` });
  },

  goGroup(event) {
    wx.navigateTo({ url: `/pages/group-detail/group-detail?id=${event.currentTarget.dataset.id}` });
  },

  goNewItem() {
    wx.navigateTo({ url: "/pages/item-edit/item-edit" });
  },

  goNewGroup() {
    wx.navigateTo({ url: "/pages/group-edit/group-edit" });
  },

  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  }
});
