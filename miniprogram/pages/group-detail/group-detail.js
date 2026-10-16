const { getGroup, joinGroup, leaveGroup, cancelGroup } = require("../../services/group-service");
const { canViewContact } = require("../../services/user-service");

Page({
  data: { id: "", group: null, contact: {}, error: "" },
  onLoad(options = {}) {
    this.setData({ id: options.id || "" });
    this.loadGroup();
  },
  onShow() {
    if (this.data.id) this.loadGroup();
  },
  loadGroup() {
    try {
      const group = getGroup(this.data.id);
      this.setData({
        group,
        error: group ? "" : "拼团已不存在",
        contact: canViewContact() && group ? { wechat_id: group.wechat_id } : {}
      });
    } catch (error) {
      this.setData({ error: "加载失败，请重试", contact: {} });
    }
  },
  act(action, title) {
    if (!canViewContact()) {
      this.goLogin();
      return;
    }
    try {
      action(this.data.id);
      this.loadGroup();
      wx.showToast({ title, icon: "success" });
    } catch (error) {
      this.loadGroup();
      wx.showToast({ title: error.message || "操作失败，请重试", icon: "none" });
    }
  },
  joinGroup() {
    this.act(joinGroup, "已加入拼团");
  },
  leaveGroup() {
    this.act(leaveGroup, "已退出拼团");
  },
  cancelGroup() {
    wx.showModal({
      title: "取消拼团",
      content: "取消后不能恢复，确定取消吗？",
      confirmText: "取消拼团",
      confirmColor: "#b42318",
      success: (result) => {
        if (result.confirm) this.act(cancelGroup, "拼团已取消");
      }
    });
  },
  copyWechat() {
    this.loadGroup();
    if (!canViewContact()) {
      this.goLogin();
      return;
    }
    if (!this.data.contact.wechat_id) {
      wx.showToast({ title: "团长暂未填写微信号", icon: "none" });
      return;
    }
    wx.setClipboardData({
      data: this.data.contact.wechat_id,
      success: () => wx.showToast({ title: "微信号已复制" }),
      fail: () => wx.showToast({ title: "复制失败，请重试", icon: "none" })
    });
  },
  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },
  copyShareText() {
    const group = this.data.group;
    if (!group) return;
    wx.setClipboardData({
      data: [
          "有物之间 · CUHK拼团（本机试用）",
        group.title,
        `人数：${group.current_size}/${group.target_size}`,
        `每人：${group.per_person_price}元`,
        `截止：${group.deadline_text}`,
        `交收：${group.handover_location}`,
        `状态：${group.status_label}`
      ].join("\n"),
      success: () => wx.showToast({ title: "文案已复制" }),
      fail: () => wx.showToast({ title: "复制失败，请重试", icon: "none" })
    });
  },
  onShareAppMessage() {
    const group = this.data.group || {};
    return {
      title: `${group.title || "CUHK拼团"} ${group.current_size || 0}/${group.target_size || 0}`,
      path: `/pages/group-detail/group-detail?id=${this.data.id}`
    };
  }
});
