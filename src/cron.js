// eSIMinder V2 — daily cron: check D1 esims, push reminders, log to notifications.
import { listEsims, getSettings, parseThresholds, daysUntil, todayInTZ } from './db.js';
import { getChannels, buildReminderMessage, fanout } from './notify.js';

async function readState(env) {
  try { return (await env.CFG.get('state', 'json')) || {}; } catch (e) { return {}; }
}
async function writeState(env, s) { await env.CFG.put('state', JSON.stringify(s)); }

export async function handleCron(env) {
  const esims = await listEsims(env.DB);
  if (!esims.length) return { checked: 0 };
  const settings = await getSettings(env.DB);
  const tz = settings.timezone || 'Asia/Shanghai';
  const today = todayInTZ(tz);
  const thresholds = parseThresholds(settings.reminderDays);
  const maxT = Math.max(...thresholds);
  const st = await readState(env);
  const notified = st.remindNotified || {};
  let changed = false;
  const due = [];
  for (const r of esims) {
    if (r.status === 'inactive' || r.status === 'disabled') continue;
    if (!r.expiresAt) continue;
    const d = daysUntil(r.expiresAt, today);
    if (d === null) continue;
    const sent = notified[r.id] || [];
    if (d > maxT) {
      if (sent.length) { notified[r.id] = []; changed = true; }
      continue;
    }
    const pending = thresholds.filter(t => d <= t && !sent.includes(t));
    if (!pending.length) continue;
    due.push({ r, d });
    notified[r.id] = [...new Set([...sent, ...pending])];
    changed = true;
  }
  if (changed) { st.remindNotified = notified; await writeState(env, st); }
  if (!due.length) return { checked: esims.length, due: 0 };
  const channels = await getChannels(env);
  const { title, text } = buildReminderMessage(due, settings.notifLang, tz);
  await fanout(env, channels, title, text, {
    kind: 'reminder',
    items: due.map(({ r, d }) => ({ esimId: r.id, esimName: r.name, daysLeft: d }))
  });
  return { checked: esims.length, due: due.length };
}

export async function runScheduled(env) {
  try {
    const res = await handleCron(env);
    const st = await readState(env);
    st.lastCheckAt = Date.now();
    await writeState(env, st);
    return res;
  } catch (e) {
    console.error('cron error:', e && e.message);
    return { error: e && e.message };
  }
}
