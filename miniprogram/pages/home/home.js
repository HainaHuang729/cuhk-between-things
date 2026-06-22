const { request } = require("../../utils/request");

const previewItems = [
  {
    id: "mock-item-0",
    title: "螺蛳粉",
    price: 10,
    dormitory: "宿舍自取",
    handover_location: "宿舍楼下",
    cover_image_url: "/assets/items/luosifen.svg"
  },
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
  },
  {
    id: "mock-item-5",
    title: "教材 ECON2011",
    price: 120,
    dormitory: "联合",
    handover_location: "大学站"
  },
  {
    id: "mock-item-6",
    title: "收纳箱两只",
    price: 35,
    dormitory: "39座",
    handover_location: "楼下"
  }
];

function filterPreviewItems(q) {
  const keyword = q.trim().toLowerCase();
  if (!keyword) return previewItems;

  return previewItems.filter((item) => {
    const text = `${item.title} ${item.price} ${item.dormitory} ${item.handover_location}`.toLowerCase();
    return text.includes(keyword);
  });
}

Page({
  data: {
    q: "",
    items: previewItems
  },

  onLoad() {
    this.loadFeed();
  },

  onPullDownRefresh() {
    this.loadFeed().finally(() => wx.stopPullDownRefresh());
  },

  onSearchInput(event) {
    const q = event.detail.value;
    this.setData({ q, items: filterPreviewItems(q) });
  },

  async loadFeed() {
    try {
      const query = this.data.q ? `?q=${encodeURIComponent(this.data.q)}` : "";
      const itemsRes = await request({ url: `/items${query}` });

      this.setData({
        items: itemsRes.data && itemsRes.data.length ? itemsRes.data : filterPreviewItems(this.data.q)
      });
    } catch (error) {
      console.warn("Feed API unavailable, using local preview data.", error);
      this.setData({ items: filterPreviewItems(this.data.q) });
    }
  },

  goItem(event) {
    wx.navigateTo({ url: `/pages/item-detail/item-detail?id=${event.currentTarget.dataset.id}` });
  }
});
