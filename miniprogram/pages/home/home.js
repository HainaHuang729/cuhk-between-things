const { listItems } = require("../../services/item-service");

Page({
  data: {
    q: "",
    items: [],
    loading: false
  },

  onLoad() {
    this.loadFeed();
  },

  onShow() {
    this.loadFeed();
  },

  onPullDownRefresh() {
    this.loadFeed({ showLoading: false });
    wx.stopPullDownRefresh();
  },

  onSearchInput(event) {
    const q = event.detail.value;
    this.setData({ q, items: listItems({ q }) });
  },

  onSearchConfirm() {
    const q = this.data.q.trim();
    this.setData({ q, items: listItems({ q }) });
  },

  clearSearch() {
    this.setData({ q: "", items: listItems() });
  },

  loadFeed(options = {}) {
    if (options.showLoading !== false) {
      this.setData({ loading: true });
    }

    this.setData({
      items: listItems({ q: this.data.q }),
      loading: false
    });
  },

  onImageError(event) {
    const id = event.currentTarget.dataset.id;
    const items = this.data.items.map((item) => (
      item.id === id ? { ...item, image_error: true } : item
    ));
    this.setData({ items });
  },

  goItem(event) {
    wx.navigateTo({ url: `/pages/item-detail/item-detail?id=${event.currentTarget.dataset.id}` });
  }
});
