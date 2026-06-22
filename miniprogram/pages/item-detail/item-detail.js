const { logContactView } = require("../../services/contact-service");
const {
  deleteItem,
  favoriteItem,
  getItem,
  isItemOwner,
  markItemStatus,
  unfavoriteItem
} = require("../../services/item-service");
const { canViewContact } = require("../../services/user-service");

function buildShareText(item) {
  return [
    "有物之间 · CUHK二手",
    item.title,
    `价格：${item.price}元`,
    item.status_label ? `状态：${item.status_label}` : "",
    item.handover_location || item.dormitory ? `交收：${item.handover_location || item.dormitory}` : "",
    item.seller_name ? `发布者：${item.seller_name}` : "",
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

  previewImages() {
    const item = this.data.item;
    const urls = (item.images && item.images.length ? item.images : [item.cover_image_url]).filter(Boolean);
    if (!urls.length) return;

    wx.previewImage({
      current: urls.includes(item.cover_image_url) ? item.cover_image_url : urls[0],
      urls
    });
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
      success: () => {
        logContactView(this.data.id, this.data.item.seller_id);
        wx.showToast({ title: "微信号已复制", icon: "success" });
      }
    });
  },

  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },

  ensureOwnerAction() {
    if (this.data.isOwner) return true;

    wx.showToast({ title: "只有发布者可操作", icon: "none" });
    return false;
  },

  editItem() {
    if (!this.ensureOwnerAction()) return;
    wx.navigateTo({ url: `/pages/item-edit/item-edit?id=${this.data.id}` });
  },

  toggleFavorite() {
    const item = this.data.item;
    const nextItem = item.is_favorited
      ? unfavoriteItem(this.data.id)
      : favoriteItem(this.data.id);

    if (!nextItem) {
      wx.showToast({ title: "操作失败", icon: "none" });
      return;
    }

    this.setData({ item: nextItem });
    wx.showToast({
      title: nextItem.is_favorited ? "已收藏" : "已取消收藏",
      icon: "none"
    });
  },

  markSold() {
    if (!this.ensureOwnerAction()) return;
    this.updateStatus("sold", "已标记售出");
  },

  offShelf() {
    if (!this.ensureOwnerAction()) return;
    wx.showModal({
      title: "下架商品",
      content: "下架后仍可在详情页查看，首页会显示已下架状态。",
      confirmText: "下架",
      success: (res) => {
        if (res.confirm) this.updateStatus("off_shelf", "已下架");
      }
    });
  },

  removeItem() {
    if (!this.ensureOwnerAction()) return;
    wx.showModal({
      title: "删除商品",
      content: "删除后将从本地 mock 列表移除。",
      confirmText: "删除",
      confirmColor: "#c2410c",
      success: (res) => {
        if (!res.confirm) return;

        const item = deleteItem(this.data.id);
        if (!item) {
          wx.showToast({ title: "删除失败", icon: "none" });
          return;
        }

        wx.showToast({ title: "已删除", icon: "none" });
        setTimeout(() => {
          wx.switchTab({ url: "/pages/home/home" });
        }, 500);
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
      success: () => {
        wx.showToast({
          title: "举报已提交",
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
