# CUHK Between Things

CUHK 校园交易与资源共享社区。定位是二手交易与拼团信息沉淀平台，不做校巴、校历、课表等校园工具箱功能。

## Structure

- `miniprogram/`：微信小程序源码。
- `apps/web/`：Next.js Web/API/BFF 骨架和管理员后台入口。
- `supabase/schema.sql`：PostgreSQL schema、索引、触发器、RLS 策略。
- `docs/PRODUCT_SPEC.md`：完整 PRD、流程图、页面结构、ER 图、API、权限、UI 规范、线框图、开发顺序。

## Mini Program

微信开发者工具打开本仓库根目录 `/Users/amadeus/WeChatProjects/miniprogram-2`。

商品和拼团页面不依赖 localhost Web/API，不需要启动网页端。旧 `utils/config.js` 仅供未启用的 Web/API 骨架使用。

## Data Mode

当前默认运行在 local mock mode，可显式切换微信云开发商品模式：

- 商品页面统一调用 `miniprogram/services/item-service.js`。
- 用户登录、退出和联系权限统一调用 `miniprogram/services/user-service.js`。
- 复制联系方式时通过 `miniprogram/services/contact-service.js` 记录本地联系日志。
- `item-service.js`、`user-service.js` 和 `contact-service.js` 默认运行在 mock mode；目标 envId 已配置，`market` 云函数、两个私有集合及三个查询索引已部署。存储、运行参数和实际云调用尚未验收，因此未启用 cloud mode，未完成双真机联调。
- `item-service.js` 和 `user-service.js` 内部暂时使用 `miniprogram/utils/mock-store.js` 读写本地 mock 数据。
- `mock-store.js` 作为 dev/mock 数据源保留，便于离线演示首页浏览、详情查看、发布、编辑、下架和标记已售。
- 模式开关是 `miniprogram/utils/data-mode.js`，保持 `mode: "mock"` 即可离线演示。云连接失败不会回退并混入 mock seeds，不自动迁移本机数据。
- 微信云模式只共享商品与图片；微信上下文身份和联系方式权限由 `cloudfunctions/market` 验证，不伪称已通过 CUHK 邮箱验证。部署、规则、已知依赖审计告警和双真机脚本见 [docs/CLOUD_SETUP.md](docs/CLOUD_SETUP.md)。

本地试用数据保存在各自设备上，不会在同学之间同步。分享文案不会将本地发布的商品同步到另一台手机；举报目前只模拟提交反馈。清理缓存会移除本地商品、收藏、登录状态和保存的图片。

发布图片会先保存为本地持久文件再写入商品数据。图片或 storage 保存失败时保留表单，可以重试。编辑、状态修改和删除都会在 `item-service` 重新检查当前发布者身份。

“我的”页始终提供发布入口，便于未登录时试用发布。模拟登录后，发布者可在商品详情的“修改状态”菜单中预订、取消预订、标记已售、下架或恢复在售。

首页使用左右两列独立的瀑布流，最新两件位于两列顶部。图片保持原比例，使用内容高度估算和已加载图片的尺寸分配列；图片加载过程中保持位置稳定，后续搜索或刷新时使用已知尺寸重新分配。

商品详情支持多图滑动、张数显示和当前图片预览，预览返回后保留位置；单张图片加载失败不会影响其他图片。发布表单会在必填字段旁显示错误，并定位到第一个错误字段。收藏与分享复制失败时可以重试，删除结果以商品数据是否成功删除为准。

新发布支持手动“存草稿”：允许必填项尚未填完，图片先持久化；再次进入发布页可继续编辑或重新填写。每个本地用户只保留一份新商品草稿，成功发布后清除；编辑现有商品不覆盖草稿。不是自动保存，清缓存会丢失草稿。

“拼团”tab 已有本机 mock 闭环：发起、加入、退出、满员成团、截止、团长取消、复制联系方式和文案。人数包含团长，2至50人，人均按目标人数计算。`group-service` 是拼团页面唯一数据入口；即使商品启用云模式，拼团仍只保存在本机，不能用于多人真实拼团。

## Mini Program Checks

无需启动网页端或安装额外依赖：

```bash
node scripts/check-miniprogram.cjs
node --test tests/miniprogram.test.cjs tests/cloud-market.test.cjs
```

第一条校验页面、tab 图标、事件处理函数、跳转引用和所有小程序业务 JS 语法，同时拦截被 Git 忽略的本地依赖，避免“本机能打开，干净副本缺文件”；第二条使用隔离的微信 API mock 和内存数据库测试商品、草稿、拼团、异步读写及云权限，不会读写开发者工具数据或实际云资源。

真机体验自测步骤见 [docs/TESTING.md](docs/TESTING.md)。

## Web/API

```bash
cd apps/web
npm install
npm run dev
```

配置文件示例在 `apps/web/.env.example`。

## Supabase

`supabase/schema.sql` 和 Web/API 目前仅作为未来方案保留，未连接当前小程序。本轮微信云试用不需要执行 Supabase schema，不要将其与微信云商品库分别作为两个在线数据源使用。
