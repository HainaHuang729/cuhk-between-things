const wantedItems = [
  {
    id: "wanted-1",
    title: "求购二手显示器",
    budget: 400,
    dormitory: "56座",
    description: "24寸以上，可宿舍自取。"
  },
  {
    id: "wanted-2",
    title: "求购宿舍小冰箱",
    budget: 250,
    dormitory: "研究生宿舍",
    description: "能正常制冷即可。"
  }
];

Page({
  data: {
    wantedItems
  },

  showWanted() {
    wx.showToast({ title: "求购详情稍后开放", icon: "none" });
  }
});
