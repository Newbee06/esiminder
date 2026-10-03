// eSIMinder V2 — auth: cookie sessions (7d) + login rate limiting.
export function getCookie(req, name) {
  const h = req.headers.get('Cookie') || '';
  const m = h.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}
export function clientIP(req) {
  return req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'unknown';
}
export async function getSession(req, env) {
  const sid = getCookie(req, 'kb_session');
  if (!sid) return null;
  try {
    const s = await env.CFG.get('sess:' + sid, 'json');
    return s ? { id: sid } : null;
  } catch (e) { return null; }
}
export async function createSession(env) {
  const sid = crypto.randomUUID();
  await env.CFG.put('sess:' + sid, JSON.stringify({ created: Date.now() }), { expirationTtl: 7 * 24 * 3600 });
  return sid;
}
export async function destroySession(req, env) {
  const sid = getCookie(req, 'kb_session');
  if (sid) { try { await env.CFG.delete('sess:' + sid); } catch (e) {} }
}
export async function destroyAllSessions(env) {
  try {
    let cursor, done = false;
    while (!done) {
      const lst = await env.CFG.list({ prefix: 'sess:', cursor });
      for (const k of lst.keys) { try { await env.CFG.delete(k.name); } catch (e) {} }
      done = lst.list_complete; cursor = lst.cursor;
    }
  } catch (e) {}
}
export function timingSafeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
export async function getAdminToken(env) {
  try { const s = await env.CFG.get('admin_token'); if (s) return s; } catch (e) {}
  return env.ADMIN_TOKEN || '';
}
export function sessionCookie(sid, maxAge) {
  return 'kb_session=' + sid + '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=' + maxAge;
}

// ---- login rate limiting: 5 failures -> 15 min lockout (per IP) ----
const MAX_FAILS = 5, LOCK_MS = 15 * 60 * 1000;
export async function checkRateLimit(env, ip) {
  try {
    const rec = await env.CFG.get('rl:' + ip, 'json');
    if (rec && rec.until > Date.now()) return { blocked: true };
  } catch (e) {}
  return { blocked: false };
}
export async function recordLoginFail(env, ip) {
  try {
    const k = 'rl:' + ip;
    const rec = (await env.CFG.get(k, 'json')) || { count: 0 };
    rec.count = (rec.count || 0) + 1;
    if (rec.count >= MAX_FAILS) { rec.until = Date.now() + LOCK_MS; rec.count = 0; }
    await env.CFG.put(k, JSON.stringify(rec), { expirationTtl: 1800 });
  } catch (e) {}
}
export async function clearRateLimit(env, ip) {
  try { await env.CFG.delete('rl:' + ip); } catch (e) {}
}
