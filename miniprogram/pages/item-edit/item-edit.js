const {
  categories,
  conditions,
  createItem,
  getItem,
  isItemOwner,
  updateItem
} = require("../../services/item-service");
const { getCurrentUser } = require("../../services/user-service");
const { saveLocalImage } = require("../../utils/local-image");

const MAX_IMAGES = 9;

function validateForm(values) {
  const title = (values.title || "").trim();
  const priceText = String(values.price || "").trim();
  const handoverLocation = (values.handover_location || "").trim();
  const description = (values.description || "").trim();

  if (!title) return { error: "请填写商品标题" };
  if (!priceText) return { error: "请填写价格" };
  if (!/^\d+(\.\d{1,2})?$/.test(priceText)) return { error: "价格只能填写数字" };
  if (!Number.isFinite(Number(priceText)) || Number(priceText) <= 0) return { error: "请填写有效的正数价格" };
  if (!handoverLocation) return { error: "请填写交收地点" };

  return {
    data: {
      description,
      handover_location: handoverLocation,
      price: Number(priceText),
      title
    }
  };
}

function isCancelError(error) {
  return error && error.errMsg && error.errMsg.includes("cancel");
}

Page({
  data: {
    categories,
    conditions,
    categoryIndex: 0,
    conditionIndex: 2,
    categoryLabel: categories[0].label,
    conditionLabel: conditions[2].label,
    images: [],
    itemId: "",
    form: {
      title: "",
      price: "",
      handover_location: "",
      description: ""
    },
    isEdit: false,
    unavailableReason: "",
    selectingImages: false,
    submitting: false
  },

  onLoad(options = {}) {
    if (!options.id) return;

    this.setData({ itemId: options.id, isEdit: true });
    const item = getItem(options.id);
    if (!item) {
      this.setData({ unavailableReason: "商品已删除或不存在" });
      return;
    }

    if (!isItemOwner(item)) {
      this.setData({ unavailableReason: "只有发布者可编辑" });
      return;
    }

    const categoryIndex = Math.max(0, categories.findIndex((entry) => entry.value === item.category));
    const conditionIndex = Math.max(0, conditions.findIndex((entry) => entry.value === item.condition));

    this.setData({
      itemId: item.id,
      isEdit: true,
      categoryIndex,
      conditionIndex,
      categoryLabel: categories[categoryIndex].label,
      conditionLabel: conditions[conditionIndex].label,
      images: item.images || [],
      form: {
        title: item.title,
        price: String(item.price),
        handover_location: item.handover_location,
        description: item.description
      }
    });
  },

  onUnload() {
    this._unloaded = true;
    clearTimeout(this._returnTimer);
  },

  goHome() {
    wx.switchTab({
      url: "/pages/home/home",
      fail: () => {
        this.setData({ submitting: false });
        wx.showToast({ title: this._saved ? "已保存，请返回首页查看" : "返回失败，请重试", icon: "none" });
      }
    });
  },

  onCategoryChange(event) {
    const index = Number(event.detail.value);
    this.setData({ categoryIndex: index, categoryLabel: categories[index].label });
  },

  onConditionChange(event) {
    const index = Number(event.detail.value);
    this.setData({ conditionIndex: index, conditionLabel: conditions[index].label });
  },

  onFieldInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  appendImages(paths) {
    const picked = paths.filter((path) => typeof path === "string" && path);
    const images = [...new Set(this.data.images.concat(picked))].slice(0, MAX_IMAGES);
    this.setData({ images });
  },

  removeImage(event) {
    if (this.data.submitting || this.data.selectingImages) return;
    const index = Number(event.currentTarget.dataset.index);
    this.setData({ images: this.data.images.filter((path, position) => position !== index) });
  },

  previewImage(event) {
    const current = this.data.images[Number(event.currentTarget.dataset.index)];
    if (current) wx.previewImage({ current, urls: this.data.images });
  },

  chooseImagesFallback(remaining) {
    wx.chooseImage({
      count: remaining,
      sizeType: ["compressed", "original"],
      sourceType: ["album", "camera"],
      success: (res) => {
        this.appendImages(res.tempFilePaths || []);
      },
      fail: (error) => {
        if (isCancelError(error)) return;
        wx.showToast({ title: "图片选择失败", icon: "none" });
      },
      complete: () => this.setData({ selectingImages: false })
    });
  },

  chooseImages() {
    if (this.data.submitting || this.data.selectingImages) return;
    const remaining = MAX_IMAGES - this.data.images.length;
    if (remaining <= 0) {
      wx.showToast({ title: "最多上传9张图片", icon: "none" });
      return;
    }

    this.setData({ selectingImages: true });
    if (!wx.chooseMedia) {
      this.chooseImagesFallback(remaining);
      return;
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const picked = (res.tempFiles || []).map((file) => file.tempFilePath);
        this.appendImages(picked);
        this.setData({ selectingImages: false });
      },
      fail: (error) => {
        if (isCancelError(error)) {
          this.setData({ selectingImages: false });
          return;
        }
        this.chooseImagesFallback(remaining);
      }
    });
  },

  canSave() {
    if (this.data.unavailableReason) {
      wx.showToast({ title: this.data.unavailableReason, icon: "none" });
      return false;
    }
    if (!this.data.isEdit) return true;

    const item = getItem(this.data.itemId);
    if (item && isItemOwner(item)) return true;
    this.setData({ unavailableReason: item ? "只有发布者可编辑" : "商品已删除或不存在" });
    wx.showToast({ title: this.data.unavailableReason, icon: "none" });
    return false;
  },

  async saveImages() {
    const images = this.data.images.slice();
    for (let index = 0; index < images.length; index += 1) {
      try {
        images[index] = await saveLocalImage(images[index]);
      } catch (error) {
        throw new Error(`第${index + 1}张图片保存失败，请重新选择`);
      }
      // saveFile moves temporary files; retain each saved path if a later file fails.
      if (!this._unloaded) this.setData({ images: images.slice() });
    }
    return images;
  },

  async submit(event) {
    if (this.data.submitting || this.data.selectingImages) return;
    if (this._saved) {
      this.goHome();
      return;
    }
    if (!this.canSave()) return;

    const values = event.detail.value;
    const validated = validateForm(values);
    if (validated.error) {
      wx.showToast({ title: validated.error, icon: "none" });
      return;
    }

    const data = validated.data;
    wx.showLoading({ title: this.data.isEdit ? "保存中" : "发布中", mask: true });
    this.setData({ submitting: true });

    let saved = false;
    let failureMessage = "";
    try {
      const images = await this.saveImages();
      if (this._unloaded) return;
      if (!this.canSave()) throw new Error(this.data.unavailableReason);
      const user = getCurrentUser();
      const payload = {
        ...data,
        category: categories[this.data.categoryIndex].value,
        condition: conditions[this.data.conditionIndex].value,
        dormitory: data.handover_location,
        images,
        wechat_id: user ? user.wechat_id : "youwu_demo"
      };
      const item = this.data.isEdit
        ? updateItem(this.data.itemId, payload)
        : createItem(payload);
      if (!item) throw new Error("商品未保存，请重试");

      this._saved = true;
      saved = true;
    } catch (error) {
      failureMessage = error.message || "保存失败，请重试";
    } finally {
      wx.hideLoading();
      if (!saved && !this._unloaded) this.setData({ submitting: false });
    }
    if (!saved) {
      wx.showToast({ title: failureMessage, icon: "none" });
      return;
    }
    wx.showToast({ title: this.data.isEdit ? "保存好了" : "发布成功", icon: "success" });
    this._returnTimer = setTimeout(() => this.goHome(), 700);
  }
});
