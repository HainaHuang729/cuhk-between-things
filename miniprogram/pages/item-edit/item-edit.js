const { request } = require("../../utils/request");

const categories = [
  { value: "electronics", label: "电子产品" },
  { value: "furniture", label: "家具" },
  { value: "dorm", label: "宿舍用品" },
  { value: "kitchen", label: "厨房用品" },
  { value: "textbook", label: "教材" },
  { value: "clothing", label: "衣物" },
  { value: "sports", label: "运动用品" },
  { value: "other", label: "其他" }
];

const conditions = [
  { value: "new", label: "全新" },
  { value: "like_new", label: "几乎全新" },
  { value: "good", label: "良好" },
  { value: "usable", label: "可用" },
  { value: "flawed", label: "有瑕疵" }
];

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
      success: (res) => this.setData({ images: res.tempFiles })
    });
  },

  async submit(event) {
    const values = event.detail.value;
    try {
      const res = await request({
        url: "/items",
        method: "POST",
        auth: true,
        data: {
          ...values,
          price: Number(values.price),
          category: categories[this.data.categoryIndex].value,
          condition: conditions[this.data.conditionIndex].value
        }
      });
      wx.redirectTo({ url: `/pages/item-detail/item-detail?id=${res.data.id}` });
    } catch (error) {
      wx.showToast({ title: error.error || "发布失败", icon: "none" });
    }
  }
});
