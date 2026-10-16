const mockStore = require("../utils/mock-store");
const { callCloud, cloudUserKey, isCloudMode, uploadItemImage } = require("../utils/cloud-client");
const { getCurrentUser, canViewContact } = require("./user-service");
const { saveLocalImage } = require("../utils/local-image");

function cloudFavoriteKey() {
  return `${cloudUserKey()}:favorites:${(getCurrentUser() || {}).id || "guest"}`;
}
function cloudFavoriteIds() {
  const ids = wx.getStorageSync(cloudFavoriteKey());
  return Array.isArray(ids) ? ids : [];
}
function draftKey() {
  return isCloudMode() ? `${cloudUserKey()}:draft:${(getCurrentUser() || {}).id || "guest"}` : undefined;
}
function decorate(item) {
  if (!item) return null;
  const label = (entries, value) => (entries.find((entry) => entry.value === value) || {}).label || "";
  return {
    ...item,
    images: item.images || [],
    cover_image_url: (item.images || [])[0] || "",
    placeholder_height: 260,
    status_label: label(mockStore.itemStatuses, item.status),
    category_label: label(mockStore.categories, item.category),
    condition_label: label(mockStore.conditions, item.condition),
    is_favorited: cloudFavoriteIds().includes(item.id)
  };
}

function listItems(params = {}) {
  if (isCloudMode())
    return callCloud("list", typeof params === "string" ? { q: params } : params).then((items) =>
      items.map(decorate)
    );
  if (typeof params === "string") {
    return mockStore.getItems(params, { status: "all" });
  }

  const items = mockStore.getItems(params.q || "", { status: params.status || "all" });
  return params.mine ? items.filter(isItemOwner) : items;
}

function getItem(id) {
  if (isCloudMode()) return callCloud("get", { id }).then(decorate);
  return mockStore.getItemById(id);
}

function createItem(data) {
  if (isCloudMode()) return callCloud("create", { data, request_id: data.request_id }).then(decorate);
  return mockStore.addItem(data);
}

function updateItem(id, data) {
  if (isCloudMode()) return callCloud("update", { id, data }).then(decorate);
  if (!isItemOwner(getItem(id))) return null;
  return mockStore.updateItem(id, data);
}

function markItemStatus(id, status) {
  if (isCloudMode()) return callCloud("status", { id, status }).then(decorate);
  if (!isItemOwner(getItem(id))) return null;
  if (!mockStore.itemStatuses.some((entry) => entry.value === status)) return null;
  return mockStore.updateItemStatus(id, status);
}

function deleteItem(id) {
  if (isCloudMode()) return callCloud("delete", { id }).then(decorate);
  if (!isItemOwner(getItem(id))) return null;
  return mockStore.deleteItem(id);
}

function favoriteItem(id) {
  const key = isCloudMode() ? cloudFavoriteKey() : "";
  if (isCloudMode())
    return getItem(id).then((item) => {
      if (cloudFavoriteKey() !== key) throw new Error("登录状态已变化，请重试");
      if (!item) return null;
      wx.setStorageSync(cloudFavoriteKey(), [id, ...cloudFavoriteIds().filter((entry) => entry !== id)]);
      return { ...item, is_favorited: true };
    });
  return mockStore.favoriteItem(id);
}

function unfavoriteItem(id) {
  const key = isCloudMode() ? cloudFavoriteKey() : "";
  if (isCloudMode())
    return getItem(id).then((item) => {
      if (cloudFavoriteKey() !== key) throw new Error("登录状态已变化，请重试");
      wx.setStorageSync(
        cloudFavoriteKey(),
        cloudFavoriteIds().filter((entry) => entry !== id)
      );
      return item ? { ...item, is_favorited: false } : null;
    });
  return mockStore.unfavoriteItem(id);
}

function listFavoriteItems() {
  if (isCloudMode())
    return Promise.all(cloudFavoriteIds().map(getItem)).then((items) => items.filter(Boolean));
  return mockStore.listFavoriteItems();
}

function isItemOwner(item) {
  const user = getCurrentUser();
  return Boolean(user && item && (item.seller_id || item.owner_id) === user.id);
}

function getItemContact(id) {
  if (!canViewContact()) return {};
  if (isCloudMode()) return callCloud("contact", { id });
  const item = getItem(id);
  return item ? { wechat_id: item.wechat_id || "" } : {};
}

module.exports = {
  categories: mockStore.categories,
  conditions: mockStore.conditions,
  getItemDraft: () => mockStore.getItemDraft(draftKey()),
  saveItemDraft: (data) => mockStore.saveItemDraft(data, draftKey()),
  clearItemDraft: () => mockStore.clearItemDraft(draftKey()),
  saveItemImage: (path) => (isCloudMode() ? uploadItemImage(path) : saveLocalImage(path)),
  getItemContact,
  itemStatuses: mockStore.itemStatuses,
  createItem,
  deleteItem,
  favoriteItem,
  getItem,
  isItemOwner,
  listFavoriteItems,
  listItems,
  markItemStatus,
  unfavoriteItem,
  updateItem
};
