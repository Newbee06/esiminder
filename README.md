<p align="center">
  <a href="./README.md">🇨🇳 中文</a>
  ·
  <a href="./README.en.md">🇬🇧 English</a>
</p>

<h1 align="center">eSIMinder 🔔</h1>

<p align="center">
  <strong>个人 eSIM 生命周期管理工具</strong><br>
  集中管理 · 到期提醒 · 一键续期 · 多渠道通知
</p>

<p align="center">
  <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/Newbee06/esiminder"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"></a>
</p>

<p align="center">
  <a href="https://x.com/BTC108_">𝕏 @BTC108_</a>
</p>

---

> 落地才发现 eSIM 昨天就过期了？eSIMinder 提前提醒你续费，让每张卡都不断线。

## ✨ 核心功能

### 📱 eSIM 管理

在一处管好每张卡：名称、国家/地区、运营商、手机号、激活日期、到期日期、续费周期、续费链接。标签、搜索、状态筛选一应俱全；使用中 / 即将到期 / 已过期 / 未激活等状态由系统按日期自动计算，无需手动维护。

### 🔔 到期提醒

到期前 7 / 3 / 1 / 0 天分级提醒，提醒天数可自定义。一次配置，多渠道同时触达，共 7 个渠道：Telegram、企业微信、钉钉、飞书、Bark、Server酱、邮件（Resend）。

### 🔄 一键续期

点一下，自动按续费周期算出新的到期日期。过期卡也能续；续期前可预览、续期后有记录；`requestId` 幂等保证重复点击不会重复续费。

### ☁️ Cloudflare 部署

Workers + D1 + KV 全托管架构，零服务器、零运维。点一下部署按钮就能装到你自己的 Cloudflare 账户，数据完全在你自己手里。

> **设计定位**
>
> 只做一件事：管好你个人的 eSIM。不做用户注册、多用户、支付和财务功能 — 简单、够用、不打扰。

## 🖥️ 界面预览

### Dashboard

<p align="center">
  <img src="./docs/screenshots/dashboard.png" alt="eSIMinder Dashboard" width="900">
</p>

### eSIM 详情

<p align="center">
  <img src="./docs/screenshots/esim-detail.png" alt="eSIM 详情" width="900">
</p>

### 一键续期

<p align="center">
  <img src="./docs/screenshots/renewal.png" alt="续期确认" width="900">
</p>

### 通知中心

<p align="center">
  <img src="./docs/screenshots/notifications.png" alt="通知通道设置" width="900">
</p>

### 移动端

<p align="center">
  <img src="./docs/screenshots/mobile.png" alt="移动端界面" width="320">
</p>

## 👤 适合谁

- 经常出国、手机里躺着好几张旅行 eSIM 的人
- 长期持有海外保号卡的人
- 记不住每张卡哪天到期的人
- 受够了「落地没网」的人

## 🎨 界面

iOS 液态玻璃设计，通透而克制；浅色 / 深色 / 跟随系统，右上角一键切换。手机是底部 Tab 栏，电脑是左侧边栏；中文 / English 双语界面。

## 🚀 部署

### A. 一键部署

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Newbee06/esiminder)

1. 点击 **Deploy to Cloudflare**，登录并选择你自己的 Cloudflare 账户
2. 按提示设置 `ADMIN_TOKEN`（就是你的后台登录密码）
3. Cloudflare 自动新建 D1 / KV 并完成部署，无需手动建库
4. 打开生成的 Worker 地址，用 `ADMIN_TOKEN` 登录；首次登录后请在设置里改掉密码

> 每次部署用的都是部署者自己账户里的 D1 / KV，与仓库作者的资源完全隔离。`ADMIN_TOKEN` 只保存在 Cloudflare 的密钥存储中，不会进入 GitHub。

### B. 手动部署

```bash
npm install
npx wrangler kv namespace create CFG   # 可选：deploy 时可自动供应
npx wrangler d1 create esiminder-db    # 可选：deploy 时可自动供应
npx wrangler secret put ADMIN_TOKEN
npx wrangler deploy
```

> 如果 CLI 返回了资源 ID，只写入你本地的 `wrangler.toml`，不要提交到公开仓库。

## 🔔 通知通道配置指南

在「设置 → 通知通道」里选一个通道、填好密钥、点「已保存」即可；回到通知页用「发送测试」验证是否通。

### Telegram

1. 在 Telegram 里找 [@BotFather](https://t.me/BotFather)，发送 `/newbot` 按提示创建机器人，拿到 **Bot Token**
2. 先给你的机器人发一句话（或把它拉进群组并发一条消息）
3. 浏览器打开 `https://api.telegram.org/bot<你的Token>/getUpdates`，在返回数据里找到 `chat.id`（群组是负数）
4. 把 Token 和 Chat ID 填进设置

### 企业微信

1. 在企业微信群聊里：右上角 `···` → 群机器人 → 添加机器人
2. 复制生成的 **Webhook** 地址，填进设置即可（无需密钥）

### 钉钉

1. 在钉钉群里：群设置 → 机器人 → 添加自定义机器人
2. 安全设置选「加签」，复制 **Webhook** 和 `SEC` 开头的密钥
3. 两项都填进设置

### 飞书

1. 在飞书群里：群设置 → 群机器人 → 添加自定义机器人
2. 如开启「签名校验」，复制密钥
3. 把 **Webhook** 和密钥填进设置

### Bark（iOS）

1. 在 App Store 安装 **Bark**，打开 App，首页会显示服务器地址
2. 把地址中 `/` 后面的那串 **Key** 填进设置

### Server酱

1. 打开 [sct.ftqq.com](https://sct.ftqq.com)，微信扫码登录
2. 在 SendKey 页面复制你的 **SendKey**（`SCT` 开头），填进设置

### 邮件（Resend）

1. 在 [resend.com](https://resend.com) 注册账号，并验证你的发件域名
2. 在 API Keys 页面创建 **API Key**（`re_` 开头）
3. 填入 API Key、From（已验证域名的发件邮箱）和 To（你的收件邮箱）

## 🆕 V2.1 更新

| 功能 | 说明 |
|---|---|
| 续费幂等 | `requestId` 防止重复续费 |
| 原子续期 | D1 单事务，要么全部成功，要么全部回滚 |
| 通知去重 | 去重状态存入 D1，发送失败自动重试 |
| 日期校验 | 拒绝非法日期，避免脏数据 |
| 配置校验 | 提醒天数自动标准化、时区由服务端校验 |
| 通知超时 | 全部渠道统一 10 秒超时 |

## 🏗️ 技术架构

Cloudflare Workers + D1 + KV，无其他依赖。

- 数据表在首次请求时自动创建，无需手动执行 SQL
- 旧版本数据自动迁移（V1 → V2、V2.0 → V2.1），迁移幂等、可重复执行
- Cron `0 1 * * *`：每天北京时间 09:00 检查到期并推送提醒

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

## 🧪 测试

```bash
npm test
```

共 75 项，覆盖：续费幂等、并发续费、通知去重、通知重试、日期校验、配置校验、Cron、数据迁移、部署配置。

## ⚠️ 注意事项

- 提醒检查固定在北京时间 09:00；时区设置仅影响「今天」的日期边界计算
- 邮件渠道走 Resend，发件域名需先在 Resend 完成验证
- 通知历史不自动清理，个人使用量下可以忽略

## 🤝 Author

Created by [𝕏 @BTC108_](https://x.com/BTC108_)

## License

MIT
