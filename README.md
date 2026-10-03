<p align="center">
  <a href="./README.md">🇨🇳 中文</a>
  ·
  <a href="./README.en.md">🇬🇧 English</a>
</p>

<h1 align="center">eSIMinder 🔔</h1>

<p align="center">
  <strong>个人 eSIM 生命周期管理工具</strong><br>
  Track expiry · Get reminders · Renew in one click
</p>

<p align="center">
  <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/Newbee06/esiminder"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"></a>
</p>

<p align="center">
  <a href="https://x.com/BTC108_">𝕏 @BTC108_</a>
</p>

---

海外 eSIM 到期前自动提醒、一键续期。再也不怕忘记续费丢卡。

## ✨ 功能

### 📱 eSIM 管理

- 基础信息：名称 / 国家 / 地区 / 运营商 / 手机号 / 激活日 / 到期日
- 续费周期、续费平台、续费地址（详情页「前往续费」新标签页打开）
- 标签（iOS 胶囊样式）、搜索、状态筛选
- 状态自动计算：🟢使用中 🟡即将到期 🔴已过期 ⚪未激活 ⚫已停用

### 🔄 续期

- 一键续期，确认弹窗显示新到期日
- 已过期的卡从今天起算（`max(旧到期, 今天) + 周期`）
- 续期预览（服务器计算，不依赖前端）
- 每次续期自动记入续期历史
- `requestId` 幂等：重复提交只生效一次；并发安全

### 🔔 通知

7 个推送通道，后台配置 + 一键测试：

Telegram · 企业微信 · 钉钉 · 飞书 · Bark · Server酱 · Resend 邮件

- 到期前 7 / 3 / 1 / 0 天各提醒一次（可自定义），去重不打扰
- 通知中心落库每条推送，失败可一键重发

### 🎨 界面

- iOS 风格，浅色 / 深色 / 跟随系统
- 手机底部 Tab Bar，电脑左侧 Sidebar
- 中英双语，默认中文

### 🔐 安全

- 登录会话 7 天，5 次输错锁定 15 分钟
- 首次登录强制修改默认密码
- HttpOnly / Secure / SameSite Cookie
- 密钥只存 KV / D1，绝不进入 GitHub

**不做的**：流量统计、财务金额、ICCID/EID/APN、用户注册、多用户、会员、支付。

## 🚀 部署 Deployment

### A. 一键部署

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Newbee06/esiminder)

1. 点击 **Deploy to Cloudflare**
2. 登录 Cloudflare，选择自己的 Account
3. 配置 `ADMIN_TOKEN`（后台登录密码，自己设定）
4. Cloudflare 为该部署创建自己的 D1 / KV
5. 完成部署，打开 Worker URL
6. 用 `ADMIN_TOKEN` 登录，首次登录后去「设置」页改密码

> 每次部署使用部署者自己账号中的 D1 / KV，不使用仓库作者的资源。
> `ADMIN_TOKEN` 由部署者设置，不提交到 GitHub。
> 数据库表首次请求自动创建，迁移自动执行，Cron 每天北京时间 09:00。

### B. 手动部署

```bash
npm install

# 可选：手动创建资源（也可跳过，deploy 时自动供应）
npx wrangler kv namespace create CFG
npx wrangler d1 create esiminder-db

# 设置后台密码
npx wrangler secret put ADMIN_TOKEN

# 部署
npx wrangler deploy
```

> 如 CLI 返回资源 ID，只写入你本地的 `wrangler.toml`，不要提交到公开仓库。

## 🆕 What's New in V2.1

| 功能 | 说明 |
|---|---|
| Renewal Idempotency | `requestId` 防止重复续费 |
| Atomic Renewal | D1 单 batch 原子事务，三者同生共死 |
| Notification Dedup | 通知去重进 D1（pending → sending → sent / failed） |
| Retry | 失败自动重试，可一键重发 |
| Date Validation | 拒绝 `2024-02-30` 等非法日期 |
| Config Validation | `reminderDays` 标准化、`timezone` 服务端校验 |
| Timeout | 全部 7 个渠道 10 秒超时 |

<details>
<summary>Technical Details</summary>

- 续费：`INSERT renewal_records ... SELECT ... WHERE expiresAt=旧值` + `UPDATE esims ... WHERE expiresAt=旧值` + 条件 `INSERT renew_idempotency`，同一 D1 batch；并发不同 `requestId` 恰好一个成功、另一个 `409`；跨 eSIM 重用 `requestId` 返回 `409`
- 通知：`notification_dedup` 表 + claim 机制，并发 Cron 不重复推送；stale `sending` 自动回收；旧 KV 去重数据自动迁移

</details>

## 🔄 迁移 Migration

> 无需手动修改数据库，首次请求或 Cron 会自动完成迁移。

- V1 → V2：KV `esims` 自动迁入 D1（幂等）
- V2.0 → V2.1：自动建 `notification_dedup` / `renew_idempotency` 表（`CREATE TABLE IF NOT EXISTS`）

## 🗄️ 数据结构

```
D1
├── esims
├── renewal_records
├── notifications
├── settings
├── notification_dedup
└── renew_idempotency

KV
├── channels
├── admin_token
├── sess:*
├── login:rl:*
└── migration markers
```

## 📡 API

| Method | Endpoint | 说明 |
|---|---|---|
| POST | `/api/login` | 登录 |
| GET / POST | `/api/esims` | 列表 / 新建 |
| GET / PUT / DELETE | `/api/esims/:id` | 详情 / 更新 / 删除 |
| POST | `/api/esims/:id/renew` | 续期（`requestId` 幂等） |
| GET | `/api/dashboard` | 首页数据 |
| GET | `/api/notifications` | 通知记录 |
| GET / PUT | `/api/settings` | 设置 |

## 🧪 测试 Tests

```bash
npm test
```

当前状态：

```
75 passed · 0 failed
```

`tests/run.mjs` 用 `node:sqlite` 模拟 D1，覆盖续费幂等与并发、通知去重与重试、日期与配置校验、Cron、迁移、部署配置。

## ⚠️ 已知问题

- Cron 固定北京时间 09:00；时区设置只影响「今天」的日期边界计算
- 邮件通道依赖 Resend，发件域名需在 Resend 验证
- 通知历史不自动清理（个人用量可忽略）

## 🤝 Author

Created by [𝕏 @BTC108_](https://x.com/BTC108_)

## License

MIT
