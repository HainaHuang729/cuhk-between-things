const mockStore = require("../utils/mock-store");

function getCurrentUser() {
  return mockStore.getMockUser();
}

function mockLogin(wechatId) {
  return mockStore.mockLogin(wechatId);
}

function mockLogout() {
  return mockStore.mockLogout();
}

function isLoggedIn() {
  return mockStore.isLoggedIn();
}

function canViewContact() {
  return isLoggedIn();
}

module.exports = {
  canViewContact,
  getCurrentUser,
  isLoggedIn,
  mockLogin,
  mockLogout
};
