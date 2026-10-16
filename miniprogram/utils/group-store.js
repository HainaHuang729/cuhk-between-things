const { getCurrentUser } = require("../services/user-service");

const KEY = "youwu_groups_v1";
const labels = { recruiting: "招募中", formed: "已成团", expired: "已截止", cancelled: "已取消" };

function readGroups() {
  const saved = wx.getStorageSync(KEY);
  if (Array.isArray(saved)) return saved;
  const now = Date.now();
  const groups = [
    {
      id: "mock-group-1",
      title: "Costco纸巾拼团",
      source_platform: "Costco",
      total_price: 120,
      target_size: 6,
      handover_location: "伍宜孙56座大堂",
      description: "一箱六包，每人一包。到货后宿舍楼下分。",
      owner_id: "group-owner-1",
      owner_name: "Grace",
      wechat_id: "grace_cuhk",
      participants: ["group-owner-1", "member-1", "member-2", "member-3"]
    },
    {
      id: "mock-group-2",
      title: "IKEA收纳盒凑单",
      source_platform: "IKEA",
      total_price: 160,
      target_size: 4,
      handover_location: "23座门口",
      description: "每人一套透明收纳盒，一起分摊运费。",
      owner_id: "group-owner-2",
      owner_name: "Alex",
      wechat_id: "alex_cuhk",
      participants: ["group-owner-2", "member-4"]
    }
  ].map((group, index) => ({
    ...group,
    status: "recruiting",
    created_at: new Date(now - index * 60000).toISOString(),
    deadline_at: new Date(now + 2 * 86400000).toISOString()
  }));
  wx.setStorageSync(KEY, groups);
  return groups;
}

function present(group) {
  if (!group) return null;
  const user = getCurrentUser();
  const currentSize = group.participants.length;
  const status =
    group.status === "cancelled"
      ? "cancelled"
      : Date.parse(group.deadline_at) <= Date.now()
        ? "expired"
        : currentSize >= group.target_size
          ? "formed"
          : "recruiting";
  const date = new Date(group.deadline_at);
  const pad = (number) => String(number).padStart(2, "0");
  return {
    ...group,
    status,
    status_label: labels[status],
    current_size: currentSize,
    per_person_price: (group.total_price / group.target_size).toFixed(2),
    deadline_text: `${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`,
    is_owner: Boolean(user && user.id === group.owner_id),
    is_joined: Boolean(user && group.participants.includes(user.id))
  };
}

function listGroups() {
  return readGroups()
    .slice()
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .map(present);
}

function getGroup(id) {
  return present(readGroups().find((group) => group.id === id));
}

function requireUser() {
  const user = getCurrentUser();
  if (!user) throw new Error("请先登录");
  return user;
}

function createGroup(input) {
  const user = requireUser();
  const title = String(input.title || "").trim();
  const location = String(input.handover_location || "").trim();
  const total = Number(input.total_price);
  const target = Number(input.target_size);
  if (!title || title.length > 80) throw new Error("请填写80字以内的标题");
  if (!location) throw new Error("请填写交收地点");
  if (!/^\d+(\.\d{1,2})?$/.test(String(input.total_price)) || !Number.isFinite(total) || total <= 0)
    throw new Error("请填写有效总价，最多两位小数");
  if (!Number.isInteger(target) || target < 2 || target > 50) throw new Error("目标人数为2至50人的整数");
  if (!Number.isFinite(Date.parse(input.deadline_at)) || Date.parse(input.deadline_at) <= Date.now())
    throw new Error("截止时间须晚于现在");
  const group = {
    id: `local-group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    handover_location: location,
    total_price: total,
    target_size: target,
    source_platform: String(input.source_platform || "其他")
      .trim()
      .slice(0, 40),
    description: String(input.description || "")
      .trim()
      .slice(0, 2000),
    deadline_at: new Date(input.deadline_at).toISOString(),
    owner_id: user.id,
    owner_name: user.display_name,
    wechat_id: user.wechat_id,
    participants: [user.id],
    status: "recruiting",
    created_at: new Date().toISOString()
  };
  wx.setStorageSync(KEY, [group, ...readGroups()]);
  return present(group);
}

function changeGroup(id, action) {
  const user = requireUser();
  const groups = readGroups();
  const index = groups.findIndex((group) => group.id === id);
  if (index < 0) throw new Error("拼团已不存在");
  const group = present(groups[index]);
  if (action === "cancel") {
    if (!group.is_owner) throw new Error("只有团长可以取消");
    if (group.status === "expired") throw new Error("拼团已结束");
    groups[index].status = "cancelled";
  } else if (action === "join") {
    if (group.is_joined) return group;
    if (group.status !== "recruiting") throw new Error(group.status === "formed" ? "人数已满" : "拼团已结束");
    groups[index].participants = [...group.participants, user.id];
  } else {
    if (group.is_owner) throw new Error("团长不能退出，可取消拼团");
    if (["expired", "cancelled"].includes(group.status)) throw new Error("拼团已结束");
    groups[index].participants = group.participants.filter((id) => id !== user.id);
  }
  wx.setStorageSync(KEY, groups);
  return present(groups[index]);
}

module.exports = {
  listGroups,
  getGroup,
  createGroup,
  joinGroup: (id) => changeGroup(id, "join"),
  leaveGroup: (id) => changeGroup(id, "leave"),
  cancelGroup: (id) => changeGroup(id, "cancel")
};
