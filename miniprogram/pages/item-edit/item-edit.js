const {
  categories,
  conditions,
  clearItemDraft,
  createItem,
  getItem,
  getItemDraft,
  isItemOwner,
  saveItemDraft,
  saveItemImage,
  updateItem
} = require("../../services/item-service");
const { getCurrentUser, isCloudMode } = require("../../services/user-service");
const { saveLocalImage } = require("../../utils/local-image");
const { readResult } = require("../../utils/service-result");

const MAX_IMAGES = 9;

function validateForm(values) {
  const title = (values.title || "").trim();
  const priceText = String(values.price || "").trim();
  const handoverLocation = (values.handover_location || "").trim();
  const description = (values.description || "").trim();

  const errors = {};
  if (!title) errors.title = "请填写商品标题";
  if (!priceText) errors.price = "请填写价格";
  else if (!/^\d+(\.\d{1,2})?$/.test(priceText)) errors.price = "价格只能填写数字，最多两位小数";
  else if (!Number.isFinite(Number(priceText)) || Number(priceText) <= 0)
    errors.price = "请填写有效的正数价格";
  if (!handoverLocation) errors.handover_location = "请填写交收地点";
  const firstField = Object.keys(errors)[0];
  if (firstField) return { errors, error: errors[firstField], firstField };

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
    submitting: false,
    savingDraft: false,
    loading: false,
    errors: {},
    focusField: ""
  },

  onLoad(options = {}) {
    if (!options.id) {
      if (isCloudMode() && !getCurrentUser()) wx.navigateTo({ url: "/pages/login/login" });
      else this.restoreDraft();
      return;
    }

    this.setData({ itemId: options.id, isEdit: true, loading: true });
    return readResult(
      () => getItem(options.id),
      (item) => {
        if (this._unloaded) return;
        this.setData({ loading: false });
        if (!item) {
          this.setData({ unavailableReason: "商品已删除或不存在" });
          return;
        }

        if (!isItemOwner(item)) {
          this.setData({ unavailableReason: "只有发布者可编辑" });
          return;
        }

        const categoryIndex = Math.max(
          0,
          categories.findIndex((entry) => entry.value === item.category)
        );
        const conditionIndex = Math.max(
          0,
          conditions.findIndex((entry) => entry.value === item.condition)
        );
        this._editableItem = item;

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
      (error) => {
        if (!this._unloaded)
          this.setData({ loading: false, unavailableReason: error.message || "加载失败，请返回重试" });
      }
    );
  },

  onShow() {
    if (!this.data.isEdit && !this._draftChecked && (!isCloudMode() || getCurrentUser())) this.restoreDraft();
  },

  onUnload() {
    this._unloaded = true;
    clearTimeout(this._returnTimer);
  },

  restoreDraft() {
    this._draftChecked = true;
    let draft;
    try {
      draft = getItemDraft();
    } catch (error) {
      wx.showToast({ title: "草稿读取失败，可继续发布", icon: "none" });
      return;
    }
    if (!draft) return;
    const userId = (getCurrentUser() || {}).id;
    wx.showModal({
      title: "继续上次发布？",
      content: "有一份未发布的草稿。",
      confirmText: "继续编辑",
      cancelText: "重新填写",
      success: (result) => {
        if (this._unloaded) return;
        if ((getCurrentUser() || {}).id !== userId) return;
        if (!result.confirm) {
          try {
            clearItemDraft();
          } catch (error) {
            wx.showToast({ title: "草稿清除失败，请重试", icon: "none" });
          }
          return;
        }
        const categoryIndex = Math.max(
          0,
          categories.findIndex((entry) => entry.value === draft.category)
        );
        const conditionIndex = Math.max(
          0,
          conditions.findIndex((entry) => entry.value === draft.condition)
        );
        this.setData({
          form: {
            title: draft.title || "",
            price: draft.price || "",
            handover_location: draft.handover_location || "",
            description: draft.description || ""
          },
          images: Array.isArray(draft.images) ? draft.images.slice(0, MAX_IMAGES) : [],
          categoryIndex,
          conditionIndex,
          categoryLabel: categories[categoryIndex].label,
          conditionLabel: conditions[conditionIndex].label
        });
      }
    });
  },

  async saveDraft() {
    if (this.data.isEdit || this.data.submitting || this.data.selectingImages || this._saved) return;
    if (!this.data.images.length && !Object.values(this.data.form).some((value) => String(value).trim())) {
      wx.showToast({ title: "还没有可保存的内容", icon: "none" });
      return;
    }
    this.setData({ submitting: true, savingDraft: true });
    const userId = (getCurrentUser() || {}).id;
    wx.showLoading({ title: "保存草稿", mask: true });
    try {
      const images = await this.saveImages(true);
      if (this._unloaded) return;
      if ((getCurrentUser() || {}).id !== userId) throw new Error("登录状态已变化，请重新保存草稿");
      saveItemDraft({
        ...this.data.form,
        images,
        category: categories[this.data.categoryIndex].value,
        condition: conditions[this.data.conditionIndex].value
      });
      wx.showToast({ title: "草稿已保存", icon: "success" });
    } catch (error) {
      if (!this._unloaded) wx.showToast({ title: error.message || "草稿保存失败，请重试", icon: "none" });
    } finally {
      wx.hideLoading();
      if (!this._unloaded) this.setData({ submitting: false, savingDraft: false });
    }
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
    this.setData({ [`form.${field}`]: event.detail.value, [`errors.${field}`]: "" });
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
    if (this.data.loading) return false;
    if (this.data.unavailableReason) {
      wx.showToast({ title: this.data.unavailableReason, icon: "none" });
      return false;
    }
    if (!this.data.isEdit) {
      if (isCloudMode() && !getCurrentUser()) {
        wx.navigateTo({ url: "/pages/login/login" });
        return false;
      }
      return true;
    }

    const item = isCloudMode() ? this._editableItem : getItem(this.data.itemId);
    if (item && isItemOwner(item)) return true;
    this.setData({ unavailableReason: item ? "只有发布者可编辑" : "商品已删除或不存在" });
    wx.showToast({ title: this.data.unavailableReason, icon: "none" });
    return false;
  },

  async saveImages(localOnly = false) {
    const images = this.data.images.slice();
    for (let index = 0; index < images.length; index += 1) {
      try {
        images[index] = await (localOnly ? saveLocalImage(images[index]) : saveItemImage(images[index]));
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
      this.setData({ errors: validated.errors, focusField: "" }, () => {
        if (!this._unloaded) this.setData({ focusField: validated.firstField });
      });
      wx.showToast({ title: validated.error, icon: "none" });
      return;
    }

    this.setData({ errors: {}, focusField: "" });
    const data = validated.data;
    wx.showLoading({ title: this.data.isEdit ? "保存中" : "发布中", mask: true });
    this.setData({ submitting: true });

    let saved = false;
    let failureMessage = "";
    let draftCleared = true;
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
        wechat_id: user ? user.wechat_id : "youwu_demo",
        request_id:
          this._requestId ||
          (this._requestId = `publish-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`)
      };
      const item = await (this.data.isEdit ? updateItem(this.data.itemId, payload) : createItem(payload));
      if (!item) throw new Error("商品未保存，请重试");

      this._saved = true;
      saved = true;
      if (!this.data.isEdit && (getCurrentUser() || {}).id === (user || {}).id) {
        try {
          clearItemDraft();
        } catch (error) {
          draftCleared = false;
        }
      }
    } catch (error) {
      failureMessage = error.message || "保存失败，请重试";
    } finally {
      wx.hideLoading();
      if (!saved && !this._unloaded) this.setData({ submitting: false });
    }
    if (this._unloaded) return;
    if (!saved) {
      wx.showToast({ title: failureMessage, icon: "none" });
      return;
    }
    wx.showToast({
      title: !draftCleared ? "已发布，草稿未清除" : this.data.isEdit ? "保存好了" : "发布成功",
      icon: draftCleared ? "success" : "none"
    });
    this._returnTimer = setTimeout(() => this.goHome(), 700);
  }
});
