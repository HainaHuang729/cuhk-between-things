const groups = [
  {
    id: "mock-group-1",
    title: "Costco纸巾拼团",
    source_platform: "Costco",
    current_size: 4,
    target_size: 6,
    handover_location: "伍宜孙56座大堂",
    deadline_text: "今晚12点",
    status_label: "招募中"
  },
  {
    id: "mock-group-2",
    title: "IKEA周末拼车",
    source_platform: "IKEA",
    current_size: 2,
    target_size: 4,
    handover_location: "23座门口",
    deadline_text: "周五18:00",
    status_label: "招募中"
  }
];

Page({
  data: {
    groups
  },

  goGroup(event) {
    wx.navigateTo({ url: `/pages/group-detail/group-detail?id=${event.currentTarget.dataset.id}` });
  }
});
