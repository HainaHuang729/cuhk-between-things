const { logContactView } = require("../../services/contact-service");
const {
  deleteItem,
  favoriteItem,
  getItem,
  getItemContact,
  isItemOwner,
  itemStatuses,
  markItemStatus,
  unfavoriteItem
} = require("../../services/item-service");
const { canViewContact, getCurrentUser, isCloudMode } = require("../../services/user-service");
const { readResult } = require("../../utils/service-result");

function buildShareText(item) {
  return [
    "有物之间 · CUHK二手",
    item.title,
    `价格：${item.price}元`,
    item.status_label ? `状态：${item.status_label}` : "",
    item.handover_location || item.dormitory ? `交收：${item.handover_location || item.dormitory}` : "",
    item.seller_name ? `发布者：${item.seller_name}` : "",
    "点击查看详情"
  ]
    .filter(Boolean)
    .join("\n");
}

Page({
  data: {
    id: "",
    item: {},
    contact: {},
    contactError: "",
    contactLoading: false,
    canViewContact: false,
    isOwner: false,
    missing: false,
    gallery: [],
    currentImage: 0,
    loading: false,
    error: "",
    loginLabel: isCloudMode() ? "微信登录" : "模拟登录"
  },

  onLoad(options = {}) {
    const id = options.id || "";
    this.setData({ id });
    this.loadItem(id);
  },

  onShow() {
    if (this.data.id) this.loadItem(this.data.id);
  },

  onUnload() {
    this._unloaded = true;
    clearTimeout(this._returnTimer);
  },

  goHome() {
    wx.switchTab({ url: "/pages/home/home" });
  },

  loadItem(id) {
    const requestId = (this._loadId = (this._loadId || 0) + 1);
    this.setData({ loading: true, error: "", contact: {}, canViewContact: false });
    return readResult(
      () => getItem(id),
      (item) => {
        if (this._unloaded || requestId !== this._loadId) return;
        this.setData({ loading: false });
        if (!item || !item.id) {
          this.setData({
            item: {},
            contact: {},
            canViewContact: false,
            isOwner: false,
            missing: true,
            gallery: [],
            currentImage: 0
          });
          return;
        }

        const urls = (item.images && item.images.length ? item.images : [item.cover_image_url]).filter(
          Boolean
        );
        const sameGallery =
          this.data.item.id === item.id &&
          this.data.gallery.length === urls.length &&
          this.data.gallery.every((entry, index) => entry.url === urls[index]);
        const gallery = urls.map((url, index) => ({
          index,
          url,
          failed: sameGallery ? this.data.gallery[index].failed : false
        }));
        this.setData(
          {
            item,
            isOwner: isItemOwner(item),
            missing: false,
            gallery,
            currentImage: sameGallery ? this.data.currentImage : 0
          },
          () => this.loadContact()
        );
      },
      (error) => {
        if (!this._unloaded && requestId === this._loadId)
          this.setData({
            loading: false,
            error: error.message || "加载失败，请重试",
            contact: {},
            isOwner: false
          });
      }
    );
  },

  retryLoad() {
    return this.loadItem(this.data.id);
  },

  onGalleryChange(event) {
    const index = Number(event.detail.current);
    if (Number.isInteger(index) && index >= 0 && index < this.data.gallery.length) {
      this.setData({ currentImage: index });
    }
  },

  onImageError(event) {
    const index = Number(event.currentTarget.dataset.index);
    const url = event.currentTarget.dataset.url;
    const image = this.data.gallery[index];
    if (!image || (url && image.url !== url)) return;
    this.setData({
      gallery: this.data.gallery.map((entry) => (entry.index === index ? { ...entry, failed: true } : entry))
    });
  },

  previewImages(event = {}) {
    const requestedIndex = event.currentTarget && event.currentTarget.dataset.index;
    const index = requestedIndex === undefined ? this.data.currentImage : Number(requestedIndex);
    const current = this.data.gallery[index];
    if (!current) return;
    if (current.failed) {
      wx.showToast({ title: "图片暂时无法预览", icon: "none" });
      return;
    }
    const urls = this.data.gallery.filter((entry) => !entry.failed).map((entry) => entry.url);

    wx.previewImage({
      current: current.url,
      urls,
      fail: () => wx.showToast({ title: "图片暂时无法预览", icon: "none" })
    });
  },

  loadContact() {
    const allowed = canViewContact();
    const userId = (getCurrentUser() || {}).id;
    const itemId = this.data.id;
    const requestId = (this._contactId = (this._contactId || 0) + 1);
    this.setData({ canViewContact: allowed, contact: {}, contactError: "", contactLoading: allowed });
    if (!allowed || !this.data.item.id) {
      this.setData({ contactLoading: false });
      return;
    }
    return readResult(
      () => getItemContact(this.data.id),
      (contact) => {
        if (
          !this._unloaded &&
          requestId === this._contactId &&
          this.data.id === itemId &&
          canViewContact() &&
          (getCurrentUser() || {}).id === userId
        )
          this.setData({ contact, contactLoading: false });
      },
      (error) => {
        if (this._unloaded || requestId !== this._contactId) return;
        this.setData({
          contact: {},
          canViewContact: canViewContact(),
          contactLoading: false,
          contactError: error.message || "联系方式加载失败"
        });
        wx.showToast({ title: error.message || "联系方式加载失败，请重试", icon: "none" });
      }
    );
  },

  copyWechat() {
    if (!canViewContact()) {
      this.loadContact();
      wx.showToast({ title: "登录后查看联系方式", icon: "none" });
      return;
    }

    if (this._copying) return;
    this._copying = true;
    const userId = getCurrentUser().id;
    return readResult(
      () => getItemContact(this.data.id),
      (contact) => {
        this._copying = false;
        if (this._unloaded || !canViewContact() || (getCurrentUser() || {}).id !== userId) return;
        const item = this.data.item;
        if (!item) {
          this.loadItem(this.data.id);
          return;
        }
        const wechatId = contact.wechat_id;
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
      (error) => {
        this._copying = false;
        this.loadContact();
        if (!this._unloaded)
          wx.showToast({ title: error.message || "联系方式加载失败，请重试", icon: "none" });
      }
    );
  },

  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },

  ensureOwnerAction() {
    const item = isCloudMode() ? this.data.item : getItem(this.data.id);
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
    if (this._favoriteBusy) return;
    this._favoriteBusy = true;
    const failed = () => {
      this._favoriteBusy = false;
      wx.showToast({ title: "收藏失败，请重试", icon: "none" });
    };
    return readResult(
      () => getItem(this.data.id),
      (item) => {
        if (!item) {
          this.loadItem(this.data.id);
          this._favoriteBusy = false;
          return;
        }
        return readResult(
          () => (item.is_favorited ? unfavoriteItem(this.data.id) : favoriteItem(this.data.id)),
          (nextItem) => {
            this._favoriteBusy = false;
            if (!nextItem) throw new Error("收藏未保存");
            if (this._unloaded) return;

            this.setData({ item: nextItem });
            wx.showToast({
              title: nextItem.is_favorited ? "已收藏" : "已取消收藏",
              icon: "none"
            });
          },
          failed
        );
      },
      failed
    );
  },

  markSold() {
    if (!this.ensureOwnerAction()) return;
    this.updateStatus("sold", "已标记售出");
  },

  manageStatus() {
    if (!this.ensureOwnerAction()) return;
    const item = this.data.item;
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

        if (this._mutating) return;
        this._mutating = true;
        return readResult(
          () => deleteItem(this.data.id),
          (item) => {
            if (!item) throw new Error("删除失败");
            this._mutating = false;
            if (this._unloaded) return;

            this.loadItem(this.data.id);
            wx.showToast({ title: "已删除", icon: "none" });
            this._returnTimer = setTimeout(() => this.goHome(), 500);
          },
          (error) => {
            this._mutating = false;
            if (this._unloaded) return;
            this.setData({ isOwner: isItemOwner(this.data.item), canViewContact: canViewContact() });
            if (!canViewContact()) this.setData({ contact: {} });
            wx.showToast({ title: isCloudMode() ? error.message : "删除失败，请重试", icon: "none" });
          }
        );
      }
    });
  },

  updateStatus(status, toastTitle) {
    if (!this.ensureOwnerAction()) return;
    if (this._mutating) return;
    this._mutating = true;
    return readResult(
      () => markItemStatus(this.data.id, status),
      (item) => {
        if (!item) throw new Error("更新失败");
        this._mutating = false;
        if (this._unloaded) return;

        this.loadItem(this.data.id);
        wx.showToast({ title: toastTitle });
      },
      (error) => {
        this._mutating = false;
        if (this._unloaded) return;
        this.setData({ isOwner: isItemOwner(this.data.item), canViewContact: canViewContact() });
        if (!canViewContact()) this.setData({ contact: {} });
        wx.showToast({ title: isCloudMode() ? error.message : "更新失败，请重试", icon: "none" });
      }
    );
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
      success: () => wx.showToast({ title: "文案已复制" }),
      fail: () => wx.showToast({ title: "复制失败，请重试", icon: "none" })
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
