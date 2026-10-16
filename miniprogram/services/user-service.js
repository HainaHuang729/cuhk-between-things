const mockStore = require("../utils/mock-store");
const { callCloud, cloudUserKey, getCloudSession, isCloudMode } = require("../utils/cloud-client");

function getCurrentUser() {
  if (isCloudMode()) {
    const session = getCloudSession();
    return session ? session.user : null;
  }
  return mockStore.getMockUser();
}

function mockLogin(wechatId) {
  if (isCloudMode()) throw new Error("云模式不能使用模拟身份");
  return mockStore.mockLogin(wechatId);
}

function mockLogout() {
  if (isCloudMode()) {
    const pending = callCloud("logout").catch(() => {});
    wx.removeStorageSync(cloudUserKey());
    return pending;
  }
  return mockStore.mockLogout();
}

function isLoggedIn() {
  return Boolean(getCurrentUser());
}

function login(wechatId) {
  if (!isCloudMode()) return mockLogin(wechatId);
  return callCloud("login", { wechat_id: wechatId }).then((session) => {
    wx.setStorageSync(cloudUserKey(), session);
    return session.user;
  });
}

function canViewContact() {
  return isLoggedIn();
}

module.exports = {
  canViewContact,
  getCurrentUser,
  isLoggedIn,
  login,
  isCloudMode,
  mockLogin,
  mockLogout
};
