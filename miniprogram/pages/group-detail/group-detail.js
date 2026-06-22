const { request } = require("../../utils/request");

Page({
  data: {
    id: "",
    group: {},
    contact: {}
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadGroup(options.id);
    this.loadContact(options.id);
  },

  async loadGroup(id) {
    try {
      const res = await request({ url: `/groups/${id}` });
      this.setData({ group: res.data || {} });
    } catch (error) {
      wx.showToast({ title: error.error || "加载失败", icon: "none" });
    }
  },

  async loadContact(id) {
    try {
      const res = await request({ url: `/groups/${id}/contact`, auth: true });
      this.setData({ contact: res.data || {} });
    } catch (_error) {
      this.setData({ contact: {} });
    }
  },

  async joinGroup() {
    try {
      await request({ url: `/groups/${this.data.id}/join`, method: "POST", auth: true });
      wx.showToast({ title: "已加入" });
      this.loadGroup(this.data.id);
    } catch (error) {
      wx.showToast({ title: error.error || "加入失败", icon: "none" });
    }
  },

  async leaveGroup() {
    try {
      await request({ url: `/groups/${this.data.id}/leave`, method: "POST", auth: true });
      wx.showToast({ title: "已退出" });
      this.loadGroup(this.data.id);
    } catch (error) {
      wx.showToast({ title: error.error || "退出失败", icon: "none" });
    }
  },

  copyWechat() {
    wx.setClipboardData({ data: this.data.contact.wechat_id });
  },

  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },

  goReport() {
    wx.navigateTo({
      url: `/pages/report/report?target_type=group&target_id=${this.data.id}`
    });
  },

  shareHint() {
    wx.showShareMenu({ withShareTicket: true });
  },

  onShareAppMessage() {
    const group = this.data.group;
    return {
      title: `${group.title || "CUHK拼团"} · ${group.current_size || 0}/${group.target_size || 0}`,
      path: `/pages/group-detail/group-detail?id=${this.data.id}`
    };
  }
});
