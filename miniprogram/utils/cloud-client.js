const config = require("./data-mode");
let initialized = false;

function isCloudMode() {
  return config.mode === "cloud";
}
function cloudUserKey() {
  return `youwu_cloud_user_v1:${config.cloudEnv}`;
}
function getCloudSession() {
  const session = wx.getStorageSync(cloudUserKey());
  return session &&
    typeof session.token === "string" &&
    session.user &&
    typeof session.user.id === "string" &&
    session.expires_at > Date.now()
    ? session
    : null;
}

function initCloud() {
  if (!config.cloudEnv) throw new Error("尚未配置云环境 ID");
  if (!wx.cloud) throw new Error("当前微信版本不支持云开发");
  if (!initialized) {
    wx.cloud.init({ env: config.cloudEnv });
    initialized = true;
  }
}

async function callCloud(action, data = {}) {
  initCloud();
  const session = getCloudSession();
  let response;
  try {
    response = await wx.cloud.callFunction({
      name: config.cloudFunction,
      data: { ...data, action, session: session ? session.token : "" }
    });
  } catch (error) {
    throw new Error("云服务连接失败，请检查网络后重试");
  }
  const result = response.result;
  if (!result || !result.ok) {
    if (
      result &&
      result.code === "AUTH_REQUIRED" &&
      (getCloudSession() || {}).token === (session || {}).token
    )
      wx.removeStorageSync(cloudUserKey());
    throw new Error((result && result.message) || "云服务暂时不可用");
  }
  return result.data;
}

async function uploadItemImage(filePath) {
  if (filePath.startsWith("cloud://")) return filePath;
  initCloud();
  const session = getCloudSession();
  if (!session) throw new Error("请先登录后上传图片");
  const suffix = /\.(png|jpg|jpeg|webp)$/i.exec(filePath);
  const extension = suffix ? suffix[1].toLowerCase() : "jpg";
  const result = await wx.cloud.uploadFile({
    cloudPath: `items/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 12)}.${extension}`,
    filePath
  });
  if (!result.fileID) throw new Error("图片上传失败，请重试");
  return result.fileID;
}

module.exports = { callCloud, cloudUserKey, getCloudSession, initCloud, isCloudMode, uploadItemImage };
