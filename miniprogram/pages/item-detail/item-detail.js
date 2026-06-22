const { request } = require("../../utils/request");

Page({
  data: {
    id: "",
    item: {},
    contact: {}
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadItem(options.id);
    this.loadContact(options.id);
  },

  async loadItem(id) {
    try {
      const res = await request({ url: `/items/${id}` });
      this.setData({ item: res.data || {} });
    } catch (error) {
      wx.showToast({ title: error.error || "加载失败", icon: "none" });
    }
  },

  async loadContact(id) {
    try {
      const res = await request({ url: `/items/${id}/contact`, auth: true });
      this.setData({ contact: res.data || {} });
    } catch (_error) {
      this.setData({ contact: {} });
    }
  },

  copyWechat() {
    wx.setClipboardData({ data: this.data.contact.wechat_id });
  },

  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },

  goReport() {
    wx.navigateTo({
      url: `/pages/report/report?target_type=item&target_id=${this.data.id}`
    });
  },

  shareHint() {
    wx.showShareMenu({ withShareTicket: true });
  },

  onShareAppMessage() {
    const item = this.data.item;
    return {
      title: `${item.title || "CUHK二手商品"} · HKD ${item.price || ""}`,
      path: `/pages/item-detail/item-detail?id=${this.data.id}`
    };
  }
});
