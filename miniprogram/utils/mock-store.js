const ITEMS_KEY = "youwu_items_v1";
const USER_KEY = "youwu_mock_user_v1";

const itemStatuses = [
  { value: "available", label: "在售" },
  { value: "reserved", label: "已预订" },
  { value: "sold", label: "已售出" },
  { value: "off_shelf", label: "已下架" }
];

const categories = [
  { value: "electronics", label: "电子产品" },
  { value: "furniture", label: "家具" },
  { value: "dorm", label: "宿舍用品" },
  { value: "kitchen", label: "厨房用品" },
  { value: "textbook", label: "教材" },
  { value: "clothing", label: "衣物" },
  { value: "sports", label: "运动用品" },
  { value: "other", label: "其他" }
];

const conditions = [
  { value: "new", label: "全新" },
  { value: "like_new", label: "几乎全新" },
  { value: "good", label: "良好" },
  { value: "usable", label: "可用" },
  { value: "flawed", label: "有瑕疵" }
];

const seedItems = [
  {
    id: "mock-item-0",
    title: "螺蛳粉",
    price: 10,
    category: "other",
    condition: "new",
    dormitory: "宿舍自取",
    handover_location: "宿舍楼下",
    description: "未拆封，10元出。",
    status: "available",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    cover_image_url: "/assets/items/luosifen.svg",
    images: ["/assets/items/luosifen.svg"],
    created_at: "2026-06-22T08:00:00Z"
  },
  {
    id: "mock-item-1",
    title: "Dell 27寸显示器",
    price: 500,
    category: "electronics",
    condition: "good",
    dormitory: "56座",
    handover_location: "伍宜孙56座大堂",
    description: "状态良好，含 HDMI 线。",
    status: "available",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    created_at: "2026-06-22T07:50:00Z"
  },
  {
    id: "mock-item-2",
    title: "IKEA椅子",
    price: 80,
    category: "furniture",
    condition: "usable",
    dormitory: "23座",
    handover_location: "23座门口",
    description: "搬宿出，轻微使用痕迹。",
    status: "reserved",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    created_at: "2026-06-22T07:40:00Z"
  },
  {
    id: "mock-item-3",
    title: "宿舍台灯",
    price: 40,
    category: "dorm",
    condition: "good",
    dormitory: "39座",
    handover_location: "楼下",
    description: "亮度稳定，可直接使用。",
    status: "available",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    created_at: "2026-06-22T07:30:00Z"
  },
  {
    id: "mock-item-4",
    title: "小冰箱",
    price: 280,
    category: "dorm",
    condition: "usable",
    dormitory: "研究生宿舍",
    handover_location: "大堂",
    description: "适合宿舍使用，需自取。",
    status: "sold",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    created_at: "2026-06-22T07:20:00Z"
  },
  {
    id: "mock-item-5",
    title: "教材 ECON2011",
    price: 120,
    category: "textbook",
    condition: "good",
    dormitory: "联合",
    handover_location: "大学站",
    description: "少量笔记，整体干净。",
    status: "available",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    created_at: "2026-06-22T07:10:00Z"
  },
  {
    id: "mock-item-6",
    title: "收纳箱两只",
    price: 35,
    category: "dorm",
    condition: "usable",
    dormitory: "39座",
    handover_location: "楼下",
    description: "两个一起出，适合搬宿。",
    status: "off_shelf",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    created_at: "2026-06-22T07:00:00Z"
  }
];

function labelOf(list, value) {
  const matched = list.find((entry) => entry.value === value);
  return matched ? matched.label : value;
}

function normalizeItem(item) {
  return {
    ...item,
    price: Number(item.price || 0),
    status: item.status || "available",
    owner_id: item.owner_id || "mock-user",
    status_label: labelOf(itemStatuses, item.status || "available"),
    category_label: labelOf(categories, item.category || "other"),
    condition_label: labelOf(conditions, item.condition || "good"),
    images: item.images || (item.cover_image_url ? [item.cover_image_url] : [])
  };
}

function readItems() {
  const saved = wx.getStorageSync(ITEMS_KEY);
  if (Array.isArray(saved)) {
    return saved.map(normalizeItem);
  }

  wx.setStorageSync(ITEMS_KEY, seedItems);
  return seedItems.map(normalizeItem);
}

function writeItems(items) {
  wx.setStorageSync(ITEMS_KEY, items);
}

function getItems(q) {
  const keyword = (q || "").trim().toLowerCase();
  const items = readItems();

  if (!keyword) return items;

  return items.filter((item) => {
    const text = [
      item.title,
      item.price,
      item.dormitory,
      item.handover_location,
      item.description,
      item.category_label,
      item.condition_label,
      item.status_label
    ].join(" ").toLowerCase();
    return text.includes(keyword);
  });
}

function getItemById(id) {
  return readItems().find((item) => item.id === id) || null;
}

function addItem(input) {
  const items = readItems();
  const now = new Date().toISOString();
  const user = getMockUser();
  const item = normalizeItem({
    id: `local-${Date.now()}`,
    title: input.title,
    price: Number(input.price || 0),
    category: input.category,
    condition: input.condition,
    dormitory: input.dormitory,
    handover_location: input.handover_location,
    description: input.description,
    status: "available",
    owner_id: user ? user.id : "mock-user",
    images: input.images || [],
    cover_image_url: input.images && input.images.length ? input.images[0] : "",
    wechat_id: input.wechat_id || "youwu_demo",
    created_at: now
  });

  writeItems([item, ...items]);
  return item;
}

function updateItem(id, input) {
  let updated = null;
  const items = readItems().map((item) => {
    if (item.id !== id) return item;

    updated = normalizeItem({
      ...item,
      title: input.title,
      price: Number(input.price || 0),
      category: input.category,
      condition: input.condition,
      dormitory: input.dormitory,
      handover_location: input.handover_location,
      description: input.description,
      images: input.images && input.images.length ? input.images : item.images,
      cover_image_url: input.images && input.images.length
        ? input.images[0]
        : item.cover_image_url,
      updated_at: new Date().toISOString()
    });

    return updated;
  });

  if (updated) writeItems(items);
  return updated;
}

function updateItemStatus(id, status) {
  let updated = null;
  const items = readItems().map((item) => {
    if (item.id !== id) return item;

    updated = normalizeItem({
      ...item,
      status,
      updated_at: new Date().toISOString()
    });

    return updated;
  });

  if (updated) writeItems(items);
  return updated;
}

function getMockUser() {
  return wx.getStorageSync(USER_KEY) || null;
}

function isLoggedIn() {
  return Boolean(getMockUser());
}

function isItemOwner(item) {
  const user = getMockUser();
  return Boolean(user && item && item.owner_id === user.id);
}

function mockLogin(wechatId) {
  const user = {
    id: "mock-user",
    email: "student@link.cuhk.edu.hk",
    wechat_id: wechatId || "youwu_demo",
    display_name: "CUHK Student"
  };

  wx.setStorageSync(USER_KEY, user);
  wx.setStorageSync("user", user);
  wx.setStorageSync("access_token", "mock-access-token");
  return user;
}

function mockLogout() {
  wx.removeStorageSync(USER_KEY);
  wx.removeStorageSync("user");
  wx.removeStorageSync("access_token");
}

module.exports = {
  addItem,
  categories,
  conditions,
  getItemById,
  getItems,
  getMockUser,
  isLoggedIn,
  isItemOwner,
  itemStatuses,
  mockLogin,
  mockLogout,
  updateItem,
  updateItemStatus
};
