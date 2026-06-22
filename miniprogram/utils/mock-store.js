const ITEMS_KEY = "youwu_items_v1";
const FAVORITES_KEY = "youwu_item_favorites_v1";
const SEED_VERSION_KEY = "youwu_seed_version_v1";
const SEED_VERSION = 2;
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
    seller_id: "mock-user",
    seller_name: "CUHK Student",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    cover_image_url: "/assets/items/luosifen.svg",
    images: ["/assets/items/luosifen.svg"],
    placeholder_height: 280,
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
    seller_id: "mock-user",
    seller_name: "CUHK Student",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    cover_image_url: "/assets/items/monitor.svg",
    images: ["/assets/items/monitor.svg"],
    placeholder_height: 250,
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
    seller_id: "mock-user",
    seller_name: "CUHK Student",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    cover_image_url: "/assets/items/chair.svg",
    images: ["/assets/items/chair.svg"],
    placeholder_height: 320,
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
    seller_id: "mock-user",
    seller_name: "CUHK Student",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    cover_image_url: "/assets/items/desk-lamp.svg",
    images: ["/assets/items/desk-lamp.svg"],
    placeholder_height: 330,
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
    seller_id: "mock-user",
    seller_name: "CUHK Student",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    placeholder_height: 270,
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
    seller_id: "mock-user",
    seller_name: "CUHK Student",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    cover_image_url: "/assets/items/textbook.svg",
    images: ["/assets/items/textbook.svg"],
    placeholder_height: 340,
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
    seller_id: "mock-user",
    seller_name: "CUHK Student",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    cover_image_url: "/assets/items/storage-box.svg",
    images: ["/assets/items/storage-box.svg"],
    placeholder_height: 260,
    created_at: "2026-06-22T07:00:00Z"
  },
  {
    id: "mock-item-7",
    title: "小米电饭锅 3L 宿舍做饭煮粥都可以",
    price: 160,
    category: "kitchen",
    condition: "good",
    dormitory: "研究生宿舍",
    handover_location: "研究生宿舍大堂",
    description: "内胆干净，带量杯和饭勺，适合两三个人用。",
    status: "available",
    seller_id: "mock-user-2",
    seller_name: "Grace Lee",
    owner_id: "mock-user-2",
    wechat_id: "grace_cuhk",
    cover_image_url: "/assets/items/rice-cooker.svg",
    images: ["/assets/items/rice-cooker.svg"],
    placeholder_height: 330,
    created_at: "2026-06-22T09:30:00Z"
  },
  {
    id: "mock-item-8",
    title: "塑料衣架 20 个 打包出",
    price: 18,
    category: "dorm",
    condition: "usable",
    dormitory: "23座",
    handover_location: "23座楼下",
    description: "搬宿清理，衣架有白色和灰色，全部一起拿走。",
    status: "available",
    seller_id: "mock-user-3",
    seller_name: "Jason Chan",
    owner_id: "mock-user-3",
    wechat_id: "jason_cu",
    cover_image_url: "/assets/items/hangers.svg",
    images: ["/assets/items/hangers.svg"],
    placeholder_height: 230,
    created_at: "2026-06-22T09:20:00Z"
  },
  {
    id: "mock-item-9",
    title: "TP-Link 路由器 WiFi 6",
    price: 120,
    category: "electronics",
    condition: "like_new",
    dormitory: "56座",
    handover_location: "伍宜孙56座",
    description: "信号稳定，配电源线，适合宿舍使用。",
    status: "available",
    seller_id: "mock-user",
    seller_name: "CUHK Student",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    cover_image_url: "/assets/items/router.svg",
    images: ["/assets/items/router.svg"],
    placeholder_height: 230,
    created_at: "2026-06-22T09:10:00Z"
  },
  {
    id: "mock-item-10",
    title: "无线键盘 适合 iPad 和电脑",
    price: 60,
    category: "electronics",
    condition: "good",
    dormitory: "39座",
    handover_location: "39座门口",
    description: "蓝牙连接正常，按键手感还可以。",
    status: "sold",
    seller_id: "mock-user-2",
    seller_name: "Grace Lee",
    owner_id: "mock-user-2",
    wechat_id: "grace_cuhk",
    cover_image_url: "/assets/items/keyboard.svg",
    images: ["/assets/items/keyboard.svg"],
    placeholder_height: 220,
    created_at: "2026-06-22T09:00:00Z"
  },
  {
    id: "mock-item-11",
    title: "热水壶 1.5L",
    price: 45,
    category: "kitchen",
    condition: "usable",
    dormitory: "联合",
    handover_location: "联合书院门口",
    description: "加热正常，有使用痕迹，介意勿拍。",
    status: "available",
    seller_id: "mock-user-4",
    seller_name: "Ming Wong",
    owner_id: "mock-user-4",
    wechat_id: "ming_cuhk",
    cover_image_url: "/assets/items/kettle.svg",
    images: ["/assets/items/kettle.svg"],
    placeholder_height: 320,
    created_at: "2026-06-22T08:50:00Z"
  },
  {
    id: "mock-item-12",
    title: "可折叠宿舍椅",
    price: 70,
    category: "furniture",
    condition: "good",
    dormitory: "新亚",
    handover_location: "新亚圆形广场",
    description: "坐着稳定，折起来不占地方。",
    status: "available",
    seller_id: "mock-user-3",
    seller_name: "Jason Chan",
    owner_id: "mock-user-3",
    wechat_id: "jason_cu",
    cover_image_url: "/assets/items/chair.svg",
    images: ["/assets/items/chair.svg"],
    placeholder_height: 340,
    created_at: "2026-06-22T08:40:00Z"
  },
  {
    id: "mock-item-13",
    title: "透明收纳盒 三个一起出",
    price: 50,
    category: "dorm",
    condition: "good",
    dormitory: "晨兴",
    handover_location: "晨兴书院大堂",
    description: "适合放衣物和杂物，三个一起出。",
    status: "available",
    seller_id: "mock-user",
    seller_name: "CUHK Student",
    owner_id: "mock-user",
    wechat_id: "youwu_demo",
    cover_image_url: "/assets/items/storage-box.svg",
    images: ["/assets/items/storage-box.svg"],
    placeholder_height: 260,
    created_at: "2026-06-22T08:30:00Z"
  },
  {
    id: "mock-item-14",
    title: "MATH1010 教材和练习册",
    price: 90,
    category: "textbook",
    condition: "good",
    dormitory: "崇基",
    handover_location: "大学站",
    description: "有少量荧光笔标记，练习册大部分空白。",
    status: "available",
    seller_id: "mock-user-4",
    seller_name: "Ming Wong",
    owner_id: "mock-user-4",
    wechat_id: "ming_cuhk",
    cover_image_url: "/assets/items/textbook.svg",
    images: ["/assets/items/textbook.svg"],
    placeholder_height: 350,
    created_at: "2026-06-22T08:20:00Z"
  },
  {
    id: "mock-item-15",
    title: "超长标题测试：毕业搬宿出一批宿舍用品包含小桌板收纳篮延长线和几个没有拍照的小物件",
    price: 88,
    category: "dorm",
    condition: "usable",
    dormitory: "逸夫",
    handover_location: "逸夫书院门口",
    description: "用于测试首页两行标题省略、无图片占位和详情页长标题展示。",
    status: "available",
    seller_id: "mock-user-5",
    seller_name: "Alex Lau",
    owner_id: "mock-user-5",
    wechat_id: "alex_cu",
    placeholder_height: 300,
    created_at: "2026-06-22T08:10:00Z"
  },
  {
    id: "mock-item-16",
    title: "旧台灯 已下架测试",
    price: 30,
    category: "dorm",
    condition: "flawed",
    dormitory: "23座",
    handover_location: "23座",
    description: "用于测试已下架筛选和详情状态。",
    status: "off_shelf",
    seller_id: "mock-user-2",
    seller_name: "Grace Lee",
    owner_id: "mock-user-2",
    wechat_id: "grace_cuhk",
    cover_image_url: "/assets/items/desk-lamp.svg",
    images: ["/assets/items/desk-lamp.svg"],
    placeholder_height: 330,
    created_at: "2026-06-22T08:05:00Z"
  }
];

function labelOf(list, value) {
  const matched = list.find((entry) => entry.value === value);
  return matched ? matched.label : value;
}

function normalizeItem(item) {
  const sellerId = item.seller_id || item.owner_id || "mock-user";

  return {
    ...item,
    price: Number(item.price || 0),
    status: item.status || "available",
    seller_id: sellerId,
    seller_name: item.seller_name || item.display_name || "CUHK Student",
    owner_id: item.owner_id || sellerId,
    status_label: labelOf(itemStatuses, item.status || "available"),
    category_label: labelOf(categories, item.category || "other"),
    condition_label: labelOf(conditions, item.condition || "good"),
    is_favorited: isFavoriteItem(item.id),
    placeholder_height: Number(item.placeholder_height || 260),
    images: item.images || (item.cover_image_url ? [item.cover_image_url] : [])
  };
}

function applySeedDefaults(item) {
  const seed = seedItems.find((entry) => entry.id === item.id);
  if (!seed) return item;

  return {
    ...seed,
    ...item,
    cover_image_url: item.cover_image_url || seed.cover_image_url,
    images: item.images && item.images.length ? item.images : seed.images,
    placeholder_height: item.placeholder_height || seed.placeholder_height,
    seller_id: item.seller_id || seed.seller_id,
    seller_name: item.seller_name || seed.seller_name,
    wechat_id: item.wechat_id || seed.wechat_id
  };
}

function mergeSeedItems(items) {
  const upgradedItems = items.map(applySeedDefaults);
  const existingIds = upgradedItems.map((item) => item.id);
  const missingSeeds = seedItems.filter((item) => !existingIds.includes(item.id));
  return missingSeeds.length ? [...upgradedItems, ...missingSeeds] : upgradedItems;
}

function readItems() {
  const saved = wx.getStorageSync(ITEMS_KEY);
  if (Array.isArray(saved)) {
    const savedSeedVersion = Number(wx.getStorageSync(SEED_VERSION_KEY) || 0);
    const merged = savedSeedVersion < SEED_VERSION ? mergeSeedItems(saved) : saved;
    const normalized = merged.map(normalizeItem);
    const needsMigration = savedSeedVersion < SEED_VERSION
      || saved.some((item) => !item.seller_id || !item.seller_name);
    if (needsMigration) {
      writeItems(normalized);
      wx.setStorageSync(SEED_VERSION_KEY, SEED_VERSION);
    }
    return normalized;
  }

  const normalizedSeed = seedItems.map(normalizeItem);
  wx.setStorageSync(ITEMS_KEY, normalizedSeed);
  wx.setStorageSync(SEED_VERSION_KEY, SEED_VERSION);
  return normalizedSeed;
}

function writeItems(items) {
  wx.setStorageSync(ITEMS_KEY, items);
}

function sortItemsByLatest(items) {
  return items.slice().sort((a, b) => (
    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  ));
}

function getItems(q, options = {}) {
  const keyword = (q || "").trim().toLowerCase();
  const status = options.status || "all";
  const items = sortItemsByLatest(readItems()).filter((item) => (
    status === "all" ? true : item.status === status
  ));

  if (!keyword) return items;

  return items.filter((item) => {
    const text = [
      item.title,
      item.description,
      item.category,
      item.seller_name,
      item.category_label,
      item.status_label,
      item.dormitory,
      item.handover_location
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
  const sellerId = user ? user.id : "mock-user";
  const sellerName = user ? user.display_name : "CUHK Student";
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
    seller_id: sellerId,
    seller_name: sellerName,
    owner_id: sellerId,
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

function deleteItem(id) {
  const items = readItems();
  const item = items.find((entry) => entry.id === id) || null;
  if (!item) return null;

  writeItems(items.filter((entry) => entry.id !== id));
  unfavoriteItem(id);
  return item;
}

function readFavoriteIds() {
  const saved = wx.getStorageSync(FAVORITES_KEY);
  return Array.isArray(saved) ? saved : [];
}

function writeFavoriteIds(ids) {
  wx.setStorageSync(FAVORITES_KEY, ids);
}

function isFavoriteItem(id) {
  return readFavoriteIds().includes(id);
}

function favoriteItem(id) {
  const item = getItemById(id);
  if (!item) return null;

  const ids = readFavoriteIds();
  if (!ids.includes(id)) writeFavoriteIds([id, ...ids]);
  return getItemById(id);
}

function unfavoriteItem(id) {
  writeFavoriteIds(readFavoriteIds().filter((entry) => entry !== id));
  return getItemById(id);
}

function listFavoriteItems() {
  const favoriteIds = readFavoriteIds();
  return sortItemsByLatest(readItems().filter((item) => favoriteIds.includes(item.id)));
}

function getMockUser() {
  return wx.getStorageSync(USER_KEY) || null;
}

function isLoggedIn() {
  return Boolean(getMockUser());
}

function isItemOwner(item) {
  const user = getMockUser();
  const sellerId = item ? (item.seller_id || item.owner_id) : "";
  return Boolean(user && sellerId === user.id);
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
  deleteItem,
  favoriteItem,
  getItemById,
  getItems,
  getMockUser,
  isLoggedIn,
  isItemOwner,
  itemStatuses,
  listFavoriteItems,
  mockLogin,
  mockLogout,
  unfavoriteItem,
  updateItem,
  updateItemStatus
};
