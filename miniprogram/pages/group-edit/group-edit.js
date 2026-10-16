const { createGroup } = require("../../services/group-service");
const { isLoggedIn } = require("../../services/user-service");

function localDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

Page({
  data: { date: "", time: "20:00", minDate: "", submitting: false, error: "" },
  onLoad() {
    this.setData({ minDate: localDate(new Date()), date: localDate(new Date(Date.now() + 86400000)) });
  },
  onDateChange(event) {
    this.setData({ date: event.detail.value });
  },
  onTimeChange(event) {
    this.setData({ time: event.detail.value });
  },
  submit(event) {
    if (this.data.submitting) return;
    if (this._createdId) {
      this.goDetail();
      return;
    }
    if (!isLoggedIn()) {
      wx.navigateTo({ url: "/pages/login/login" });
      return;
    }
    this.setData({ submitting: true, error: "" });
    try {
      const [year, month, day] = this.data.date.split("-").map(Number);
      const [hour, minute] = this.data.time.split(":").map(Number);
      const deadline = new Date(year, month - 1, day, hour, minute);
      const group = createGroup({ ...event.detail.value, deadline_at: deadline.toISOString() });
      this._createdId = group.id;
      wx.showToast({ title: "拼团已发起", icon: "success" });
      this.goDetail();
    } catch (error) {
      this.setData({ submitting: false, error: error.message || "发布失败，请重试" });
    }
  },
  goDetail() {
    wx.redirectTo({
      url: `/pages/group-detail/group-detail?id=${this._createdId}`,
      fail: () => {
        this.setData({ submitting: false });
        wx.showToast({ title: "已发起，请返回拼团查看", icon: "none" });
      }
    });
  }
});
