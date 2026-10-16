const cloud = require("wx-server-sdk");
const { createMarket } = require("./market");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
// Creation checks a not-yet-existing document inside the idempotency transaction.
const market = createMarket({
  db: cloud.database({ throwOnNotFound: false }),
  getOpenId: () => cloud.getWXContext().OPENID
});
exports.main = (event) => market(event);
