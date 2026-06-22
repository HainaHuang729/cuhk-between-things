const { addItem, categories, conditions, getMockUser } = require("../../utils/mock-store");

Page({
  data: {
    categories,
    conditions,
    categoryIndex: 0,
    conditionIndex: 2,
    categoryLabel: categories[0].label,
    conditionLabel: conditions[2].label,
    images: []
  },

  onCategoryChange(event) {
    const index = Number(event.detail.value);
    this.setData({ categoryIndex: index, categoryLabel: categories[index].label });
  },

  onConditionChange(event) {
    const index = Number(event.detail.value);
    this.setData({ conditionIndex: index, conditionLabel: conditions[index].label });
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
    const values = event.detail.value;

    if (!values.title || !values.price || !values.handover_location) {
      wx.showToast({ title: "标题、价格、地点必填", icon: "none" });
      return;
    }

    const user = getMockUser();
    addItem({
      title: values.title.trim(),
      price: Number(values.price),
      category: categories[this.data.categoryIndex].value,
      condition: conditions[this.data.conditionIndex].value,
      dormitory: values.handover_location.trim(),
      handover_location: values.handover_location.trim(),
      description: values.description || "",
      images: this.data.images,
      wechat_id: user ? user.wechat_id : "youwu_demo"
    });

    wx.showToast({ title: "已发布" });
    wx.reLaunch({ url: "/pages/home/home" });
  }
});
