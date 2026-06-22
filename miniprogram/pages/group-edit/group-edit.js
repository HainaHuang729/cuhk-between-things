const { request } = require("../../utils/request");

Page({
  async submit(event) {
    const values = event.detail.value;
    try {
      const res = await request({
        url: "/groups",
        method: "POST",
        auth: true,
        data: {
          ...values,
          target_size: Number(values.target_size),
          total_price: values.total_price ? Number(values.total_price) : undefined,
          per_person_price: values.per_person_price
            ? Number(values.per_person_price)
            : undefined
        }
      });
      wx.redirectTo({ url: `/pages/group-detail/group-detail?id=${res.data.id}` });
    } catch (error) {
      wx.showToast({ title: error.error || "发布失败", icon: "none" });
    }
  }
});
