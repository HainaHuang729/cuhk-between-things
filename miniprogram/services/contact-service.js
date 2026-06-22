const { getCurrentUser } = require("./user-service");

const CONTACT_LOGS_KEY = "youwu_contact_logs_v1";

function readLogs() {
  const saved = wx.getStorageSync(CONTACT_LOGS_KEY);
  return Array.isArray(saved) ? saved : [];
}

function writeLogs(logs) {
  wx.setStorageSync(CONTACT_LOGS_KEY, logs);
}

function logContactView(itemId, targetUserId) {
  const user = getCurrentUser();
  const log = {
    id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    item_id: itemId,
    target_user_id: targetUserId || "",
    viewer_id: user ? user.id : "",
    created_at: new Date().toISOString()
  };

  writeLogs([log, ...readLogs()]);
  return log;
}

function getContactLogs() {
  return readLogs();
}

module.exports = {
  getContactLogs,
  logContactView
};
