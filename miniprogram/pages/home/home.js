const { listItems } = require("../../services/item-service");

const statusFilters = [
  { label: "全部", value: "all" },
  { label: "在售", value: "available" },
  { label: "已售", value: "sold" },
  { label: "已下架", value: "off_shelf" }
];

function buildEmptyCopy(q, status) {
  if (q) return "换个关键词试试，支持标题、描述和分类";
  if (status === "available") return "暂时没有在售商品";
  if (status === "sold") return "暂时没有已售商品";
  if (status === "off_shelf") return "暂时没有已下架商品";
  return "发布后会出现在这里";
}

Page({
  data: {
    emptyCopy: "",
    emptyTitle: "暂无商品",
    q: "",
    status: "available",
    statusFilters,
    items: [],
    loading: false
  },

  onLoad() {
    this.loadFeed();
  },

  onShow() {
    this.loadFeed();
  },

  onPullDownRefresh() {
    this.loadFeed({ showLoading: false });
    wx.stopPullDownRefresh();
  },

  onSearchInput(event) {
    const q = event.detail.value;
    this.updateFeed({ q });
  },

  onSearchConfirm() {
    const q = this.data.q.trim();
    this.updateFeed({ q });
  },

  clearSearch() {
    this.updateFeed({ q: "", status: "available" });
  },

  setStatus(event) {
    this.updateFeed({ status: event.currentTarget.dataset.status });
  },

  loadFeed(options = {}) {
    if (options.showLoading !== false) {
      this.setData({ loading: true });
    }

    this.updateFeed({
      q: this.data.q,
      status: this.data.status,
      loading: false
    });
  },

  updateFeed(next = {}) {
    const q = next.q !== undefined ? next.q : this.data.q;
    const status = next.status || this.data.status;
    const items = listItems({ q, status });

    this.setData({
      emptyCopy: buildEmptyCopy(q, status),
      emptyTitle: q ? "没有找到商品" : "暂无商品",
      items,
      loading: next.loading !== undefined ? next.loading : this.data.loading,
      q,
      status
    });
  },

  onImageError(event) {
    const id = event.currentTarget.dataset.id;
    const items = this.data.items.map((item) => (
      item.id === id ? { ...item, image_error: true } : item
    ));
    this.setData({ items });
  },

  goItem(event) {
    wx.navigateTo({ url: `/pages/item-detail/item-detail?id=${event.currentTarget.dataset.id}` });
  }
});
