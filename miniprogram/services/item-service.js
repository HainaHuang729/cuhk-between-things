const mockStore = require("../utils/mock-store");

function listItems(params = {}) {
  return mockStore.getItems(params.q || "");
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
  return markItemStatus(id, "off_shelf");
}

function getCurrentUser() {
  return mockStore.getMockUser();
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
  getCurrentUser,
  getItem,
  isItemOwner,
  listItems,
  markItemStatus,
  updateItem
};
