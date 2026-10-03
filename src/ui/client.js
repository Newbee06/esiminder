export const CLIENT_JS = `
'use strict';
/* eSIMinder V2 SPA — iOS style. No template literals/backticks used in this file by design. */
var STR = window.__STR__;
var LANG = localStorage.getItem('esiminder_lang') || 'zh';
var THEME = localStorage.getItem('esiminder_theme') || ((window.__BOOT__ && window.__BOOT__.theme) || 'system');
var S = { settings: null, dash: null };
function t(k){ return (STR[LANG] && STR[LANG][k]) || (STR.zh && STR.zh[k]) || k; }
function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function applyTheme(){
  var th = THEME === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : THEME;
  document.documentElement.setAttribute('data-theme', th);
}
if (window.matchMedia) {
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme); } catch (e) {}
}
var CSS = ':root{--sat:env(safe-area-inset-top);--sab:env(safe-area-inset-bottom);}'
+ '[data-theme="light"]{--bg:#f2f2f7;--card:#ffffff;--card2:#f2f2f7;--text:#1c1c1e;--text2:#8e8e93;--border:#e9e9ee;--accent:#007aff;--accent-tap:#0062cc;--green:#34c759;--yellow:#ff9500;--red:#ff3b30;--tabbar:rgba(255,255,255,.86);--shadow:0 2px 16px rgba(0,0,0,.06);--input:#f2f2f7;}'
+ '[data-theme="dark"]{--bg:#000000;--card:#1c1c1e;--card2:#2c2c2e;--text:#f2f2f7;--text2:#98989f;--border:#2e2e32;--accent:#0a84ff;--accent-tap:#0066d6;--green:#30d158;--yellow:#ff9f0a;--red:#ff453a;--tabbar:rgba(24,24,26,.86);--shadow:0 2px 16px rgba(0,0,0,.4);--input:#2c2c2e;}'
+ '*{box-sizing:border-box;}'
+ 'html,body{margin:0;padding:0;}'
+ 'body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text);-webkit-tap-highlight-color:transparent;min-height:100vh;transition:background .25s,color .25s;}'
+ '#app{min-height:100vh;}'
+ '.page{max-width:720px;margin:0 auto;padding:calc(12px + var(--sat)) 16px calc(96px + var(--sab));animation:fadeIn .22s ease;}'
+ '@keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}'
+ '.pagetitle{font-size:30px;font-weight:800;letter-spacing:-.5px;margin:10px 2px 2px;}'
+ '.pagesub{color:var(--text2);font-size:14px;margin:0 2px 16px;}'
+ '.card{background:var(--card);border-radius:18px;padding:16px;margin-bottom:12px;box-shadow:var(--shadow);border:1px solid var(--border);}'
+ '.rowline{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--border);font-size:15px;}'
+ '.rowline:last-child{border-bottom:none;}'
+ '.lbl{color:var(--text2);font-size:14px;}'
+ '.val{font-weight:500;text-align:right;}'
+ 'a{color:var(--accent);text-decoration:none;}'
+ '.btn{display:inline-block;background:var(--accent);color:#fff;border:none;border-radius:12px;padding:11px 18px;font-size:15px;font-weight:600;cursor:pointer;transition:transform .08s,background .15s;text-align:center;}'
+ '.btn:active{transform:scale(.97);background:var(--accent-tap);}'
+ '.btn.block{display:block;width:100%;}'
+ '.btn.ghost{background:var(--card2);color:var(--text);}'
+ '.btn.danger{background:var(--red);}'
+ '.btn.sm{padding:8px 14px;font-size:14px;border-radius:10px;}'
+ '.btnrow{display:flex;gap:10px;margin-top:14px;}'
+ '.btnrow .btn{flex:1;}'
+ 'input[type=text],input[type=password],input[type=date],input[type=number],select,textarea{width:100%;background:var(--input);border:1px solid transparent;border-radius:12px;padding:12px 13px;font-size:15px;color:var(--text);outline:none;margin-bottom:2px;font-family:inherit;}'
+ 'input:focus,select:focus,textarea:focus{border-color:var(--accent);background:var(--card);}'
+ 'textarea{resize:vertical;min-height:70px;}'
+ 'label.f{display:block;font-size:13px;color:var(--text2);margin:14px 0 6px;font-weight:500;}'
+ 'label.f .req{color:var(--red);}'
+ '.fsec{font-size:13px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.6px;margin:22px 2px 8px;}'
+ '.pill{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:600;padding:5px 11px;border-radius:999px;white-space:nowrap;}'
+ '.pill.st-active{background:rgba(52,199,89,.14);color:var(--green);}'
+ '.pill.st-expiring{background:rgba(255,149,0,.15);color:var(--yellow);}'
+ '.pill.st-expired{background:rgba(255,59,48,.13);color:var(--red);}'
+ '.pill.st-inactive{background:rgba(142,142,147,.16);color:var(--text2);}'
+ '.pill.st-disabled{background:rgba(142,142,147,.16);color:var(--text2);}'
+ '.tagpill{display:inline-block;background:var(--card2);color:var(--text2);font-size:12.5px;padding:6px 12px;border-radius:999px;margin:0 6px 6px 0;cursor:pointer;border:1px solid transparent;}'
+ '.tagpill.on{background:var(--accent);color:#fff;}'
+ '.ecard{display:block;background:var(--card);border-radius:18px;padding:16px;margin-bottom:12px;box-shadow:var(--shadow);border:1px solid var(--border);color:var(--text);transition:transform .1s;}'
+ '.ecard:active{transform:scale(.985);}'
+ '.ecard .top{display:flex;align-items:center;gap:12px;}'
+ '.ecard .flag{font-size:34px;line-height:1;}'
+ '.ecard .nm{font-size:17px;font-weight:700;}'
+ '.ecard .car{font-size:13px;color:var(--text2);margin-top:2px;}'
+ '.ecard .meta{display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:13.5px;color:var(--text2);}'
+ '.ecard .days{font-weight:700;font-size:14px;}'
+ '.ecard .days.warn{color:var(--yellow);}.ecard .days.bad{color:var(--red);}'
+ '.ecard .tags{margin-top:10px;}'
+ '.statgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;}'
+ '.stat{background:var(--card);border-radius:16px;padding:14px 6px;text-align:center;box-shadow:var(--shadow);border:1px solid var(--border);cursor:pointer;transition:transform .1s;}'
+ '.stat:active{transform:scale(.95);}'
+ '.stat .n{font-size:22px;font-weight:800;}'
+ '.stat .l{font-size:11.5px;color:var(--text2);margin-top:4px;}'
+ '.sech{display:flex;justify-content:space-between;align-items:baseline;margin:20px 2px 10px;}'
+ '.sech h2{font-size:19px;font-weight:700;margin:0;}'
+ '.sech a{font-size:14px;}'
+ '.tabbar{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;background:var(--tabbar);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border-top:1px solid var(--border);padding-bottom:var(--sab);}'
+ '.tabbar a{flex:1;text-align:center;padding:9px 0 8px;color:var(--text2);font-size:10.5px;font-weight:500;display:flex;flex-direction:column;gap:3px;align-items:center;}'
+ '.tabbar a .ic{font-size:21px;}'
+ '.tabbar a.on{color:var(--accent);}'
+ '.sidebar{display:none;}'
+ '@media(min-width:900px){'
+ '.tabbar{display:none;}'
+ '.appwrap{display:flex;max-width:1100px;margin:0 auto;}'
+ '.sidebar{display:flex;flex-direction:column;width:230px;flex-shrink:0;position:sticky;top:0;height:100vh;padding:calc(20px + var(--sat)) 14px 20px;border-right:1px solid var(--border);}'
+ '.sidebar .logo{font-size:20px;font-weight:800;padding:6px 12px 18px;}'
+ '.sidebar a{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:12px;color:var(--text2);font-size:15px;font-weight:500;margin-bottom:4px;}'
+ '.sidebar a .ic{font-size:19px;}'
+ '.sidebar a.on{background:var(--card2);color:var(--text);font-weight:700;}'
+ '.page{margin:0;max-width:760px;padding-bottom:40px;}'
+ '}'
+ '.fab{position:fixed;right:18px;bottom:calc(86px + var(--sab));width:56px;height:56px;border-radius:50%;background:var(--accent);color:#fff;font-size:28px;border:none;box-shadow:0 6px 20px rgba(0,122,255,.4);cursor:pointer;z-index:40;transition:transform .1s;}'
+ '.fab:active{transform:scale(.92);}'
+ '@media(min-width:900px){.fab{bottom:30px;}}'
+ '.chips{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px;margin-bottom:6px;-webkit-overflow-scrolling:touch;}'
+ '.chip{flex-shrink:0;font-size:13.5px;font-weight:500;padding:8px 15px;border-radius:999px;background:var(--card);color:var(--text2);border:1px solid var(--border);cursor:pointer;}'
+ '.chip.on{background:var(--text);color:var(--bg);border-color:var(--text);}'
+ '.searchbar{position:relative;margin-bottom:10px;}'
+ '.searchbar input{padding-left:38px;border-radius:14px;}'
+ '.searchbar .sic{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--text2);font-size:16px;}'
+ '#modal-root{position:fixed;inset:0;z-index:100;pointer-events:none;}'
+ '.mback{position:absolute;inset:0;background:rgba(0,0,0,.4);opacity:0;transition:opacity .2s;pointer-events:auto;}'
+ '.msheet{position:absolute;left:0;right:0;bottom:0;background:var(--card);border-radius:22px 22px 0 0;padding:20px 20px calc(20px + var(--sab));transform:translateY(100%);transition:transform .25s cubic-bezier(.32,.72,.35,1);pointer-events:auto;max-height:86vh;overflow-y:auto;}'
+ '#modal-root.open .mback{opacity:1;}'
+ '#modal-root.open .msheet{transform:none;}'
+ '.msheet h3{margin:0 0 6px;font-size:18px;font-weight:700;}'
+ '@media(min-width:900px){.msheet{left:50%;right:auto;bottom:auto;top:50%;width:440px;transform:translate(-50%,-40%);border-radius:22px;opacity:0;}#modal-root.open .msheet{transform:translate(-50%,-50%);opacity:1;}}'
+ '#toast-root{position:fixed;left:0;right:0;bottom:calc(100px + var(--sab));display:flex;flex-direction:column;align-items:center;z-index:200;pointer-events:none;}'
+ '.toast{background:rgba(28,28,30,.92);color:#fff;font-size:14px;font-weight:500;padding:11px 20px;border-radius:999px;margin-top:8px;animation:toastIn .25s ease;box-shadow:0 4px 16px rgba(0,0,0,.2);max-width:88%;}'
+ '[data-theme="dark"] .toast{background:rgba(242,242,247,.94);color:#1c1c1e;}'
+ '@keyframes toastIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}'
+ '.skel{border-radius:14px;background:linear-gradient(90deg,var(--card2) 25%,var(--border) 50%,var(--card2) 75%);background-size:200% 100%;animation:sk 1.2s infinite;}'
+ '@keyframes sk{from{background-position:200% 0;}to{background-position:-200% 0;}}'
+ '.empty{text-align:center;color:var(--text2);padding:44px 20px;font-size:14.5px;}'
+ '.empty .big{font-size:44px;margin-bottom:10px;}'
+ '.notif{display:flex;gap:12px;background:var(--card);border-radius:16px;padding:14px;margin-bottom:10px;border:1px solid var(--border);}'
+ '.notif .nic{font-size:26px;}'
+ '.notif .nb{flex:1;min-width:0;}'
+ '.notif .nt{font-size:14.5px;font-weight:600;}'
+ '.notif .nm{font-size:13px;color:var(--text2);margin-top:3px;line-height:1.5;word-break:break-word;}'
+ '.notif .nmeta{font-size:12px;color:var(--text2);margin-top:6px;}'
+ '.okic{color:var(--green);font-weight:700;}.failic{color:var(--red);font-weight:700;}'
+ '.dayhead{font-size:13px;font-weight:700;color:var(--text2);margin:16px 2px 8px;}'
+ '.seg{display:flex;background:var(--card2);border-radius:12px;padding:3px;gap:2px;}'
+ '.seg button{flex:1;border:none;background:transparent;color:var(--text2);font-size:14px;font-weight:500;padding:9px 0;border-radius:9px;cursor:pointer;}'
+ '.seg button.on{background:var(--card);color:var(--text);font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.12);}'
+ '.ch{border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:10px;background:var(--card);}'
+ '.ch h4{margin:0 0 4px;font-size:15px;font-weight:700;}'
+ '.ch .st{float:right;font-size:12px;color:var(--green);font-weight:600;}'
+ '.hdr{position:sticky;top:0;z-index:30;background:var(--bg);padding-top:calc(8px + var(--sat));}'
+ '.backbtn{display:inline-flex;align-items:center;gap:4px;color:var(--accent);font-size:16px;background:none;border:none;padding:8px 0;cursor:pointer;}'
+ '.detailhead{display:flex;gap:14px;align-items:center;margin:6px 0 16px;}'
+ '.detailhead .flag{font-size:52px;}'
+ '.detailhead .nm{font-size:23px;font-weight:800;}'
+ '.detailhead .car{color:var(--text2);font-size:14px;margin-top:3px;}'
+ '.kbd{font-size:12px;color:var(--text2);}';
/* inject styles: the shell carries no <style> tag, so the SPA must add its own */
try {
  var _styleEl = document.createElement('style');
  _styleEl.textContent = CSS;
  document.head.appendChild(_styleEl);
} catch (_e) {}
/* ---------- utils ---------- */
async function api(method, path, body){
  var r = await fetch(path, { method: method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 401) { location.href = '/'; return { ok: false }; }
  var d = await r.json().catch(function(){ return { ok: false }; });
  if (r.status === 403 && d.error === 'must_change_password') { showMustChange(); return { ok: false, mustChange: true }; }
  return d;
}
function fmtDate(ts){
  if (!ts) return '—';
  try { return new Date(ts).toLocaleDateString(LANG === 'zh' ? 'zh-CN' : 'en-US', { timeZone: 'Asia/Shanghai' }); } catch (e) { return ''; }
}
function fmtTime(ts){
  try { return new Date(ts).toLocaleTimeString(LANG === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); } catch (e) { return ''; }
}
function fmtDay(ts){
  var d = new Date(ts);
  var today = new Date(); today.setHours(0,0,0,0);
  var that = new Date(d); that.setHours(0,0,0,0);
  var diff = Math.round((today - that) / 86400000);
  if (diff === 0) return LANG === 'zh' ? '今天' : 'Today';
  if (diff === 1) return LANG === 'zh' ? '昨天' : 'Yesterday';
  try { return d.toLocaleDateString(LANG === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric' }); } catch (e) { return ''; }
}
function greeting(){
  var h = new Date().getHours();
  if (h < 5) return t('greetNight');
  if (h < 11) return t('greetMorning');
  if (h < 14) return t('greetNoon');
  if (h < 18) return t('greetAfternoon');
  return t('greetEvening');
}
/* ---------- country flags ---------- */
var FLAGS = {
  '美国': '🇺🇸', '美利坚': '🇺🇸', 'usa': '🇺🇸', 'united states': '🇺🇸', 'america': '🇺🇸',
  '中国': '🇨🇳', 'china': '🇨🇳', '香港': '🇭🇰', 'hong kong': '🇭🇰', '台湾': '🇹🇼', 'taiwan': '🇹🇼', '澳门': '🇲🇴', 'macau': '🇲🇴',
  '日本': '🇯🇵', 'japan': '🇯🇵', '韩国': '🇰🇷', 'korea': '🇰🇷',
  '英国': '🇬🇧', 'uk': '🇬🇧', 'england': '🇬🇧', '法国': '🇫🇷', 'france': '🇫🇷', '德国': '🇩🇪', 'germany': '🇩🇪',
  '意大利': '🇮🇹', 'italy': '🇮🇹', '西班牙': '🇪🇸', 'spain': '🇪🇸', '荷兰': '🇳🇱', 'netherlands': '🇳🇱', 'dutch': '🇳🇱',
  '加拿大': '🇨🇦', 'canada': '🇨🇦', '澳大利亚': '🇦🇺', 'australia': '🇦🇺', '澳洲': '🇦🇺',
  '新加坡': '🇸🇬', 'singapore': '🇸🇬', '泰国': '🇹🇭', 'thailand': '🇹🇭', '马来西亚': '🇲🇾', 'malaysia': '🇲🇾',
  '菲律宾': '🇵🇭', 'philippines': '🇵🇭', '越南': '🇻🇳', 'vietnam': '🇻🇳', '印尼': '🇮🇩', 'indonesia': '🇮🇩',
  '印度': '🇮🇳', 'india': '🇮🇳', '阿联酋': '🇦🇪', 'uae': '🇦🇪', 'dubai': '🇦🇪', '迪拜': '🇦🇪',
  '土耳其': '🇹🇷', 'turkey': '🇹🇷', '俄罗斯': '🇷🇺', 'russia': '🇷🇺', '巴西': '🇧🇷', 'brazil': '🇧🇷',
  '墨西哥': '🇲🇽', 'mexico': '🇲🇽', '新西兰': '🇳🇿', 'new zealand': '🇳🇿', '瑞士': '🇨🇭', 'switzerland': '🇨🇭',
  '瑞典': '🇸🇪', 'sweden': '🇸🇪', '挪威': '🇳🇴', 'norway': '🇳🇴', '芬兰': '🇫🇮', 'finland': '🇫🇮',
  '爱尔兰': '🇮🇪', 'ireland': '🇮🇪', '葡萄牙': '🇵🇹', 'portugal': '🇵🇹', '希腊': '🇬🇷', 'greece': '🇬🇷',
  '埃及': '🇪🇬', 'egypt': '🇪🇬', '南非': '🇿🇦', 'south africa': '🇿🇦', '以色列': '🇮🇱', 'israel': '🇮🇱',
  '沙特': '🇸🇦', 'saudi': '🇸🇦', '卡塔尔': '🇶🇦', 'qatar': '🇶🇦'
};
function flagFor(country){
  var c = String(country || '').trim().toLowerCase();
  if (!c) return '📱';
  for (var k in FLAGS) { if (c.indexOf(k) >= 0) return FLAGS[k]; }
  return '🌐';
}
/* ---------- router ---------- */
function parseHash(){
  var h = (location.hash || '#/').slice(1);
  var qi = h.indexOf('?');
  var path = qi >= 0 ? h.slice(0, qi) : h;
  var query = {};
  if (qi >= 0) {
    h.slice(qi + 1).split('&').forEach(function(p){
      var kv = p.split('='); if (kv[0]) query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
    });
  }
  return { seg: path.split('/').filter(function(x){ return x; }), query: query };
}
function nav(h){ if (location.hash === h) render(); else location.hash = h; }
window.addEventListener('hashchange', render);
/* ---------- layout ---------- */
var NAVS = [
  { k: 'home', ic: '🏠', label: 'navHome', hash: '#/' },
  { k: 'esims', ic: '📱', label: 'navEsims', hash: '#/esims' },
  { k: 'notifs', ic: '🔔', label: 'navNotifs', hash: '#/notifications' },
  { k: 'settings', ic: '⚙️', label: 'navSettings', hash: '#/settings' }
];
function layout(content, active){
  var tabs = NAVS.map(function(n){
    return '<a href="' + n.hash + '" class="' + (active === n.k ? 'on' : '') + '"><span class="ic">' + n.ic + '</span><span>' + t(n.label) + '</span></a>';
  }).join('');
  var side = NAVS.map(function(n){
    return '<a href="' + n.hash + '" class="' + (active === n.k ? 'on' : '') + '"><span class="ic">' + n.ic + '</span><span>' + t(n.label) + '</span></a>';
  }).join('');
  return '<div class="appwrap"><div class="sidebar"><div class="logo">📱 eSIMinder</div>' + side + '</div>'
    + '<div class="page" style="flex:1">' + content + '</div></div>'
    + '<div class="tabbar">' + tabs + '</div>';
}
function setView(html){ document.getElementById('app').innerHTML = html; window.scrollTo(0, 0); }
function skeleton(n){
  var h = '';
  for (var i = 0; i < (n || 3); i++) h += '<div class="skel" style="height:96px;margin-bottom:12px;"></div>';
  return h;
}
/* ---------- shared components ---------- */
var ST_ICON = { active: '🟢', expiring: '🟡', expired: '🔴', inactive: '⚪', disabled: '⚫' };
function statusPill(ds){
  return '<span class="pill st-' + ds + '">' + (ST_ICON[ds] || '') + ' ' + t('st_' + ds) + '</span>';
}
function daysBadge(e){
  if (e.daysLeft === null || e.daysLeft === undefined) return '<span class="lbl">' + t('noExpiry') + '</span>';
  if (e.daysLeft < 0) return '<span class="days bad">' + t('dOver').replace('{n}', -e.daysLeft) + '</span>';
  if (e.daysLeft === 0) return '<span class="days bad">' + t('dToday') + '</span>';
  var cls = e.displayStatus === 'expiring' ? 'warn' : '';
  return '<span class="days ' + cls + '">' + t('dLeft').replace('{n}', '<b>' + e.daysLeft + '</b>') + '</span>';
}
function tagPills(tags){
  return (tags || []).map(function(x){ return '<span class="tagpill" style="cursor:default">' + esc(x) + '</span>'; }).join('');
}
function esimCard(e){
  var sub = [e.carrier, e.country].filter(function(x){ return x; }).join(' · ');
  return '<a class="ecard" href="#/esim/' + e.id + '">'
    + '<div class="top"><span class="flag">' + flagFor(e.country) + '</span>'
    + '<div style="flex:1;min-width:0"><div class="nm">' + esc(e.name) + '</div>'
    + (sub ? '<div class="car">' + esc(sub) + '</div>' : '') + '</div>'
    + statusPill(e.displayStatus) + '</div>'
    + '<div class="meta"><span>' + t('expiresOn') + ' ' + esc(e.expiresAt || '—') + '</span>' + daysBadge(e) + '</div>'
    + (e.tags && e.tags.length ? '<div class="tags">' + tagPills(e.tags) + '</div>' : '')
    + '</a>';
}
function emptyState(big, text){
  return '<div class="empty"><div class="big">' + big + '</div><div>' + text + '</div></div>';
}
/* ---------- modal & toast ---------- */
function modalOpen(html){
  var r = document.getElementById('modal-root');
  r.innerHTML = '<div class="mback" onclick="modalClose()"></div><div class="msheet">' + html + '</div>';
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ r.classList.add('open'); }); });
}
function modalClose(){
  var r = document.getElementById('modal-root');
  r.classList.remove('open');
  setTimeout(function(){ r.innerHTML = ''; }, 260);
}
function toast(msg){
  var r = document.getElementById('toast-root');
  var el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  r.appendChild(el);
  setTimeout(function(){ el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(function(){ el.remove(); }, 320); }, 2200);
}
function confirmModal(title, bodyHtml, okText, onOk){
  window._confirmOk = onOk;
  modalOpen('<h3>' + esc(title) + '</h3><div style="color:var(--text2);font-size:14px;margin:8px 0 4px;">' + bodyHtml + '</div>'
    + '<div class="btnrow"><button class="btn ghost" onclick="modalClose()">' + t('cancel') + '</button>'
    + '<button class="btn" onclick="window._confirmOk();modalClose();">' + esc(okText) + '</button></div>');
}
function showMustChange(){
  modalOpen('<h3>🔐 ' + t('mustChangePw') + '</h3>'
    + '<label class="f">' + t('newPwPh') + '</label><input type="password" id="mc_pw1" autocomplete="new-password">'
    + '<input type="password" id="mc_pw2" autocomplete="new-password" style="margin-top:8px">'
    + '<div class="btnrow"><button class="btn" onclick="doMustChange()">' + t('changePwBtn') + '</button></div>');
}
async function doMustChange(){
  var a = document.getElementById('mc_pw1').value, b = document.getElementById('mc_pw2').value;
  if (a.length < 6) { toast(t('pwShort')); return; }
  if (a !== b) { toast(t('loginFail')); return; }
  var d = await api('POST', '/api/admin-password', { newPassword: a });
  if (d.ok) { toast(t('pwChanged')); setTimeout(function(){ location.reload(); }, 900); }
  else toast('❌ ' + (d.error || 'error'));
}
/* ---------- dashboard ---------- */
async function renderDashboard(){
  setView(layout('<div class="pagetitle">' + greeting() + ' 👋</div><div class="pagesub">' + t('appSub') + '</div>' + skeleton(4), 'home'));
  var d = await api('GET', '/api/dashboard');
  if (!d.ok) return;
  S.dash = d;
  var h = '<div class="pagetitle">' + greeting() + ' 👋</div><div class="pagesub">' + t('myEsims') + '</div>';
  var st = d.stats;
  h += '<div class="statgrid">'
    + statCard(st.all, 'statAll', '')
    + statCard(st.active, 'statActive', 'active')
    + statCard(st.expiring + st.expired, 'statExpiring', 'expiring')
    + statCard(st.inactive, 'statInactive', 'inactive')
    + '</div>';
  h += '<div class="sech"><h2>' + t('secExpiring') + '</h2></div>';
  if (d.attention.length) {
    h += d.attention.map(function(e){ return esimCard(e); }).join('');
  } else {
    h += '<div class="card" style="text-align:center;color:var(--text2);font-size:14px;">' + t('emptyExpiring') + '</div>';
  }
  h += '<div class="sech"><h2>' + t('secAllEsims') + '</h2><a href="#/esims">' + t('viewAll') + ' →</a></div>';
  h += d.esims.length ? d.esims.slice(0, 6).map(esimCard).join('') : emptyState('📱', t('emptyEsims'));
  h += '<button class="fab" onclick="nav(\\'#/esim/new\\')">＋</button>';
  setView(layout(h, 'home'));
}
function statCard(n, label, status){
  var href = status ? '#/esims?status=' + status : '#/esims';
  return '<a class="stat" href="' + href + '"><div class="n">' + n + '</div><div class="l">' + t(label) + '</div></a>';
}
/* ---------- esim list ---------- */
var LIST_FILTERS = [
  { k: '', label: 'filterAll' }, { k: 'active', label: 'st_active' }, { k: 'expiring', label: 'st_expiring' },
  { k: 'expired', label: 'st_expired' }, { k: 'inactive', label: 'st_inactive' }, { k: 'disabled', label: 'st_disabled' }
];
async function renderEsimList(){
  var q0 = parseHash().query;
  setView(layout('<div class="pagetitle">' + t('navEsims') + '</div>' + skeleton(4), 'esims'));
  var d = await api('GET', '/api/esims');
  if (!d.ok) return;
  var tags = await api('GET', '/api/tags');
  S.tags = tags.ok ? tags.tags : [];
  paintEsimList(d.items, q0);
}
function paintEsimList(items, q0){
  var q = q0.q || '', status = q0.status || '', tag = q0.tag || '';
  var h = '<div class="pagetitle">' + t('navEsims') + '</div>';
  h += '<div class="searchbar"><span class="sic">🔍</span><input type="text" id="q" placeholder="' + t('searchPh') + '" value="' + esc(q) + '"></div>';
  h += '<div class="chips">' + LIST_FILTERS.map(function(f){
    return '<button class="chip ' + (status === f.k ? 'on' : '') + '" data-f="' + f.k + '">' + t(f.label) + '</button>';
  }).join('') + '</div>';
  if (S.tags.length) {
    h += '<div style="margin-bottom:4px;">'
      + '<span class="tagpill ' + (!tag ? 'on' : '') + '" data-tag="">' + t('allTags') + '</span>'
      + S.tags.map(function(x){
        return '<span class="tagpill ' + (tag === x.tag ? 'on' : '') + '" data-tag="' + esc(x.tag) + '">' + esc(x.tag) + ' · ' + x.count + '</span>';
      }).join('') + '</div>';
  }
  var list = items.filter(function(e){
    if (q && (e.name + ' ' + e.country + ' ' + e.region + ' ' + e.carrier + ' ' + e.phone + ' ' + e.tags.join(' ')).toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
    if (status && !(status === 'expiring' ? (e.displayStatus === 'expiring' || e.displayStatus === 'expired') : e.displayStatus === status)) return false;
    if (tag && e.tags.indexOf(tag) < 0) return false;
    return true;
  });
  h += '<div id="elist">' + (list.length ? list.map(esimCard).join('') : emptyState('🔍', t('emptyEsims'))) + '</div>';
  h += '<button class="fab" onclick="nav(\\'#/esim/new\\')">＋</button>';
  setView(layout(h, 'esims'));
  var qi = document.getElementById('q');
  var deb;
  qi.addEventListener('input', function(){
    clearTimeout(deb);
    deb = setTimeout(function(){ paintEsimList(items, { q: qi.value, status: status, tag: tag }); }, 280);
  });
  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function(c){
    c.addEventListener('click', function(){ paintEsimList(items, { q: qi.value, status: c.getAttribute('data-f'), tag: tag }); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.tagpill[data-tag]'), function(p){
    p.addEventListener('click', function(){ paintEsimList(items, { q: qi.value, status: status, tag: p.getAttribute('data-tag') }); });
  });
}
/* ---------- esim detail ---------- */
async function renderEsimDetail(id){
  setView(layout('<div class="pagetitle">' + t('detailTitle') + '</div>' + skeleton(4), 'esims'));
  var d = await api('GET', '/api/esims/' + encodeURIComponent(id));
  if (!d.ok) { nav('#/esims'); return; }
  var e = d.esim;
  var h = '<button class="backbtn" onclick="nav(\\'#/esims\\')">‹ ' + t('back') + '</button>';
  h += '<div class="detailhead"><span class="flag">' + flagFor(e.country) + '</span><div>'
    + '<div class="nm">' + esc(e.name) + '</div>'
    + '<div class="car">' + esc([e.carrier, e.country, e.region].filter(function(x){ return x; }).join(' · ')) + '</div>'
    + '</div><span style="margin-left:auto">' + statusPill(e.displayStatus) + '</span></div>';
  h += '<div class="card">'
    + rowline(t('detailPhone'), e.phone ? esc(e.phone) : '—')
    + rowline(t('detailActivated'), e.activatedAt ? esc(e.activatedAt) : '—')
    + rowline(t('detailExpires'), e.expiresAt ? esc(e.expiresAt) : '—')
    + rowline(t('detailCycle'), e.cycleDays ? t('detailCycleDays').replace('{n}', e.cycleDays) : '—')
    + rowline(t('detailValidity'), daysBadge(e))
    + '</div>';
  h += '<div class="fsec">' + t('secRenewal') + '</div><div class="card">'
    + rowline(t('detailProvider'), e.provider ? esc(e.provider) : '—');
  if (e.renewalUrl) {
    h += '<div class="btnrow"><a class="btn block" href="' + esc(e.renewalUrl) + '" target="_blank" rel="noopener">' + t('goRenew') + ' ↗</a></div>';
  } else {
    h += '<div style="color:var(--text2);font-size:13.5px;margin-top:8px;">' + t('noRenewalUrl') + '</div>';
  }
  h += '</div>';
  if (e.tags && e.tags.length) {
    h += '<div class="fsec">' + t('detailTags') + '</div><div>' + tagPills(e.tags) + '</div>';
  }
  if (e.note) {
    h += '<div class="fsec">' + t('detailNote') + '</div><div class="card" style="white-space:pre-wrap;font-size:14.5px;">' + esc(e.note) + '</div>';
  }
  h += '<div class="fsec">' + t('secHistory') + '</div>';
  if (d.renewals && d.renewals.length) {
    h += '<div class="card">' + d.renewals.map(function(r){
      var ds = '';
      try { ds = new Date(r.renewedAt).toLocaleDateString(LANG === 'zh' ? 'zh-CN' : 'en-US'); } catch (x) {}
      return '<div class="rowline"><span>' + esc(ds) + '<div class="lbl">' + esc(r.oldExpiresAt) + ' → ' + esc(r.newExpiresAt) + '</div></span>'
        + '<span class="val">+' + r.days + ' ' + t('detailCycleDays').replace('{n}', '').trim() + '</span></div>';
    }).join('') + '</div>';
  } else {
    h += '<div class="card" style="color:var(--text2);font-size:14px;text-align:center;">' + t('histEmpty') + '</div>';
  }
  h += '<div class="btnrow"><button class="btn" onclick="openRenew(\\'' + e.id + '\\')">✓ ' + t('renewBtn') + '</button>'
    + '<button class="btn ghost" onclick="nav(\\'#/esim/' + e.id + '/edit\\')">' + t('edit') + '</button></div>';
  h += '<div style="margin-top:18px;text-align:center;"><a href="javascript:void(0)" onclick="doDelete(\\'' + e.id + '\\')" style="color:var(--red);font-size:14px;">' + t('del') + '</a></div>';
  setView(layout(h, 'esims'));
  window._detail = e;
}
function rowline(l, v){
  return '<div class="rowline"><span class="lbl">' + l + '</span><span class="val">' + v + '</span></div>';
}
async function doDelete(id){
  var e = window._detail;
  confirmModal(t('del'), t('confirmDel'), t('del'), async function(){
    var d = await api('DELETE', '/api/esims/' + encodeURIComponent(id));
    if (d.ok) { toast(t('deleted')); nav('#/esims'); } else toast('❌ error');
  });
}
/* ---------- renew (server-authoritative dates) ---------- */
async function openRenew(id){
  var pv = await api('POST', '/api/esims/' + encodeURIComponent(id) + '/renew/preview');
  if (!pv.ok) { toast(pv.error === 'no cycle' ? t('needCycle') : '❌ ' + (pv.error || 'error')); return; }
  var body = '<div class="card" style="box-shadow:none;margin:10px 0;">'
    + rowline(t('renewCurrent'), esc(pv.currentExpiresAt || '—'))
    + rowline(t('renewCycle'), t('detailCycleDays').replace('{n}', pv.cycleDays) + (pv.fromToday ? ' <span class="lbl">' + t('renewFromToday') + '</span>' : ''))
    + rowline('<b>' + t('renewNew') + '</b>', '<b style="color:var(--accent)">' + esc(pv.newExpiresAt) + '</b>')
    + '</div>';
  confirmModal(t('renewTitle'), body, t('confirmRenew'), async function(){
    var d = await api('POST', '/api/esims/' + encodeURIComponent(id) + '/renew');
    if (d.ok) { toast(t('renewed')); render(); } else toast('❌ ' + (d.error || 'error'));
  });
}
/* ---------- esim form ---------- */
async function renderEsimForm(id){
  var e = null;
  if (id) {
    var d = await api('GET', '/api/esims/' + encodeURIComponent(id));
    if (!d.ok) { nav('#/esims'); return; }
    e = d.esim;
  }
  var tags = await api('GET', '/api/tags');
  var existingTags = tags.ok ? tags.tags.map(function(x){ return x.tag; }) : [];
  function fv(k){ return e ? esc(e[k] || '') : ''; }
  var h = '<button class="backbtn" onclick="history.back()">‹ ' + t('back') + '</button>'
    + '<div class="pagetitle" style="font-size:24px;">' + (e ? t('edit') : t('addEsim')) + '</div>';
  h += '<div class="fsec">' + t('formBasic') + '</div><div class="card">'
    + '<label class="f">' + t('fName') + ' <span class="req">*</span></label><input type="text" id="f_name" value="' + fv('name') + '">'
    + '<label class="f">' + t('fCountry') + '</label><input type="text" id="f_country" value="' + fv('country') + '" placeholder="United States / 美国">'
    + '<label class="f">' + t('fRegion') + ' <span class="lbl">(' + t('optional') + ')</span></label><input type="text" id="f_region" value="' + fv('region') + '">'
    + '<label class="f">' + t('fCarrier') + '</label><input type="text" id="f_carrier" value="' + fv('carrier') + '">'
    + '<label class="f">' + t('fPhone') + ' <span class="lbl">(' + t('optional') + ')</span></label><input type="text" id="f_phone" value="' + fv('phone') + '">'
    + '</div>';
  h += '<div class="fsec">' + t('formValidity') + '</div><div class="card">'
    + '<label class="f">' + t('fCycle') + '</label><input type="number" id="f_cycle" min="0" value="' + (e ? e.cycleDays : '') + '" placeholder="30">'
    + '<label class="f">' + t('fActivated') + ' <span class="lbl">(' + t('optional') + ')</span></label><input type="date" id="f_activated" value="' + fv('activatedAt') + '">'
    + '<label class="f">' + t('fExpires') + '</label><input type="date" id="f_expires" value="' + fv('expiresAt') + '">'
    + '<label class="f">' + t('fStatus') + '</label><select id="f_status">'
    + ['active', 'inactive', 'disabled'].map(function(s){
      return '<option value="' + s + '"' + ((e ? e.status : 'active') === s ? ' selected' : '') + '>' + t('st_' + s) + '</option>';
    }).join('') + '</select></div>';
  h += '<div class="fsec">' + t('formRenew') + '</div><div class="card">'
    + '<label class="f">' + t('fProvider') + ' <span class="lbl">(' + t('optional') + ')</span></label><input type="text" id="f_provider" value="' + fv('provider') + '" placeholder="Airalo">'
    + '<label class="f">' + t('fRenewalUrl') + ' <span class="lbl">(' + t('optional') + ')</span></label><input type="text" id="f_renewalUrl" value="' + fv('renewalUrl') + '" placeholder="https://…">'
    + '</div>';
  h += '<div class="fsec">' + t('formOther') + '</div><div class="card">'
    + '<label class="f">' + t('fTags') + '</label><input type="text" id="f_tags" value="' + esc(e ? e.tags.join(', ') : '') + '" placeholder="' + t('tagsHint') + '">'
    + (existingTags.length ? '<div style="margin-top:8px;">' + existingTags.map(function(x){
      return '<span class="tagpill" data-tg="' + esc(x) + '">＋' + esc(x) + '</span>';
    }).join('') + '</div>' : '')
    + '<label class="f">' + t('fNote') + ' <span class="lbl">(' + t('optional') + ')</span></label><textarea id="f_note">' + fv('note') + '</textarea>'
    + '</div>';
  h += '<div class="btnrow"><button class="btn" onclick="doSaveEsim(' + (e ? "'" + e.id + "'" : 'null') + ')">' + t('saveEsim') + '</button></div>';
  h += '<div style="height:20px"></div>';
  setView(layout(h, 'esims'));
  Array.prototype.forEach.call(document.querySelectorAll('.tagpill[data-tg]'), function(p){
    p.addEventListener('click', function(){
      var inp = document.getElementById('f_tags');
      var cur = inp.value.trim();
      var tg = p.getAttribute('data-tg');
      if ((',' + cur + ',').indexOf(',' + tg + ',') < 0) inp.value = cur ? cur + ', ' + tg : tg;
    });
  });
}
function fv2(id){ return document.getElementById(id).value.trim(); }
async function doSaveEsim(id){
  var body = {
    name: fv2('f_name'), country: fv2('f_country'), region: fv2('f_region'), carrier: fv2('f_carrier'),
    phone: fv2('f_phone'), cycleDays: parseInt(fv2('f_cycle'), 10) || 0,
    activatedAt: fv2('f_activated'), expiresAt: fv2('f_expires'), status: document.getElementById('f_status').value,
    provider: fv2('f_provider'), renewalUrl: fv2('f_renewalUrl'),
    tags: fv2('f_tags'), note: fv2('f_note')
  };
  if (!body.name) { toast(t('fName') + ' ' + t('required')); return; }
  var d = id
    ? await api('PUT', '/api/esims/' + encodeURIComponent(id), body)
    : await api('POST', '/api/esims', body);
  if (d.ok) { toast(id ? t('updated') : t('added')); nav('#/esim/' + (id || d.id)); }
  else toast('❌ ' + (d.error || 'error'));
}
/* ---------- notifications ---------- */
var CH_DEFS = [
  { k: 'telegram', ic: '✈️', f: [['tg_token', 'password', 'Bot Token', '123456:ABC-DEF...'], ['tg_chat', 'text', 'Chat ID', '123456789']] },
  { k: 'wecom', ic: '💬', f: [['wc_hook', 'text', 'Webhook', 'https://qyapi.weixin.qq.com/...']] },
  { k: 'dingtalk', ic: '📌', f: [['dd_hook', 'text', 'Webhook', 'https://oapi.dingtalk.com/...'], ['dd_secret', 'password', 'Sign secret', 'SEC...']] },
  { k: 'feishu', ic: '🕊️', f: [['fs_hook', 'text', 'Webhook', 'https://open.feishu.cn/...'], ['fs_secret', 'password', 'Sign secret', '']] },
  { k: 'bark', ic: '🍎', f: [['bark_key', 'text', 'Key', 'xxxxxx']] },
  { k: 'serverchan', ic: '💌', f: [['sc_key', 'password', 'SendKey', 'SCT...']] },
  { k: 'email', ic: '📧', f: [['em_key', 'password', 'API Key', 're_...'], ['em_from', 'text', 'From', 'eSIMinder <noreply@example.com>'], ['em_to', 'text', 'To', 'you@example.com']] }
];
var CH_MAP = { telegram: [['botToken', 'tg_token'], ['chatId', 'tg_chat']], wecom: [['webhook', 'wc_hook']], dingtalk: [['webhook', 'dd_hook'], ['secret', 'dd_secret']], feishu: [['webhook', 'fs_hook'], ['secret', 'fs_secret']], bark: [['key', 'bark_key']], serverchan: [['sendKey', 'sc_key']], email: [['apiKey', 'em_key'], ['from', 'em_from'], ['to', 'em_to']] };
var CH_LABEL = { telegram: 'ch_telegram', wecom: 'ch_wecom', dingtalk: 'ch_dingtalk', feishu: 'ch_feishu', bark: 'ch_bark', serverchan: 'ch_serverchan', email: 'ch_email' };
async function renderNotifications(){
  setView(layout('<div class="pagetitle">' + t('notifTitle') + '</div>' + skeleton(4), 'notifs'));
  var d = await api('GET', '/api/notifications?limit=100');
  if (!d.ok) return;
  var h = '<div class="pagetitle">' + t('notifTitle') + '</div>';
  h += '<div class="card"><div style="display:flex;gap:8px;align-items:center;">'
    + '<select id="test_ch" style="margin:0;flex:1"></select>'
    + '<button class="btn sm" style="white-space:nowrap" onclick="doTest()">' + t('sendTest') + '</button></div></div>';
  if (!d.items.length) { h += emptyState('🔕', t('notifEmpty')); }
  else {
    var lastDay = '';
    d.items.forEach(function(n){
      var day = fmtDay(n.createdAt);
      if (day !== lastDay) { h += '<div class="dayhead">' + esc(day) + '</div>'; lastDay = day; }
      var okc = n.status === 'ok'
        ? '<span class="okic">✅ ' + t('notifSent') + '</span>'
        : '<span class="failic">❌ ' + t('notifFailed') + ' · ' + t('willRetry') + '</span>';
      var title = n.kind === 'test' ? t('kindTest') : t('kindReminder');
      h += '<div class="notif"><span class="nic">' + (n.status === 'ok' ? '📨' : '⚠️') + '</span><div class="nb">'
        + '<div class="nt">' + esc(n.esimName ? n.esimName + ' · ' + title : title) + '</div>'
        + '<div class="nmeta">' + fmtTime(n.createdAt) + ' · ' + esc(channelLabel(n.channel)) + ' · ' + okc + '</div>'
        + (n.error ? '<div class="nm" style="color:var(--red)">' + esc(n.error) + '</div>' : '')
        + (n.status !== 'ok' ? '<div style="margin-top:8px;"><button class="btn sm ghost" onclick="doRetry(\\'' + n.id + '\\')">' + t('retry') + '</button></div>' : '')
        + '</div></div>';
    });
  }
  setView(layout(h, 'notifs'));
  var s = await api('GET', '/api/settings');
  var sel = document.getElementById('test_ch');
  var opts = '<option value="all">' + t('testChannel') + ': ' + t('allTags') + '</option>';
  if (s.ok) {
    CH_DEFS.forEach(function(c){
      if (s.chStatus[c.k]) opts += '<option value="' + c.k + '">' + t(CH_LABEL[c.k]) + '</option>';
    });
  }
  sel.innerHTML = opts;
}
function channelLabel(k){
  var m = { telegram: 'Telegram', wecom: 'WeCom', dingtalk: 'DingTalk', feishu: 'Feishu', bark: 'Bark', serverchan: 'ServerChan', email: 'Email' };
  return m[k] || k;
}
async function doTest(){
  toast('…');
  var d = await api('POST', '/api/notifications/test', { channel: document.getElementById('test_ch').value });
  if (!d.ok) { toast('❌ error'); return; }
  if (!d.results.length) { toast(t('notifEmpty')); return; }
  toast(d.results.map(function(r){ return (r.ok ? '✅ ' : '❌ ') + r.channel; }).join(' '));
  render();
}
async function doRetry(id){
  var d = await api('POST', '/api/notifications/' + encodeURIComponent(id) + '/retry');
  toast(d.ok && d.sent ? '✅' : '❌ ' + (d.error || 'error'));
  render();
}
/* ---------- settings ---------- */
var TIMEZONES = ['Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Taipei', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Singapore', 'Asia/Bangkok', 'Asia/Dubai', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Australia/Sydney', 'Pacific/Auckland', 'UTC'];
async function renderSettings(){
  setView(layout('<div class="pagetitle">' + t('navSettings') + '</div>' + skeleton(3), 'settings'));
  var d = await api('GET', '/api/settings');
  if (!d.ok) return;
  S.settings = d.settings;
  var st = d.settings;
  var h = '<div class="pagetitle">' + t('navSettings') + '</div>';
  h += '<div class="fsec">' + t('setAppearance') + '</div><div class="card"><div class="seg" id="seg_theme">'
    + ['system', 'light', 'dark'].map(function(x){
      return '<button data-v="' + x + '" class="' + (THEME === x ? 'on' : '') + '">' + t(x === 'system' ? 'themeSystem' : x === 'light' ? 'themeLight' : 'themeDark') + '</button>';
    }).join('') + '</div></div>';
  h += '<div class="fsec">' + t('setLanguage') + '</div><div class="card"><div class="seg" id="seg_lang">'
    + '<button data-v="zh" class="' + (LANG === 'zh' ? 'on' : '') + '">中文</button>'
    + '<button data-v="en" class="' + (LANG === 'en' ? 'on' : '') + '">English</button>'
    + '</div></div>';
  h += '<div class="fsec">' + t('setReminders') + '</div><div class="card">'
    + '<label class="f">' + t('setRemindDays') + '</label><input type="text" id="s_days" value="' + esc(st.reminderDays) + '">'
    + '<div class="lbl" style="margin-bottom:10px;">' + t('remindDaysHint') + '</div>'
    + '<label class="f">' + t('setTimezone') + '</label><select id="s_tz">'
    + TIMEZONES.map(function(z){ return '<option value="' + z + '"' + (st.timezone === z ? ' selected' : '') + '>' + z + '</option>'; }).join('')
    + '</select>'
    + '<div class="lbl" style="margin:10px 0;">' + t('lastCheck') + ': ' + (S.dash ? '' : '') + '<span id="s_lastcheck">…</span></div>'
    + '<button class="btn block" onclick="doSaveSettings()">' + t('saved') + '</button></div>';
  h += '<div class="fsec">' + t('setChannels') + '</div><div id="chwrap"></div>'
    + '<button class="btn block" onclick="doSaveChannels()">' + t('saved') + '</button><div style="height:12px"></div>';
  h += '<div class="fsec">' + t('setAdmin') + '</div><div class="card">'
    + '<label class="f">' + t('newPwPh') + '</label><input type="password" id="s_npw" autocomplete="new-password">'
    + '<div class="btnrow"><button class="btn" onclick="doChangePw()">' + t('changePwBtn') + '</button>'
    + '<button class="btn ghost" onclick="doLogout()">' + t('logout') + '</button></div></div>';
  h += '<div style="text-align:center;color:var(--text2);font-size:12px;margin:24px 0;">eSIMinder v2.0</div>';
  setView(layout(h, 'settings'));
  segBind('seg_theme', function(v){ THEME = v; localStorage.setItem('esiminder_theme', v); applyTheme(); paintSeg('seg_theme', v); });
  segBind('seg_lang', function(v){ LANG = v; localStorage.setItem('esiminder_lang', v); applyLangAll(); });
  CH_CLEARED = {};
  paintChannels(d.chStatus);
  var dd = await api('GET', '/api/dashboard');
  if (dd.ok) document.getElementById('s_lastcheck').textContent = dd.lastCheckAt ? fmtDate(dd.lastCheckAt) + ' ' + fmtTime(dd.lastCheckAt) : t('neverChecked');
}
function segBind(id, fn){
  Array.prototype.forEach.call(document.getElementById(id).querySelectorAll('button'), function(b){
    b.addEventListener('click', function(){ fn(b.getAttribute('data-v')); });
  });
}
function paintSeg(id, v){
  Array.prototype.forEach.call(document.getElementById(id).querySelectorAll('button'), function(b){
    b.classList.toggle('on', b.getAttribute('data-v') === v);
  });
}
function applyLangAll(){ document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en'; render(); }
var CH_CLEARED = {};
var EL_TO_FIELD = {};
for (var _ck in CH_MAP) { CH_MAP[_ck].forEach(function(p){ EL_TO_FIELD[p[1]] = p[0]; }); }
function paintChannels(chStatus){
  var el = document.getElementById('chwrap');
  el.innerHTML = CH_DEFS.map(function(c){
    var ok = chStatus[c.k];
    var fs = c.f.map(function(f){
      var elId = f[0], field = EL_TO_FIELD[elId] || elId;
      var ck = c.k + '__' + field;
      var cleared = !!CH_CLEARED[ck];
      var h = '<label class="f">' + esc(f[2]);
      if (ok) h += ' <a href="javascript:void(0)" data-clear="' + ck + '" style="font-size:12px;">' + (cleared ? t('cancel') : t('clear')) + '</a>';
      h += '</label><input id="' + elId + '" type="' + f[1] + '" placeholder="' + esc(ok ? '✓ ' + t('configured') : f[3]) + '" autocomplete="off"' + (cleared ? ' disabled' : '') + '>';
      if (cleared) h += '<div style="color:var(--red);font-size:12px;margin:2px 0 6px;">⚠️ ' + t('clear') + '</div>';
      return h;
    }).join('');
    return '<div class="ch"><h4>' + c.ic + ' ' + t(CH_LABEL[c.k]) + (ok ? ' <span class="st">✓ ' + t('configured') + '</span>' : '') + '</h4>' + fs + '</div>';
  }).join('');
  Array.prototype.forEach.call(el.querySelectorAll('a[data-clear]'), function(a){
    a.addEventListener('click', function(){
      var ck = a.getAttribute('data-clear');
      if (CH_CLEARED[ck]) delete CH_CLEARED[ck]; else CH_CLEARED[ck] = true;
      paintChannels(chStatus);
    });
  });
}
function collectChannels(){
  var o = {};
  for (var k in CH_MAP) {
    o[k] = {};
    CH_MAP[k].forEach(function(p){
      var field = p[0], elId = p[1];
      var el = document.getElementById(elId);
      if (CH_CLEARED[k + '__' + field]) o[k][field + '__clear'] = true;
      else if (el && el.value.trim()) o[k][field] = el.value.trim();
      // blank + not cleared -> omitted; backend keeps the existing value
    });
  }
  return o;
}
async function doSaveSettings(){
  var d = await api('PUT', '/api/settings', {
    reminderDays: document.getElementById('s_days').value.trim(),
    timezone: document.getElementById('s_tz').value,
    theme: THEME, notifLang: LANG
  });
  toast(d.ok ? '✅ ' + t('saved') : '❌ error');
}
async function doSaveChannels(){
  var d = await api('PUT', '/api/channels', { channels: collectChannels() });
  if (d.ok) { toast('✅ ' + t('saved')); render(); } else toast('❌ error');
}
async function doChangePw(){
  var np = document.getElementById('s_npw').value;
  if (np.length < 6) { toast(t('pwShort')); return; }
  var d = await api('POST', '/api/admin-password', { newPassword: np });
  if (d.ok) { toast(t('pwChanged')); setTimeout(function(){ location.href = '/'; }, 1000); }
  else toast('❌ error');
}
async function doLogout(){
  if (!confirm(t('logoutConfirm'))) return;
  await api('POST', '/api/logout');
  location.href = '/';
}
/* ---------- dispatcher & init ---------- */
async function render(){
  modalClose();
  var r = parseHash(), seg = r.seg;
  applyTheme();
  document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
  if (!seg.length) return renderDashboard();
  if (seg[0] === 'esims') return renderEsimList();
  if (seg[0] === 'esim' && seg[1] === 'new') return renderEsimForm(null);
  if (seg[0] === 'esim' && seg[2] === 'edit') return renderEsimForm(seg[1]);
  if (seg[0] === 'esim' && seg[1]) return renderEsimDetail(seg[1]);
  if (seg[0] === 'notifications') return renderNotifications();
  if (seg[0] === 'settings') return renderSettings();
  return renderDashboard();
}
applyTheme();
try {
  var _boot = render();
  if (_boot && _boot.catch) _boot.catch(function(e){
    document.getElementById('app').innerHTML = '<div style="padding:48px 24px;text-align:center;font-size:14px;color:#8e8e93;">⚠️ ' + esc(String((e && e.message) || e)) + '</div>';
  });
} catch (e) {
  document.getElementById('app').innerHTML = '<div style="padding:48px 24px;text-align:center;font-size:14px;color:#8e8e93;">⚠️ ' + esc(String((e && e.message) || e)) + '</div>';
}
`;
