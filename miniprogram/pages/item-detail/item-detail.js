const { getItemById, getMockUser } = require("../../utils/mock-store");

function buildShareText(item) {
  return [
    item.title,
    `${item.price}元`,
    item.status_label,
    item.handover_location || item.dormitory,
    "点击查看详情"
  ].filter(Boolean).join("\n");
}

Page({
  data: {
    id: "",
    item: {},
    contact: {},
    isLoggedIn: false
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadItem(options.id);
  },

  onShow() {
    this.loadContact();
  },

  loadItem(id) {
    const item = getItemById(id);
    if (!item) {
      wx.showToast({ title: "商品不存在", icon: "none" });
      return;
    }

    this.setData({ item }, () => this.loadContact());
  },

  loadContact() {
    const user = getMockUser();
    const item = this.data.item.id ? this.data.item : getItemById(this.data.id);
    this.setData({
      isLoggedIn: Boolean(user),
      contact: user && item ? { wechat_id: item.wechat_id || user.wechat_id } : {}
    });
  },

  copyWechat() {
    wx.setClipboardData({ data: this.data.contact.wechat_id });
  },

  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },

  reportItem() {
    wx.showActionSheet({
      itemList: ["诈骗", "虚假商品", "骚扰", "不当内容"],
      success: (res) => {
        const reasons = ["诈骗", "虚假商品", "骚扰", "不当内容"];
        wx.showToast({
          title: `已记录：${reasons[res.tapIndex]}`,
          icon: "none"
        });
      }
    });
  },

  copyShareText() {
    wx.setClipboardData({
      data: buildShareText(this.data.item),
      success: () => wx.showToast({ title: "文案已复制" })
    });
  },

  onShareAppMessage() {
    const item = this.data.item;
    return {
      title: `${item.title || "有物之间"} · ${item.price || ""}元`,
      path: `/pages/item-detail/item-detail?id=${this.data.id}`
    };
  }
});
