# CUHK Between Things

CUHK 校园交易与资源共享社区。定位是二手交易与拼团信息沉淀平台，不做校巴、校历、课表等校园工具箱功能。

## Structure

- `miniprogram/`：微信小程序源码。
- `apps/web/`：Next.js Web/API/BFF 骨架和管理员后台入口。
- `supabase/schema.sql`：PostgreSQL schema、索引、触发器、RLS 策略。
- `docs/PRODUCT_SPEC.md`：完整 PRD、流程图、页面结构、ER 图、API、权限、UI 规范、线框图、开发顺序。

## Mini Program

微信开发者工具打开本仓库根目录 `/Users/amadeus/WeChatProjects/miniprogram-2`。

小程序 API 配置：

```js
// miniprogram/utils/config.js
API_BASE_URL: "http://localhost:3000/api"
```

上线前需要替换为 HTTPS 域名，并在微信公众平台配置 request 合法域名。

## Data Mode

当前小程序运行在 local mock mode：

- 商品页面统一调用 `miniprogram/services/item-service.js`。
- 用户登录、退出和联系权限统一调用 `miniprogram/services/user-service.js`。
- 复制联系方式时通过 `miniprogram/services/contact-service.js` 记录本地联系日志。
- `item-service.js`、`user-service.js` 和 `contact-service.js` 暂时都运行在 mock mode。
- `item-service.js` 和 `user-service.js` 内部暂时使用 `miniprogram/utils/mock-store.js` 读写本地 mock 数据。
- `mock-store.js` 作为 dev/mock 数据源保留，便于离线演示首页浏览、详情查看、发布、编辑、下架和标记已售。
- 后续接入 Supabase 时，优先替换 services 内部实现，页面层不需要直接改为调用 Supabase。

本地试用数据保存在各自设备上，不会在同学之间同步。分享文案不会将本地发布的商品同步到另一台手机；举报目前只模拟提交反馈。清理缓存会移除本地商品、收藏、登录状态和保存的图片。

发布图片会先保存为本地持久文件再写入商品数据。图片或 storage 保存失败时保留表单，可以重试。编辑、状态修改和删除都会在 `item-service` 重新检查当前发布者身份。

## Mini Program Checks

无需启动网页端或安装额外依赖：

```bash
node scripts/check-miniprogram.cjs
node --test tests/miniprogram.test.cjs
```

第一条校验页面、tab 图标、事件处理函数、跳转引用和所有业务 JS 语法；第二条使用隔离的微信 API mock 测试浏览、发布、图片保存失败重试、编辑权限、联系记录和登录返回等流程，不会读写开发者工具中的试用数据。

真机体验自测步骤见 [docs/TESTING.md](docs/TESTING.md)。

## Web/API

```bash
cd apps/web
npm install
npm run dev
```

配置文件示例在 `apps/web/.env.example`。

## Supabase

在 Supabase SQL Editor 执行：

```text
supabase/schema.sql
```

小程序与 Web 共用同一个 Supabase 数据库。
