# eSIMinder 🔔 — 个人 eSIM 管理 / Personal eSIM Manager

海外 eSIM 生命周期管理：记录有效期 → 到期前自动提醒 → 一键续期顺延。再也不怕忘记续费丢卡。

eSIM lifecycle manager: track expiry → auto reminders → one-tap renewal. Never lose an eSIM again.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Newbee06/esiminder)

## ✨ V2.0 功能 Features

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

### 一键部署（推荐）

点上面的 **Deploy to Cloudflare** 按钮，按向导操作即可（自动创建 KV 和 D1）。

### 手动部署

```bash
# 1. 创建 KV 和 D1，填入 wrangler.toml
wrangler kv:namespace create CFG
wrangler d1 create esiminder-db

# 2. 设置后台密码（Secret，不在代码里）
wrangler secret put ADMIN_TOKEN

# 3. 部署
wrangler deploy
```

首次打开网页用 `ADMIN_TOKEN` 的值登录，系统会强制你修改默认密码。

## 🗄️ D1 Schema

```sql
esims(id, name, country, region, carrier, phone, cycleDays, activatedAt,
      expiresAt, provider, renewalUrl, status, tags(JSON), note,
      createdAt, updatedAt, lastRenewedAt)
renewal_records(id, esimId, renewedAt, days, oldExpiresAt, newExpiresAt)
notifications(id, createdAt, esimId, esimName, kind, daysLeft, channel,
              status, error, title, text)
settings(key, value)   -- reminderDays / notifLang / theme / timezone / pwChanged
```

KV 继续用于：`channels`（渠道密钥）、`admin_token`、`sess:*`（会话）、`state`（去重）、`migrated_v2`。

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
| POST | /api/esims/:id/renew | 续期 |
| GET | /api/dashboard | 首页数据（统计/即将到期/标签） |
| GET | /api/tags | 标签列表 |
| GET | /api/notifications | 通知记录 |
| POST | /api/notifications/test | 测试推送 |
| POST | /api/notifications/:id/retry | 重发 |
| GET/PUT | /api/settings | 设置 |
| PUT | /api/channels | 渠道配置 |
| POST | /api/admin-password | 改密码 |

## ✅ 测试

33 项服务端测试全过（`node:sqlite` 模拟 D1）：迁移映射、登录/限流/强制改密、CRUD、五种状态计算、搜索/筛选/标签、正常续期、**过期后续期（max+周期）**、续期历史、通知去重、通知失败落库、重发、设置落盘、密钥不泄露。

## ⚠️ 已知问题

- Cron 固定北京时间 09:00；时区设置只影响"今天"的日期边界计算。
- 邮件通道依赖 Resend，发件域名需在 Resend 验证。
- 通知中心只保留推送记录，不自动清理（个人用量可忽略）。

## License

MIT
