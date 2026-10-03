# eSIMinder 🔔

海外 eSIM 续费提醒 —— 到期前自动推送，别让你的 eSIM 因忘记续费而丢失。

Overseas eSIM recharge reminder — automatic push notifications before expiry, so you never lose an eSIM by forgetting to recharge.

## 功能 Features

- ⏰ **eSIM 管理**：名称 + 有效期（手动填写）+ 周期天数 + 备注，随时增删改
  **eSIM management**: name + expiry date (manual) + cycle days + note
- 🔔 **到期提醒**：到期前 7 / 3 / 1 天和当天各推送一次（天数可在后台自定义），不重复打扰
  **Reminders**: one push at 7 / 3 / 1 days before and on expiry day (customizable), no spam
- 👆 **一键"已充值"**：按周期自动顺延有效期，不用算日期
  **One-click "Recharged"**: auto-extends expiry by cycle days
- 📲 **7 种推送通道**（可多选，全部在网页后台配置）：
  **7 push channels** (multi-select, all configured in web UI):
  Telegram · 企业微信 WeCom · 钉钉 DingTalk · 飞书 Feishu · Bark · Server酱 ServerChan · 邮件 Email (Resend)
- 🌐 **中英双语界面**，右上角一键切换
  **Bilingual UI** (Chinese/English toggle)
- 🔐 **网页后台登录**：默认口令 `admin`（请立即修改），7 天免登，修改口令后旧会话全部失效
  **Login-protected dashboard**: default password `admin` (change it!), 7-day session
- 🔒 **代码零密钥**：机器人 Token、API Key 等所有私密配置只存 Cloudflare KV，在网页后台填写
  **Zero secrets in code**: all tokens/keys live in Cloudflare KV, configured via web UI

## 快速开始 Quick Start

```bash
# 1. 创建 KV（已创建的可跳过，用现有 namespace id 替换 wrangler.toml 中的 id）
# 1. Create KV (skip if you have one; put its id in wrangler.toml)
wrangler kv:namespace create CFG

# 2. 设置后台口令 / Set admin password
wrangler secret put ADMIN_TOKEN
# 输入 admin（或你自己的口令）/ Enter admin (or your own)

# 3. 部署 / Deploy
wrangler deploy
```

打开 Worker 网址 → 登录 → 添加 eSIM（名称 + 有效期 + 周期天数）→ 配置推送通道 → 点"发送测试"验证。

Open the Worker URL → log in → add eSIMs (name + expiry + cycle days) → configure push channels → hit "Send test".

每天北京时间 09:00 自动检查一次。Daily check at 09:00 Beijing time.

## 推送通道配置 Push Channel Setup

| 通道 Channel | 需要填写 What to fill |
|---|---|
| Telegram | Bot Token（找 @BotFather）、Chat ID（找 @userinfobot） |
| 企业微信 WeCom | 群机器人 webhook 地址 |
| 钉钉 DingTalk | 群机器人 webhook + 加签密钥（可选） |
| 飞书 Feishu | 群机器人 webhook + 签名密钥（可选） |
| Bark | App 里的 Key（iPhone 推送） |
| Server酱 ServerChan | SendKey（sct.ftqq.com，推送到微信） |
| 邮件 Email | Resend API Key + 发件人 + 收件人（发件域名需在 Resend 验证） |

## KV 数据结构 KV Layout

- `esims` — eSIM 列表 `[{id, name, expiresAt, cycleDays, note, lastRechargeAt}]`
- `channels` — 推送通道配置（密钥）
- `settings` — `{reminderDays, notifLang}`
- `state` — 去重状态 `{remindNotified}`
- `admin_token` — 后台口令（网页可改）
- `sess:*` — 登录会话

## License

MIT
