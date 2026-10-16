const { listItems } = require("../../services/item-service");
const { buildMasonryColumns } = require("../../utils/masonry");
const { readResult } = require("../../utils/service-result");
const { isCloudMode } = require("../../services/user-service");

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
    columns: buildMasonryColumns([]),
    loading: false,
    error: ""
  },

  onLoad() {
    this.loadFeed();
  },

  onShow() {
    this.loadFeed();
  },

  onPullDownRefresh() {
    this._imageErrors = new Set();
    const pending = this.loadFeed({ showLoading: false });
    if (pending && pending.then) return pending.finally(() => wx.stopPullDownRefresh());
    wx.stopPullDownRefresh();
  },

  onSearchInput(event) {
    const q = event.detail.value;
    if (isCloudMode()) {
      clearTimeout(this._searchTimer);
      this._requestId = (this._requestId || 0) + 1;
      this.setData(q.trim() ? { q } : { q, status: "available" });
      this._searchTimer = setTimeout(() => this.updateFeed(), 250);
      return;
    }
    this.updateFeed(q.trim() ? { q } : { q, status: "available" });
  },

  onSearchConfirm() {
    clearTimeout(this._searchTimer);
    const q = this.data.q.trim();
    this.updateFeed({ q });
    wx.hideKeyboard();
  },

  clearSearch() {
    clearTimeout(this._searchTimer);
    this.updateFeed({ q: "", status: "available" });
  },

  setStatus(event) {
    this.updateFeed({ status: event.currentTarget.dataset.status });
  },

  loadFeed(options = {}) {
    return this.updateFeed({ loading: options.showLoading !== false });
  },

  updateFeed(next = {}) {
    const q = next.q !== undefined ? next.q : this.data.q;
    const status = next.status || this.data.status;
    const requestId = (this._requestId = (this._requestId || 0) + 1);
    this.setData({ q, status, loading: next.loading !== false, error: "" });
    return readResult(
      () => listItems({ q, status }),
      (results) => {
        if (this._unloaded || requestId !== this._requestId) return;
        const items = results.map((item) => ({
          ...item,
          image_error: Boolean(this._imageErrors && this._imageErrors.has(item.cover_image_url))
        }));

        this.setData({
          emptyCopy: buildEmptyCopy(q.trim(), status),
          emptyTitle: q.trim() ? "没有找到商品" : "暂无商品",
          items,
          columns: buildMasonryColumns(items, this._imageSizes),
          loading: false,
          q,
          status
        });
      },
      (error) => {
        if (!this._unloaded && requestId === this._requestId)
          this.setData({ loading: false, error: error.message || "加载失败，请重试" });
      }
    );
  },

  onUnload() {
    this._unloaded = true;
    clearTimeout(this._searchTimer);
  },

  onImageLoad(event) {
    const item = this.data.items.find((entry) => entry.id === event.currentTarget.dataset.id);
    const { width, height } = event.detail;
    if (
      !item ||
      !item.cover_image_url ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    )
      return;
    this._imageSizes = this._imageSizes || {};
    this._imageSizes[item.cover_image_url] = { width, height };
    // Use known ratios on the next feed update without moving cards while browsing.
  },

  onImageError(event) {
    const id = event.currentTarget.dataset.id;
    const failed = this.data.items.find((item) => item.id === id);
    if (!failed) return;
    this._imageErrors = this._imageErrors || new Set();
    this._imageErrors.add(failed.cover_image_url);
    const update = (item) =>
      item.cover_image_url === failed.cover_image_url ? { ...item, image_error: true } : item;
    this.setData({
      items: this.data.items.map(update),
      columns: this.data.columns.map((column) => ({ ...column, items: column.items.map(update) }))
    });
  },

  goItem(event) {
    wx.navigateTo({ url: `/pages/item-detail/item-detail?id=${event.currentTarget.dataset.id}` });
  }
});
