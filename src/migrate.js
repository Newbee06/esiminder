// eSIMinder V2 — one-time migration from V1 (KV) to D1. Idempotent, never deletes KV data.
import { ensureSchema, setSetting } from './db.js';

export async function migrateIfNeeded(env) {
  if (!env.DB) return { ok: false, error: 'no D1 binding' };
  const done = await env.CFG.get('migrated_v2');
  if (done) return { ok: true, migrated: false };
  await ensureSchema(env.DB);

  // 1. esims: KV JSON array -> D1 (field mapping per spec, new fields empty)
  const old = (await env.CFG.get('esims', 'json')) || [];
  const now = Date.now();
  let count = 0;
  for (const o of old) {
    if (!o || !o.id) continue;
    await env.DB.prepare(
      `INSERT OR IGNORE INTO esims
       (id, name, country, region, carrier, phone, cycleDays, activatedAt, expiresAt,
        provider, renewalUrl, status, tags, note, createdAt, updatedAt, lastRenewedAt)
       VALUES (?, ?, '', '', '', '', ?, '', ?, '', '', 'active', '[]', ?, ?, ?, ?)`
    ).bind(
      String(o.id), String(o.name || ''), parseInt(o.cycleDays, 10) || 0,
      String(o.expiresAt || ''), String(o.note || ''),
      now, now, parseInt(o.lastRechargeAt, 10) || 0
    ).run();
    count++;
  }

  // 2. settings: KV -> D1 (channels stay in KV; state stays in KV)
  const s = (await env.CFG.get('settings', 'json')) || {};
  await setSetting(env.DB, 'reminderDays', s.reminderDays || '7,3,1,0');
  await setSetting(env.DB, 'notifLang', s.notifLang === 'en' ? 'en' : 'zh');
  await setSetting(env.DB, 'theme', 'system');
  await setSetting(env.DB, 'timezone', 'Asia/Shanghai');
  // password already changed via UI in V1 -> don't force change in V2
  const hadAdminToken = await env.CFG.get('admin_token');
  await setSetting(env.DB, 'pwChanged', hadAdminToken ? '1' : '0');

  await env.CFG.put('migrated_v2', '1');
  return { ok: true, migrated: true, count };
}
