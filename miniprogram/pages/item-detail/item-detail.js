const { logContactView } = require("../../services/contact-service");
const {
  deleteItem,
  favoriteItem,
  getItem,
  isItemOwner,
  itemStatuses,
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
    missing: false,
    imageError: false
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadItem(options.id);
  },

  onShow() {
    if (this.data.id) this.loadItem(this.data.id);
  },

  onUnload() {
    clearTimeout(this._returnTimer);
  },

  goHome() {
    wx.switchTab({ url: "/pages/home/home" });
  },

  loadItem(id) {
    const item = getItem(id);
    if (!item) {
      this.setData({ item: {}, contact: {}, canViewContact: false, isOwner: false, missing: true });
      return;
    }

    this.setData({
      item,
      isOwner: isItemOwner(item),
      missing: false,
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
    if (!canViewContact()) {
      this.loadContact();
      wx.showToast({ title: "登录后查看联系方式", icon: "none" });
      return;
    }

    const item = getItem(this.data.id);
    if (!item) {
      this.loadItem(this.data.id);
      return;
    }
    const wechatId = item.wechat_id;
    if (!wechatId) {
      wx.showToast({ title: "卖家暂未填写微信号", icon: "none" });
      return;
    }

    wx.setClipboardData({
      data: wechatId,
      success: () => {
        try {
          logContactView(this.data.id, item.seller_id);
        } catch (error) {
          wx.showToast({ title: "已复制，联系记录未保存", icon: "none" });
          return;
        }
        wx.showToast({ title: "微信号已复制", icon: "success" });
      },
      fail: () => wx.showToast({ title: "复制失败，请重试", icon: "none" })
    });
  },

  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },

  ensureOwnerAction() {
    const item = getItem(this.data.id);
    if (isItemOwner(item)) return true;

    this.loadItem(this.data.id);
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

  manageStatus() {
    if (!this.ensureOwnerAction()) return;
    const item = getItem(this.data.id);
    const choices = itemStatuses.filter((entry) => entry.value !== item.status);
    wx.showActionSheet({
      itemList: choices.map((entry) => {
        if (entry.value === "available") return "恢复在售";
        if (entry.value === "off_shelf") return "下架商品";
        return `标记${entry.label}`;
      }),
      success: (result) => {
        const choice = choices[result.tapIndex];
        if (!choice) return;
        if (choice.value === "off_shelf") this.offShelf();
        else if (choice.value === "sold") this.markSold();
        else this.updateStatus(choice.value, choice.value === "available" ? "已恢复在售" : choice.label);
      }
    });
  },

  offShelf() {
    if (!this.ensureOwnerAction()) return;
    wx.showModal({
      title: "下架商品",
      content: "下架后不再出现在默认商品流，可在“我的发布”中查看。",
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
      content: "删除后无法恢复，确定删除这件商品吗？",
      confirmText: "删除",
      confirmColor: "#c2410c",
      success: (res) => {
        if (!res.confirm || !this.ensureOwnerAction()) return;

        try {
          if (!deleteItem(this.data.id)) throw new Error("删除失败");
        } catch (error) {
          wx.showToast({ title: "删除失败，请重试", icon: "none" });
          return;
        }

        this.loadItem(this.data.id);
        wx.showToast({ title: "已删除", icon: "none" });
        this._returnTimer = setTimeout(() => this.goHome(), 500);
      }
    });
  },

  updateStatus(status, toastTitle) {
    if (!this.ensureOwnerAction()) return;
    try {
      if (!markItemStatus(this.data.id, status)) throw new Error("更新失败");
    } catch (error) {
      wx.showToast({ title: "更新失败，请重试", icon: "none" });
      return;
    }

    this.loadItem(this.data.id);
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
    if (!this.data.item.id) return;
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
