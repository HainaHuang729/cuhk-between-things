const { listGroups } = require("../../services/group-service");

Page({
  data: {
    groups: [],
    error: ""
  },

  onShow() {
    this.loadGroups();
  },

  loadGroups() {
    try {
      this.setData({ groups: listGroups(), error: "" });
    } catch (error) {
      this.setData({ error: "加载失败，请重试" });
    }
  },

  goNewGroup() {
    wx.navigateTo({ url: "/pages/group-edit/group-edit" });
  },

  goGroup(event) {
    wx.navigateTo({ url: `/pages/group-detail/group-detail?id=${event.currentTarget.dataset.id}` });
  }
});
