const {
  categories,
  conditions,
  createItem,
  getCurrentUser,
  getItem,
  updateItem
} = require("../../services/item-service");

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
    wx.chooseMedia({
      count: 9,
      mediaType: ["image"],
      success: (res) => {
        const images = res.tempFiles.map((file) => file.tempFilePath);
        this.setData({ images });
      }
    });
  },

  submit(event) {
    if (this.data.submitting) return;

    const values = event.detail.value;

    if (!values.title || !values.price || !values.handover_location) {
      wx.showToast({ title: "标题、价格、地点必填", icon: "none" });
      return;
    }

    const user = getCurrentUser();
    const payload = {
      title: values.title.trim(),
      price: Number(values.price),
      category: categories[this.data.categoryIndex].value,
      condition: conditions[this.data.conditionIndex].value,
      dormitory: values.handover_location.trim(),
      handover_location: values.handover_location.trim(),
      description: values.description || "",
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
    wx.showToast({ title: this.data.isEdit ? "已保存" : "已发布" });
    wx.reLaunch({ url: "/pages/home/home" });
  }
});
