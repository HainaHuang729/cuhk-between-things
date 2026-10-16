# 微信云开发试用接入

## 当前状态

目标环境：`cloud1-d4g2uanps066a4efa`。**默认仍为 mock，云资源已部分部署，未完成真实云调用和双真机验收**。
环境 ID 不是 AppSecret；不要将 AppSecret、云密钥、会话 token 写进仓库或聊天。
本轮不使用 Supabase、不启动 Web，不自动导入本地商品，不覆盖其他业务资源。

### 实际部署记录（2026-10-16）

- 微信开发者工具已登录；CLI 环境列表确认当前正式项目可访问目标环境。
- `market` 已通过微信开发者工具 CLI 上传代码并云端安装依赖，部署返回 `success: true`，随后查询为 `Active`。
- 工具默认创建为 `Nodejs16.13`、超时 3 秒。**运行环境和超时尚待调整**：按下方要求选择受支持的 Node.js LTS，并将超时调至 15 秒后重新验证。
- 新建 `youwu_items`、`youwu_users`，创建时均选择「所有用户不可读写」。没有导入商品或用户记录，尚未通过小程序客户端验证直接访问被拒绝。
- 已在 `youwu_items` 创建并从控制台确认三个非唯一索引：`created_at_desc`（created_at 降序）、`status_created_at`（status 升序、created_at 降序）、`seller_created_at`（seller_id 升序、created_at 降序）。
- 存储管理页提示「存储桶不存在」，初始化操作返回 `ResourceInUse, Current Storage Status Normal Not Allowed`。**不能据此认定图片存储已经可用**；未修改存储权限，未上传图片。
- 后续界面读取遇到 ScreenCaptureKit `-3812`，未继续提交函数运行参数，也未完成云端 get/list、图片上传及双账号权限联调。
- 同时修复 `app.js` 在 `App()` 注册后才导入用户服务导致的启动错误。新回归在修复前重现初始化错误，修复后 mock/cloud 两种冷启动通过。

CLI 首次按 `--project` 部署遇到签名错误 `41002`；显式指定本机私有配置中的正式 AppID 后，等待函数从 Creating 变为 Active 再上传成功。公共 AppID 仍是游客占位，本机真实 AppID 未改动或提交。

在存储、运行参数和实际云调用验证完成前，不把 `mode` 改为 `cloud`；本机既有商品、收藏和模拟登录状态保留。

## 模式范围

| 数据 | mock | cloud |
| --- | --- | --- |
| 商品与状态 | 本机 storage | 微信云数据库，跨设备共享 |
| 发布图片 | 本机持久文件 | 云存储 fileID |
| 身份 | 本地模拟用户 | 云函数获取微信 OPENID，7 天业务会话 |
| 联系方式 | 本地用户判断 | 独立 contact 调用，云函数验证业务会话 |
| 收藏、联系记录、草稿 | 本机 | 仍在本机，与 mock / 环境 / 用户隔离 |
| 拼团 | 本机 mock | 仍是本机试用，不共享 |

云登录只确认微信身份，**不代表 CUHK 邮箱验证通过**。第一批试用由项目拥有者线下邀请，不能宣传为已验证学生社区。
同一微信账号重新登录会替换该账号之前的业务会话。退出登录立即清理本机云会话，并尽力撤销服务端会话；断网时远端撤销可能失败，原会话最长 7 天失效。

## 部署前安全门槛

1. 使用有云开发权限的小程序 AppID，不能用 touristappid。继续通过忽略的 `project.private.config.json` 配置真实 AppID，不修改公共配置。
2. 确认环境归属、计费与配额，只操作项目拥有者明确指定的试用环境。先备份已有配置，不覆盖其他业务集合或存储桶规则。
3. 云函数必须由小程序 `wx.cloud.callFunction` 调用，不开放 HTTP 触发器，不接受客户端传来的 OPENID 或 owner 身份。
4. `wx-server-sdk@4.0.2` 已锁定，`npm ci` 可复现。2026-10-16 依赖审计仍报告上游 `axios`、`lodash.set`、`lodash.unset` 告警，共 5 个 high、1 个 moderate；**未使用强制降级/未经验证的 overrides 消除报告**。正式开放前须评估并处理，当前不能宣称通过安全验收。
5. 不往商品描述或图片放私人证件、个人敏感资料；商品图片设为公开可读，联系方式只经鉴权接口返回。

## 最小部署步骤

1. 在微信开发者工具中选择目标云环境，记录 envId。
2. 新建文档型数据库集合 `youwu_users`、`youwu_items`，不要导入 mock seeds。
3. 对两个集合分别设置自定义安全规则，使用 `cloudfunctions/market/database.rules.json`：客户端禁止直接读写，商品数据仅通过云函数访问。验证开发者工具的客户端数据库直接读写确实被拒绝。
4. 给 `youwu_items` 建索引：`created_at` 降序；`status` 升序 + `created_at` 降序；`seller_id` 升序 + `created_at` 降序。当前「我的发布」不按状态筛选；未来增加该查询时再添加 `seller_id` 升序 + `status` 升序 + `created_at` 降序。`_id` 使用默认唯一索引。若控制台提示其他搜索索引，按实际查询提示补充，不重复创建已有索引。
5. 在本项目专用云存储配置中应用 `cloudfunctions/market/storage.rules.json`，公开读、仅创建者写；已有其他业务共用存储时，先合并规则，不能整体替换。验证 B 不能覆盖或删除 A 上传的文件。
6. 右键 `cloudfunctions/market`，上传并部署，选择云端安装依赖。使用云控制台当前支持的 Node.js LTS 运行环境（至少 Node.js 18）；不要沿用 CLI 默认的 Node.js 16。通过「云函数 → market → 版本与配置 → $LATEST 配置」核对可选运行环境，将超时设为 15 秒并验证生效。保留函数名称 `market`，不启用定时或 HTTP 触发器。
7. 修改 `miniprogram/utils/data-mode.js`，填入实际 envId，并将 `mode` 从 `mock` 改为 `cloud`。这一步是显式启用，不自动切换。
8. 重新编译。先以未注册业务用户浏览，再分别使用两个微信账号登录。云模式下没有 CUHK 邮箱标签或“模拟登录”权限捷径。
9. 按下方双真机脚本验收。失败时停留在错误/重试状态，不能自动用 mock 掩盖云连接失败。

数据入口仍是 `item-service`，公共商品对象不含微信号、业务 token 或 session hash。
发布请求带有 request_id，云函数通过事务幂等写入，重试不会创建第二件商品或重置已售状态。
SDK 默认在文档不存在时抛错；入口已显式设置 `throwOnNotFound: false`，供首次创建事务使用。

## 双真机验收

1. A 登录，发布一件带照片的商品；A 的用户 ID 必须由云函数写入，而非表单指定。
2. B 未业务登录时刷新首页，能看到 A 的商品和云端图片，但公共 get/list 响应及页面均没有微信号。
3. B 登录，复制 A 的微信号；联系记录保存在 B 本机“我联系过的商品”。
4. B 不显示管理按钮；直接伪造 update/status/delete 调用，云端仍返回 FORBIDDEN。
5. A 标记预订、已售、下架；B 刷新或重进详情后看到最新状态，默认商品流仅在售。
6. A 编辑标题、价格和图片，B 刷新可见；A 删除后，B 进入旧链接显示商品不存在。
7. 两端退出重进，小程序能重新拉取相同云数据；B 退出业务登录后不能查看或复制联系方式。
8. 断网、上传失败、重复提交、业务会话过期均有反馈；不能因为失败混入本地 seeds 或重复商品。
9. B 无法直接查询 users 集合、读取会话 hash，或覆盖/删除 A 的云文件。

## 限制与回退

- 当前列表为匹配条件下最新 100 件，适用于首批小范围试用；未实现无限分页、实时订阅、邮箱验证或内容审核后台。
- 收藏、联系记录、草稿、拼团不跨设备同步。拼团页面及复制文案标记为本机试用。
- 删除商品暂不删除对应云图片，避免误删复用文件；需定期在试用环境核对孤立文件与存储配额。
- 分享本地商品/拼团链接不会把本机数据上传。只有 cloud 模式商品才可在其他设备打开。
- 回退时只将 `mode` 改回 `mock` 并重新编译。本地旧商品、收藏和模拟登录未被云模式改写，云数据不会因此删除。
- 不要清空微信 storage 来切换模式，也不要执行旧 Supabase schema 作为本轮部署步骤。

## 验证命令

```bash
node scripts/check-miniprogram.cjs
node --test tests/miniprogram.test.cjs tests/cloud-market.test.cjs
node --check cloudfunctions/market/index.js
node --check cloudfunctions/market/market.js
```

自动化的双客户端测试使用内存数据库替身，不是已部署云环境或双真机验收证据。
规则和索引 JSON/说明不代表已自动应用到控制台。

参考：[微信官方服务端 SDK](https://github.com/wechat-miniprogram/wx-server-sdk)、[CloudBase 数据库事务](https://docs.cloudbase.net/database/transaction)、[数据库安全规则](https://docs.cloudbase.net/en/database/security-rules/)、[云存储安全规则](https://docs.cloudbase.net/storage/security-rules)。
