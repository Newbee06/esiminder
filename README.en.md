<p align="center">
  <a href="./README.md">🇨🇳 中文</a>
  ·
  <a href="./README.en.md">🇬🇧 English</a>
</p>

<h1 align="center">eSIMinder 🔔</h1>

<p align="center">
  <strong>Personal eSIM Lifecycle Manager</strong><br>
  Manage eSIMs · Track expiry · Get reminders · Renew in one click
</p>

<p align="center">
  <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/Newbee06/esiminder"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"></a>
</p>

<p align="center">
  <a href="https://x.com/BTC108_">𝕏 @BTC108_</a>
</p>

---

> Never let a forgotten renewal leave your eSIM unusable when you need it most.

## ✨ Core Features

### 📱 eSIM Management

Manage name, country / region, carrier, phone number, activation date, expiry date, renewal cycle, and renewal links in one place. Tags, search, and status filters included; statuses are computed automatically.

### 🔔 Expiry Reminders

Reminders at 7 / 3 / 1 / 0 days before expiry, customizable. 7 notification channels: Telegram, WeCom, DingTalk, Feishu, Bark, ServerChan, and Email (Resend).

### 🔄 One-Click Renewal

New expiry dates computed automatically. Supports renewing expired cards, renewal preview, renewal history, and `requestId` idempotency.

### ☁️ Cloudflare Deployment

Built on Cloudflare Workers + D1 + KV. No servers to maintain — deploy to your own Cloudflare account.

> **Design philosophy**
>
> eSIMinder focuses on personal eSIM lifecycle management. No sign-up, no multi-user, no payments, no finance features.

## 👤 Who It's For

- Travelers who regularly use overseas eSIMs
- Users managing multiple eSIMs at once
- Anyone who needs to track plan expiry dates long-term
- Anyone who doesn't want an eSIM to die from a forgotten renewal

## 🎨 Interface

iOS-style design with Light / Dark / System themes; bottom Tab Bar on mobile, left Sidebar on desktop; Chinese / English bilingual.

## 🚀 Deployment

### A. One-click deployment

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Newbee06/esiminder)

1. Click **Deploy to Cloudflare**, log in and pick your own Cloudflare Account
2. Set `ADMIN_TOKEN` (your admin password)
3. Cloudflare provisions a fresh D1 / KV for this deployment and deploys the Worker
4. Open your Worker URL, log in with `ADMIN_TOKEN`, and change your password after first login

> Every deployment uses D1 / KV in the deployer's own account — never the repo author's resources. `ADMIN_TOKEN` is never committed to GitHub.

### B. Manual deployment

```bash
npm install
npx wrangler kv namespace create CFG   # optional: auto-provisioned on deploy
npx wrangler d1 create esiminder-db    # optional: auto-provisioned on deploy
npx wrangler secret put ADMIN_TOKEN
npx wrangler deploy
```

> If the CLI returns resource IDs, write them only to your local `wrangler.toml` — never commit them to a public repo.

## 🆕 What's New in V2.1

| Feature | Description |
|---|---|
| Renewal Idempotency | `requestId` prevents duplicate renewals |
| Atomic Renewal | Single D1 transaction — all or nothing |
| Notification Dedup | Dedup state moved into D1, automatic retry on failure |
| Date Validation | Rejects invalid dates |
| Config Validation | Reminder days normalized, timezone validated server-side |
| Notification Timeout | 10-second timeout on all channels |

## 🏗️ Architecture

Cloudflare Workers + D1 + KV. No other dependencies.

- Tables are created automatically on first request — no manual SQL
- V1 → V2 and V2.0 → V2.1 migrations run automatically (idempotent)
- Cron `0 1 * * *` checks expiries and sends reminders daily at 09:00 Beijing time

## 🗄️ Data Model

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

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/login` | Login |
| GET / POST | `/api/esims` | List / Create |
| GET / PUT / DELETE | `/api/esims/:id` | Detail / Update / Delete |
| POST | `/api/esims/:id/renew` | Renew (`requestId` idempotent) |
| GET | `/api/dashboard` | Dashboard data |
| GET | `/api/notifications` | Notification history |
| GET / PUT | `/api/settings` | Settings |

## 🧪 Tests

```bash
npm test
```

Covers: Renewal Idempotency, Concurrent Renewal, Notification Deduplication, Notification Retry, Date Validation, Configuration Validation, Cron, Migration, Deployment Configuration.

## ⚠️ Known Notes

- Cron is fixed at 09:00 Beijing time; the timezone setting only affects the "today" date boundary
- Email channel requires a verified sending domain in Resend
- Notification history is not auto-pruned (negligible for personal use)

## 🤝 Author

Created by [𝕏 @BTC108_](https://x.com/BTC108_)

## License

MIT
