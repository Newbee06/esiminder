// eSIMinder V2 — push channels (reused from V1, unchanged behavior) + D1 notification logging.
// V2.1: every third-party request has a 10s timeout (AbortController); error bodies
// are truncated to 240 chars so logs stay useful.
const NOTIFY_TIMEOUT_MS = 10000;
const ERR_BODY_MAX = 240;
async function timedFetch(url, opts = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), NOTIFY_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctl.signal });
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('timeout after ' + NOTIFY_TIMEOUT_MS + 'ms');
    throw e;
  } finally {
    clearTimeout(t);
  }
}
async function errText(r) {
  try {
    const t = await r.text();
    return t ? t.slice(0, ERR_BODY_MAX) : '';
  } catch (e) { return ''; }
}
async function postJSON(url, body, headers = {}) {
  const r = await timedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const b = await errText(r);
    throw new Error('HTTP ' + r.status + (b ? ': ' + b : ''));
  }
  return r;
}
async function hmacSHA256Base64(key, msg) {
  const ck = await crypto.subtle.importKey('raw', new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', ck, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
async function sendTelegram(cfg, title, text) {
  if (!cfg || !cfg.botToken || !cfg.chatId) return { skipped: true };
  try {
    await postJSON(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`,
      { chat_id: cfg.chatId, text: `${title}\n${text}` });
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}
async function sendWecom(cfg, title, text) {
  if (!cfg || !cfg.webhook) return { skipped: true };
  try {
    await postJSON(cfg.webhook, { msgtype: 'text', text: { content: `${title}\n${text}` } });
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}
async function sendDingtalk(cfg, title, text) {
  if (!cfg || !cfg.webhook) return { skipped: true };
  try {
    let url = cfg.webhook;
    if (cfg.secret) {
      const ts = Date.now();
      const sign = await hmacSHA256Base64(cfg.secret, `${ts}\n${cfg.secret}`);
      url += (url.includes('?') ? '&' : '?') + `timestamp=${ts}&sign=${encodeURIComponent(sign)}`;
    }
    await postJSON(url, { msgtype: 'text', text: { content: `${title}\n${text}` } });
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}
async function sendFeishu(cfg, title, text) {
  if (!cfg || !cfg.webhook) return { skipped: true };
  try {
    let url = cfg.webhook;
    if (cfg.secret) {
      const ts = Math.floor(Date.now() / 1000);
      const sign = await hmacSHA256Base64(cfg.secret, `${ts}\n${cfg.secret}`);
      url += (url.includes('?') ? '&' : '?') + `timestamp=${ts}&sign=${encodeURIComponent(sign)}`;
    }
    await postJSON(url, { msg_type: 'text', content: { text: `${title}\n${text}` } });
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}
async function sendBark(cfg, title, text) {
  if (!cfg || !cfg.key) return { skipped: true };
  try {
    const r = await timedFetch(`https://api.day.app/${cfg.key}/${encodeURIComponent(title)}/${encodeURIComponent(text)}`);
    if (!r.ok) { const b = await errText(r); throw new Error('HTTP ' + r.status + (b ? ': ' + b : '')); }
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}
async function sendServerChan(cfg, title, text) {
  if (!cfg || !cfg.sendKey) return { skipped: true };
  try {
    const r = await timedFetch(`https://sctapi.ftqq.com/${cfg.sendKey}.send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `title=${encodeURIComponent(title)}&desp=${encodeURIComponent(text)}`
    });
    if (!r.ok) { const b = await errText(r); throw new Error('HTTP ' + r.status + (b ? ': ' + b : '')); }
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}
async function sendEmail(cfg, title, text) {
  if (!cfg || !cfg.apiKey || !cfg.to) return { skipped: true };
  try {
    await postJSON('https://api.resend.com/emails', {
      from: cfg.from || 'eSIMinder <onboarding@resend.dev>',
      to: [cfg.to], subject: title, text
    }, { Authorization: `Bearer ${cfg.apiKey}` });
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}
export const CHANNELS = [
  ['telegram', sendTelegram], ['wecom', sendWecom], ['dingtalk', sendDingtalk],
  ['feishu', sendFeishu], ['bark', sendBark], ['serverchan', sendServerChan],
  ['email', sendEmail],
];
export const CHANNEL_LABELS = {
  telegram: 'Telegram', wecom: 'WeCom', dingtalk: 'DingTalk',
  feishu: 'Feishu', bark: 'Bark', serverchan: 'ServerChan', email: 'Email'
};
export async function getChannels(env) {
  try { return (await env.CFG.get('channels', 'json')) || {}; } catch (e) { return {}; }
}
export function isChannelConfigured(cfg) {
  return !!(cfg && Object.values(cfg).some(v => v));
}

// ---- bilingual message builders (reused logic from V1) ----
export function nowInTZ(tz) {
  try {
    return new Date().toLocaleString('zh-CN', { timeZone: tz || 'Asia/Shanghai', hour12: false });
  } catch (e) {
    return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
  }
}
export function buildReminderMessage(due, lang, tz) {
  const zh = lang !== 'en';
  const title = zh ? '⏰ eSIM 续费提醒' : '⏰ eSIM Recharge Reminder';
  const lines = due.map(({ r, d }) => {
    const when = zh
      ? (d < 0 ? `已过期 ${-d} 天` : d === 0 ? '今天到期' : `还有 ${d} 天到期`)
      : (d < 0 ? `expired ${-d} day(s) ago` : d === 0 ? 'expires today' : `expires in ${d} days`);
    const tail = zh ? '，记得续费' : ' — please renew';
    return `• ${r.name}: ${when} (${r.expiresAt})${tail}`;
  });
  const time = zh ? `\n时间：${nowInTZ(tz)}` : `\nTime: ${nowInTZ(tz)}`;
  return { title, text: lines.join('\n') + time };
}
export function buildTestMessage(lang) {
  return lang === 'en'
    ? { title: '⏰ eSIMinder', text: 'Test message: push channel works.' }
    : { title: '⏰ eSIMinder', text: '测试消息：推送通道正常。' };
}

// ---- fanout with D1 logging: one row per (event, channel) ----
export async function logNotification(env, { esimId, esimName, kind, daysLeft, channel, ok, error, title, text }) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      `INSERT INTO notifications (id, createdAt, esimId, esimName, kind, daysLeft, channel, status, error, title, text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(), Date.now(), esimId || '', esimName || '', kind,
      daysLeft === undefined || daysLeft === null ? 0 : daysLeft,
      channel, ok ? 'ok' : 'fail', error || '', title || '', text || ''
    ).run();
  } catch (e) { /* logging must never break sending */ }
}
export async function fanout(env, channelsCfg, title, text, opts) {
  // opts: { kind, items, only } (legacy test path)
  //    or { kind:'reminder', includeKeys:[...], logCtx:{esimId,esimName,daysLeft} } (cron per-channel path)
  // A single channel failure never stops the others (each send is individually try/caught).
  const { kind, items, only, includeKeys, logCtx } = opts || {};
  const results = [];
  for (const [key, fn] of CHANNELS) {
    if (only && only !== 'all' && only !== key) continue;
    if (includeKeys && !includeKeys.includes(key)) continue;
    const r = await fn(channelsCfg[key] || {}, title, text);
    if (r.skipped) continue;
    const ok = !!r.ok;
    results.push({ channel: CHANNEL_LABELS[key], key, ok, error: r.error || '' });
    if (logCtx) {
      await logNotification(env, {
        esimId: logCtx.esimId, esimName: logCtx.esimName, kind: kind || 'reminder',
        daysLeft: logCtx.daysLeft, channel: key, ok, error: r.error || '', title, text
      });
    } else if (kind === 'reminder' && items && items.length) {
      for (const it of items) {
        await logNotification(env, {
          esimId: it.esimId, esimName: it.esimName, kind, daysLeft: it.daysLeft,
          channel: key, ok, error: r.error || '', title, text
        });
      }
    } else {
      await logNotification(env, {
        esimId: '', esimName: '', kind: kind || 'test', daysLeft: 0,
        channel: key, ok, error: r.error || '', title, text
      });
    }
  }
  return results;
}
