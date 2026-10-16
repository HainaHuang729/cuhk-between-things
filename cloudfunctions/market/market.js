const crypto = require("node:crypto");

const categories = {
  electronics: "电子产品",
  furniture: "家具",
  dorm: "宿舍用品",
  kitchen: "厨房用品",
  textbook: "教材",
  clothing: "衣物",
  sports: "运动用品",
  other: "其他"
};
const conditions = ["new", "like_new", "good", "usable", "flawed"];
const statuses = ["available", "reserved", "sold", "off_shelf"];
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
function reject(message, code = "INVALID_INPUT") {
  const error = new Error(message);
  error.code = code;
  error.isPublic = true;
  throw error;
}
function text(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function publicItem(item) {
  if (!item) return null;
  const fields = [
    "title",
    "description",
    "price",
    "category",
    "condition",
    "images",
    "seller_id",
    "seller_name",
    "handover_location",
    "dormitory",
    "status",
    "created_at",
    "updated_at"
  ];
  return fields.reduce(
    (result, field) => {
      result[field] = item[field];
      return result;
    },
    { id: item._id }
  );
}

function validateItem(input, openid) {
  const title = text(input.title, 120);
  const location = text(input.handover_location, 100);
  const price = Number(input.price);
  if (!title || !location) reject("请填写标题和交收地点");
  if (
    !/^\d+(\.\d{1,2})?$/.test(String(input.price)) ||
    !Number.isFinite(price) ||
    price <= 0 ||
    price > 99999999
  )
    reject("价格须大于0且最多两位小数");
  if (!Object.hasOwn(categories, input.category) || !conditions.includes(input.condition))
    reject("分类或成色无效");
  const images = input.images || [];
  if (
    !Array.isArray(images) ||
    images.length > 9 ||
    images.some((url) => {
      if (typeof url !== "string" || !url.startsWith("cloud://")) return true;
      const path = url.slice(url.indexOf("/", 8));
      return !path.startsWith(`/items/${openid}/`) || !/\/[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp)$/.test(path);
    })
  )
    reject("图片须上传至当前用户的云目录，最多9张");
  return {
    title,
    price,
    handover_location: location,
    dormitory: location,
    description: text(input.description, 2000),
    category: input.category,
    condition: input.condition,
    images
  };
}

function createMarket({ db, getOpenId, now = Date.now }) {
  const users = db.collection("youwu_users");
  const items = db.collection("youwu_items");
  const find = async (collection, id) => (await collection.where({ _id: id }).limit(1).get()).data[0] || null;
  async function authenticate(event, openid) {
    const user = await find(users, openid);
    if (
      !user ||
      typeof event.session !== "string" ||
      !event.session ||
      user.session_hash !== hash(event.session) ||
      user.expires_at <= now()
    )
      reject("登录已失效，请重新登录", "AUTH_REQUIRED");
    return user;
  }

  return async function market(event = {}) {
    try {
      // Never accept identity fields supplied by the client, including OPENID/userInfo.
      const openid = getOpenId();
      if (!openid) reject("请从微信小程序调用", "AUTH_REQUIRED");
      const action = event.action;
      if (action === "login") {
        const wechat = text(event.wechat_id, 40);
        if (!/^[a-zA-Z][a-zA-Z0-9_-]{5,39}$/.test(wechat)) reject("微信号须以字母开头，6至40位");
        const token = crypto.randomBytes(32).toString("hex");
        const user = {
          id: openid,
          display_name: text(event.display_name, 30) || "CUHK 同学",
          wechat_id: wechat
        };
        const expires = now() + 7 * 86400000;
        await users.doc(openid).set({ data: { ...user, session_hash: hash(token), expires_at: expires } });
        return { ok: true, data: { user, token, expires_at: expires } };
      }
      if (action === "list") {
        const clauses = [];
        if (event.mine) {
          await authenticate(event, openid);
          clauses.push({ seller_id: openid });
        }
        if (event.status && event.status !== "all") {
          if (!statuses.includes(event.status)) reject("商品状态无效");
          clauses.push({ status: event.status });
        }
        const keyword = text(event.q, 80);
        if (keyword) {
          const regex = db.RegExp({ regexp: keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), options: "i" });
          const terms = [
            { title: regex },
            { description: regex },
            { handover_location: regex },
            { category: regex }
          ];
          Object.entries(categories)
            .filter(([, label]) => label.includes(keyword))
            .forEach(([category]) => terms.push({ category }));
          clauses.push(db.command.or(terms));
        }
        const query = clauses.length ? items.where(db.command.and(clauses)) : items;
        const data = await query.orderBy("created_at", "desc").limit(100).get();
        return { ok: true, data: data.data.map(publicItem) };
      }
      const id = text(event.id, 150);
      if (action === "get") return { ok: true, data: id ? publicItem(await find(items, id)) : null };
      const user = await authenticate(event, openid);
      if (action === "logout") {
        await users
          .where({ _id: openid, session_hash: hash(event.session) })
          .update({ data: { session_hash: "", expires_at: 0 } });
        return { ok: true, data: true };
      }
      if (action === "create") {
        const input = validateItem(event.data || {}, openid);
        if (!/^[a-zA-Z0-9-]{8,80}$/.test(event.request_id || "")) reject("缺少发布请求标识");
        const itemId = `item-${hash(openid + event.request_id).slice(0, 40)}`;
        const item = await db.runTransaction(async (transaction) => {
          const ref = transaction.collection("youwu_items").doc(itemId);
          const previous = await ref.get();
          if (previous.data) return previous.data;
          const data = {
            ...input,
            seller_id: openid,
            seller_name: user.display_name,
            status: "available",
            created_at: new Date(now()).toISOString(),
            updated_at: new Date(now()).toISOString()
          };
          await ref.set({ data });
          return { ...data, _id: itemId };
        });
        return { ok: true, data: publicItem(item) };
      }
      const item = id ? await find(items, id) : null;
      if (!item) reject("商品已删除或不存在", "NOT_FOUND");
      if (action === "contact") {
        const seller = await find(users, item.seller_id);
        return { ok: true, data: { wechat_id: seller ? seller.wechat_id : "" } };
      }
      if (item.seller_id !== openid) reject("只有发布者可操作", "FORBIDDEN");
      if (action === "delete") {
        await items.doc(id).remove();
        return { ok: true, data: publicItem(item) };
      }
      let update;
      if (action === "status") {
        if (!statuses.includes(event.status)) reject("商品状态无效");
        update = { status: event.status };
      } else if (action === "update") update = validateItem(event.data || {}, openid);
      else reject("不支持的操作");
      update.updated_at = new Date(now()).toISOString();
      await items.doc(id).update({ data: update });
      return { ok: true, data: publicItem({ ...item, ...update }) };
    } catch (error) {
      return {
        ok: false,
        code: error.isPublic ? error.code : "SERVICE_ERROR",
        message: error.isPublic ? error.message : "云服务暂时不可用，请稍后重试"
      };
    }
  };
}

module.exports = { createMarket };
