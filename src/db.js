// eSIMinder V2 — D1 schema, date utils, unified status computation.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS esims (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT DEFAULT '',
  region TEXT DEFAULT '',
  carrier TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  cycleDays INTEGER DEFAULT 0,
  activatedAt TEXT DEFAULT '',
  expiresAt TEXT DEFAULT '',
  provider TEXT DEFAULT '',
  renewalUrl TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  tags TEXT DEFAULT '[]',
  note TEXT DEFAULT '',
  createdAt INTEGER DEFAULT 0,
  updatedAt INTEGER DEFAULT 0,
  lastRenewedAt INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS renewal_records (
  id TEXT PRIMARY KEY,
  esimId TEXT NOT NULL,
  renewedAt INTEGER NOT NULL,
  days INTEGER NOT NULL,
  oldExpiresAt TEXT NOT NULL,
  newExpiresAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_renewal_esim ON renewal_records(esimId, renewedAt DESC);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  createdAt INTEGER NOT NULL,
  esimId TEXT DEFAULT '',
  esimName TEXT DEFAULT '',
  kind TEXT NOT NULL,
  daysLeft INTEGER DEFAULT 0,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT DEFAULT '',
  title TEXT DEFAULT '',
  text TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(createdAt DESC);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT DEFAULT ''
);
`;

export async function ensureSchema(db) {
  for (const stmt of SCHEMA.split(';')) {
    const s = stmt.trim();
    if (s) await db.prepare(s).bind().run();
  }
}

// ---- dates (timezone-aware) ----
export function todayInTZ(tz, nowMs) {
  try {
    return new Date(nowMs === undefined ? Date.now() : nowMs)
      .toLocaleDateString('en-CA', { timeZone: tz || 'Asia/Shanghai' });
  } catch (e) {
    return new Date(nowMs === undefined ? Date.now() : nowMs)
      .toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  }
}
export function addDays(dateStr, n) {
  const t = Date.parse(dateStr);
  if (isNaN(t)) return '';
  return new Date(t + n * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}
export function daysUntil(dateStr, todayStr) {
  if (!dateStr) return null;
  return Math.round((Date.parse(dateStr) - Date.parse(todayStr)) / 86400000);
}
export function validDateStr(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  return !isNaN(Date.parse(s));
}
export function parseThresholds(s) {
  const arr = String(s || '7,3,1,0').split(',')
    .map(x => parseInt(x.trim(), 10)).filter(n => !isNaN(n) && n >= 0);
  return arr.length ? [...new Set(arr)].sort((a, b) => b - a) : [7, 3, 1, 0];
}

// ---- unified status: the ONLY place that computes display status ----
// Never conflates "no expiresAt" with user-chosen "inactive":
// inactive/disabled always reflect the user's explicit choice;
// an active esim without expiry simply shows as active with no countdown.
export const DISPLAY_STATUSES = ['active', 'expiring', 'expired', 'inactive', 'disabled'];
export function computeDisplayStatus(row, todayStr, maxThreshold) {
  if (row.status === 'inactive') return 'inactive';
  if (row.status === 'disabled') return 'disabled';
  if (!row.expiresAt) return 'active';
  const d = daysUntil(row.expiresAt, todayStr);
  if (d === null || d < 0) return 'expired';
  if (d <= maxThreshold) return 'expiring';
  return 'active';
}

// ---- row mapping (DB -> API object) ----
export function mapEsim(row, todayStr, maxThreshold) {
  let tags = [];
  try { tags = JSON.parse(row.tags || '[]'); if (!Array.isArray(tags)) tags = []; } catch (e) { tags = []; }
  const d = row.expiresAt ? daysUntil(row.expiresAt, todayStr) : null;
  return {
    id: row.id, name: row.name, country: row.country || '', region: row.region || '',
    carrier: row.carrier || '', phone: row.phone || '',
    cycleDays: row.cycleDays || 0, activatedAt: row.activatedAt || '', expiresAt: row.expiresAt || '',
    provider: row.provider || '', renewalUrl: row.renewalUrl || '',
    status: row.status || 'active', tags, note: row.note || '',
    createdAt: row.createdAt || 0, updatedAt: row.updatedAt || 0, lastRenewedAt: row.lastRenewedAt || 0,
    daysLeft: d, displayStatus: computeDisplayStatus(row, todayStr, maxThreshold),
  };
}

export async function getEsim(db, id) {
  return db.prepare('SELECT * FROM esims WHERE id = ?').bind(id).first();
}
export async function listEsims(db) {
  const r = await db.prepare('SELECT * FROM esims ORDER BY expiresAt ASC').bind().all();
  return r.results || [];
}
export async function getSetting(db, key, fallback) {
  const r = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  return r ? r.value : fallback;
}
export async function setSetting(db, key, value) {
  await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .bind(key, String(value)).run();
}
export async function getSettings(db) {
  const r = await db.prepare('SELECT key, value FROM settings').bind().all();
  const s = { reminderDays: '7,3,1,0', notifLang: 'zh', theme: 'system', timezone: 'Asia/Shanghai' };
  for (const row of (r.results || [])) s[row.key] = row.value;
  if (s.notifLang !== 'en') s.notifLang = 'zh';
  if (!['system', 'light', 'dark'].includes(s.theme)) s.theme = 'system';
  return s;
}
