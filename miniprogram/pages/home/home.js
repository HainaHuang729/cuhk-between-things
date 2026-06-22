const { getItems } = require("../../utils/mock-store");

Page({
  data: {
    q: "",
    items: []
  },

  onLoad() {
    this.loadFeed();
  },

  onShow() {
    this.loadFeed();
  },

  onPullDownRefresh() {
    this.loadFeed().finally(() => wx.stopPullDownRefresh());
  },

  onSearchInput(event) {
    const q = event.detail.value;
    this.setData({ q, items: getItems(q) });
  },

  loadFeed() {
    this.setData({ items: getItems(this.data.q) });
  },

  goItem(event) {
    wx.navigateTo({ url: `/pages/item-detail/item-detail?id=${event.currentTarget.dataset.id}` });
  }
});
