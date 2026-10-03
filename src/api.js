// eSIMinder V2 — REST API handlers.
import {
  listEsims, getEsim, mapEsim, getSettings, getSetting, setSetting,
  todayInTZ, addDays, daysUntil, parseThresholds, validDateStr, computeDisplayStatus
} from './db.js';
import {
  getSession, createSession, destroySession, destroyAllSessions,
  timingSafeEqual, getAdminToken, sessionCookie,
  checkRateLimit, recordLoginFail, clearRateLimit, clientIP
} from './auth.js';
import {
  getChannels, buildReminderMessage, buildTestMessage, fanout, logNotification,
  CHANNELS, CHANNEL_LABELS
} from './notify.js';
import { migrateIfNeeded } from './migrate.js';

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
async function needAuth(req, env) {
  const body = req.method === 'GET' ? null : await req.json().catch(() => null);
  if (!(await getSession(req, env))) return { err: json({ ok: false, error: 'unauthorized' }, 401) };
  return { body: body || {} };
}
function str(v, max) { return String(v === undefined || v === null ? '' : v).trim().slice(0, max || 200); }
function parseTags(input) {
  let arr = [];
  if (Array.isArray(input)) arr = input;
  else if (typeof input === 'string') arr = input.split(/[,，、]/);
  const seen = new Set(); const out = [];
  for (const t of arr) {
    const s = String(t).trim().slice(0, 20);
    if (s && !seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out.slice(0, 20);
}
function sanitizeEsim(b, isCreate) {
  const rawCycle = parseInt(b.cycleDays, 10);
  if (b.cycleDays !== undefined && b.cycleDays !== '' && b.cycleDays !== null && (isNaN(rawCycle) || rawCycle < 0))
    return { error: 'bad cycleDays' };
  if (!isNaN(rawCycle) && rawCycle > 3650) return { error: 'bad cycleDays' };
  const o = {
    name: str(b.name, 60),
    country: str(b.country, 60), region: str(b.region, 60),
    carrier: str(b.carrier, 60), phone: str(b.phone, 40),
    cycleDays: isNaN(rawCycle) ? 0 : Math.min(3650, Math.max(0, rawCycle)),
    activatedAt: str(b.activatedAt, 10), expiresAt: str(b.expiresAt, 10),
    provider: str(b.provider, 60), renewalUrl: str(b.renewalUrl, 500),
    status: ['active', 'inactive', 'disabled'].includes(b.status) ? b.status : 'active',
    tags: parseTags(b.tags), note: str(b.note, 500),
  };
  if (isCreate && !o.name) return { error: 'name required' };
  if (o.activatedAt && !validDateStr(o.activatedAt)) return { error: 'bad activatedAt' };
  if (o.expiresAt && !validDateStr(o.expiresAt)) return { error: 'bad expiresAt' };
  if (o.renewalUrl && !/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(o.renewalUrl)) return { error: 'bad renewalUrl' };
  return { value: o };
}
async function clearDedup(env, esimId) {
  // V2.1: dedup lives in D1. Also clear legacy KV state (harmless if absent).
  try { await env.DB.prepare('DELETE FROM notification_dedup WHERE esim_id = ?').bind(esimId).run(); } catch (e) {}
  try {
    const st = (await env.CFG.get('state', 'json')) || {};
    const n = st.remindNotified || {};
    if (n[esimId]) { delete n[esimId]; st.remindNotified = n; await env.CFG.put('state', JSON.stringify(st)); }
  } catch (e) {}
}

// ---------------- auth ----------------
export async function handleLogin(req, env) {
  const ip = clientIP(req);
  const rl = await checkRateLimit(env, ip);
  if (rl.blocked) return json({ ok: false, error: 'locked' }, 429);
  const body = await req.json().catch(() => null);
  if (!body || !timingSafeEqual(String(body.adminToken || ''), await getAdminToken(env))) {
    await recordLoginFail(env, ip);
    return json({ ok: false, error: 'bad password' }, 401);
  }
  await clearRateLimit(env, ip);
  await migrateIfNeeded(env);
  const sid = await createSession(env);
  const pwChanged = await getSetting(env.DB, 'pwChanged', '0');
  return new Response(JSON.stringify({ ok: true, mustChangePassword: pwChanged !== '1' }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': sessionCookie(sid, 604800)
    }
  });
}
export async function handleLogout(req, env) {
  await destroySession(req, env);
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': sessionCookie('', 0)
    }
  });
}
export async function handleAdminPassword(req, env) {
  const { err, body } = await needAuth(req, env);
  if (err) return err;
  const np = String(body.newPassword || '');
  if (np.length < 6) return json({ ok: false, error: 'too short' }, 400);
  if (np.length > 128) return json({ ok: false, error: 'too long' }, 400);
  await env.CFG.put('admin_token', np);
  await destroyAllSessions(env);
  await setSetting(env.DB, 'pwChanged', '1');
  return json({ ok: true });
}

// ---------------- esims ----------------
async function ctx(env) {
  const settings = await getSettings(env.DB);
  const today = todayInTZ(settings.timezone);
  const maxT = Math.max(...parseThresholds(settings.reminderDays));
  return { settings, today, maxT };
}
export async function handleEsimList(req, env) {
  const { err } = await needAuth(req, env);
  if (err) return err;
  const { today, maxT } = await ctx(env);
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').toLowerCase();
  const statusF = url.searchParams.get('status') || '';
  const tagF = url.searchParams.get('tag') || '';
  let rows = await listEsims(env.DB);
  let items = rows.map(r => mapEsim(r, today, maxT));
  if (q) items = items.filter(e =>
    (e.name + ' ' + e.country + ' ' + e.region + ' ' + e.carrier + ' ' + e.phone + ' ' + e.tags.join(' ')).toLowerCase().includes(q));
  if (statusF) items = items.filter(e => e.displayStatus === statusF);
  if (tagF) items = items.filter(e => e.tags.includes(tagF));
  return json({ ok: true, items });
}
export async function handleEsimCreate(req, env) {
  const { err, body } = await needAuth(req, env);
  if (err) return err;
  const s = sanitizeEsim(body, true);
  if (s.error) return json({ ok: false, error: s.error }, 400);
  const v = s.value; const now = Date.now();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO esims (id, name, country, region, carrier, phone, cycleDays, activatedAt, expiresAt,
      provider, renewalUrl, status, tags, note, createdAt, updatedAt, lastRenewedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
  ).bind(id, v.name, v.country, v.region, v.carrier, v.phone, v.cycleDays, v.activatedAt,
    v.expiresAt, v.provider, v.renewalUrl, v.status, JSON.stringify(v.tags), v.note, now, now).run();
  return json({ ok: true, id });
}
export async function handleEsimGet(req, env, params) {
  const { err } = await needAuth(req, env);
  if (err) return err;
  const { today, maxT } = await ctx(env);
  const row = await getEsim(env.DB, params.id);
  if (!row) return json({ ok: false, error: 'not found' }, 404);
  const renewals = await env.DB.prepare(
    'SELECT * FROM renewal_records WHERE esimId = ? ORDER BY renewedAt DESC').bind(params.id).all();
  return json({ ok: true, esim: mapEsim(row, today, maxT), renewals: renewals.results || [] });
}
export async function handleEsimUpdate(req, env, params) {
  const { err, body } = await needAuth(req, env);
  if (err) return err;
  const row = await getEsim(env.DB, params.id);
  if (!row) return json({ ok: false, error: 'not found' }, 404);
  const s = sanitizeEsim({ ...row, tags: row.tags, ...body }, false);
  if (s.error) return json({ ok: false, error: s.error }, 400);
  const v = s.value;
  const dateChanged = v.expiresAt !== (row.expiresAt || '');
  await env.DB.prepare(
    `UPDATE esims SET name=?, country=?, region=?, carrier=?, phone=?, cycleDays=?, activatedAt=?,
      expiresAt=?, provider=?, renewalUrl=?, status=?, tags=?, note=?, updatedAt=? WHERE id=?`
  ).bind(v.name, v.country, v.region, v.carrier, v.phone, v.cycleDays, v.activatedAt, v.expiresAt,
    v.provider, v.renewalUrl, v.status, JSON.stringify(v.tags), v.note, Date.now(), params.id).run();
  if (dateChanged) await clearDedup(env, params.id);
  return json({ ok: true });
}
export async function handleEsimDelete(req, env, params) {
  const { err } = await needAuth(req, env);
  if (err) return err;
  await env.DB.prepare('DELETE FROM renewal_records WHERE esimId = ?').bind(params.id).run();
  await env.DB.prepare('DELETE FROM esims WHERE id = ?').bind(params.id).run();
  await clearDedup(env, params.id);
  return json({ ok: true });
}
// Server-authoritative renewal computation. The frontend may preview, but must
// use the server's result. base = max(expiresAt, today) + cycleDays.
function computeRenewal(row, today) {
  if (!row.cycleDays || row.cycleDays <= 0) return { error: 'no cycle' };
  const base = row.expiresAt && row.expiresAt >= today ? row.expiresAt : today;
  const newExp = addDays(base, row.cycleDays);
  if (!newExp) return { error: 'bad date' };
  return {
    currentExpiresAt: row.expiresAt || '',
    cycleDays: row.cycleDays,
    baseDate: base,
    newExpiresAt: newExp,
    fromToday: !(row.expiresAt && row.expiresAt >= today),
  };
}
export async function handleEsimRenewPreview(req, env, params) {
  const { err } = await needAuth(req, env);
  if (err) return err;
  const row = await getEsim(env.DB, params.id);
  if (!row) return json({ ok: false, error: 'not found' }, 404);
  const { today } = await ctx(env);
  const c = computeRenewal(row, today);
  if (c.error) return json({ ok: false, error: c.error }, 400);
  return json({ ok: true, ...c });
}
async function lookupIdempotency(db, requestId) {
  try {
    return await db.prepare(
      'SELECT esim_id, response FROM renew_idempotency WHERE request_id = ?'
    ).bind(requestId).first();
  } catch (e) { return null; }
}
export async function handleEsimRenew(req, env, params) {
  const { err, body } = await needAuth(req, env);
  if (err) return err;
  const row = await getEsim(env.DB, params.id);
  if (!row) return json({ ok: false, error: 'not found' }, 404);
  const { today } = await ctx(env);
  const c = computeRenewal(row, today);
  if (c.error) return json({ ok: false, error: c.error }, 400);
  const requestId = String((body && body.requestId) || '').slice(0, 64);
  const now = Date.now();
  const oldExp = row.expiresAt || '';
  const result = { ok: true, oldExpiresAt: oldExp, newExpiresAt: c.newExpiresAt, fromToday: c.fromToday };

  // V2.1 idempotency pre-check: a requestId is bound to the first esim that used it.
  if (requestId) {
    const prev = await lookupIdempotency(env.DB, requestId);
    if (prev && prev.response) {
      if (prev.esim_id !== params.id)
        return json({ ok: false, error: 'requestId already used for another esim' }, 409);
      return json(JSON.parse(prev.response));
    }
  }

  // V2.1 atomic renewal: ONE D1 batch, all three writes conditional on the same
  // predicate (esim still has oldExp). D1 batch is transactional: either all three
  // succeed or all roll back. If the predicate fails (lost race), nothing is
  // written — not the history, not the idempotency row.
  const recordId = crypto.randomUUID();
  const stmts = [
    env.DB.prepare(`
      INSERT INTO renewal_records (id, esimId, renewedAt, days, oldExpiresAt, newExpiresAt)
      SELECT ?, id, ?, ?, expiresAt, ?
      FROM esims WHERE id = ? AND expiresAt = ?
    `).bind(recordId, now, row.cycleDays, c.newExpiresAt, params.id, oldExp),
    env.DB.prepare(`
      UPDATE esims SET expiresAt = ?, lastRenewedAt = ?, updatedAt = ?
      WHERE id = ? AND expiresAt = ?
    `).bind(c.newExpiresAt, now, now, params.id, oldExp),
  ];
  if (requestId) {
    stmts.push(env.DB.prepare(`
      INSERT INTO renew_idempotency (request_id, esim_id, created_at, response)
      SELECT ?, ?, ?, ?
      WHERE EXISTS (SELECT 1 FROM renewal_records WHERE id = ?)
    `).bind(requestId, params.id, now, JSON.stringify(result), recordId));
  }
  const results = await env.DB.batch(stmts);
  const updateChanges = results[1] && results[1].meta ? results[1].meta.changes : 0;

  if (updateChanges !== 1) {
    // Lost the race and nothing was written. It might be a concurrent duplicate
    // requestId: give the winner a moment, then re-check.
    if (requestId) {
      for (let i = 0; i < 4; i++) {
        const prev = await lookupIdempotency(env.DB, requestId);
        if (prev && prev.response) {
          if (prev.esim_id !== params.id)
            return json({ ok: false, error: 'requestId already used for another esim' }, 409);
          return json(JSON.parse(prev.response));
        }
        if (i < 3) await new Promise(r => setTimeout(r, 120));
      }
    }
    return json({ ok: false, error: 'conflict: esim was modified, please refresh and retry' }, 409);
  }

  await clearDedup(env, params.id);
  return json(result);
}

// ---------------- dashboard / tags ----------------
export async function handleDashboard(req, env) {
  const { err } = await needAuth(req, env);
  if (err) return err;
  const { settings, today, maxT } = await ctx(env);
  const rows = await listEsims(env.DB);
  const items = rows.map(r => mapEsim(r, today, maxT));
  const byStatus = s => items.filter(e => e.displayStatus === s);
  const stats = {
    all: items.length,
    active: byStatus('active').length,
    expiring: byStatus('expiring').length,
    inactive: byStatus('inactive').length,
    expired: byStatus('expired').length,
    disabled: byStatus('disabled').length,
  };
  const attention = items
    .filter(e => e.displayStatus === 'expiring' || e.displayStatus === 'expired')
    .sort((a, b) => (a.daysLeft === null ? 9999 : a.daysLeft) - (b.daysLeft === null ? 9999 : b.daysLeft));
  const tagMap = {};
  for (const e of items) for (const t of e.tags) tagMap[t] = (tagMap[t] || 0) + 1;
  const tags = Object.entries(tagMap).map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
  let lastCheckAt = 0;
  try { lastCheckAt = ((await env.CFG.get('state', 'json')) || {}).lastCheckAt || 0; } catch (e) {}
  return json({ ok: true, today, stats, attention, esims: items, tags, lastCheckAt, timezone: settings.timezone });
}
export async function handleTags(req, env) {
  const { err } = await needAuth(req, env);
  if (err) return err;
  const rows = await listEsims(env.DB);
  const tagMap = {};
  for (const r of rows) {
    let tags = [];
    try { tags = JSON.parse(r.tags || '[]'); } catch (e) {}
    for (const t of tags) tagMap[t] = (tagMap[t] || 0) + 1;
  }
  return json({
    ok: true,
    tags: Object.entries(tagMap).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count)
  });
}

// ---------------- notifications ----------------
export async function handleNotifList(req, env) {
  const { err } = await needAuth(req, env);
  if (err) return err;
  const url = new URL(req.url);
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
  const r = await env.DB.prepare(
    'SELECT id, createdAt, esimId, esimName, kind, daysLeft, channel, status, error FROM notifications ORDER BY createdAt DESC LIMIT ?'
  ).bind(limit).all();
  return json({ ok: true, items: r.results || [] });
}
export async function handleNotifTest(req, env) {
  const { err, body } = await needAuth(req, env);
  if (err) return err;
  const settings = await getSettings(env.DB);
  const channels = await getChannels(env);
  const { title, text } = (await import('./notify.js')).buildTestMessage(settings.notifLang);
  const results = await fanout(env, channels, title, text, { kind: 'test', only: body.channel || 'all' });
  return json({ ok: true, results });
}
export async function handleNotifRetry(req, env, params) {
  const { err } = await needAuth(req, env);
  if (err) return err;
  const row = await env.DB.prepare('SELECT * FROM notifications WHERE id = ?').bind(params.id).first();
  if (!row) return json({ ok: false, error: 'not found' }, 404);
  const sender = (await import('./notify.js')).CHANNELS.find(([k]) => k === row.channel);
  if (!sender) return json({ ok: false, error: 'unknown channel' }, 400);
  const channels = await getChannels(env);
  const r = await sender[1](channels[row.channel] || {}, row.title, row.text);
  const ok = !r.skipped && !!r.ok;
  await logNotification(env, {
    esimId: row.esimId, esimName: row.esimName, kind: row.kind, daysLeft: row.daysLeft,
    channel: row.channel, ok, error: r.error || (r.skipped ? 'skipped' : ''), title: row.title, text: row.text
  });
  return json({ ok: true, sent: ok, error: r.error || '' });
}

// ---------------- settings / channels / migrate ----------------
export async function handleSettingsGet(req, env) {
  const { err } = await needAuth(req, env);
  if (err) return err;
  const settings = await getSettings(env.DB);
  const channels = await getChannels(env);
  const chStatus = {};
  for (const [key] of CHANNELS) {
    const c = channels[key] || {};
    chStatus[key] = Object.values(c).some(v => v);
  }
  return json({ ok: true, settings, chStatus });
}
function validTimezone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz }).format();
    return true;
  } catch (e) { return false; }
}
export async function handleSettingsPut(req, env) {
  const { err, body } = await needAuth(req, env);
  if (err) return err;
  if (body.reminderDays !== undefined) {
    // V2.1: normalize and persist only the canonical form (deduped, sorted,
    // capped). parseThresholds already rejects non-numbers/negatives.
    const thresholds = parseThresholds(String(body.reminderDays).slice(0, 100))
      .filter(t => t <= 365).slice(0, 10);
    await setSetting(env.DB, 'reminderDays', (thresholds.length ? thresholds : [7, 3, 1, 0]).join(','));
  }
  if (body.notifLang !== undefined) await setSetting(env.DB, 'notifLang', body.notifLang === 'en' ? 'en' : 'zh');
  if (body.theme !== undefined && ['system', 'light', 'dark'].includes(body.theme))
    await setSetting(env.DB, 'theme', body.theme);
  if (body.timezone !== undefined) {
    const tz = String(body.timezone).trim().slice(0, 60) || 'Asia/Shanghai';
    if (!validTimezone(tz)) return json({ ok: false, error: 'bad timezone' }, 400);
    await setSetting(env.DB, 'timezone', tz);
  }
  return json({ ok: true });
}
export async function handleChannelsPut(req, env) {
  const { err, body } = await needAuth(req, env);
  if (err) return err;
  const input = (body && body.channels) || {};
  const existing = await getChannels(env);
  // Merge, never blind-overwrite:
  //   - missing/blank field  -> keep existing value
  //   - non-blank value      -> update
  //   - "<field>__clear":true -> delete the stored value
  const FIELDS = {
    telegram: ['botToken', 'chatId'],
    wecom: ['webhook'],
    dingtalk: ['webhook', 'secret'],
    feishu: ['webhook', 'secret'],
    bark: ['key'],
    serverchan: ['sendKey'],
    email: ['apiKey', 'from', 'to'],
  };
  const merged = {};
  for (const ch of Object.keys(FIELDS)) {
    merged[ch] = { ...(existing[ch] || {}) };
    const inc = input[ch] || {};
    for (const f of FIELDS[ch]) {
      if (inc[f + '__clear']) {
        delete merged[ch][f];
      } else if (inc[f] !== undefined && inc[f] !== null && String(inc[f]).trim() !== '') {
        merged[ch][f] = String(inc[f]).trim().slice(0, 500);
      }
      // blank/missing: keep existing
    }
  }
  await env.CFG.put('channels', JSON.stringify(merged));
  return json({ ok: true });
}
export async function handleMigrate(req, env) {
  const { err } = await needAuth(req, env);
  if (err) return err;
  return json(await migrateIfNeeded(env));
}
