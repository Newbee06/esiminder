# eSIMinder 🔔 — 个人 eSIM 管理 / Personal eSIM Manager

海外 eSIM 生命周期管理：记录有效期 → 到期前自动提醒 → 一键续期顺延。再也不怕忘记续费丢卡。

eSIM lifecycle manager: track expiry → auto reminders → one-tap renewal. Never lose an eSIM again.

## ✨ V2.1 功能 Features

- 📱 **eSIM 全生命周期管理**：名称 / 国家 / 地区 / 运营商 / 手机号 / 激活日 / 到期日 / 续期周期 / 续费平台 / 续费地址 / 标签 / 备注
- 🔄 **一键续期**：确认弹窗显示新到期日；已过期的卡从今天起算（`max(旧到期, 今天) + 周期`），不会得到过去的日期
- 📜 **续期历史**：每次续期自动记录（日期/天数/旧→新）
- 🔗 **续费地址**：每张卡可填续费平台 + 链接，详情页「前往续费」新标签页打开
- 🏷️ **标签系统**：多标签，iOS 胶囊样式，支持筛选
- 🔍 **搜索 + 状态筛选**：名称/国家/运营商/手机号/标签；使用中/即将到期/已过期/未激活/已停用
- 📊 **状态自动计算**：🟢使用中 🟡即将到期 🔴已过期 ⚪未激活 ⚫已停用（到期类状态由系统算，不可手动填）
- 🔔 **通知中心**：每次推送落库（时间/eSIM/类型/渠道/成功失败），失败可一键重发
- 📲 **7 种推送通道**：Telegram · 企业微信 · 钉钉 · 飞书 · Bark · Server酱 · 邮件（Resend），后台配置 + 测试
- ⏰ **到期提醒**：默认 7/3/1/0 天各提醒一次（可改），去重不打扰
- 🎨 **iOS 风格 UI**：浅色/深色/跟随系统，手机底部 Tab Bar，电脑左侧 Sidebar
- 🌐 **中英双语**，默认中文
- 🔐 **安全**：登录会话 7 天，5 次输错锁 15 分钟，首次登录强制改默认密码，HttpOnly/Secure/SameSite Cookie，密钥只存 KV/D1 不在代码里

**不做的**：流量统计、财务/金额、ICCID/EID/APN、用户注册、多用户、会员、支付。

## 🚀 部署 Deploy

### 部署说明

仓库 `wrangler.toml` 中的 KV/D1 ID 是作者自己的资源，他人 fork 后需要替换成自己的：

```bash
# 1. 创建 KV 和 D1，把返回的 ID 填入 wrangler.toml
wrangler kv:namespace create CFG
wrangler d1 create esiminder-db

# 2. 设置后台密码（Secret，不在代码里）
wrangler secret put ADMIN_TOKEN

# 3. 部署
wrangler deploy
```

首次打开网页用 `ADMIN_TOKEN` 的值登录，系统会强制你修改默认密码。

## 🆕 V2.1 更新

- **续费幂等**：`POST /api/esims/:id/renew` 支持 `requestId`，相同 ID 重复提交只生效一次；续期写入使用 D1 batch 原子执行
- **并发续费保护**：乐观锁（`UPDATE ... WHERE expiresAt=旧值`），冲突返回 `409`，前端提示刷新重试
- **通知去重进 D1**：新增 `notification_dedup` 表（`pending → sending → sent/failed`），并发 Cron 通过 claim 机制不会重复推送，失败自动重试
- **严格日期校验**：拒绝 `2024-02-30`、`2025-13-01` 等非法日期
- **配置标准化**：`reminderDays` 自动去重/排序/上限；`timezone` 服务端验证，非法返回 400
- **通知超时**：全部 7 个渠道 10 秒超时，错误信息截断

### 从 V2.0 升级到 V2.1

**无需手动修改数据库。** 首次运行（HTTP 请求或 Cron）会自动完成 V2.1 migration：

- 创建 `notification_dedup` 和 `renew_idempotency` 表（`CREATE TABLE IF NOT EXISTS`，可重复执行）
- 旧 KV 通知去重状态自动迁移到 D1
- 原有 eSIM / 续期记录 / 通知历史 / 设置数据不受影响
- migration 标记为 `migrated_v21`，独立于 V2.0 的 `migrated_v2`

## 🗄️ D1 Schema

```sql
esims(id, name, country, region, carrier, phone, cycleDays, activatedAt,
      expiresAt, provider, renewalUrl, status, tags(JSON), note,
      createdAt, updatedAt, lastRenewedAt)
renewal_records(id, esimId, renewedAt, days, oldExpiresAt, newExpiresAt)
notifications(id, createdAt, esimId, esimName, kind, daysLeft, channel,
              status, error, title, text)
settings(key, value)   -- reminderDays / notifLang / theme / timezone / pwChanged
notification_dedup(esim_id, threshold, channel, status, created_at, updated_at)  -- V2.1 通知去重
renew_idempotency(request_id, esim_id, created_at, response)  -- V2.1 续费幂等
```

KV 用于：`channels`（渠道密钥）、`admin_token`、`sess:*`（会话）、`login:rl:*`（登录限流）、`state`（lastCheckAt）、`migrated_v2`。

## 🔄 从 V1 迁移

Worker 首次收到请求时自动迁移（幂等，可重复跑）：

| V1 (KV `esims`) | V2 (D1) |
|---|---|
| name / expiresAt / cycleDays / note | 同名 |
| lastRechargeAt | lastRenewedAt |
| — | country/region/carrier/phone/provider/renewalUrl/tags 等为空 |

`channels`（渠道密钥）继续留在 KV，无需迁移。旧数据不删除。

也可手动触发：`POST /api/migrate`（需登录）。

## ⏰ Cron

`wrangler.toml`：`0 1 * * *`（每天北京时间 09:00）。检查即将到期的 eSIM，按 7/3/1/0 天推送，去重；失败记入通知中心。

## 🔑 环境变量 / Secrets

| 名称 | 说明 |
|---|---|
| `ADMIN_TOKEN` | 后台初始密码（Secret），首次登录后强制修改 |

其余所有配置（推送渠道、提醒天数、主题、时区）都在网页后台修改，存 KV/D1。

## 📡 API 一览

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/login /api/logout | 登录/退出（限流 5 次/15 分钟） |
| GET/POST | /api/esims?q=&status=&tag= | 列表（搜索/筛选）/ 新建 |
| GET/PUT/DELETE | /api/esims/:id | 详情（含续期历史）/ 更新 / 删除 |
| POST | /api/esims/:id/renew | 续期（支持 requestId 幂等） |
| POST | /api/esims/:id/renew/preview | 续期预览（服务器计算新到期日） |
| GET | /api/dashboard | 首页数据（统计/即将到期/标签） |
| GET | /api/tags | 标签列表 |
| GET | /api/notifications | 通知记录 |
| POST | /api/notifications/test | 测试推送 |
| POST | /api/notifications/:id/retry | 重发 |
| GET/PUT | /api/settings | 设置 |
| PUT | /api/channels | 渠道配置 |
| POST | /api/admin-password | 改密码 |

## ✅ 测试

`npm test` 运行 `tests/run.mjs`（`node:sqlite` 模拟 D1），41 项，覆盖：

- 日期严格校验（闰年/非法日期如 2024-02-30、2025-13-01）
- 续费：正常/已过期/无到期日/cycleDays=0 拒绝、重复 `requestId` 幂等、并发同 `requestId` 只生效一次
- 配置：`reminderDays` 标准化（去重/排序/上限）、`timezone` 非法值 400
- 通知渠道：HTTP 400/401/429/500 错误信息、错误 body 截断、10 秒超时
- Cron：active/inactive/disabled/无到期日过滤、多阈值去重、失败重试、成功不重发、并发认领、KV 旧数据迁移
- API：未知路由 404、未登录 401

## ⚠️ 已知问题

- Cron 固定北京时间 09:00；时区设置只影响"今天"的日期边界计算。
- 邮件通道依赖 Resend，发件域名需在 Resend 验证。
- 通知中心只保留推送记录，不自动清理（个人用量可忽略）。

## License

MIT
