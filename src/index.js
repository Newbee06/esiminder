// eSIMinder V2 — Worker entry: router, auth gate, pages.
import { getSession, getAdminToken } from './auth.js';
import { getSetting } from './db.js';
import { migrateIfNeeded } from './migrate.js';
import { runScheduled } from './cron.js';
import { json } from './api.js';
import * as api from './api.js';
import { LOGIN_PAGE, appShell } from './ui/shell.js';
import { getSettings } from './db.js';

const ROUTES = [
  ['POST', '/api/login', api.handleLogin],
  ['POST', '/api/logout', api.handleLogout],
  ['POST', '/api/admin-password', api.handleAdminPassword],
  ['GET', '/api/dashboard', api.handleDashboard],
  ['GET', '/api/tags', api.handleTags],
  ['GET', '/api/esims', api.handleEsimList],
  ['POST', '/api/esims', api.handleEsimCreate],
  ['GET', '/api/esims/:id', api.handleEsimGet],
  ['PUT', '/api/esims/:id', api.handleEsimUpdate],
  ['DELETE', '/api/esims/:id', api.handleEsimDelete],
  ['POST', '/api/esims/:id/renew', api.handleEsimRenew],
  ['GET', '/api/notifications', api.handleNotifList],
  ['POST', '/api/notifications/test', api.handleNotifTest],
  ['POST', '/api/notifications/:id/retry', api.handleNotifRetry],
  ['GET', '/api/settings', api.handleSettingsGet],
  ['PUT', '/api/settings', api.handleSettingsPut],
  ['PUT', '/api/channels', api.handleChannelsPut],
  ['POST', '/api/migrate', api.handleMigrate],
];
function matchRoute(method, path) {
  for (const [m, pattern, handler] of ROUTES) {
    if (m !== method) continue;
    const pp = pattern.split('/'), xp = path.split('/');
    if (pp.length !== xp.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(xp[i]);
      else if (pp[i] !== xp[i]) { ok = false; break; }
    }
    if (ok) return { handler, params };
  }
  return null;
}
function html(s) {
  return new Response(s, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
// paths allowed while password change is forced
const MUST_CHANGE_ALLOW = new Set(['/api/admin-password', '/api/logout']);

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;
    if (path === '/' || path === '/index.html') {
      const sess = await getSession(req, env);
      if (!sess) return html(LOGIN_PAGE);
      await migrateIfNeeded(env);
      return html(appShell(await getSettings(env.DB)));
    }
    if (!path.startsWith('/api/')) return json({ ok: false, error: 'not found' }, 404);
    const r = matchRoute(req.method, path);
    if (!r) return json({ ok: false, error: 'not found' }, 404);
    // auth gate for API (login itself is public)
    if (path !== '/api/login') {
      const sess = await getSession(req, env);
      if (!sess) return json({ ok: false, error: 'unauthorized' }, 401);
      await migrateIfNeeded(env);
      if (!MUST_CHANGE_ALLOW.has(path)) {
        const pwChanged = await getSetting(env.DB, 'pwChanged', '0');
        if (pwChanged !== '1') return json({ ok: false, error: 'must_change_password' }, 403);
      }
    }
    try {
      return await r.handler(req, env, r.params);
    } catch (e) {
      console.error('api error', path, e && e.message);
      return json({ ok: false, error: 'internal' }, 500);
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduled(env));
  }
};
