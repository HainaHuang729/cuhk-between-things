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
