const { request } = require("../../utils/request");

const reasons = [
  { value: "scam", label: "诈骗" },
  { value: "fake_item", label: "虚假商品" },
  { value: "harassment", label: "骚扰" },
  { value: "inappropriate", label: "不当内容" },
  { value: "other", label: "其他" }
];

Page({
  data: {
    target_type: "",
    target_id: "",
    reasons,
    reasonIndex: 0,
    reasonLabel: reasons[0].label
  },

  onLoad(options) {
    this.setData({
      target_type: options.target_type,
      target_id: options.target_id
    });
  },

  onReasonChange(event) {
    const index = Number(event.detail.value);
    this.setData({ reasonIndex: index, reasonLabel: reasons[index].label });
  },

  async submit(event) {
    const reason = reasons[this.data.reasonIndex].value;
    const targetType = this.data.target_type;
    const payload = {
      target_type: targetType,
      reason,
      description: event.detail.value.description
    };

    if (targetType === "item") payload.target_item_id = this.data.target_id;
    if (targetType === "group") payload.target_group_id = this.data.target_id;
    if (targetType === "user") payload.target_user_id = this.data.target_id;

    try {
      await request({ url: "/reports", method: "POST", auth: true, data: payload });
      wx.showToast({ title: "已提交" });
      wx.navigateBack();
    } catch (error) {
      wx.showToast({ title: error.error || "提交失败", icon: "none" });
    }
  }
});
