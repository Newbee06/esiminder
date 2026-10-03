// eSIMinder V2.1 — daily cron with D1-backed notification dedup (strong consistency).
//
// notification_dedup(esim_id, threshold, channel) PRIMARY KEY, status:
//   pending -> sending -> sent | failed
// - INSERT OR IGNORE creates pending rows for due combos.
// - Claim via UPDATE ... WHERE status IN ('pending','failed') (or stale 'sending');
//   meta.changes = 1 means this run owns the row -> concurrent crons can't double-send.
// - sent: never resent. failed: retried by the next cron.
// Legacy KV remindNotified is migrated once into D1, then no longer read.
import { listEsims, getSettings, parseThresholds, daysUntil, todayInTZ } from './db.js';
import { getChannels, buildReminderMessage, fanout, CHANNELS, isChannelConfigured } from './notify.js';
import { migrateV21IfNeeded } from './migrate.js';

const STALE_SENDING_MS = 3600 * 1000;

async function readState(env) {
  try { return (await env.CFG.get('state', 'json')) || {}; } catch (e) { return {}; }
}
async function writeState(env, s) { await env.CFG.put('state', JSON.stringify(s)); }

// One-time migration of legacy KV dedup state -> D1 (marked as sent).
async function migrateKvDedup(env, configured) {
  try {
    if (await env.CFG.get('dedup_migrated_v21')) return;
    const st = await readState(env);
    const raw = st.remindNotified || {};
    const now = Date.now();
    const stmts = [];
    const markSent = (id, t, ch) => stmts.push(
      env.DB.prepare(
        `INSERT OR IGNORE INTO notification_dedup
         (esim_id, threshold, channel, status, created_at, updated_at)
         VALUES (?, ?, ?, 'sent', ?, ?)`
      ).bind(id, parseInt(t, 10), ch, now, now));
    for (const [id, v] of Object.entries(raw)) {
      if (Array.isArray(v)) {
        for (const t of v) for (const ch of configured) markSent(id, t, ch);
      } else if (v && typeof v === 'object') {
        for (const [t, m] of Object.entries(v)) {
          if (!m || typeof m !== 'object' || Array.isArray(m)) continue;
          if (m['*']) { for (const ch of configured) markSent(id, t, ch); continue; }
          for (const [ch, sent] of Object.entries(m)) if (sent) markSent(id, t, ch);
        }
      }
    }
    for (let i = 0; i < stmts.length; i += 50) await env.DB.batch(stmts.slice(i, i + 50));
    await env.CFG.put('dedup_migrated_v21', '1');
  } catch (e) {
    console.error('[cron] dedup migration failed:', e && e.message);
  }
}

export async function handleCron(env) {
  const esims = await listEsims(env.DB);
  if (!esims.length) return { checked: 0 };
  const settings = await getSettings(env.DB);
  const tz = settings.timezone || 'Asia/Shanghai';
  const today = todayInTZ(tz);
  const thresholds = parseThresholds(settings.reminderDays);
  const maxT = Math.max(...thresholds);
  const channelsCfg = await getChannels(env);
  const configured = CHANNELS.filter(([k]) => isChannelConfigured(channelsCfg[k])).map(([k]) => k);
  if (!configured.length) return { checked: esims.length, due: 0, reason: 'no channels configured' };

  await migrateKvDedup(env, configured);
  const now = Date.now();

  // Collect due (esim, threshold, channel) combos, grouped by esim for one message each.
  const byEsim = new Map();
  const outOfWindow = [];
  for (const r of esims) {
    if (r.status === 'inactive' || r.status === 'disabled') continue;
    if (!r.expiresAt) continue;
    const d = daysUntil(r.expiresAt, today);
    if (d === null) continue;
    if (d > maxT) { outOfWindow.push(r.id); continue; }
    const g = byEsim.get(r.id) || { esim: r, d, combos: [] };
    for (const t of thresholds) {
      if (d > t) continue;
      for (const ch of configured) g.combos.push({ threshold: t, channel: ch });
    }
    if (g.combos.length) byEsim.set(r.id, g);
  }
  // Prune rows for esims no longer in any reminder window (mirrors old KV reset).
  if (outOfWindow.length) {
    for (let i = 0; i < outOfWindow.length; i += 50) {
      await env.DB.batch(outOfWindow.slice(i, i + 50).map(id =>
        env.DB.prepare('DELETE FROM notification_dedup WHERE esim_id = ?').bind(id)));
    }
  }
  if (!byEsim.size) return { checked: esims.length, due: 0 };

  let sent = 0, failed = 0, esimsNotified = 0;
  for (const [id, g] of byEsim) {
    // Ensure pending rows, then claim the ones we may send.
    const ensureStmts = g.combos.map(c => env.DB.prepare(
      `INSERT OR IGNORE INTO notification_dedup
       (esim_id, threshold, channel, status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?)`
    ).bind(id, c.threshold, c.channel, now, now));
    for (let i = 0; i < ensureStmts.length; i += 50) await env.DB.batch(ensureStmts.slice(i, i + 50));

    const claimed = [];
    for (const c of g.combos) {
      let cl;
      try {
        cl = await env.DB.prepare(
          `UPDATE notification_dedup SET status = 'sending', updated_at = ?
           WHERE esim_id = ? AND threshold = ? AND channel = ?
             AND (status IN ('pending', 'failed')
                  OR (status = 'sending' AND updated_at < ?))`
        ).bind(now, id, c.threshold, c.channel, now - STALE_SENDING_MS).run();
      } catch (e) { continue; }
      if (cl && cl.meta && cl.meta.changes === 1) claimed.push(c);
    }
    if (!claimed.length) continue;

    const needChannels = [...new Set(claimed.map(c => c.channel))];
    const { title, text } = buildReminderMessage([{ r: g.esim, d: g.d }], settings.notifLang, tz);
    const setStatus = async (c, s) => {
      try {
        await env.DB.prepare(
          `UPDATE notification_dedup SET status = ?, updated_at = ?
           WHERE esim_id = ? AND threshold = ? AND channel = ?`
        ).bind(s, Date.now(), id, c.threshold, c.channel).run();
      } catch (e) {}
    };

    let results;
    try {
      results = await fanout(env, channelsCfg, title, text, {
        kind: 'reminder',
        includeKeys: needChannels,
        logCtx: { esimId: id, esimName: g.esim.name, daysLeft: g.d }
      });
    } catch (e) {
      console.error(`[cron] fanout threw: esim=${id} error=${e && e.message}`);
      for (const c of claimed) await setStatus(c, 'failed');
      failed += claimed.length;
      continue;
    }
    esimsNotified++;
    for (const c of claimed) {
      const res = results.find(r => r.key === c.channel);
      if (res && res.ok) { await setStatus(c, 'sent'); sent++; }
      else {
        await setStatus(c, 'failed'); failed++;
        console.error(`[cron] notify fail: esim=${id} (${g.esim.name}) threshold=${c.threshold} channel=${c.channel} error=${res ? res.error : 'fanout-throw'}`);
      }
    }
  }
  return { checked: esims.length, due: esimsNotified, sent, failed };
}

export async function runScheduled(env) {
  try {
    // V2.1 tables must exist before the first cron runs, even if no HTTP
    // request has triggered migration yet.
    await migrateV21IfNeeded(env);
    const res = await handleCron(env);
    const st = await readState(env);
    st.lastCheckAt = Date.now();
    await writeState(env, st);
    return res;
  } catch (e) {
    console.error('[cron] fatal:', e && e.message);
    return { error: e && e.message };
  }
}
