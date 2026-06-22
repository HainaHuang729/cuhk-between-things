const { logContactView } = require("../../services/contact-service");
const {
  getItem,
  isItemOwner,
  markItemStatus
} = require("../../services/item-service");
const { canViewContact } = require("../../services/user-service");

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
    canViewContact: false,
    isOwner: false,
    imageError: false
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadItem(options.id);
  },

  onShow() {
    if (this.data.id) this.loadItem(this.data.id);
  },

  loadItem(id) {
    const item = getItem(id);
    if (!item) {
      wx.showToast({ title: "商品不存在", icon: "none" });
      return;
    }

    this.setData({
      item,
      isOwner: isItemOwner(item),
      imageError: false
    }, () => this.loadContact());
  },

  onImageError() {
    this.setData({ imageError: true });
  },

  loadContact() {
    const allowed = canViewContact();
    const item = this.data.item.id ? this.data.item : getItem(this.data.id);
    this.setData({
      canViewContact: allowed,
      contact: allowed && item ? { wechat_id: item.wechat_id || "" } : {}
    });
  },

  copyWechat() {
    const wechatId = this.data.contact.wechat_id;
    if (!wechatId) {
      wx.showToast({ title: "登录后查看联系方式", icon: "none" });
      return;
    }

    wx.setClipboardData({
      data: wechatId,
      success: () => logContactView(this.data.id, this.data.item.seller_id)
    });
  },

  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },

  editItem() {
    wx.navigateTo({ url: `/pages/item-edit/item-edit?id=${this.data.id}` });
  },

  markSold() {
    this.updateStatus("sold", "已标记售出");
  },

  offShelf() {
    wx.showModal({
      title: "下架商品",
      content: "下架后仍可在详情页查看，首页会显示已下架状态。",
      confirmText: "下架",
      success: (res) => {
        if (res.confirm) this.updateStatus("off_shelf", "已下架");
      }
    });
  },

  updateStatus(status, toastTitle) {
    const item = markItemStatus(this.data.id, status);
    if (!item) {
      wx.showToast({ title: "更新失败", icon: "none" });
      return;
    }

    this.setData({
      item,
      isOwner: isItemOwner(item)
    }, () => this.loadContact());
    wx.showToast({ title: toastTitle });
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
