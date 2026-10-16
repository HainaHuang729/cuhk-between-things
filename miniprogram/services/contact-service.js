const { canViewContact, getCurrentUser } = require("./user-service");
const { cloudUserKey, isCloudMode } = require("../utils/cloud-client");

const CONTACT_LOGS_KEY = "youwu_contact_logs_v1";
const logsKey = () => (isCloudMode() ? `${cloudUserKey()}:contacts` : CONTACT_LOGS_KEY);

function readLogs() {
  const saved = wx.getStorageSync(logsKey());
  return Array.isArray(saved) ? saved : [];
}

function writeLogs(logs) {
  wx.setStorageSync(logsKey(), logs);
}

function logContactView(itemId, targetUserId) {
  if (!canViewContact()) return null;
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
