const { request } = require("../../utils/request");

Page({
  data: {
    activeType: "items",
    items: [
      {
        id: "mock-item-1",
        title: "Dell 27寸显示器",
        price: 500,
        dormitory: "56座",
        handover_location: "伍宜孙56座大堂"
      },
      {
        id: "mock-item-2",
        title: "IKEA椅子",
        price: 80,
        dormitory: "23座",
        handover_location: "23座门口"
      },
      {
        id: "mock-item-3",
        title: "宿舍台灯",
        price: 40,
        dormitory: "39座",
        handover_location: "楼下"
      },
      {
        id: "mock-item-4",
        title: "小冰箱",
        price: 280,
        dormitory: "研究生宿舍",
        handover_location: "大堂"
      }
    ],
    groups: [
      {
        id: "mock-group-1",
        title: "Costco纸巾",
        source_platform: "Costco",
        target_size: 6,
        current_size: 4,
        dormitory: "56座"
      },
      {
        id: "mock-group-2",
        title: "IKEA拼车",
        source_platform: "IKEA",
        target_size: 4,
        current_size: 2,
        dormitory: "23座"
      }
    ],
    wantedItems: [
      {
        id: "wanted-1",
        title: "求购显示器",
        budget: "HKD 400",
        dormitory: "56座"
      },
      {
        id: "wanted-2",
        title: "求购教材",
        budget: "预算可议",
        dormitory: "23座"
      }
    ]
  },

  onLoad() {
    this.loadFeed();
  },

  onPullDownRefresh() {
    this.loadFeed().finally(() => wx.stopPullDownRefresh());
  },

  setType(event) {
    this.setData({ activeType: event.currentTarget.dataset.type });
  },

  async loadFeed() {
    try {
      const [itemsRes, groupsRes] = await Promise.all([
        request({ url: "/items" }),
        request({ url: "/groups" })
      ]);

      this.setData({
        items: itemsRes.data && itemsRes.data.length ? itemsRes.data : this.data.items,
        groups: groupsRes.data && groupsRes.data.length ? groupsRes.data : this.data.groups
      });
    } catch (error) {
      console.warn("Feed API unavailable, using local preview data.", error);
    }
  },

  goItem(event) {
    wx.navigateTo({ url: `/pages/item-detail/item-detail?id=${event.currentTarget.dataset.id}` });
  },

  goGroup(event) {
    wx.navigateTo({ url: `/pages/group-detail/group-detail?id=${event.currentTarget.dataset.id}` });
  },

  goNewItem() {
    wx.navigateTo({ url: "/pages/item-edit/item-edit" });
  }
});
