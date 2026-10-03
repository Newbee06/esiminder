<p align="center">
  <a href="./README.md">🇨🇳 中文</a>
  ·
  <a href="./README.en.md">🇬🇧 English</a>
</p>

<h1 align="center">eSIMinder 🔔</h1>

<p align="center">
  <strong>Personal eSIM lifecycle manager</strong><br>
  Track expiry · Get reminders · Renew in one click
</p>

<p align="center">
  <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/Newbee06/esiminder"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"></a>
</p>

<p align="center">
  <a href="https://x.com/BTC108_">𝕏 @BTC108_</a>
</p>

---

Never lose an eSIM to a forgotten renewal again. eSIMinder tracks expiry dates, reminds you before they lapse, and renews in one click.

## ✨ Features

### 📱 eSIM Management

- Full profile: name / country / region / carrier / phone / activation & expiry dates
- Renewal cycle, provider, renewal URL (opens in a new tab from the detail page)
- Tags (iOS pill style), search, status filters
- Auto-computed status: 🟢active 🟡expiring soon 🔴expired ⚪not activated ⚫disabled

### 🔄 Renewal

- One-click renewal with a confirmation dialog showing the new expiry date
- Expired cards renew from today (`max(old expiry, today) + cycle`)
- Server-side renewal preview, renewal history recorded automatically
- `requestId` idempotency: duplicate submissions apply only once; concurrency-safe

### 🔔 Notifications

7 channels, configured and tested from the admin UI:

Telegram · WeCom · DingTalk · Feishu · Bark · ServerChan · Resend Email

- Reminders at 7 / 3 / 1 / 0 days before expiry (customizable), deduplicated
- Every push is logged; failed ones can be retried with one click

### 🎨 UI

- iOS-style design, Light / Dark / System themes
- Bottom Tab Bar on mobile, left Sidebar on desktop
- Chinese / English, Chinese by default

### 🔐 Security

- 7-day login sessions, 15-minute lockout after 5 failed attempts
- Forced password change on first login
- HttpOnly / Secure / SameSite cookies
- Secrets live in KV / D1, never in GitHub

**Out of scope**: traffic stats, finance, ICCID/EID/APN, sign-up, multi-user, memberships, payments.

## 🚀 Deployment

### A. One-click deployment

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Newbee06/esiminder)

1. Click **Deploy to Cloudflare**
2. Log in to Cloudflare and pick your own Account
3. Set `ADMIN_TOKEN` (your admin password)
4. Cloudflare provisions a fresh D1 database and KV namespace for this deployment
5. Finish deployment and open your Worker URL
6. Log in with `ADMIN_TOKEN`, then change your password in Settings

> Every deployment uses D1 / KV in the deployer's own Cloudflare account — never the repo author's resources.
> `ADMIN_TOKEN` is set by you and never committed to GitHub.
> Tables are created automatically on first request, migrations run automatically, Cron fires daily at 09:00 Beijing time.

### B. Manual deployment

```bash
npm install

# Optional: create resources manually (wrangler auto-provisions on deploy if skipped)
npx wrangler kv namespace create CFG
npx wrangler d1 create esiminder-db

# Set the admin password
npx wrangler secret put ADMIN_TOKEN

# Deploy
npx wrangler deploy
```

> If the CLI returns resource IDs, write them only to your local `wrangler.toml` — never commit real IDs to a public repo.

## 🆕 What's New in V2.1

| Feature | Description |
|---|---|
| Renewal Idempotency | `requestId` prevents duplicate renewals |
| Atomic Renewal | Single D1 batch transaction — all three writes succeed or roll back together |
| Notification Dedup | Deduplication moved into D1 (`pending` → `sending` → `sent` / `failed`) |
| Retry | Automatic retry on failure, manual retry with one click |
| Date Validation | Rejects invalid dates like `2024-02-30` |
| Config Validation | `reminderDays` normalized, `timezone` validated server-side |
| Timeout | 10-second timeout on all 7 channels |

<details>
<summary>Technical Details</summary>

- Renewal: `INSERT renewal_records ... SELECT ... WHERE expiresAt=old` + `UPDATE esims ... WHERE expiresAt=old` + conditional `INSERT renew_idempotency` in one D1 batch. Concurrent renewals with different `requestId`s: exactly one wins, the other gets `409`; reusing a `requestId` across eSIMs returns `409`.
- Notifications: `notification_dedup` table with a claim mechanism — concurrent Crons never double-send; stale `sending` rows are reclaimed; legacy KV dedup state migrates automatically.

</details>

## 🔄 Migration

> No manual database migration required. Migrations run automatically on first request or Cron.

- V1 → V2: KV `esims` auto-migrated into D1 (idempotent)
- V2.0 → V2.1: `notification_dedup` / `renew_idempotency` tables auto-created (`CREATE TABLE IF NOT EXISTS`)

## 🗄️ Architecture

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

Cloudflare Workers + D1 + KV. No other dependencies, no Durable Objects.

## ⏰ Cron

`0 1 * * *` in `wrangler.toml` — daily at 09:00 Beijing time (01:00 UTC). Checks expiring eSIMs and pushes reminders per the 7 / 3 / 1 / 0-day schedule with deduplication.

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

Current status:

```
75 passed · 0 failed
```

`tests/run.mjs` mocks D1 with `node:sqlite` and covers renewal idempotency & concurrency, notification dedup & retry, date & config validation, Cron, migrations, and deployment config.

## ⚠️ Known Notes

- Cron is fixed at 09:00 Beijing time; the timezone setting only affects the "today" date boundary
- Email channel requires a verified sending domain in Resend
- Notification history is not auto-pruned (negligible for personal use)

## 🤝 Author

Created by [𝕏 @BTC108_](https://x.com/BTC108_)

## License

MIT
