const { API_BASE_URL } = require("./config");

function request(options) {
  const accessToken = wx.getStorageSync("access_token");
  const headers = {
    "content-type": "application/json",
    ...(options.auth && accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {})
  };

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${options.url}`,
      method: options.method || "GET",
      data: options.data || {},
      header: headers,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        reject(res.data || { error: "Request failed" });
      },
      fail: reject
    });
  });
}

module.exports = { request };
