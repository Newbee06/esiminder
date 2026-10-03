// eSIMinder V2 — daily cron: per-channel independent dedup.
// state.remindNotified format:
//   { [esimId]: { [threshold]: { [channelKey]: true } } }
// true = successfully sent. Missing/false = still pending (will auto-retry next run).
// Legacy format { [esimId]: [threshold, ...] } is normalized to { [t]: { '*': true } }
// ('*' = treated as sent for all channels, so upgrades never cause duplicate sends).
import { listEsims, getSettings, parseThresholds, daysUntil, todayInTZ } from './db.js';
import { getChannels, buildReminderMessage, fanout, CHANNELS, isChannelConfigured } from './notify.js';

async function readState(env) {
  try { return (await env.CFG.get('state', 'json')) || {}; } catch (e) { return {}; }
}
async function writeState(env, s) { await env.CFG.put('state', JSON.stringify(s)); }

// Normalize legacy array format; never throws on unexpected shapes.
function normalizeNotified(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, v] of Object.entries(raw)) {
    if (Array.isArray(v)) {
      out[id] = {};
      for (const t of v) out[id][String(t)] = { '*': true };
    } else if (v && typeof v === 'object') {
      out[id] = {};
      for (const [t, m] of Object.entries(v)) {
        out[id][String(t)] = (m && typeof m === 'object' && !Array.isArray(m)) ? m : {};
      }
    }
  }
  return out;
}
function isSent(sentMap, ch) {
  return !!(sentMap[ch] || sentMap['*']);
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

  const st = await readState(env);
  const notified = normalizeNotified(st.remindNotified);
  let changed = false;

  // Collect per-esim jobs: which thresholds are due and which channels still pending.
  const jobs = []; // { esim, d, pending: { [threshold]: [channels] } }
  for (const r of esims) {
    if (r.status === 'inactive' || r.status === 'disabled') continue;
    if (!r.expiresAt) continue;
    const d = daysUntil(r.expiresAt, today);
    if (d === null) continue;
    const id = r.id;
    if (d > maxT) {
      if (notified[id] && Object.keys(notified[id]).length) { delete notified[id]; changed = true; }
      continue;
    }
    const pending = {};
    for (const t of thresholds) {
      if (d > t) continue;
      const sentMap = (notified[id] && notified[id][String(t)]) || {};
      const todo = configured.filter(ch => !isSent(sentMap, ch));
      if (todo.length) pending[String(t)] = todo;
    }
    if (Object.keys(pending).length) jobs.push({ esim: r, d, pending });
  }
  if (!jobs.length) {
    if (changed) { st.remindNotified = notified; await writeState(env, st); }
    return { checked: esims.length, due: 0 };
  }

  // One message per esim, sent only to channels that still need it.
  // State is updated ONLY for channels that actually succeeded (never before sending).
  let sent = 0, failed = 0;
  for (const job of jobs) {
    const id = job.esim.id;
    const needChannels = [...new Set(Object.values(job.pending).flat())];
    const { title, text } = buildReminderMessage([{ r: job.esim, d: job.d }], settings.notifLang, tz);
    let results;
    try {
      results = await fanout(env, channelsCfg, title, text, {
        kind: 'reminder',
        includeKeys: needChannels,
        logCtx: { esimId: id, esimName: job.esim.name, daysLeft: job.d }
      });
    } catch (e) {
      console.error(`[cron] fanout threw: esim=${id} error=${e && e.message}`);
      continue; // never mark anything sent; will retry next run
    }
    for (const res of results) {
      if (res.ok) {
        notified[id] = notified[id] || {};
        for (const t of Object.keys(job.pending)) {
          if (!job.pending[t].includes(res.key)) continue;
          notified[id][t] = notified[id][t] || {};
          notified[id][t][res.key] = true;
        }
        changed = true; sent++;
      } else {
        failed++;
        console.error(`[cron] notify fail: esim=${id} (${job.esim.name}) channel=${res.key} error=${res.error}`);
      }
    }
  }
  if (changed) { st.remindNotified = notified; await writeState(env, st); }
  return { checked: esims.length, due: jobs.length, sent, failed };
}

export async function runScheduled(env) {
  try {
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
