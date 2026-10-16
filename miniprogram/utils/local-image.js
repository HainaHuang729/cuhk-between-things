function saveLocalImage(path) {
  if (path.startsWith("cloud://")) return Promise.resolve(path);
  const userDirectory = wx.env && wx.env.USER_DATA_PATH;
  const isSavedFile = (userDirectory && path.startsWith(`${userDirectory}/`))
    || path.startsWith("wxfile://store_");
  const isRemoteImage = /^https?:\/\//.test(path) && !path.startsWith("http://tmp/");
  if (path.startsWith("/assets/") || isSavedFile || isRemoteImage) {
    return Promise.resolve(path);
  }

  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().saveFile({
      tempFilePath: path,
      success: (result) => {
        if (result.savedFilePath) resolve(result.savedFilePath);
        else reject(new Error("图片保存失败"));
      },
      fail: reject
    });
  });
}

module.exports = { saveLocalImage };
