// eSIMinder — overseas eSIM recharge reminder (open source, MIT)
// A Cloudflare Worker that reminds you before your eSIMs expire, so you never lose one.
//
// - Web UI (login required) to manage eSIMs, push channels and settings.
// - ALL secrets (robot keys, API keys, passwords) live in Cloudflare KV, configured
//   in the web UI. NOTHING secret is in this code or the repo.
// - Daily cron checks expiry dates and pushes reminders via configured channels.
//
// Deploy: wrangler kv:namespace create CFG, wrangler secret put ADMIN_TOKEN, wrangler deploy

// ---------------- utils ----------------
function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
}
function timingSafeEqual(a, b) {
    a = String(a || ''); b = String(b || '');
    if (a.length !== b.length || a.length === 0) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}
function beijingNow() {
    return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
}
function beijingDateStr(ts) {
    return new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }); // YYYY-MM-DD
}
function daysUntilStr(dateStr) {
    return Math.round((Date.parse(dateStr) - Date.parse(beijingDateStr(Date.now()))) / 86400000);
}
function validDateStr(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
    return !isNaN(Date.parse(s));
}
function parseThresholds(s) {
    const arr = String(s || '7,3,1,0').split(',')
        .map(x => parseInt(x.trim(), 10)).filter(n => !isNaN(n) && n >= 0);
    return arr.length ? [...new Set(arr)].sort((a, b) => b - a) : [7, 3, 1, 0];
}

// ---------------- KV ----------------
async function kvGet(env, key, type) {
    try { const v = await env.CFG.get(key, type); return v === undefined ? null : v; }
    catch (e) { return null; }
}
async function getEsims(env) { return (await kvGet(env, 'esims', 'json')) || []; }
async function getChannels(env) { return (await kvGet(env, 'channels', 'json')) || {}; }
async function getSettings(env) {
    const s = (await kvGet(env, 'settings', 'json')) || {};
    return { reminderDays: s.reminderDays || '7,3,1,0', notifLang: s.notifLang === 'en' ? 'en' : 'zh' };
}
async function readState(env) {
    try { return (await env.CFG.get('state', 'json')) || {}; } catch (e) { return {}; }
}
async function writeState(env, s) { await env.CFG.put('state', JSON.stringify(s)); }

// ---------------- auth (login session, 7 days) ----------------
function getCookie(req, name) {
    const h = req.headers.get('Cookie') || '';
    const m = h.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
}
async function getSession(req, env) {
    const sid = getCookie(req, 'kb_session');
    if (!sid) return null;
    try {
        const s = await env.CFG.get('sess:' + sid, 'json');
        return s ? { id: sid } : null;
    } catch (e) { return null; }
}
async function getAdminToken(env) {
    try { const s = await env.CFG.get('admin_token'); if (s) return s; } catch (e) {}
    return env.ADMIN_TOKEN || '';
}
async function isAuthed(req, env, body) {
    if (await getSession(req, env)) return true;
    return !!(body && timingSafeEqual(String(body.adminToken || ''), await getAdminToken(env)));
}

// ---------------- push channels ----------------
async function postJSON(url, body, headers = {}) {
    const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
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
        const r = await fetch(`https://api.day.app/${cfg.key}/${encodeURIComponent(title)}/${encodeURIComponent(text)}`);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
}
async function sendServerChan(cfg, title, text) {
    if (!cfg || !cfg.sendKey) return { skipped: true };
    try {
        const r = await fetch(`https://sctapi.ftqq.com/${cfg.sendKey}.send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `title=${encodeURIComponent(title)}&desp=${encodeURIComponent(text)}`
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
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
const CHANNELS = [
    ['telegram', sendTelegram],
    ['wecom', sendWecom],
    ['dingtalk', sendDingtalk],
    ['feishu', sendFeishu],
    ['bark', sendBark],
    ['serverchan', sendServerChan],
    ['email', sendEmail],
];
const CHANNEL_LABELS = {
    telegram: 'Telegram', wecom: 'WeCom', dingtalk: 'DingTalk',
    feishu: 'Feishu', bark: 'Bark', serverchan: 'ServerChan', email: 'Email'
};
async function fanout(env, channelsCfg, title, text, only) {
    const results = [];
    for (const [key, fn] of CHANNELS) {
        if (only && only !== 'all' && only !== key) continue;
        const r = await fn(channelsCfg[key] || {}, title, text);
        if (!r.skipped) results.push({ channel: CHANNEL_LABELS[key], key, ok: !!r.ok, error: r.error || '' });
    }
    return results;
}

// ---------------- reminder message (bilingual) ----------------
function buildReminderMessage(due, lang) {
    const zh = lang !== 'en';
    const title = zh ? '⏰ eSIM 续费提醒' : '⏰ eSIM Recharge Reminder';
    const lines = due.map(({ r, d }) => {
        const when = zh
            ? (d < 0 ? `已过期 ${-d} 天` : d === 0 ? '今天到期' : `还有 ${d} 天到期`)
            : (d < 0 ? `expired ${-d} day(s) ago` : d === 0 ? 'expires today' : `expires in ${d} days`);
        const tail = zh ? '，记得充值' : ' — please recharge';
        return `• ${r.name}: ${when} (${r.expiresAt})${tail}`;
    });
    const time = zh ? `\n时间：${beijingNow()}（北京时间）` : `\nTime: ${beijingNow()} (Beijing)`;
    return { title, text: lines.join('\n') + time };
}
function buildTestMessage(lang) {
    return lang === 'en'
        ? { title: '⏰ eSIMinder', text: 'Test message: push channel works.' }
        : { title: '⏰ eSIMinder', text: '测试消息：推送通道正常。' };
}

// ---------------- daily cron ----------------
async function handleCron(env) {
    const esims = await getEsims(env);
    if (!esims.length) return;
    const settings = await getSettings(env);
    const thresholds = parseThresholds(settings.reminderDays);
    const maxT = Math.max(...thresholds);
    const st = await readState(env);
    const notified = st.remindNotified || {};
    let changed = false;
    const due = [];
    for (const r of esims) {
        const d = daysUntilStr(r.expiresAt);
        const sent = notified[r.id] || [];
        if (d > maxT) {
            if (sent.length) { notified[r.id] = []; changed = true; }
            continue;
        }
        const pending = thresholds.filter(t => d <= t && !sent.includes(t));
        if (!pending.length) continue;
        due.push({ r, d });
        // mark every crossed threshold as notified, so each of 7/3/1/0 fires exactly once
        notified[r.id] = [...new Set([...sent, ...pending])];
        changed = true;
    }
    if (changed) { st.remindNotified = notified; await writeState(env, st); }
    if (!due.length) return;
    const channels = await getChannels(env);
    const { title, text } = buildReminderMessage(due, settings.notifLang);
    await fanout(env, channels, title, text);
}

// ---------------- API ----------------
async function needAuth(req, env) {
    const body = await req.json().catch(() => null);
    if (!(await isAuthed(req, env, body))) return { err: json({ ok: false, error: 'unauthorized' }, 401) };
    return { body: body || {} };
}
async function handleLogin(req, env) {
    const body = await req.json().catch(() => null);
    if (!body || !timingSafeEqual(String(body.adminToken || ''), await getAdminToken(env))) {
        return json({ ok: false, error: 'bad password' }, 401);
    }
    const sid = crypto.randomUUID();
    await env.CFG.put('sess:' + sid, JSON.stringify({ created: Date.now() }), { expirationTtl: 7 * 24 * 3600 });
    return new Response(JSON.stringify({ ok: true }), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Set-Cookie': 'kb_session=' + sid + '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800'
        }
    });
}
async function handleLogout(req, env) {
    const sid = getCookie(req, 'kb_session');
    if (sid) { try { await env.CFG.delete('sess:' + sid); } catch (e) {} }
    return new Response(JSON.stringify({ ok: true }), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Set-Cookie': 'kb_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
        }
    });
}
async function handleAdminPassword(req, env) {
    const { err, body } = await needAuth(req, env);
    if (err) return err;
    const np = String(body.newPassword || '');
    if (np.length < 6) return json({ ok: false, error: 'too short' }, 400);
    if (np.length > 128) return json({ ok: false, error: 'too long' }, 400);
    await env.CFG.put('admin_token', np);
    try {
        let cursor, done = false;
        while (!done) {
            const lst = await env.CFG.list({ prefix: 'sess:', cursor });
            for (const k of lst.keys) { try { await env.CFG.delete(k.name); } catch (e) {} }
            done = lst.list_complete; cursor = lst.cursor;
        }
    } catch (e) {}
    return json({ ok: true });
}
function sanitizeEsim(b) {
    const name = String(b.name || '').trim().slice(0, 60);
    const expiresAt = String(b.expiresAt || '').trim();
    const cycleDays = parseInt(b.cycleDays, 10);
    const note = String(b.note || '').trim().slice(0, 200);
    return { name, expiresAt, cycleDays: !isNaN(cycleDays) && cycleDays > 0 ? cycleDays : 0, note };
}
async function handleEsimAdd(req, env) {
    const { err, body } = await needAuth(req, env);
    if (err) return err;
    const f = sanitizeEsim(body);
    if (!f.name) return json({ ok: false, error: 'name required' }, 400);
    if (!validDateStr(f.expiresAt)) return json({ ok: false, error: 'bad date' }, 400);
    const list = await getEsims(env);
    const item = { id: crypto.randomUUID(), ...f, lastRechargeAt: 0 };
    list.push(item);
    await env.CFG.put('esims', JSON.stringify(list));
    return json({ ok: true, id: item.id });
}
async function handleEsimUpdate(req, env) {
    const { err, body } = await needAuth(req, env);
    if (err) return err;
    const id = String(body.id || '');
    const list = await getEsims(env);
    const it = list.find(x => x.id === id);
    if (!it) return json({ ok: false, error: 'not found' }, 404);
    let dateChanged = false;
    if (body.name !== undefined) {
        const name = String(body.name).trim().slice(0, 60);
        if (!name) return json({ ok: false, error: 'name required' }, 400);
        it.name = name;
    }
    if (body.expiresAt !== undefined) {
        if (!validDateStr(body.expiresAt)) return json({ ok: false, error: 'bad date' }, 400);
        if (it.expiresAt !== body.expiresAt) dateChanged = true;
        it.expiresAt = body.expiresAt;
    }
    if (body.cycleDays !== undefined) {
        const c = parseInt(body.cycleDays, 10);
        it.cycleDays = !isNaN(c) && c > 0 ? c : 0;
    }
    if (body.note !== undefined) it.note = String(body.note).trim().slice(0, 200);
    await env.CFG.put('esims', JSON.stringify(list));
    if (dateChanged) {
        const st = await readState(env);
        const notified = st.remindNotified || {};
        if (notified[id]) { delete notified[id]; st.remindNotified = notified; await writeState(env, st); }
    }
    return json({ ok: true });
}
async function handleEsimDel(req, env) {
    const { err, body } = await needAuth(req, env);
    if (err) return err;
    const id = String(body.id || '');
    const list = (await getEsims(env)).filter(x => x.id !== id);
    await env.CFG.put('esims', JSON.stringify(list));
    return json({ ok: true });
}
async function handleEsimRecharge(req, env) {
    const { err, body } = await needAuth(req, env);
    if (err) return err;
    const id = String(body.id || '');
    const list = await getEsims(env);
    const it = list.find(x => x.id === id);
    if (!it) return json({ ok: false, error: 'not found' }, 404);
    if (!it.cycleDays || it.cycleDays <= 0) return json({ ok: false, error: 'no cycle' }, 400);
    const today = beijingDateStr(Date.now());
    it.expiresAt = new Date(Date.parse(today) + it.cycleDays * 86400000)
        .toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
    it.lastRechargeAt = Date.now();
    await env.CFG.put('esims', JSON.stringify(list));
    const st = await readState(env);
    const notified = st.remindNotified || {};
    if (notified[id]) { delete notified[id]; st.remindNotified = notified; await writeState(env, st); }
    return json({ ok: true, expiresAt: it.expiresAt });
}
async function handleChannels(req, env) {
    const { err, body } = await needAuth(req, env);
    if (err) return err;
    const input = (body && body.channels) || {};
    const clean = {};
    const str = v => String(v || '').trim();
    clean.telegram = { botToken: str(input.telegram && input.telegram.botToken), chatId: str(input.telegram && input.telegram.chatId) };
    clean.wecom = { webhook: str(input.wecom && input.wecom.webhook) };
    clean.dingtalk = { webhook: str(input.dingtalk && input.dingtalk.webhook), secret: str(input.dingtalk && input.dingtalk.secret) };
    clean.feishu = { webhook: str(input.feishu && input.feishu.webhook), secret: str(input.feishu && input.feishu.secret) };
    clean.bark = { key: str(input.bark && input.bark.key) };
    clean.serverchan = { sendKey: str(input.serverchan && input.serverchan.sendKey) };
    clean.email = { apiKey: str(input.email && input.email.apiKey), from: str(input.email && input.email.from), to: str(input.email && input.email.to) };
    await env.CFG.put('channels', JSON.stringify(clean));
    return json({ ok: true });
}
async function handleSettings(req, env) {
    const { err, body } = await needAuth(req, env);
    if (err) return err;
    const reminderDays = String(body.reminderDays || '7,3,1,0');
    parseThresholds(reminderDays); // validates, throws nothing; keep even if odd
    const notifLang = body.notifLang === 'en' ? 'en' : 'zh';
    await env.CFG.put('settings', JSON.stringify({ reminderDays, notifLang }));
    return json({ ok: true });
}
async function handleTest(req, env) {
    const { err, body } = await needAuth(req, env);
    if (err) return err;
    const settings = await getSettings(env);
    const channels = await getChannels(env);
    const { title, text } = buildTestMessage(settings.notifLang);
    const results = await fanout(env, channels, title, text, body.channel || 'all');
    return json({ ok: true, results });
}
async function handleStatus(req, env) {
    const { err } = await needAuth(req, env);
    if (err) return err;
    const esims = await getEsims(env);
    const channels = await getChannels(env);
    const settings = await getSettings(env);
    const st = await readState(env);
    const chStatus = {};
    const has = o => o && Object.values(o).some(v => v);
    for (const [key] of CHANNELS) chStatus[key] = has(channels[key]);
    return json({
        ok: true,
        esims: esims.map(r => ({
            id: r.id, name: r.name, expiresAt: r.expiresAt,
            cycleDays: r.cycleDays || 0, note: r.note || '',
            lastRechargeAt: r.lastRechargeAt || 0,
            daysLeft: daysUntilStr(r.expiresAt)
        })),
        chStatus, settings,
        lastCheckAt: st.lastCheckAt || 0,
        cronNote: 'daily'
    });
}

// ---------------- router ----------------
function htmlPage(s) {
    return new Response(s, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
export default {
    async fetch(req, env) {
        const url = new URL(req.url);
        const p = url.pathname;
        if (p === '/' || p === '/index.html') {
            const sess = await getSession(req, env);
            return htmlPage(sess ? PAGE : LOGIN_PAGE);
        }
        if (p === '/api/login' && req.method === 'POST') return handleLogin(req, env);
        if (p === '/api/logout' && req.method === 'POST') return handleLogout(req, env);
        if (p === '/api/admin-password' && req.method === 'POST') return handleAdminPassword(req, env);
        if (p === '/api/esims/add' && req.method === 'POST') return handleEsimAdd(req, env);
        if (p === '/api/esims/update' && req.method === 'POST') return handleEsimUpdate(req, env);
        if (p === '/api/esims/del' && req.method === 'POST') return handleEsimDel(req, env);
        if (p === '/api/esims/recharge' && req.method === 'POST') return handleEsimRecharge(req, env);
        if (p === '/api/channels' && req.method === 'POST') return handleChannels(req, env);
        if (p === '/api/settings' && req.method === 'POST') return handleSettings(req, env);
        if (p === '/api/test' && req.method === 'POST') return handleTest(req, env);
        if (p === '/api/status' && req.method === 'POST') return handleStatus(req, env);
        return json({ ok: false, error: 'not found' }, 404);
    },
    async scheduled(event, env, ctx) {
        ctx.waitUntil((async () => {
            try {
                await handleCron(env);
                const st = await readState(env);
                st.lastCheckAt = Date.now();
                await writeState(env, st);
            } catch (e) { console.error('cron error:', e && e.message); }
        })());
    }
};

// ---------------- login page (bilingual) ----------------
const LOGIN_PAGE = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>eSIMinder</title>'
    + '<style>'
    + 'body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:#f7f8fa;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}'
    + '.card{background:#fff;border-radius:12px;padding:28px;width:320px;box-shadow:0 2px 12px rgba(0,0,0,.08)}'
    + 'h1{font-size:20px;margin:0 0 6px}.sub{color:#888;font-size:13px;margin-bottom:16px}'
    + 'input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:12px}'
    + 'button{width:100%;background:#1677ff;color:#fff;border:none;border-radius:8px;padding:10px;font-size:14px;cursor:pointer}'
    + '#err{color:#d32f2f;font-size:13px;min-height:20px;margin-top:8px}'
    + '.lang{text-align:right;margin-bottom:8px}.lang a{color:#1677ff;font-size:13px;cursor:pointer;text-decoration:none}'
    + '</style></head><body>'
    + '<div class="card"><div class="lang"><a onclick="toggleLang()" id="langLink">EN</a></div>'
    + '<h1>🔔 eSIMinder</h1>'
    + '<div class="sub" id="loginSub"></div>'
    + '<input id="pw" type="password" autocomplete="off">'
    + '<button onclick="login()" id="loginBtn"></button>'
    + '<div id="err"></div></div>'
    + '<script>'
    + 'var LSTR={zh:{sub:"请输入管理口令登录",ph:"管理口令",btn:"登录",fail:"管理口令错误"},'
    + 'en:{sub:"Enter admin password to log in",ph:"Admin password",btn:"Log in",fail:"Wrong password"}};'
    + 'var LANG=localStorage.getItem("esiminder_lang")||"zh";'
    + 'function applyLang(){document.getElementById("loginSub").textContent=LSTR[LANG].sub;'
    + 'document.getElementById("pw").placeholder=LSTR[LANG].ph;'
    + 'document.getElementById("loginBtn").textContent=LSTR[LANG].btn;'
    + 'document.getElementById("langLink").textContent=LANG==="zh"?"EN":"中文";'
    + 'document.documentElement.lang=LANG==="zh"?"zh-CN":"en";}'
    + 'function toggleLang(){LANG=LANG==="zh"?"en":"zh";localStorage.setItem("esiminder_lang",LANG);applyLang();}'
    + 'async function login(){'
    + 'var pw=document.getElementById("pw").value;'
    + 'var r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({adminToken:pw})});'
    + 'var d=await r.json();'
    + 'if(d.ok){location.reload()}else{document.getElementById("err").textContent="❌ "+LSTR[LANG].fail}}'
    + 'document.getElementById("pw").addEventListener("keydown",function(e){if(e.key==="Enter")login()});'
    + 'applyLang();'
    + '</script></body></html>';
// ---------------- dashboard (bilingual) ----------------
const STR = {
zh: {
  appSub: '海外 eSIM 续费提醒中枢 · 到期前自动推送提醒',
  logout: '退出登录',
  secEsim: '⏰ eSIM 管理',
  esimDesc: '有效期手动填写；到期前按设置的天数提醒。充值后点「已充值」自动顺延，或手动改日期。',
  thInfo: 'eSIM', thOp: '操作',
  namePh: '名称，如 DITO', cyclePh: '周期天数，如 30', notePh: '备注（可选）',
  addBtn: '添加',
  updateBtn: '更新日期', rechargeBtn: '已充值', delBtn: '删除',
  noEsims: '暂无 eSIM，请添加',
  dLeft: '剩余 {n} 天', dToday: '今天到期', dOver: '已过期 {n} 天',
  cycleDays: '周期 {n} 天', noCycle: '未设周期', lastRecharge: '上次充值',
  never: '无',
  secPush: '📲 推送通道',
  pushDesc: '填写要用的通道，密钥只存 Cloudflare KV，不会出现在代码里。留空即不启用。',
  saveBtn: '保存配置', testBtn: '发送测试', testAll: '全部已配置通道',
  configured: '已配置',
  secSettings: '⚙️ 设置',
  remindDaysLabel: '提醒提前天数', remindDaysDesc: '逗号分隔，到期前这些天各提醒一次',
  notifLangLabel: '推送语言', lastCheck: '上次检查',
  neverChecked: '尚未检查',
  secPw: '🔐 管理口令',
  pwDesc: '修改后所有登录失效，需重新登录。默认口令 admin，请尽快修改。',
  newPwPh: '输入新口令（至少 6 位）', changePwBtn: '修改口令',
  ch_telegram: 'Telegram', ch_telegram_hint: '@BotFather 创建机器人拿 Token；@userinfobot 查 Chat ID',
  ch_wecom: '企业微信', ch_wecom_hint: '群聊 → 设置 → 群机器人 → 添加 → 复制 webhook 地址',
  ch_dingtalk: '钉钉', ch_dingtalk_hint: '群设置 → 智能群助手 → 自定义 → 复制 webhook；加签密钥在安全设置里',
  ch_feishu: '飞书', ch_feishu_hint: '群设置 → 群机器人 → 添加自定义机器人 → 复制 webhook；签名密钥可选',
  ch_bark: 'Bark', ch_bark_hint: 'Bark App 里的 key（iPhone 推送）',
  ch_serverchan: 'Server酱', ch_serverchan_hint: 'sct.ftqq.com 获取 SendKey，推送到微信',
  ch_email: '邮件', ch_email_hint: '用 Resend 发信；发件域名需在 Resend 验证',
  f_botToken: 'Bot Token', f_chatId: 'Chat ID', f_webhook: 'Webhook 地址',
  f_signSecret: '加签密钥', f_key: 'Key', f_sendKey: 'SendKey',
  f_apiKey: 'API Key', f_from: '发件人', f_to: '收件人',
  confirmDel: '确定删除吗？', confirmRecharge: '确认已充值？有效期将按周期顺延。',
  msgSaved: '✅ 已保存', msgAdded: '✅ 已添加', msgUpdated: '✅ 已更新',
  msgDeleted: '✅ 已删除', msgRecharged: '✅ 已充值，有效期已顺延',
  msgPwChanged: '✅ 口令已修改，请重新登录', msgNeedCycle: '请先设置周期天数',
  msgFillAll: '请填写名称和有效期', msgNoChannel: '请先配置至少一个推送通道',
  msgPwShort: '新口令至少 6 位'
},
en: {
  appSub: 'Overseas eSIM recharge reminder hub · auto push before expiry',
  logout: 'Log out',
  secEsim: '⏰ eSIM Management',
  esimDesc: 'Enter expiry dates manually; reminders follow your settings. After recharging, click "Recharged" to auto-extend, or edit the date manually.',
  thInfo: 'eSIM', thOp: 'Actions',
  namePh: 'Name, e.g. DITO', cyclePh: 'Cycle days, e.g. 30', notePh: 'Note (optional)',
  addBtn: 'Add',
  updateBtn: 'Update date', rechargeBtn: 'Recharged', delBtn: 'Delete',
  noEsims: 'No eSIMs yet',
  dLeft: '{n} days left', dToday: 'Expires today', dOver: 'Expired {n} days ago',
  cycleDays: 'Cycle: {n}d', noCycle: 'No cycle', lastRecharge: 'Last recharge',
  never: 'Never',
  secPush: '📲 Push Channels',
  pushDesc: 'Fill in the channels you use. Secrets stay in Cloudflare KV, never in code. Empty = disabled.',
  saveBtn: 'Save', testBtn: 'Send test', testAll: 'All configured channels',
  configured: 'configured',
  secSettings: '⚙️ Settings',
  remindDaysLabel: 'Reminder days in advance', remindDaysDesc: 'Comma-separated; one reminder on each of these days before expiry',
  notifLangLabel: 'Notification language', lastCheck: 'Last check',
  neverChecked: 'Not checked yet',
  secPw: '🔐 Admin Password',
  pwDesc: 'All sessions expire after change; log in again. Default is admin, please change it.',
  newPwPh: 'New password (min 6 chars)', changePwBtn: 'Change password',
  ch_telegram: 'Telegram', ch_telegram_hint: 'Create a bot via @BotFather for the token; get Chat ID via @userinfobot',
  ch_wecom: 'WeCom', ch_wecom_hint: 'Group chat → Settings → Group bots → Add → copy webhook URL',
  ch_dingtalk: 'DingTalk', ch_dingtalk_hint: 'Group settings → Smart group assistant → Custom → copy webhook; sign secret in security settings',
  ch_feishu: 'Feishu', ch_feishu_hint: 'Group settings → Group bots → Add custom bot → copy webhook; sign secret optional',
  ch_bark: 'Bark', ch_bark_hint: 'Key from the Bark app (iPhone push)',
  ch_serverchan: 'ServerChan', ch_serverchan_hint: 'Get SendKey at sct.ftqq.com, pushes to WeChat',
  ch_email: 'Email', ch_email_hint: 'Send via Resend; sender domain must be verified in Resend',
  f_botToken: 'Bot Token', f_chatId: 'Chat ID', f_webhook: 'Webhook URL',
  f_signSecret: 'Sign secret', f_key: 'Key', f_sendKey: 'SendKey',
  f_apiKey: 'API Key', f_from: 'From', f_to: 'To',
  confirmDel: 'Delete?', confirmRecharge: 'Confirm recharged? Expiry will extend by cycle.',
  msgSaved: '✅ Saved', msgAdded: '✅ Added', msgUpdated: '✅ Updated',
  msgDeleted: '✅ Deleted', msgRecharged: '✅ Recharged, expiry extended',
  msgPwChanged: '✅ Password changed, please log in again', msgNeedCycle: 'Set cycle days first',
  msgFillAll: 'Fill in name and expiry date', msgNoChannel: 'Configure at least one channel first',
  msgPwShort: 'Min 6 characters'
}
};
const PAGE = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>eSIMinder</title>
<style>
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;max-width:760px;margin:0 auto;padding:20px;color:#333;background:#f7f8fa}
.card{background:#fff;border-radius:12px;padding:18px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
h1{font-size:22px;margin:0}h2{font-size:16px;margin:0 0 10px}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.sub{color:#888;font-size:13px;margin-bottom:16px}
.muted{color:#888;font-size:13px}.bad{color:#d32f2f;font-weight:bold}
label{display:block;font-size:13px;color:#666;margin:10px 0 4px}
input,select{width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:8px}
button{background:#1677ff;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:14px;cursor:pointer;margin:4px 4px 4px 0}
button.ghost{background:#f0f0f0;color:#333}
.row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #eee;font-size:14px;flex-wrap:wrap}
.row:last-child{border-bottom:none}
.frow{display:flex;gap:8px;flex-wrap:wrap}.frow>input,.frow>select{flex:1;min-width:120px;margin-bottom:4px}
.ch{border:1px solid #eee;border-radius:8px;padding:12px;margin-bottom:10px}
.ch h3{margin:0 0 4px;font-size:15px}.ch .st{float:right;font-size:12px;color:#2e7d32}
a.lang{color:#1677ff;font-size:13px;cursor:pointer;text-decoration:none;margin-right:12px}
#msg{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 18px;border-radius:8px;font-size:14px;display:none;z-index:99;max-width:90%}
</style></head><body>
<div class="top"><h1>🔔 eSIMinder</h1>
<div><a class="lang" onclick="toggleLang()" id="langLink">EN</a>
<button class="ghost" style="margin:0" onclick="logout()" data-t="logout"></button></div></div>
<div class="sub" data-t="appSub"></div>
<div class="card"><h2 data-t="secEsim"></h2>
<div class="muted" data-t="esimDesc"></div>
<div id="esimlist" style="margin:8px 0">...</div>
<div class="frow"><input id="esim_name" data-t-ph="namePh">
<input id="esim_date" type="date">
<input id="esim_cycle" type="number" min="1" data-t-ph="cyclePh">
<input id="esim_note" data-t-ph="notePh"></div>
<div><button onclick="addEsim()" data-t="addBtn"></button></div></div>
<div class="card"><h2 data-t="secPush"></h2>
<div class="muted" data-t="pushDesc"></div>
<div id="channels" style="margin-top:8px"></div>
<div><button onclick="saveChannels()" data-t="saveBtn"></button>
<select id="test_ch" style="width:auto"></select>
<button class="ghost" onclick="sendTest()" data-t="testBtn"></button></div></div>
<div class="card"><h2 data-t="secSettings"></h2>
<label data-t="remindDaysLabel"></label>
<input id="set_days" placeholder="7,3,1,0">
<div class="muted" data-t="remindDaysDesc"></div>
<label data-t="notifLangLabel"></label>
<select id="set_notiflang"><option value="zh">中文</option><option value="en">English</option></select>
<div><button onclick="saveSettings()" data-t="saveBtn"></button></div>
<div class="muted"><span data-t="lastCheck"></span>: <span id="lastCheck">-</span></div></div>
<div class="card"><h2 data-t="secPw"></h2>
<div class="muted" data-t="pwDesc"></div>
<input id="new_pw" type="password" data-t-ph="newPwPh" autocomplete="off">
<div><button onclick="changePw()" data-t="changePwBtn"></button></div></div>
<div id="msg"></div>
<script>
var LANG=localStorage.getItem('esiminder_lang')||'zh';
var STR=${JSON.stringify(STR)};
function t(k){return (STR[LANG]&&STR[LANG][k])||STR.zh[k]||k;}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function showMsg(s){var m=document.getElementById('msg');m.textContent=s;m.style.display='block';clearTimeout(m._t);m._t=setTimeout(function(){m.style.display='none';},2500);}
function v(id){return document.getElementById(id).value.trim();}
async function api(path,body){var r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});if(r.status===401){location.reload();return{ok:false};}return r.json();}
function toggleLang(){LANG=LANG==='zh'?'en':'zh';localStorage.setItem('esiminder_lang',LANG);applyLang();}
function applyLang(){
document.querySelectorAll('[data-t]').forEach(function(el){el.textContent=t(el.getAttribute('data-t'));});
document.querySelectorAll('[data-t-ph]').forEach(function(el){el.placeholder=t(el.getAttribute('data-t-ph'));});
document.getElementById('langLink').textContent=LANG==='zh'?'EN':'中文';
document.documentElement.lang=LANG==='zh'?'zh-CN':'en';
if(window._lastStatus)renderAll(window._lastStatus);}
function fmtDate(ts){if(!ts)return t('never');return new Date(ts).toLocaleDateString(LANG==='zh'?'zh-CN':'en-CA',{timeZone:'Asia/Shanghai'});}
function badge(d){if(d<0)return '<span class="bad">'+t('dOver').replace('{n}',-d)+'</span>';if(d===0)return '<span class="bad">'+t('dToday')+'</span>';return t('dLeft').replace('{n}','<b>'+d+'</b>');}
var CH_DEFS=[
{k:'telegram',icon:'✈️',nk:'ch_telegram',hk:'ch_telegram_hint',fields:[['tg_token','password','f_botToken','123456:ABC-DEF...'],['tg_chat','text','f_chatId','123456789']]},
{k:'wecom',icon:'💬',nk:'ch_wecom',hk:'ch_wecom_hint',fields:[['wc_hook','text','f_webhook','https://qyapi.weixin.qq.com/...']]},
{k:'dingtalk',icon:'📌',nk:'ch_dingtalk',hk:'ch_dingtalk_hint',fields:[['dd_hook','text','f_webhook','https://oapi.dingtalk.com/...'],['dd_secret','password','f_signSecret','SEC...']]},
{k:'feishu',icon:'🕊️',nk:'ch_feishu',hk:'ch_feishu_hint',fields:[['fs_hook','text','f_webhook','https://open.feishu.cn/...'],['fs_secret','password','f_signSecret','']]},
{k:'bark',icon:'🍎',nk:'ch_bark',hk:'ch_bark_hint',fields:[['bark_key','text','f_key','xxxxxx']]},
{k:'serverchan',icon:'💌',nk:'ch_serverchan',hk:'ch_serverchan_hint',fields:[['sc_key','password','f_sendKey','SCT...']]},
{k:'email',icon:'📧',nk:'ch_email',hk:'ch_email_hint',fields:[['em_key','password','f_apiKey','re_...'],['em_from','text','f_from','eSIMinder <noreply@example.com>'],['em_to','text','f_to','you@example.com']]}
];
var CH_MAP={telegram:[['botToken','tg_token'],['chatId','tg_chat']],wecom:[['webhook','wc_hook']],dingtalk:[['webhook','dd_hook'],['secret','dd_secret']],feishu:[['webhook','fs_hook'],['secret','fs_secret']],bark:[['key','bark_key']],serverchan:[['sendKey','sc_key']],email:[['apiKey','em_key'],['from','em_from'],['to','em_to']]};
function renderChannels(st){var el=document.getElementById('channels');
el.innerHTML=CH_DEFS.map(function(c){var ok=st.chStatus[c.k];
var fs=c.fields.map(function(f){return '<label>'+t(f[2])+'</label><input id="'+f[0]+'" type="'+f[1]+'" placeholder="'+(ok?t('configured'):(f[3]||''))+'" autocomplete="off">';}).join('');
return '<div class="ch"><h3>'+c.icon+' '+t(c.nk)+(ok?' <span class="st">✓</span>':'')+'</h3><div class="muted">'+t(c.hk)+'</div>'+fs+'</div>';}).join('');
var sel=document.getElementById('test_ch');
sel.innerHTML='<option value="all">'+t('testAll')+'</option>'+CH_DEFS.filter(function(c){return st.chStatus[c.k];}).map(function(c){return '<option value="'+c.k+'">'+t(c.nk)+'</option>';}).join('');}
function collectChannels(){var o={};for(var k in CH_MAP){o[k]={};CH_MAP[k].forEach(function(p){o[k][p[0]]=v(p[1]);});}return o;}
function renderEsims(st){var el=document.getElementById('esimlist');
if(!st.esims.length){el.innerHTML='<div class="muted">'+t('noEsims')+'</div>';return;}
el.innerHTML=st.esims.map(function(r){
var info='<b>'+esc(r.name)+'</b> · '+esc(r.expiresAt)+' · '+badge(r.daysLeft);
info+='<br><span class="muted">'+(r.cycleDays?t('cycleDays').replace('{n}',r.cycleDays):t('noCycle'));
if(r.note)info+=' · '+esc(r.note);
info+=' · '+t('lastRecharge')+':'+fmtDate(r.lastRechargeAt)+'</span>';
return '<div class="row"><span>'+info+'</span><span><input type="date" value="'+esc(r.expiresAt)+'" id="ed_'+r.id+'" style="width:auto;margin:0"> '
+'<button class="ghost" data-id="'+r.id+'" onclick="updateEsim(this)">'+t('updateBtn')+'</button> '
+'<button data-id="'+r.id+'" onclick="rechargeEsim(this)">'+t('rechargeBtn')+'</button> '
+'<button class="ghost" data-id="'+r.id+'" onclick="delEsim(this)">'+t('delBtn')+'</button></span></div>';}).join('');}
function renderAll(st){window._lastStatus=st;renderEsims(st);renderChannels(st);
document.getElementById('set_days').value=st.settings.reminderDays||'7,3,1,0';
document.getElementById('set_notiflang').value=st.settings.notifLang||'zh';
document.getElementById('lastCheck').textContent=st.lastCheckAt?fmtDate(st.lastCheckAt)+' '+new Date(st.lastCheckAt).toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):t('neverChecked');}
async function refresh(){var d=await api('/api/status',{});if(d.ok)renderAll(d);}
async function addEsim(){var n=v('esim_name'),dt=v('esim_date'),cy=parseInt(v('esim_cycle'),10),nt=v('esim_note');
if(!n||!dt){showMsg(t('msgFillAll'));return;}
var d=await api('/api/esims/add',{name:n,expiresAt:dt,cycleDays:cy||0,note:nt});
if(d.ok){['esim_name','esim_date','esim_cycle','esim_note'].forEach(function(id){document.getElementById(id).value='';});refresh();showMsg(t('msgAdded'));}else showMsg('❌ '+(d.error||'error'));}
async function updateEsim(el){var id=el.getAttribute('data-id');var dt=document.getElementById('ed_'+id).value;
if(!dt){showMsg(t('msgFillAll'));return;}
var d=await api('/api/esims/update',{id:id,expiresAt:dt});
if(d.ok){refresh();showMsg(t('msgUpdated'));}else showMsg('❌ '+(d.error||'error'));}
async function rechargeEsim(el){var id=el.getAttribute('data-id');if(!confirm(t('confirmRecharge')))return;
var d=await api('/api/esims/recharge',{id:id});
if(d.ok){refresh();showMsg(t('msgRecharged'));}else showMsg('❌ '+(d.error||t('msgNeedCycle')));}
async function delEsim(el){if(!confirm(t('confirmDel')))return;
var d=await api('/api/esims/del',{id:el.getAttribute('data-id')});
if(d.ok){refresh();showMsg(t('msgDeleted'));}else showMsg('❌ error');}
async function saveChannels(){var d=await api('/api/channels',{channels:collectChannels()});
if(d.ok){refresh();showMsg(t('msgSaved'));}else showMsg('❌ error');}
async function sendTest(){showMsg('…');var d=await api('/api/test',{channel:document.getElementById('test_ch').value});
if(!d.ok){showMsg('❌ error');return;}if(!d.results.length){showMsg(t('msgNoChannel'));return;}
showMsg(d.results.map(function(r){return (r.ok?'✅ ':'❌ ')+r.channel+(r.error?': '+r.error:'');}).join(' | '));}
async function saveSettings(){var d=await api('/api/settings',{reminderDays:v('set_days'),notifLang:document.getElementById('set_notiflang').value});
if(d.ok){refresh();showMsg(t('msgSaved'));}else showMsg('❌ error');}
async function changePw(){var np=document.getElementById('new_pw').value;
if(np.length<6){showMsg(t('msgPwShort'));return;}if(!confirm(t('changePwBtn')+'?'))return;
var d=await api('/api/admin-password',{newPassword:np});
if(d.ok){showMsg(t('msgPwChanged'));setTimeout(function(){location.reload();},1200);}else showMsg('❌ error');}
async function logout(){await api('/api/logout',{});location.reload();}
applyLang();refresh();
</script></body></html>`;
