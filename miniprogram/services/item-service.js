const mockStore = require("../utils/mock-store");

function listItems(params = {}) {
  if (typeof params === "string") {
    return mockStore.getItems(params, { status: "all" });
  }

  return mockStore.getItems(params.q || "", { status: params.status || "all" });
}

function getItem(id) {
  return mockStore.getItemById(id);
}

function createItem(data) {
  return mockStore.addItem(data);
}

function updateItem(id, data) {
  return mockStore.updateItem(id, data);
}

function markItemStatus(id, status) {
  return mockStore.updateItemStatus(id, status);
}

function deleteItem(id) {
  return mockStore.deleteItem(id);
}

function favoriteItem(id) {
  return mockStore.favoriteItem(id);
}

function unfavoriteItem(id) {
  return mockStore.unfavoriteItem(id);
}

function listFavoriteItems() {
  return mockStore.listFavoriteItems();
}

function isItemOwner(item) {
  return mockStore.isItemOwner(item);
}

module.exports = {
  categories: mockStore.categories,
  conditions: mockStore.conditions,
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
