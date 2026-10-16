const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createMarket } = require("../cloudfunctions/market/market");
const { createDatabase } = require("./helpers/cloud-db.cjs");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

test("云函数入口配置不存在文档返回 null，并逐次读取微信上下文身份", async () => {
  const { db } = createDatabase();
  let openid = "student-a";
  let configured;
  const sdk = { DYNAMIC_CURRENT_ENV: Symbol("current-env"), init: () => {},
    database: (options) => { configured = options; return db; }, getWXContext: () => ({ OPENID: openid }) };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, "../cloudfunctions/market/index.js"), "utf8"), {
    module, exports: module.exports, require: (name) => name === "wx-server-sdk" ? sdk : { createMarket }
  });
  assert.equal(configured.throwOnNotFound, false);
  const first = await module.exports.main({ action: "login", wechat_id: "student_a" });
  openid = "student-b";
  const second = await module.exports.main({ action: "login", wechat_id: "student_b" });
  assert.equal(first.data.user.id, "student-a");
  assert.equal(second.data.user.id, "student-b");
});

test("上游错误不向客户端泄漏原始配置、数据库信息或凭证", async () => {
  const { db } = createDatabase();
  const market = createMarket({ db, getOpenId: () => { const error = new Error("private upstream details"); error.code = "E_UPSTREAM"; throw error; } });
  const result = await market({ action: "list" });
  assert.equal(result.code, "SERVICE_ERROR");
  assert.doesNotMatch(JSON.stringify(result), /private|E_UPSTREAM/);
});

function setup() {
  const { db, collections } = createDatabase();
  let time = Date.now();
  const caller = (openid) => createMarket({ db, getOpenId: () => openid, now: () => time });
  return { a: caller("student-a"), b: caller("student-b"), missing: caller(undefined), collections,
    advance: (milliseconds) => { time += milliseconds; } };
}
const input = (patch = {}) => ({ title: "Dell显示器", price: "500.50", description: "毕业出闲置", category: "electronics", condition: "good", handover_location: "56座", images: [], ...patch });
const login = async (client, wechat) => {
  const result = await client({ action: "login", wechat_id: wechat });
  assert.equal(result.ok, true);
  return result.data.token;
};

test("云端游客可浏览但不能读取联系方式，公共响应不包含微信号和令牌", async () => {
  const h = setup();
  const session = await login(h.a, "student_a");
  const created = await h.a({ action: "create", session, data: input({ wechat_id: "injected" }), request_id: "request-001" });
  assert.equal(created.ok, true);
  const id = created.data.id;
  for (const response of [created, await h.b({ action: "get", id }), await h.b({ action: "list" })]) {
    assert.equal(response.ok, true);
    assert.doesNotMatch(JSON.stringify(response), /wechat_id|student_a|session_hash|token/);
  }
  assert.equal((await h.b({ action: "contact", id })).code, "AUTH_REQUIRED");
  const bSession = await login(h.b, "student_b");
  assert.equal((await h.b({ action: "contact", id, session: bSession })).data.wechat_id, "student_a");
});

test("云函数只接受微信上下文身份，非 owner 不能编辑、改状态或删除", async () => {
  const h = setup();
  const aSession = await login(h.a, "student_a");
  const bSession = await login(h.b, "student_b");
  const created = await h.a({ action: "create", session: aSession, request_id: "request-002", data: input({ seller_id: "student-b", status: "sold" }) });
  const id = created.data.id;
  assert.equal(created.data.seller_id, "student-a");
  assert.equal(created.data.status, "available");
  for (const action of ["update", "status", "delete"]) {
    assert.equal((await h.b({ action, id, data: input(), status: "sold", session: bSession, OPENID: "student-a", userInfo: { openId: "student-a" }, seller_id: "student-a" })).code, "FORBIDDEN");
  }
  assert.equal((await h.b({ action: "status", id, status: "sold", session: aSession })).code, "AUTH_REQUIRED");
  assert.equal((await h.missing({ action: "list", OPENID: "student-a" })).code, "AUTH_REQUIRED");
  assert.equal((await h.a({ action: "status", id, status: "unknown", session: aSession })).code, "INVALID_INPUT");
});

test("发布请求幂等，网络重试不重复创建，也不重置已售状态", async () => {
  const h = setup();
  const session = await login(h.a, "student_a");
  const event = { action: "create", session, data: input(), request_id: "same-request-123" };
  const [one, two] = await Promise.all([h.a(event), h.a(event)]);
  assert.equal(one.ok, true);
  assert.equal(one.data.id, two.data.id);
  assert.equal(h.collections.get("youwu_items").size, 1);
  await h.a({ action: "status", id: one.data.id, status: "sold", session });
  assert.equal((await h.a(event)).data.status, "sold");
});

test("云端校验必填字段、价格、枚举和图片路径，不信任前端校验", async () => {
  const h = setup();
  const session = await login(h.a, "student_a");
  for (const patch of [{ title: "" }, { handover_location: "" }, { price: "" }, { price: "-1" }, { price: "12.345" }, { category: "__proto__" },
    { condition: "unknown" }, { images: ["wxfile://tmp_a.jpg"] }, { images: ["cloud://env.bucket/items/student-b/image.jpg"] },
    { images: Array(10).fill("cloud://env.bucket/items/student-a/image.jpg") }]) {
    const result = await h.a({ action: "create", session, request_id: "invalid-request", data: input(patch) });
    assert.equal(result.code, "INVALID_INPUT", JSON.stringify(patch));
  }
  const valid = await h.a({ action: "create", session, request_id: "valid-request", data: input({ images: ["cloud://env.bucket/items/student-a/image.jpg"] }) });
  assert.equal(valid.ok, true);
  assert.equal((await h.a({ action: "login", wechat_id: "bad id" })).code, "INVALID_INPUT");
});

test("云端状态、搜索、我的发布、删除和登录有效期", async () => {
  const h = setup();
  const session = await login(h.a, "student_a");
  const bSession = await login(h.b, "student_b");
  const created = await h.a({ action: "create", session, request_id: "request-status", data: input() });
  const id = created.data.id;
  assert.equal((await h.b({ action: "list", q: "电子产品" })).data.length, 1);
  assert.equal((await h.b({ action: "list", q: "[.*" })).data.length, 0);
  assert.equal((await h.b({ action: "list", mine: true, session: bSession })).data.length, 0);
  for (const status of ["reserved", "sold", "off_shelf", "available"]) {
    assert.equal((await h.a({ action: "status", id, status, session })).data.status, status);
    assert.equal((await h.b({ action: "get", id })).data.status, status);
    assert.equal((await h.b({ action: "list", status })).data.length, 1);
  }
  assert.equal((await h.a({ action: "delete", id, session })).ok, true);
  assert.equal((await h.b({ action: "get", id })).data, null);
  await h.a({ action: "logout", session });
  assert.equal((await h.a({ action: "list", mine: true, session })).code, "AUTH_REQUIRED");
  h.advance(8 * 86400000);
  assert.equal((await h.b({ action: "list", mine: true, session: bSession })).code, "AUTH_REQUIRED");
});
