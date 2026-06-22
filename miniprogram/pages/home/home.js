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
    this.loadFeed().finally(() => wx.stopPullDownRefresh());
  },

  onSearchInput(event) {
    const q = event.detail.value;
    this.setData({ q, items: listItems({ q }) });
  },

  loadFeed() {
    this.setData({ loading: true });
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
