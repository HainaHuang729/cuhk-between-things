const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const { createDatabase } = require("./helpers/cloud-db.cjs");
const { createMarket } = require("../cloudfunctions/market/market");

const root = path.resolve(__dirname, "../miniprogram");
const copy = (value) => JSON.parse(JSON.stringify(value));
const form = (values = {}) => ({ detail: { value: {
  title: "试用商品", price: "10.50", handover_location: "大学站", description: "未拆封", ...values
} } });
const event = (dataset) => ({ currentTarget: { dataset } });

function runtime(savedStorage = [], options = {}) {
  const h = {
    storage: new Map(savedStorage), toasts: [], navigation: [], modals: [], actionSheets: [],
    timers: new Map(), tempFiles: new Set(), savedFiles: new Set(), saveCalls: [],
    deferredSaves: [], pages: [{}], app: { globalData: {} }, chosenImages: [], cloudCalls: [], uploads: [], definitions: new Map()
  };
  let timerId = 0;
  let fileId = 0;
  const wx = {
    env: { USER_DATA_PATH: "wxfile://usr" },
    getStorageSync: (key) => h.storage.has(key) ? copy(h.storage.get(key)) : "",
    setStorageSync: (key, value) => {
      if (h.failStorageKey === key) throw new Error("本地空间不足");
      h.storage.set(key, copy(value));
    },
    removeStorageSync: (key) => {
      if (h.failRemoveKey === key) throw new Error("清除失败");
      return h.storage.delete(key);
    },
    cloud: {
      init: (config) => { h.cloudInit = config; },
      callFunction: async ({ data }) => {
        h.cloudCalls.push(data);
        if (h.cloudFailure) throw new Error("network error");
        return { result: await h.cloudCall(data) };
      },
      uploadFile: async ({ filePath, cloudPath }) => {
        h.uploads.push({ filePath, cloudPath });
        if (h.uploadFails) throw new Error("upload failed");
        return { fileID: `cloud://test-env.bucket/${cloudPath}` };
      }
    },
    showToast: ({ title }) => h.toasts.push(title),
    showLoading: () => { h.loading = true; },
    hideLoading: () => { h.loading = false; },
    stopPullDownRefresh: () => { h.refreshed = true; },
    hideKeyboard: () => { h.keyboardHidden = true; },
    showModal: (options) => h.modals.push(options),
    showActionSheet: (options) => h.actionSheets.push(options),
    previewImage: (options) => { h.preview = options; },
    setClipboardData: (options) => {
      if (h.clipboardFails) return options.fail && options.fail();
      h.clipboard = options.data;
      if (options.success) options.success();
    },
    chooseMedia: (options) => {
      if (h.mediaError) return options.fail({ errMsg: h.mediaError });
      h.chosenImages.forEach((image) => h.tempFiles.add(image));
      options.success({ tempFiles: h.chosenImages.map((image) => ({ tempFilePath: image })) });
    },
    chooseImage: (options) => {
      h.fallbackUsed = true;
      h.chosenImages.forEach((image) => h.tempFiles.add(image));
      options.success({ tempFilePaths: h.chosenImages });
      options.complete();
    },
    getFileSystemManager: () => ({
      saveFile(options) {
        h.saveCalls.push(options.tempFilePath);
        const save = () => {
          if (!h.tempFiles.has(options.tempFilePath) || h.failImage === options.tempFilePath) {
            options.fail({ errMsg: "saveFile:fail" });
            return;
          }
          const savedFilePath = `${wx.env.USER_DATA_PATH}/saved-${++fileId}.jpg`;
          h.savedFiles.add(savedFilePath);
          h.tempFiles.delete(options.tempFilePath);
          options.success({ savedFilePath });
        };
        if (h.deferSave) h.deferredSaves.push(save);
        else save();
      }
    })
  };
  for (const method of ["navigateTo", "navigateBack", "switchTab", "redirectTo"]) {
    wx[method] = (options) => {
      h.navigation.push({ method, ...options });
      if (h.navigationFails && options.fail) options.fail();
    };
  }
  const context = vm.createContext({
    wx,
    App: (definition) => {
      h.app = definition;
      definition.onLaunch.call(definition);
    },
    Page: (definition) => { h.definition = definition; },
    getApp: () => h.app,
    getCurrentPages: () => h.pages,
    setTimeout: (callback) => { h.timers.set(++timerId, callback); return timerId; },
    clearTimeout: (id) => h.timers.delete(id)
  });
  const modules = new Map();
  h.load = (relative) => {
    const filename = path.resolve(root, relative);
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} };
    modules.set(filename, module);
    if (relative === "utils/data-mode.js") {
      module.exports = { mode: options.cloud ? "cloud" : "mock", cloudEnv: options.env === undefined ? "test-env" : options.env, cloudFunction: "market" };
      return module.exports;
    }
    const source = fs.readFileSync(filename, "utf8");
    const factory = vm.runInContext(`(function(require, module, exports) {\n${source}\n})`, context, { filename });
    factory((target) => h.load(path.relative(root, path.resolve(path.dirname(filename), `${target}.js`))), module, module.exports);
    return module.exports;
  };
  h.page = (name) => {
    if (!h.definitions.has(name)) {
      h.load(`pages/${name}/${name}.js`);
      h.definitions.set(name, h.definition);
    }
    const definition = h.definitions.get(name);
    return {
      ...definition, data: copy(definition.data),
      setData(patch, done) {
        for (const [key, value] of Object.entries(patch)) {
          const parts = key.split(".");
          const field = parts.pop();
          const parent = parts.reduce((value, part) => value[part], this.data);
          parent[field] = copy(value);
        }
        if (done) done();
      }
    };
  };
  h.runTimers = () => {
    const pending = [...h.timers.values()];
    h.timers.clear();
    pending.forEach((callback) => callback());
  };
  h.items = h.load("services/item-service.js");
  h.users = h.load("services/user-service.js");
  h.contacts = h.load("services/contact-service.js");
  return h;
}

test("App 注册时即可读取用户服务，冷启动不会使用尚未初始化的导入", () => {
  for (const cloud of [false, true]) {
    const h = runtime([], { cloud });
    h.storage.set("user", { id: "legacy-user" });
    h.storage.set("access_token", "mock-access-token");
    if (cloud) {
      h.storage.set("youwu_cloud_user_v1:test-env", {
        user: { id: "cloud-user" }, token: "test-session", expires_at: Date.now() + 60000
      });
    } else {
      h.users.mockLogin("tester");
    }
    assert.doesNotThrow(() => h.load("app.js"));
    assert.equal(h.app.globalData.user.id, cloud ? "cloud-user" : "mock-user");
    assert.equal(h.app.globalData.accessToken, cloud ? "" : "mock-access-token");
  }
});

test("草稿允许不完整字段，持久保存图片并恢复；发布后清除", async () => {
  const h = runtime();
  const before = h.items.listItems().length;
  const edit = h.page("item-edit");
  edit.onLoad();
  await edit.saveDraft();
  assert.equal(h.items.getItemDraft(), null);
  edit.setData({ form: { title: "未写完的电饭锅", price: "", description: "今晚补图", handover_location: "" }, categoryIndex: 3, conditionIndex: 1 });
  h.chosenImages = ["wxfile://tmp_draft.jpg"];
  edit.chooseImages();
  await edit.saveDraft();
  assert.equal(h.items.listItems().length, before);
  const draft = h.items.getItemDraft();
  assert.equal(draft.price, "");
  assert.ok(h.savedFiles.has(draft.images[0]));
  const restarted = runtime([...h.storage]);
  restarted.users.mockLogin("tester");
  const restored = restarted.page("item-edit");
  restored.onLoad();
  restored.onShow();
  assert.equal(restarted.modals.length, 1);
  restarted.modals[0].success({ confirm: true });
  assert.equal(restored.data.form.title, draft.title);
  assert.equal(restored.data.categoryLabel, "厨房用品");
  assert.equal(restored.data.conditionLabel, "几乎全新");
  assert.deepEqual(copy(restored.data.images), copy(draft.images));
  await restored.submit(form({ title: draft.title }));
  assert.equal(restarted.items.getItemDraft(), null);
  assert.equal(restarted.items.listItems().length, before + 1);
});

test("放弃草稿不改商品，编辑商品不恢复或清除新发布草稿", async () => {
  const h = runtime();
  h.users.mockLogin("tester");
  const draft = h.items.saveItemDraft({ title: "另外一件商品" });
  const edit = h.page("item-edit");
  edit.onLoad({ id: "mock-item-1" });
  assert.equal(h.modals.length, 0);
  await edit.submit(form());
  assert.equal(h.items.getItemDraft().title, draft.title);
  const next = h.page("item-edit");
  next.onLoad();
  h.modals[0].success({ confirm: false });
  assert.equal(h.items.getItemDraft(), null);
  assert.equal(next.data.form.title, "");
  assert.equal(h.items.getItem("mock-item-1").title, "试用商品");
});

test("草稿写入失败可重试，保存期间重复操作和离开页面不误发布", async () => {
  const h = runtime();
  const edit = h.page("item-edit");
  edit.setData({ form: { title: "草稿", price: "", handover_location: "", description: "" } });
  h.failStorageKey = "youwu_item_draft_v1:mock-user";
  await edit.saveDraft();
  assert.equal(edit.data.submitting, false);
  assert.equal(edit.data.savingDraft, false);
  assert.equal(h.loading, false);
  assert.equal(edit.data.form.title, "草稿");
  h.failStorageKey = "";
  h.deferSave = true;
  h.chosenImages = ["wxfile://tmp_pending.jpg"];
  edit.chooseImages();
  const pending = edit.saveDraft();
  await edit.saveDraft();
  await edit.submit(form());
  assert.equal(h.saveCalls.length, 1);
  edit.onUnload();
  h.deferredSaves[0]();
  await pending;
  assert.equal(h.items.getItemDraft(), null);
  assert.equal(h.items.listItems().some((item) => item.title === "试用商品"), false);
});

test("草稿按用户隔离，草稿清理失败不会把发布成功误报为失败", async () => {
  const h = runtime();
  h.users.mockLogin("tester");
  h.items.saveItemDraft({ title: "本人的草稿" });
  h.storage.set("youwu_mock_user_v1", { id: "another-user" });
  assert.equal(h.items.getItemDraft(), null);
  h.users.mockLogin("tester");
  h.failRemoveKey = "youwu_item_draft_v1:mock-user";
  const edit = h.page("item-edit");
  await edit.submit(form());
  assert.equal(h.toasts.at(-1), "已发布，草稿未清除");
  const count = h.items.listItems().length;
  await edit.submit(form());
  assert.equal(h.items.listItems().length, count);
});

test("拼团发起、加入、退出、成团与取消持久化，权限和人数在服务层校验", () => {
  const h = runtime();
  const groups = h.load("services/group-service.js");
  const data = { title: "纸巾拼团", total_price: "30", target_size: "2", handover_location: "56座", deadline_at: new Date(Date.now() + 86400000).toISOString() };
  assert.throws(() => groups.createGroup(data), /登录/);
  h.users.mockLogin("tester");
  const group = groups.createGroup(data);
  assert.equal(group.current_size, 1);
  assert.equal(group.per_person_price, "15.00");
  assert.throws(() => groups.leaveGroup(group.id), /团长不能退出/);
  h.storage.set("youwu_mock_user_v1", { id: "friend-a", display_name: "A" });
  assert.throws(() => groups.cancelGroup(group.id), /只有团长/);
  assert.equal(groups.joinGroup(group.id).status, "formed");
  assert.equal(groups.joinGroup(group.id).current_size, 2);
  h.storage.set("youwu_mock_user_v1", { id: "friend-b" });
  assert.throws(() => groups.joinGroup(group.id), /人数已满/);
  h.storage.set("youwu_mock_user_v1", { id: "friend-a" });
  assert.equal(groups.leaveGroup(group.id).status, "recruiting");
  h.users.mockLogin("tester");
  groups.cancelGroup(group.id);
  const restarted = runtime([...h.storage]);
  assert.equal(restarted.load("services/group-service.js").getGroup(group.id).status, "cancelled");
});

test("拼团价格、人数、截止时间校验，失败写入不改变成员或状态", () => {
  const h = runtime();
  h.users.mockLogin("tester");
  const groups = h.load("services/group-service.js");
  const data = { title: "凑单", total_price: "12.50", target_size: "3", handover_location: "大学站", deadline_at: new Date(Date.now() + 86400000).toISOString() };
  for (const patch of [{ title: "" }, { total_price: "" }, { total_price: "12.345" }, { target_size: "2.5" }, { target_size: "1" }, { deadline_at: "2020-01-01" }]) assert.throws(() => groups.createGroup({ ...data, ...patch }));
  const group = groups.createGroup(data);
  h.storage.set("youwu_mock_user_v1", { id: "friend-a" });
  h.failStorageKey = "youwu_groups_v1";
  assert.throws(() => groups.joinGroup(group.id), /空间不足/);
  assert.equal(groups.getGroup(group.id).current_size, 1);
  h.failStorageKey = "";
  const saved = h.storage.get("youwu_groups_v1");
  saved[0].deadline_at = "2020-01-01T00:00:00Z";
  assert.equal(groups.getGroup(group.id).status, "expired");
  assert.throws(() => groups.joinGroup(group.id), /已结束/);
});

test("拼团页面可发起和返回详情，重复提交不创建第二个团", () => {
  const h = runtime();
  h.users.mockLogin("tester");
  const groups = h.load("services/group-service.js");
  const edit = h.page("group-edit");
  edit.onLoad();
  h.navigationFails = true;
  const input = { detail: { value: { title: "日用品凑单", total_price: "80", target_size: "4", handover_location: "39座" } } };
  edit.submit(input);
  const count = groups.listGroups().length;
  edit.submit(input);
  assert.equal(groups.listGroups().length, count);
  const detail = h.page("group-detail");
  detail.onLoad({ id: edit._createdId });
  assert.equal(detail.data.group.is_owner, true);
  detail.copyWechat();
  assert.equal(h.clipboard, "tester");
  detail.cancelGroup();
  h.modals.at(-1).success({ confirm: false });
  assert.equal(groups.getGroup(edit._createdId).status, "recruiting");
  detail.cancelGroup();
  h.modals.at(-1).success({ confirm: true });
  assert.equal(detail.data.group.status, "cancelled");
});

test("两个隔离云客户端可共享商品和状态，云模式不读写 mock 商品", async () => {
  const { db } = createDatabase();
  const a = runtime([], { cloud: true });
  const b = runtime([], { cloud: true });
  a.cloudCall = createMarket({ db, getOpenId: () => "student-a" });
  b.cloudCall = createMarket({ db, getOpenId: () => "student-b" });
  assert.equal(a.users.getCurrentUser(), null);
  assert.throws(() => a.users.mockLogin("tester"), /模拟身份/);
  await a.users.login("student_a");
  const edit = a.page("item-edit");
  edit.onLoad();
  a.chosenImages = ["wxfile://tmp_cloud.jpg"];
  edit.chooseImages();
  await edit.submit(form());
  const items = await b.items.listItems({ status: "available" });
  assert.equal(items.length, 1);
  assert.equal(items[0].seller_id, "student-a");
  assert.match(items[0].images[0], /^cloud:\/\//);
  assert.equal(items[0].wechat_id, undefined);
  assert.equal(b.users.canViewContact(), false);
  assert.deepEqual(copy(b.items.getItemContact(items[0].id)), {});
  const home = b.page("home");
  await home.loadFeed();
  assert.equal(home.data.items[0].id, items[0].id);
  await b.users.login("student_b");
  assert.equal((await b.items.getItemContact(items[0].id)).wechat_id, "student_a");
  await assert.rejects(() => b.items.updateItem(items[0].id, form().detail.value), /只有发布者/);
  const detail = b.page("item-detail");
  await detail.loadItem(items[0].id);
  detail.setData({ id: items[0].id });
  await detail.copyWechat();
  assert.equal(b.clipboard, "student_a");
  assert.equal(b.contacts.getContactLogs().length, 1);
  await a.items.markItemStatus(items[0].id, "sold");
  await home.loadFeed();
  assert.equal(home.data.items.length, 0);
  const profile = a.page("profile");
  await profile.loadProfile();
  assert.equal(profile.data.myItems[0].status, "sold");
  await b.users.mockLogout();
  assert.equal(b.users.getCurrentUser(), null);
  assert.equal(a.storage.has("youwu_items_v1"), false);
  assert.equal(b.storage.has("youwu_items_v1"), false);
});

test("云首页忽略过时搜索响应，网络失败有重试状态且不混入本地商品", async () => {
  const h = runtime([], { cloud: true });
  const pending = [];
  h.cloudCall = (data) => new Promise((resolve) => pending.push({ data, resolve }));
  const home = h.page("home");
  const first = home.updateFeed({ q: "台灯" });
  const next = home.updateFeed({ q: "显示器" });
  pending[1].resolve({ ok: true, data: [{ id: "monitor", title: "显示器", price: 100, images: [], status: "available" }] });
  await next;
  pending[0].resolve({ ok: true, data: [] });
  await first;
  assert.equal(home.data.q, "显示器");
  assert.equal(home.data.items[0].id, "monitor");
  h.cloudFailure = true;
  await home.loadFeed();
  assert.equal(home.data.loading, false);
  assert.match(home.data.error, /云服务连接失败/);
  assert.equal(h.storage.has("youwu_items_v1"), false);
});

test("云环境缺失、登录失败和图片上传失败不会绕过权限或显示成功", async () => {
  const missing = runtime([], { cloud: true, env: "" });
  await assert.rejects(() => missing.items.listItems(), /尚未配置/);
  const h = runtime([], { cloud: true });
  h.cloudCall = async () => ({ ok: false, code: "INVALID_INPUT", message: "微信号无效" });
  const login = h.page("login");
  login.setData({ wechatId: "invalid" });
  await login.login();
  assert.equal(login.data.submitting, false);
  assert.equal(h.users.getCurrentUser(), null);
  const { db } = createDatabase();
  h.cloudCall = createMarket({ db, getOpenId: () => "student-a" });
  await h.users.login("student_a");
  const edit = h.page("item-edit");
  edit.onLoad();
  h.chosenImages = ["wxfile://tmp_retry.jpg"];
  edit.chooseImages();
  h.uploadFails = true;
  await edit.submit(form());
  assert.equal(edit.data.submitting, false);
  assert.equal(h.loading, false);
  assert.equal((await h.items.listItems()).length, 0);
  h.uploadFails = false;
  await edit.submit(form());
  assert.equal((await h.items.listItems()).length, 1);
});

test("云端过时鉴权失败响应不会清掉刚重新登录的会话", async () => {
  const h = runtime([], { cloud: true });
  const { db } = createDatabase();
  const backend = createMarket({ db, getOpenId: () => "student-a" });
  h.cloudCall = backend;
  await h.users.login("student_a");
  const key = "youwu_cloud_user_v1:test-env";
  const firstToken = h.storage.get(key).token;
  let finish;
  h.cloudCall = (event) => event.action === "list" ? new Promise((resolve) => { finish = resolve; }) : backend(event);
  const pending = h.items.listItems({ mine: true });
  await h.users.login("student_a");
  assert.notEqual(h.storage.get(key).token, firstToken);
  finish({ ok: false, code: "AUTH_REQUIRED", message: "登录已失效" });
  await assert.rejects(() => pending, /登录已失效/);
  assert.equal(h.users.getCurrentUser().id, "student-a");
});

test("首页按时间排序，支持分类搜索、空结果、清空和刷新", () => {
  const h = runtime();
  const home = h.page("home");
  home.onLoad();
  assert.ok(home.data.items.every((item) => item.status === "available"));
  const dates = home.data.items.map((item) => Date.parse(item.created_at));
  assert.deepEqual(dates, dates.slice().sort((a, b) => b - a));
  home.onSearchInput({ detail: { value: "厨房用品" } });
  assert.ok(home.data.items.length > 0);
  assert.ok(home.data.items.every((item) => item.category === "kitchen"));
  assert.ok(h.items.listItems({ q: "配电源线" }).some((item) => item.id === "mock-item-9"));
  assert.ok(h.items.listItems({ q: "dell" }).some((item) => item.id === "mock-item-1"));
  home.onSearchInput({ detail: { value: "不存在的关键词" } });
  assert.equal(home.data.items.length, 0);
  assert.equal(home.data.emptyTitle, "没有找到商品");
  home.setStatus(event({ status: "sold" }));
  home.clearSearch();
  assert.equal(home.data.status, "available");
  assert.ok(home.data.items.length > 0);
  home.onPullDownRefresh();
  assert.equal(h.refreshed, true);
  home.setStatus(event({ status: "sold" }));
  home.onSearchInput({ detail: { value: "键盘" } });
  home.onSearchInput({ detail: { value: "" } });
  assert.equal(home.data.status, "available");
  assert.ok(home.data.items.length > 0);
});

test("瀑布流将最新两件放在两列顶部，按图片比例和内容分配后续商品", () => {
  const h = runtime();
  const { buildMasonryColumns } = h.load("utils/masonry.js");
  const items = [
    { id: "newest", title: "竖图商品", cover_image_url: "tall.jpg" },
    { id: "second", title: "横图商品", cover_image_url: "wide.jpg" },
    { id: "third", title: "第三件商品", placeholder_height: 100 },
    { id: "fourth", title: "第四件商品", placeholder_height: 100 }
  ];
  const columns = buildMasonryColumns(items, {
    "tall.jpg": { width: 300, height: 900 },
    "wide.jpg": { width: 900, height: 300 }
  });
  assert.deepEqual(copy(columns[0].items.map((item) => item.id)), ["newest"]);
  assert.deepEqual(copy(columns[1].items.map((item) => item.id)), ["second", "third", "fourth"]);
  assert.equal(columns.flatMap((column) => column.items).length, items.length);
  const longTitle = "毕业搬宿出一批宿舍用品包含小桌板收纳篮延长线";
  const byContent = buildMasonryColumns([
    { id: "long", title: longTitle }, { id: "short", title: "台灯" }, { id: "next", title: "衣架" }
  ]);
  assert.equal(byContent[1].items[1].id, "next");
});

test("图片加载不移动正在浏览的卡片，图片失败、搜索和刷新保持两列一致", () => {
  const h = runtime();
  const home = h.page("home");
  home.onLoad();
  assert.equal(home.data.columns[0].items[0].id, home.data.items[0].id);
  assert.equal(home.data.columns[1].items[0].id, home.data.items[1].id);
  const placements = copy(home.data.columns);
  const first = home.data.items[0];
  home.onImageLoad({ ...event({ id: first.id }), detail: { width: 100, height: 500 } });
  assert.deepEqual(home.data.columns, placements);
  home.onImageError(event({ id: first.id }));
  assert.equal(home.data.items[0].image_error, true);
  const displayed = home.data.columns.flatMap((column) => column.items);
  assert.equal(displayed.find((item) => item.id === first.id).image_error, true);
  home.onSearchInput({ detail: { value: "显示器" } });
  home.onSearchConfirm();
  assert.equal(h.keyboardHidden, true);
  assert.equal(home.data.columns.flatMap((column) => column.items).length, home.data.items.length);
  home.clearSearch();
  assert.equal(home.data.items.find((item) => item.id === first.id).image_error, true);
  home.onPullDownRefresh();
  assert.equal(home.data.items.find((item) => item.id === first.id).image_error, false);
});

test("未登录也能从我的页进入发布并完成 mock 发布", async () => {
  const h = runtime();
  const profile = h.page("profile");
  profile.onShow();
  assert.equal(profile.data.user.id, undefined);
  profile.goNewItem();
  assert.equal(h.navigation.at(-1).url, "/pages/item-edit/item-edit");
  const edit = h.page("item-edit");
  edit.onLoad({});
  await edit.submit(form());
  assert.equal(h.items.listItems()[0].title, "试用商品");
  assert.equal(h.users.isLoggedIn(), false);
});

test("种子升级保留已有商品、修改内容和收藏", () => {
  const saved = [{ id: "custom", title: "用户原有商品", price: 20, images: [], seller_id: "mock-user" },
    { id: "mock-item-1", title: "用户改过的显示器", price: 450, images: [], owner_id: "mock-user" }];
  const h = runtime([["youwu_items_v1", saved], ["youwu_item_favorites_v1", ["custom"]]]);
  assert.equal(h.items.getItem("custom").title, "用户原有商品");
  assert.equal(h.items.getItem("mock-item-1").price, 450);
  assert.equal(h.items.getItem("mock-item-1").seller_id, "mock-user");
  assert.deepEqual(copy(h.items.getItem("mock-item-1").images), []);
  assert.equal(h.items.getItem("mock-item-1").cover_image_url, "");
  assert.equal(h.items.listFavoriteItems()[0].id, "custom");
});

test("服务层拒绝游客、非 owner 的修改和非法状态", () => {
  const h = runtime();
  const original = copy(h.items.getItem("mock-item-1"));
  assert.equal(h.items.updateItem(original.id, { title: "不应保存" }), null);
  assert.equal(h.items.deleteItem(original.id), null);
  h.users.mockLogin("tester");
  assert.equal(h.items.updateItem("mock-item-7", { title: "不应保存" }), null);
  assert.equal(h.items.markItemStatus("mock-item-7", "sold"), null);
  assert.equal(h.items.deleteItem("mock-item-7"), null);
  assert.equal(h.items.markItemStatus(original.id, "unknown"), null);
  assert.deepEqual(copy(h.items.getItem(original.id)), original);
  assert.equal(h.items.markItemStatus(original.id, "reserved").status, "reserved");
});

test("发布先保存图片，连续点击和返回失败不会重复创建", async () => {
  const h = runtime();
  const edit = h.page("item-edit");
  edit.onLoad({});
  h.chosenImages = ["wxfile://tmp_first.jpg", "http://tmp/second.jpg"];
  edit.chooseImages();
  const before = h.items.listItems().length;
  const first = edit.submit(form());
  await edit.submit(form());
  await first;
  assert.equal(h.items.listItems().length, before + 1);
  const item = h.items.listItems()[0];
  assert.equal(item.seller_id, "mock-user");
  assert.equal(item.price, 10.5);
  assert.ok(item.images.every((image) => h.savedFiles.has(image)));
  assert.equal(item.cover_image_url, item.images[0]);
  assert.equal(edit.data.submitting, true);
  h.navigationFails = true;
  h.runTimers();
  assert.equal(edit.data.submitting, false);
  await edit.submit(form());
  assert.equal(h.items.listItems().length, before + 1);
  const restarted = runtime([...h.storage]);
  assert.deepEqual(copy(restarted.items.getItem(item.id).images), copy(item.images));
});

test("图片部分保存失败后可以保留路径并重试", async () => {
  const h = runtime();
  const edit = h.page("item-edit");
  h.chosenImages = ["wxfile://tmp_first.jpg", "wxfile://tmp_second.jpg"];
  edit.chooseImages();
  h.failImage = h.chosenImages[1];
  const before = h.items.listItems().length;
  await edit.submit(form());
  assert.equal(h.items.listItems().length, before);
  assert.equal(edit.data.submitting, false);
  assert.equal(h.loading, false);
  assert.ok(edit.data.images[0].startsWith("wxfile://usr/"));
  assert.equal(edit.data.images[1], "wxfile://tmp_second.jpg");
  assert.match(h.toasts.at(-1), /第2张图片保存失败/);
  h.failImage = "";
  await edit.submit(form());
  assert.equal(h.items.listItems().length, before + 1);
  assert.equal(h.saveCalls.filter((image) => image === "wxfile://tmp_first.jpg").length, 1);
});

test("本地 storage 写入失败后解除 loading，重试只保存一件商品", async () => {
  const h = runtime();
  const before = h.items.listItems().length;
  const edit = h.page("item-edit");
  h.failStorageKey = "youwu_items_v1";
  await edit.submit(form());
  assert.equal(h.items.listItems().length, before);
  assert.equal(edit.data.submitting, false);
  assert.equal(h.loading, false);
  assert.equal(h.toasts.at(-1), "本地空间不足");
  h.failStorageKey = "";
  await edit.submit(form());
  assert.equal(h.items.listItems().length, before + 1);
});

test("必填价格校验、9图上限、取消选择和旧接口回退", async () => {
  const h = runtime();
  const edit = h.page("item-edit");
  const before = h.items.listItems().length;
  for (const values of [{ price: "" }, { price: "abc" }, { price: "0" }, { title: " " }, { handover_location: " " }]) {
    await edit.submit(form(values));
    assert.equal(h.items.listItems().length, before);
  }
  h.mediaError = "chooseMedia:fail cancel";
  edit.chooseImages();
  assert.equal(h.fallbackUsed, undefined);
  assert.equal(edit.data.selectingImages, false);
  h.mediaError = "chooseMedia:fail unsupported";
  h.chosenImages = Array.from({ length: 12 }, (_, index) => `wxfile://tmp_${index}.jpg`);
  edit.chooseImages();
  assert.equal(h.fallbackUsed, true);
  assert.equal(edit.data.images.length, 9);
  edit.removeImage(event({ index: 0 }));
  assert.equal(edit.data.images.length, 8);
  edit.previewImage(event({ index: 0 }));
  assert.equal(h.preview.current, edit.data.images[0]);
});

test("表单同时标出必填错误，修改字段只清除对应提示", async () => {
  const h = runtime();
  const edit = h.page("item-edit");
  const before = h.items.listItems().length;
  await edit.submit(form({ title: "", price: "", handover_location: "" }));
  assert.equal(edit.data.errors.title, "请填写商品标题");
  assert.equal(edit.data.errors.price, "请填写价格");
  assert.equal(edit.data.errors.handover_location, "请填写交收地点");
  assert.equal(edit.data.focusField, "title");
  edit.onFieldInput({ ...event({ field: "title" }), detail: { value: "电饭锅" } });
  assert.equal(edit.data.errors.title, "");
  assert.equal(edit.data.errors.price, "请填写价格");
  assert.equal(h.items.listItems().length, before);
  await edit.submit(form());
  assert.deepEqual(edit.data.errors, {});
  assert.equal(h.items.listItems().length, before + 1);
});

test("详情多图切换后预览当前图片，返回页面保留位置并隔离坏图", () => {
  const h = runtime();
  const item = h.items.createItem({ ...form().detail.value, images: [
    "/assets/items/monitor.svg", "/assets/items/router.svg", "/assets/items/chair.svg"
  ] });
  const detail = h.page("item-detail");
  detail.onLoad({ id: item.id });
  assert.equal(detail.data.gallery.length, 3);
  detail.onGalleryChange({ detail: { current: 2 } });
  detail.previewImages();
  assert.equal(h.preview.current, item.images[2]);
  detail.onShow();
  assert.equal(detail.data.currentImage, 2);
  detail.onImageError(event({ index: 1 }));
  assert.equal(detail.data.gallery[1].failed, true);
  assert.equal(detail.data.gallery[0].failed, false);
  detail.previewImages();
  assert.deepEqual(copy(h.preview.urls), [item.images[0], item.images[2]]);
  detail.onGalleryChange({ detail: { current: 1 } });
  h.preview = null;
  detail.previewImages();
  assert.equal(h.preview, null);
  assert.match(h.toasts.at(-1), /图片/);
  h.users.mockLogin("tester");
  h.items.updateItem(item.id, { ...item, images: [] });
  detail.onShow();
  assert.equal(detail.data.gallery.length, 0);
  assert.equal(detail.data.currentImage, 0);
  h.items.updateItem(item.id, { ...item, images: [item.images[2]] });
  detail.onShow();
  detail.onImageError(event({ index: 0, url: item.images[0] }));
  assert.equal(detail.data.gallery[0].failed, false);
  detail.onLoad({});
  assert.equal(detail.data.missing, true);
  assert.equal(detail.data.gallery.length, 0);
});

test("收藏写入失败不改变按钮或数据，重试可收藏和取消", () => {
  const h = runtime();
  const detail = h.page("item-detail");
  detail.onLoad({ id: "mock-item-7" });
  h.failStorageKey = "youwu_item_favorites_v1";
  assert.doesNotThrow(() => detail.toggleFavorite());
  assert.equal(detail.data.item.is_favorited, false);
  assert.equal(h.items.listFavoriteItems().length, 0);
  assert.equal(h.toasts.at(-1), "收藏失败，请重试");
  h.failStorageKey = "";
  detail.toggleFavorite();
  assert.equal(detail.data.item.is_favorited, true);
  h.failStorageKey = "youwu_item_favorites_v1";
  assert.doesNotThrow(() => detail.toggleFavorite());
  assert.equal(detail.data.item.is_favorited, true);
  assert.equal(h.items.listFavoriteItems().length, 1);
  h.failStorageKey = "";
  detail.toggleFavorite();
  assert.equal(h.items.listFavoriteItems().length, 0);
});

test("删除以商品写入结果为准，收藏清理失败不误报删除失败", () => {
  const h = runtime();
  h.users.mockLogin("tester");
  h.items.favoriteItem("mock-item-1");
  const detail = h.page("item-detail");
  detail.onLoad({ id: "mock-item-1" });
  h.failStorageKey = "youwu_items_v1";
  detail.removeItem();
  h.modals.at(-1).success({ confirm: true });
  assert.ok(h.items.getItem("mock-item-1"));
  assert.equal(h.items.listFavoriteItems().length, 1);
  assert.equal(detail.data.missing, false);
  assert.equal(h.toasts.at(-1), "删除失败，请重试");
  h.failStorageKey = "youwu_item_favorites_v1";
  detail.removeItem();
  h.modals.at(-1).success({ confirm: true });
  assert.equal(h.items.getItem("mock-item-1"), null);
  assert.equal(h.items.listFavoriteItems().length, 0);
  assert.equal(detail.data.missing, true);
  assert.equal(h.toasts.at(-1), "已删除");
});

test("分享文案复制失败提示重试，不显示成功", () => {
  const h = runtime();
  const detail = h.page("item-detail");
  detail.onLoad({ id: "mock-item-1" });
  h.clipboardFails = true;
  detail.copyShareText();
  assert.equal(h.toasts.at(-1), "复制失败，请重试");
  h.clipboardFails = false;
  detail.copyShareText();
  assert.match(h.clipboard, /Dell 27寸显示器/);
  assert.match(h.clipboard, /价格：500元/);
  assert.equal(h.toasts.at(-1), "文案已复制");
});

test("编辑可以删除最后一张图片，并保持发布者和状态", async () => {
  const h = runtime();
  h.users.mockLogin("tester");
  const edit = h.page("item-edit");
  edit.onLoad({ id: "mock-item-1" });
  edit.removeImage(event({ index: 0 }));
  await edit.submit(form({ title: "改好的显示器" }));
  const item = h.items.getItem("mock-item-1");
  assert.equal(item.title, "改好的显示器");
  assert.deepEqual(copy(item.images), []);
  assert.equal(item.cover_image_url, "");
  assert.equal(item.seller_id, "mock-user");
  assert.equal(item.status, "available");
});

test("直接打开非本人或不存在的编辑页不会误创建商品", async () => {
  for (const id of ["mock-item-7", "deleted-item"]) {
    const h = runtime();
    h.users.mockLogin("tester");
    const before = h.items.listItems().length;
    const edit = h.page("item-edit");
    edit.onLoad({ id });
    assert.ok(edit.data.unavailableReason);
    await edit.submit(form());
    assert.equal(h.items.listItems().length, before);
  }
});

test("保存图片期间退出登录会阻止编辑写入", async () => {
  const h = runtime();
  h.users.mockLogin("tester");
  const original = copy(h.items.getItem("mock-item-1"));
  const edit = h.page("item-edit");
  edit.onLoad({ id: original.id });
  edit.setData({ images: ["wxfile://tmp_new.jpg"] });
  h.tempFiles.add("wxfile://tmp_new.jpg");
  h.deferSave = true;
  const pending = edit.submit(form({ title: "不应保存" }));
  h.users.mockLogout();
  h.deferredSaves[0]();
  await pending;
  assert.equal(edit.data.submitting, false);
  assert.deepEqual(copy(h.items.getItem(original.id)), original);
});

test("保存图片期间离开发布页不会创建商品或稍后强制跳转", async () => {
  const h = runtime();
  const before = h.items.listItems().length;
  const edit = h.page("item-edit");
  edit.setData({ images: ["wxfile://tmp_new.jpg"] });
  h.tempFiles.add("wxfile://tmp_new.jpg");
  h.deferSave = true;
  const pending = edit.submit(form());
  edit.onUnload();
  h.deferredSaves[0]();
  await pending;
  h.runTimers();
  assert.equal(h.items.listItems().length, before);
  assert.equal(h.navigation.length, 0);
  assert.equal(h.loading, false);
});

test("联系权限实时复核，只有复制成功才记录联系日志", () => {
  const h = runtime();
  const detail = h.page("item-detail");
  detail.onLoad({ id: "mock-item-7" });
  detail.copyWechat();
  assert.equal(h.clipboard, undefined);
  assert.equal(h.contacts.logContactView("mock-item-7", "mock-user-2"), null);
  h.users.mockLogin("tester");
  detail.onShow();
  assert.equal(detail.data.contact.wechat_id, "grace_cuhk");
  h.clipboardFails = true;
  detail.copyWechat();
  assert.equal(h.contacts.getContactLogs().length, 0);
  h.clipboardFails = false;
  detail.copyWechat();
  assert.equal(h.clipboard, "grace_cuhk");
  const log = h.contacts.getContactLogs()[0];
  assert.equal(log.target_user_id, "mock-user-2");
  assert.equal(log.viewer_id, "mock-user");
  h.users.mockLogout();
  h.clipboard = "";
  detail.copyWechat();
  assert.equal(h.clipboard, "");
  assert.equal(detail.data.canViewContact, false);
});

test("删除确认时重新检查 owner，已删除详情清空联系方式与管理操作", () => {
  const h = runtime();
  h.users.mockLogin("tester");
  const detail = h.page("item-detail");
  detail.onLoad({ id: "mock-item-1" });
  h.items.favoriteItem("mock-item-1");
  detail.removeItem();
  h.users.mockLogout();
  h.modals[0].success({ confirm: true });
  assert.ok(h.items.getItem("mock-item-1"));
  h.users.mockLogin("tester");
  detail.onShow();
  detail.removeItem();
  h.modals[1].success({ confirm: false });
  assert.ok(h.items.getItem("mock-item-1"));
  detail.removeItem();
  h.modals[2].success({ confirm: true });
  assert.equal(h.items.getItem("mock-item-1"), null);
  assert.equal(detail.data.missing, true);
  assert.equal(detail.data.isOwner, false);
  assert.deepEqual(detail.data.contact, {});
  assert.equal(h.items.listFavoriteItems().length, 0);
  h.runTimers();
  assert.equal(h.navigation.at(-1).url, "/pages/home/home");
});

test("状态更新同步首页和我的发布，退出登录清除所有本地登录状态", () => {
  const h = runtime();
  h.users.mockLogin("tester");
  const detail = h.page("item-detail");
  detail.onLoad({ id: "mock-item-1" });
  detail.markSold();
  assert.equal(detail.data.item.status, "sold");
  assert.ok(!h.items.listItems({ status: "available" }).some((item) => item.id === detail.data.id));
  const profile = h.page("profile");
  profile.onShow();
  assert.equal(profile.data.myItems.find((item) => item.id === detail.data.id).status, "sold");
  h.contacts.logContactView("mock-item-7", "mock-user-2");
  profile.onShow();
  assert.equal(profile.data.contactedItems[0].id, "mock-item-7");
  profile.logout();
  assert.equal(h.users.getCurrentUser(), null);
  assert.equal(h.storage.has("user"), false);
  assert.equal(h.storage.has("access_token"), false);
  assert.equal(profile.data.myItems.length, 0);
  assert.equal(profile.data.contactedItems.length, 0);
});

test("状态菜单支持预订、取消预订、下架、重新上架和标记已售", () => {
  const h = runtime();
  h.users.mockLogin("tester");
  const detail = h.page("item-detail");
  detail.onLoad({ id: "mock-item-1" });
  const choose = (label) => {
    detail.manageStatus();
    const sheet = h.actionSheets.at(-1);
    assert.equal(sheet.itemList.length, 3);
    const index = sheet.itemList.indexOf(label);
    assert.ok(index >= 0, `Missing action: ${label}`);
    sheet.success({ tapIndex: index });
  };
  choose("标记已预订");
  assert.equal(h.items.getItem(detail.data.id).status, "reserved");
  choose("恢复在售");
  assert.equal(h.items.getItem(detail.data.id).status, "available");
  choose("下架商品");
  assert.equal(h.items.getItem(detail.data.id).status, "available");
  h.modals.at(-1).success({ confirm: false });
  assert.equal(h.items.getItem(detail.data.id).status, "available");
  choose("下架商品");
  h.modals.at(-1).success({ confirm: true });
  assert.equal(h.items.getItem(detail.data.id).status, "off_shelf");
  choose("恢复在售");
  assert.ok(h.items.listItems({ status: "available" }).some((item) => item.id === detail.data.id));
  choose("标记已售出");
  assert.equal(h.items.getItem(detail.data.id).status, "sold");
});

test("非 owner 无状态菜单，菜单打开后退出登录也不能修改", () => {
  const h = runtime();
  h.users.mockLogin("tester");
  const detail = h.page("item-detail");
  detail.onLoad({ id: "mock-item-7" });
  detail.manageStatus();
  assert.equal(h.actionSheets.length, 0);
  detail.onLoad({ id: "mock-item-1" });
  detail.manageStatus();
  const sheet = h.actionSheets[0];
  h.users.mockLogout();
  sheet.success({ tapIndex: sheet.itemList.indexOf("标记已售出") });
  assert.equal(h.items.getItem("mock-item-1").status, "available");
});

test("模拟登录从详情返回原页，单独打开时回到我的页", () => {
  for (const depth of [1, 2]) {
    const h = runtime();
    h.pages = Array.from({ length: depth }, () => ({}));
    const login = h.page("login");
    login.login();
    h.runTimers();
    assert.equal(h.users.isLoggedIn(), true);
    assert.equal(h.navigation.at(-1).method, depth === 1 ? "switchTab" : "navigateBack");
  }
});
