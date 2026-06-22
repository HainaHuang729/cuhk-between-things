const { request } = require("../../utils/request");

const previewItems = {
  "mock-item-1": {
    title: "Dell 27寸显示器",
    price: 500,
    category: "电子产品",
    condition: "良好",
    dormitory: "56座",
    handover_location: "伍宜孙56座大堂",
    description: "状态良好，含 HDMI 线。"
  },
  "mock-item-2": {
    title: "IKEA椅子",
    price: 80,
    category: "家具",
    condition: "可用",
    dormitory: "23座",
    handover_location: "23座门口",
    description: "搬宿出，轻微使用痕迹。"
  },
  "mock-item-3": {
    title: "宿舍台灯",
    price: 40,
    category: "宿舍用品",
    condition: "良好",
    dormitory: "39座",
    handover_location: "楼下",
    description: "亮度稳定，可直接使用。"
  },
  "mock-item-4": {
    title: "小冰箱",
    price: 280,
    category: "宿舍用品",
    condition: "可用",
    dormitory: "研究生宿舍",
    handover_location: "大堂",
    description: "适合宿舍使用，需自取。"
  },
  "mock-item-5": {
    title: "教材 ECON2011",
    price: 120,
    category: "教材",
    condition: "良好",
    dormitory: "联合",
    handover_location: "大学站",
    description: "少量笔记，整体干净。"
  },
  "mock-item-6": {
    title: "收纳箱两只",
    price: 35,
    category: "宿舍用品",
    condition: "可用",
    dormitory: "39座",
    handover_location: "楼下",
    description: "两个一起出，适合搬宿。"
  }
};

Page({
  data: {
    id: "",
    item: {},
    contact: {}
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadItem(options.id);
    this.loadContact(options.id);
  },

  async loadItem(id) {
    if (previewItems[id]) {
      this.setData({ item: previewItems[id] });
      return;
    }

    try {
      const res = await request({ url: `/items/${id}` });
      this.setData({ item: res.data || {} });
    } catch (error) {
      wx.showToast({ title: error.error || "加载失败", icon: "none" });
    }
  },

  async loadContact(id) {
    try {
      const res = await request({ url: `/items/${id}/contact`, auth: true });
      this.setData({ contact: res.data || {} });
    } catch (_error) {
      this.setData({ contact: {} });
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
      url: `/pages/report/report?target_type=item&target_id=${this.data.id}`
    });
  },

  shareHint() {
    wx.showShareMenu({ withShareTicket: true });
  },

  onShareAppMessage() {
    const item = this.data.item;
    return {
      title: `${item.title || "CUHK二手商品"} · HKD ${item.price || ""}`,
      path: `/pages/item-detail/item-detail?id=${this.data.id}`
    };
  }
});
