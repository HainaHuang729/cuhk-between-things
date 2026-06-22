const {
  categories,
  conditions,
  createItem,
  getItem,
  updateItem
} = require("../../services/item-service");
const { getCurrentUser } = require("../../services/user-service");

const MAX_IMAGES = 9;

function validateForm(values) {
  const title = (values.title || "").trim();
  const priceText = String(values.price || "").trim();
  const handoverLocation = (values.handover_location || "").trim();
  const description = (values.description || "").trim();

  if (!title) return { error: "请填写商品标题" };
  if (!priceText) return { error: "请填写价格" };
  if (!/^\d+(\.\d{1,2})?$/.test(priceText)) return { error: "价格只能填写数字" };
  if (Number(priceText) <= 0) return { error: "价格需大于0" };
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
    submitting: false
  },

  onLoad(options) {
    if (!options.id) return;

    const item = getItem(options.id);
    if (!item) {
      wx.showToast({ title: "商品不存在", icon: "none" });
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

  chooseImages() {
    const remaining = MAX_IMAGES - this.data.images.length;
    if (remaining <= 0) {
      wx.showToast({ title: "最多上传9张图片", icon: "none" });
      return;
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ["image"],
      success: (res) => {
        const picked = res.tempFiles.map((file) => file.tempFilePath);
        const images = this.data.images.concat(picked).slice(0, MAX_IMAGES);
        this.setData({ images });
      }
    });
  },

  submit(event) {
    if (this.data.submitting) return;

    const values = event.detail.value;
    const validated = validateForm(values);
    if (validated.error) {
      wx.showToast({ title: validated.error, icon: "none" });
      return;
    }

    const user = getCurrentUser();
    const data = validated.data;

    const payload = {
      title: data.title,
      price: data.price,
      category: categories[this.data.categoryIndex].value,
      condition: conditions[this.data.conditionIndex].value,
      dormitory: data.handover_location,
      handover_location: data.handover_location,
      description: data.description,
      images: this.data.images,
      wechat_id: user ? user.wechat_id : "youwu_demo"
    };

    wx.showLoading({ title: this.data.isEdit ? "保存中" : "发布中", mask: true });
    this.setData({ submitting: true });

    if (this.data.isEdit) {
      updateItem(this.data.itemId, payload);
    } else {
      createItem(payload);
    }

    wx.hideLoading();
    this.setData({ submitting: false });
    wx.showToast({ title: this.data.isEdit ? "保存好了" : "发布成功", icon: "success" });
    setTimeout(() => {
      wx.switchTab({ url: "/pages/home/home" });
    }, 700);
  }
});
