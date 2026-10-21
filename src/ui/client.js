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
+ '[data-theme="light"]{--bg:#e9f4fd;--card:rgba(255,255,255,.62);--card2:rgba(255,255,255,.45);--text:#132a3e;--text2:#5d7b92;--border:rgba(110,175,235,.30);--accent:#1f9bf0;--accent-tap:#0f83d6;--icon:#2ea6f2;--green:#2fb350;--yellow:#e8890c;--red:#e8322a;--tabbar:rgba(238,247,255,.55);--shadow:0 10px 34px rgba(31,110,180,.14);--input:rgba(255,255,255,.55);--glass-hi:inset 0 1px 0 rgba(230,245,255,.85);--glass-grad:linear-gradient(135deg,rgba(255,255,255,.72),rgba(255,255,255,.38) 42%,rgba(255,255,255,.52));--glass-brd:rgba(235,248,255,.85);--glass-shadow:inset 0 1px 1px rgba(230,245,255,.95),inset 0 -1px 1px rgba(230,245,255,.50),inset 1px 0 1px rgba(230,245,255,.28),inset -1px 0 1px rgba(230,245,255,.28),0 14px 40px rgba(28,100,170,.15);--sheen:linear-gradient(115deg,rgba(235,248,255,.50) 0%,rgba(235,248,255,.12) 22%,rgba(235,248,255,0) 42%);--thumb:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,255,255,.48));--thumb-sh:inset 0 1px 1px rgba(235,248,255,.95),0 4px 14px rgba(31,110,180,.18);--glass-fx:blur(24px) saturate(190%) brightness(1.05);--glass-in:rgba(255,255,255,.50);--in-shadow:inset 0 1px 3px rgba(20,60,110,.08);}'
+ '[data-theme="dark"]{--bg:#050c15;--card:rgba(22,38,58,.55);--card2:rgba(255,255,255,.08);--text:#edf6ff;--text2:#8fa9bf;--border:rgba(110,185,255,.20);--accent:#3aa9f5;--accent-tap:#1f8fe0;--icon:#6ec3ff;--green:#30d158;--yellow:#ff9f0a;--red:#ff453a;--tabbar:rgba(7,15,25,.55);--shadow:0 10px 34px rgba(0,0,0,.5);--input:rgba(255,255,255,.09);--glass-hi:inset 0 1px 0 rgba(215,240,255,.30);--glass-grad:linear-gradient(135deg,rgba(125,195,255,.16),rgba(18,36,58,.50) 45%,rgba(95,165,235,.12));--glass-brd:rgba(160,215,255,.32);--glass-shadow:inset 0 1px 1px rgba(215,240,255,.28),inset 0 -1px 1px rgba(215,240,255,.10),inset 1px 0 1px rgba(215,240,255,.08),inset -1px 0 1px rgba(215,240,255,.08),0 14px 40px rgba(0,0,0,.50);--sheen:linear-gradient(115deg,rgba(215,240,255,.16) 0%,rgba(215,240,255,.05) 22%,rgba(215,240,255,0) 42%);--thumb:linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,.10));--thumb-sh:inset 0 1px 1px rgba(215,240,255,.25),0 4px 14px rgba(0,0,0,.35);--glass-fx:blur(24px) saturate(190%) brightness(1.06);--glass-in:rgba(255,255,255,.08);--in-shadow:inset 0 1px 3px rgba(0,0,0,.25);}'
+ '*{box-sizing:border-box;}'
+ 'html,body{margin:0;padding:0;}'
+ 'body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;background:var(--bg);background-image:radial-gradient(620px 420px at 10% -6%,rgba(90,190,255,.38),rgba(90,190,255,0) 62%),radial-gradient(560px 420px at 98% 2%,rgba(150,220,255,.30),rgba(150,220,255,0) 60%),radial-gradient(760px 620px at 50% 112%,rgba(70,160,250,.22),rgba(70,160,250,0) 62%),radial-gradient(520px 420px at 88% 88%,rgba(120,255,214,.13),rgba(120,255,214,0) 60%),radial-gradient(480px 380px at 6% 78%,rgba(186,164,255,.13),rgba(186,164,255,0) 60%);background-attachment:fixed;color:var(--text);-webkit-tap-highlight-color:transparent;min-height:100vh;transition:background .25s,color .25s;}'
+ '#app{min-height:100vh;}'
+ '.page{max-width:720px;margin:0 auto;padding:calc(12px + var(--sat)) 16px calc(96px + var(--sab));animation:fadeIn .22s ease;}'
+ '@keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}'
+ '.pagetitle{font-size:30px;font-weight:800;letter-spacing:-.5px;margin:10px 2px 2px;}'
+ '.pagesub{color:var(--text2);font-size:14px;margin:0 2px 16px;}'
+ '.card{position:relative;background:var(--glass-grad);-webkit-backdrop-filter:var(--glass-fx);backdrop-filter:var(--glass-fx);border-radius:22px;padding:16px;margin-bottom:12px;box-shadow:var(--glass-shadow);border:1px solid var(--glass-brd);}'
+ '.rowline{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--border);font-size:15px;}'
+ '.rowline:last-child{border-bottom:none;}'
+ '.lbl{color:var(--text2);font-size:14px;}'
+ '.val{font-weight:500;text-align:right;}'
+ 'a{color:var(--accent);text-decoration:none;}'
+ '.btn{display:inline-block;position:relative;background:linear-gradient(180deg,rgba(110,198,255,.95),rgba(31,143,240,.92));color:#fff;border:1px solid rgba(255,255,255,.55);border-radius:14px;padding:11px 18px;font-size:15px;font-weight:600;cursor:pointer;transition:transform .08s,filter .15s;text-align:center;box-shadow:inset 0 1px 1px rgba(230,245,255,.85),inset 0 -1px 1px rgba(230,245,255,.25),0 10px 24px rgba(31,143,240,.38);}'
+ '.btn:active{transform:scale(.97);filter:brightness(1.07);}'
+ '.btn.block{display:block;width:100%;}'
+ '.btn.ghost{background:var(--glass-grad);-webkit-backdrop-filter:var(--glass-fx);backdrop-filter:var(--glass-fx);color:var(--text);border:1px solid var(--glass-brd);box-shadow:var(--glass-shadow);}'
+ '.btn.danger{background:var(--red);}'
+ '.btn.sm{padding:8px 14px;font-size:14px;border-radius:10px;}'
+ '.btnrow{display:flex;gap:10px;margin-top:14px;}'
+ '.btnrow .btn{flex:1;}'
+ 'input[type=text],input[type=password],input[type=date],input[type=number],select,textarea{width:100%;background:var(--glass-in);box-shadow:var(--in-shadow);border:1px solid var(--border);border-radius:14px;padding:12px 13px;font-size:15px;color:var(--text);-webkit-text-fill-color:var(--text);caret-color:var(--accent);outline:none;margin-bottom:2px;font-family:inherit;}'
+ 'input:focus,select:focus,textarea:focus{border-color:var(--accent);box-shadow:var(--in-shadow),0 0 0 4px rgba(46,166,242,.20);}'
+ 'textarea{resize:vertical;min-height:70px;}'
+ 'input[type=password]{letter-spacing:.5px;}'
+ 'input::placeholder,textarea::placeholder{color:var(--text2);-webkit-text-fill-color:var(--text2);opacity:.85;}'
+ 'label.f{display:block;font-size:13px;color:var(--text2);margin:14px 0 6px;font-weight:500;}'
+ 'label.f .req{color:var(--red);}'
+ '.fsec{font-size:13px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.6px;margin:22px 2px 8px;}'
+ '.pill{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:600;padding:5px 11px;border-radius:999px;white-space:nowrap;border:1px solid rgba(255,255,255,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.45);}'
+ '.pill.st-active{background:rgba(52,199,89,.14);color:var(--green);}'
+ '.pill.st-expiring{background:rgba(255,149,0,.15);color:var(--yellow);}'
+ '.pill.st-expired{background:rgba(255,59,48,.13);color:var(--red);}'
+ '.pill.st-inactive{background:rgba(142,142,147,.16);color:var(--text2);}'
+ '.pill.st-disabled{background:rgba(142,142,147,.16);color:var(--text2);}'
+ '.tagpill{display:inline-block;background:var(--card2);color:var(--text2);font-size:12.5px;padding:6px 12px;border-radius:999px;margin:0 6px 6px 0;cursor:pointer;border:1px solid transparent;}'
+ '.tagpill.on{background:linear-gradient(180deg,rgba(110,198,255,.95),rgba(31,143,240,.92));color:#fff;border:1px solid rgba(255,255,255,.55);box-shadow:inset 0 1px 1px rgba(230,245,255,.85),0 6px 16px rgba(31,143,240,.30);}'
+ '.ecard{display:block;position:relative;background:var(--glass-grad);-webkit-backdrop-filter:var(--glass-fx);backdrop-filter:var(--glass-fx);border-radius:22px;padding:16px;margin-bottom:12px;box-shadow:var(--glass-shadow);border:1px solid var(--glass-brd);color:var(--text);transition:transform .1s;}'
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
+ '.stat{position:relative;background:var(--glass-grad);-webkit-backdrop-filter:var(--glass-fx);backdrop-filter:var(--glass-fx);border-radius:20px;padding:14px 6px;text-align:center;box-shadow:var(--glass-shadow);border:1px solid var(--glass-brd);cursor:pointer;transition:transform .1s;}'
+ '.stat:active{transform:scale(.95);}'
+ '.stat .n{font-size:22px;font-weight:800;}'
+ '.stat .l{font-size:11.5px;color:var(--text2);margin-top:4px;}'
+ '.sech{display:flex;justify-content:space-between;align-items:baseline;margin:20px 2px 10px;}'
+ '.sech h2{font-size:19px;font-weight:700;margin:0;}'
+ '.sech a{font-size:14px;}'
+ '.tabbar{position:fixed;left:14px;right:14px;bottom:calc(12px + var(--sab));z-index:50;display:flex;background:var(--glass-grad);-webkit-backdrop-filter:var(--glass-fx);backdrop-filter:var(--glass-fx);border:1px solid var(--glass-brd);border-radius:999px;box-shadow:var(--glass-shadow),0 0 0 1px rgba(120,200,255,.15),1px 2px 0 0 rgba(255,180,120,.06);padding:6px;}'
+ '.tabbar a{flex:1;text-align:center;padding:9px 0 8px;color:var(--text2);font-size:10.5px;font-weight:500;display:flex;flex-direction:column;gap:3px;align-items:center;border-radius:999px;}'
+ '.tabbar a .ic{font-size:21px;}'
+ '.tabbar a.on{color:var(--accent);background:var(--thumb);box-shadow:var(--thumb-sh);}'
+ '.sidebar{display:none;}'
+ '@media(min-width:900px){'
+ '.tabbar{display:none;}'
+ '.appwrap{display:flex;max-width:1100px;margin:0 auto;gap:8px;}'
+ '.sidebar{display:flex;flex-direction:column;width:230px;flex-shrink:0;position:sticky;top:16px;height:calc(100vh - 32px);margin:16px 0 16px 16px;border-radius:28px;padding:calc(20px + var(--sat)) 14px 20px;border:1px solid var(--glass-brd);background:var(--glass-grad);-webkit-backdrop-filter:var(--glass-fx);backdrop-filter:var(--glass-fx);box-shadow:var(--glass-shadow),0 0 0 1px rgba(120,200,255,.14),1px 2px 0 0 rgba(255,180,120,.05);}'
+ '.sidebar .logo{font-size:20px;font-weight:800;padding:6px 12px 18px;}'
+ '.sidebar a{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:12px;color:var(--text2);font-size:15px;font-weight:500;margin-bottom:4px;}'
+ '.sidebar a .ic{font-size:19px;}'
+ '.sidebar a.on{background:var(--thumb);box-shadow:var(--thumb-sh);color:var(--text);font-weight:700;}'
+ '.page{margin:0;max-width:760px;padding-bottom:40px;}'
+ '}'
+ '.fab{position:fixed;right:18px;bottom:calc(96px + var(--sab));width:56px;height:56px;border-radius:50%;background:linear-gradient(180deg,rgba(110,198,255,.95),rgba(31,143,240,.92));color:#fff;font-size:28px;border:1px solid rgba(255,255,255,.55);box-shadow:inset 0 1px 1px rgba(230,245,255,.85),inset 0 -1px 1px rgba(230,245,255,.25),0 12px 28px rgba(31,143,240,.45);cursor:pointer;z-index:40;transition:transform .1s;display:flex;align-items:center;justify-content:center;}'
+ '.fab:active{transform:scale(.92);}'
+ '@media(min-width:900px){.fab{bottom:30px;}}'
+ '.chips{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px;margin-bottom:6px;-webkit-overflow-scrolling:touch;}'
+ '.chip{flex-shrink:0;font-size:13.5px;font-weight:500;padding:8px 15px;border-radius:999px;background:var(--glass-grad);-webkit-backdrop-filter:var(--glass-fx);backdrop-filter:var(--glass-fx);color:var(--text2);border:1px solid var(--glass-brd);box-shadow:var(--glass-shadow);cursor:pointer;}'
+ '.chip.on{background:linear-gradient(180deg,rgba(110,198,255,.95),rgba(31,143,240,.92));color:#fff;border:1px solid rgba(255,255,255,.55);box-shadow:inset 0 1px 1px rgba(230,245,255,.85),0 6px 16px rgba(31,143,240,.30);}'
+ '.searchbar{position:relative;margin-bottom:10px;}'
+ '.searchbar input{padding-left:38px;border-radius:14px;}'
+ '.searchbar .sic{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--text2);font-size:16px;}'
+ '#modal-root{position:fixed;inset:0;z-index:100;pointer-events:none;}'
+ '.mback{position:absolute;inset:0;background:rgba(0,0,0,.4);opacity:0;transition:opacity .2s;pointer-events:auto;}'
+ '.msheet{position:absolute;left:0;right:0;bottom:0;background:var(--glass-grad);-webkit-backdrop-filter:var(--glass-fx);backdrop-filter:var(--glass-fx);border:1px solid var(--glass-brd);box-shadow:var(--glass-shadow);border-radius:26px 26px 0 0;padding:20px 20px calc(20px + var(--sab));transform:translateY(100%);transition:transform .25s cubic-bezier(.32,.72,.35,1);pointer-events:auto;max-height:86vh;overflow-y:auto;}'
+ '#modal-root.open .mback{opacity:1;}'
+ '#modal-root.open .msheet{transform:none;}'
+ '.msheet h3{margin:0 0 6px;font-size:18px;font-weight:700;}'
+ '@media(min-width:900px){.msheet{left:50%;right:auto;bottom:auto;top:50%;width:440px;transform:translate(-50%,-40%);border-radius:22px;opacity:0;}#modal-root.open .msheet{transform:translate(-50%,-50%);opacity:1;}}'
+ '#toast-root{position:fixed;left:0;right:0;bottom:calc(100px + var(--sab));display:flex;flex-direction:column;align-items:center;z-index:200;pointer-events:none;}'
+ '.toast{background:linear-gradient(135deg,rgba(72,84,100,.88),rgba(26,32,42,.92));-webkit-backdrop-filter:blur(18px) saturate(180%);backdrop-filter:blur(18px) saturate(180%);border:1px solid rgba(255,255,255,.28);color:#fff;font-size:14px;font-weight:500;padding:11px 20px;border-radius:999px;margin-top:8px;animation:toastIn .25s ease;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 10px 30px rgba(0,0,0,.28);max-width:88%;}'
+ '[data-theme="dark"] .toast{background:linear-gradient(135deg,rgba(255,255,255,.93),rgba(224,238,250,.90));color:#1c1c1e;border-color:rgba(255,255,255,.5);box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 10px 30px rgba(0,0,0,.4);}'
+ '@keyframes toastIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}'
+ '.skel{border-radius:14px;background:linear-gradient(90deg,var(--card2) 25%,var(--border) 50%,var(--card2) 75%);background-size:200% 100%;animation:sk 1.2s infinite;}'
+ '@keyframes sk{from{background-position:200% 0;}to{background-position:-200% 0;}}'
+ '.empty{text-align:center;color:var(--text2);padding:44px 20px;font-size:14.5px;}'
+ '.empty .big{font-size:44px;margin-bottom:10px;}'
+ '.notif{display:flex;gap:12px;position:relative;background:var(--glass-grad);-webkit-backdrop-filter:var(--glass-fx);backdrop-filter:var(--glass-fx);border-radius:20px;padding:14px;margin-bottom:10px;box-shadow:var(--glass-shadow);border:1px solid var(--glass-brd);}'
+ '.notif .nic{font-size:26px;}'
+ '.notif .nb{flex:1;min-width:0;}'
+ '.notif .nt{font-size:14.5px;font-weight:600;}'
+ '.notif .nm{font-size:13px;color:var(--text2);margin-top:3px;line-height:1.5;word-break:break-word;}'
+ '.notif .nmeta{font-size:12px;color:var(--text2);margin-top:6px;}'
+ '.okic{color:var(--green);font-weight:700;}.failic{color:var(--red);font-weight:700;}'
+ '.dayhead{font-size:13px;font-weight:700;color:var(--text2);margin:16px 2px 8px;}'
+ '.seg{display:flex;background:var(--glass-in);box-shadow:var(--in-shadow);-webkit-backdrop-filter:var(--glass-fx);backdrop-filter:var(--glass-fx);border:1px solid var(--glass-brd);border-radius:14px;padding:3px;gap:2px;}'
+ '.seg button{flex:1;border:none;background:transparent;color:var(--text2);font-size:14px;font-weight:500;padding:9px 0;border-radius:9px;cursor:pointer;}'
+ '.seg button.on{background:var(--thumb);color:var(--text);font-weight:700;box-shadow:var(--thumb-sh);}'
+ '.ch{position:relative;border:1px solid var(--glass-brd);border-radius:18px;padding:14px;margin-bottom:10px;background:var(--glass-grad);-webkit-backdrop-filter:var(--glass-fx);backdrop-filter:var(--glass-fx);box-shadow:var(--glass-shadow);}'
+ '.ch h4{margin:0 0 4px;font-size:15px;font-weight:700;}'
+ '.ch .st{float:right;font-size:12px;color:var(--green);font-weight:600;}'
+ '.hdr{position:sticky;top:0;z-index:30;background:var(--tabbar);-webkit-backdrop-filter:blur(22px) saturate(180%);backdrop-filter:blur(22px) saturate(180%);padding-top:calc(8px + var(--sat));}'
+ '.backbtn{display:inline-flex;align-items:center;gap:4px;color:var(--accent);font-size:16px;background:none;border:none;padding:8px 0;cursor:pointer;}'
+ '.detailhead{display:flex;gap:14px;align-items:center;margin:6px 0 16px;}'
+ '.detailhead .flag{font-size:52px;}'
+ '.detailhead .nm{font-size:23px;font-weight:800;}'
+ '.detailhead .car{color:var(--text2);font-size:14px;margin-top:3px;}'
+ '.kbd{font-size:12px;color:var(--text2);}'
+ '.svgic{display:inline-block;vertical-align:-.16em;color:var(--icon);flex-shrink:0;}'
+ '.tabbar a .svgic,.sidebar a .svgic{color:var(--icon);}'
+ '.tabbar a.on .svgic{color:var(--accent);}'
+ '.btn .svgic{color:#fff;}'
+ '.btn.ghost .svgic{color:var(--icon);}'
+ '.fab .svgic{color:#fff;vertical-align:middle;}'
+ '.searchbar .sic{display:flex;align-items:center;}'
+ '.ecard .flag .svgic,.detailhead .flag .svgic{color:var(--icon);}'
+ '.logo .svgic{color:var(--icon);}'
+ '.card::after,.ecard::after,.stat::after,.notif::after,.ch::after{content:"";position:absolute;inset:0;border-radius:inherit;background:var(--sheen);pointer-events:none;}'
+ '.msheet::before{content:"";display:block;width:38px;height:5px;border-radius:99px;background:var(--text2);opacity:.35;margin:0 auto 12px;}';
/* inject styles: the shell carries no <style> tag, so the SPA must add its own */
CSS += '.extlinks{display:flex;justify-content:center;gap:12px;}.extlinks a{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text2);background:var(--glass-grad);border:1px solid var(--glass-brd);box-shadow:var(--glass-shadow);-webkit-backdrop-filter:var(--glass-fx);backdrop-filter:var(--glass-fx);text-decoration:none;}.extlinks a:active{transform:scale(.93);}.extlinks .blogico{width:20px;height:20px;display:block;}[data-theme="dark"] .extlinks .blogico{filter:invert(1);}';
CSS += '.topbar{position:fixed;top:calc(10px + var(--sat));right:14px;display:flex;gap:8px;z-index:60;}.tb-btn{min-width:38px;height:38px;padding:0 11px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:var(--text2);background:var(--glass-grad);border:1px solid var(--glass-brd);box-shadow:var(--glass-shadow);-webkit-backdrop-filter:var(--glass-fx);backdrop-filter:var(--glass-fx);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}.tb-btn:active{transform:scale(.93);}.tb-btn svg{display:block;}';
CSS += '@media(max-width:899px){.pagetitle.pt-tab{display:none;}}';
CSS += '@media(max-width:899px){.page.sub{padding-top:calc(60px + var(--sat));}}';
CSS += '.sb-fv-dark{display:none;}[data-theme="dark"] .sb-fv-light{display:none;}[data-theme="dark"] .sb-fv-dark{display:block;}';
try {
  var _styleEl = document.createElement('style');
  _styleEl.textContent = CSS;
  document.head.appendChild(_styleEl);
} catch (_e) {}
/* ---------- SVG line icons (global light blue via --icon) ---------- */
var ICON_PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  esim: '<path d="M6.2 2.8h6.6l6.4 6.4v10.4a1.6 1.6 0 0 1-1.6 1.6H6.2a1.6 1.6 0 0 1-1.6-1.6V4.4a1.6 1.6 0 0 1 1.6-1.6Z"/><rect x="8.4" y="12" width="7" height="6.2" rx="1.2"/><path d="M8.4 15.1h7"/>',
  bell: '<path d="M6 9.5a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  belloff: '<path d="M6 9.5a6 6 0 0 1 11.4-3.4M18.6 15.6c.7.5 1.4.9 1.4.9H4s2-1 2-6c0-1.2.3-2.4.9-3.4"/><path d="M10 19a2 2 0 0 0 4 0"/><path d="m4 4 16 16"/>',
  sliders: '<path d="M4 7h8.5M19 7h1M4 17h2.5M13 17h7"/><circle cx="15.8" cy="7" r="2.3"/><circle cx="9.3" cy="17" r="2.3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.6-4.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 15.2h.01"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  alert: '<path d="M12 3.5 2.8 20h18.4L12 3.5Z"/><path d="M12 10v4.4"/><path d="M12 17.2h.01"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20.2 3.6v4.6h-4.6"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M20 14v5a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19V6.2A1.6 1.6 0 0 1 5.6 4.6H10"/>',
  chev: '<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>',
  send: '<path d="M21 3 10.4 13.6"/><path d="M21 3 14.2 21l-3.8-7.4L3 9.8 21 3Z"/>',
  chat: '<path d="M20 4.8A2.3 2.3 0 0 0 17.7 2.5H6.3A2.3 2.3 0 0 0 4 4.8v14.4L8.6 16h9.1a2.3 2.3 0 0 0 2.3-2.3V4.8Z" transform="translate(0 1)"/>',
  pin: '<path d="M12 21.5s-7-5.7-7-11a7 7 0 0 1 14 0c0 5.3-7 11-7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  feather: '<path d="M20.2 3.8c-5.2 0-12.3 3.2-13.8 12.7L4 20l3.5-2.4c9.5-1.5 12.7-8.6 12.7-13.8Z"/><path d="M16 8 6.6 17.4"/><path d="M17.5 11H9"/>',
  bellring: '<path d="M6 9.5a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 19a2 2 0 0 0 4 0"/><path d="M18.8 2.8a7 7 0 0 1 2.4 4.2"/>',
  signal: '<path d="M2.8 9.6a15 15 0 0 1 18.4 0"/><path d="M5.8 13a10.5 10.5 0 0 1 12.4 0"/><path d="M8.9 16.4a6 6 0 0 1 6.2 0"/><path d="M12 19.6h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.7 2.6 4 5.6 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.6-4-9s1.3-6.4 4-9Z"/>'
};
function icon(n, sz, style){
  return '<svg class="svgic" width="' + (sz || 24) + '" height="' + (sz || 24) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (style ? ' style="' + style + '"' : '') + '>' + (ICON_PATHS[n] || '') + '</svg>';
}
function statusDot(){
  return '<svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true" style="display:inline-block;vertical-align:0;"><circle cx="5" cy="5" r="4.2" fill="currentColor"/></svg>';
}
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
var CARRIER_FLAGS = { 'dito': '🇵🇭' };
function flagFor(country, sz, extra){
  var c = String(country || '').trim().toLowerCase();
  if (c) { for (var k in FLAGS) { if (c.indexOf(k) >= 0) return FLAGS[k]; } }
  var x = String(extra || '').toLowerCase();
  if (x) {
    for (var k2 in FLAGS) { if (x.indexOf(k2) >= 0) return FLAGS[k2]; }
    for (var k3 in CARRIER_FLAGS) { if (x.indexOf(k3) >= 0) return CARRIER_FLAGS[k3]; }
  }
  if (!c && !x) return icon('esim', sz || 36);
  return icon('globe', sz || 36);
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
  { k: 'home', ic: icon('home'), label: 'navHome', hash: '#/' },
  { k: 'esims', ic: icon('esim'), label: 'navEsims', hash: '#/esims' },
  { k: 'notifs', ic: icon('bell'), label: 'navNotifs', hash: '#/notifications' },
  { k: 'settings', ic: icon('sliders'), label: 'navSettings', hash: '#/settings' }
];
var EXT_LINKS = '<div class="extlinks"><a href="https://github.com/Newbee06/esiminder" target="_blank" rel="noopener" aria-label="GitHub"><svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.73.9.44 1.49 1.15 1.06 1.61.8.08-.63.34-1.06.63-1.31-2.2-.25-4.51-1.1-4.51-4.91 0-1.08.39-1.97 1.02-2.67-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.63.7 1.02 1.59 1.02 2.67 0 3.81-2.31 4.66-4.52 4.91.35.31.66.91.66 1.84 0 1.33-.01 2.4-.01 2.72 0 .21.15.47.55.38A8.013 8.013 0 0 1 16 8c0-4.42-3.58-8-8-8z"/></svg></a><a href="https://x.com/BTC108_" target="_blank" rel="noopener" aria-label="X"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg></a><a href="https://www.weblog.ren" target="_blank" rel="noopener" aria-label="Blog"><img class="blogico" src="data:image/webp;base64,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" width="20" height="20" alt="Blog"></a></div>';
function toggleTheme(){ var cur = document.documentElement.getAttribute('data-theme'); THEME = cur === 'dark' ? 'light' : 'dark'; localStorage.setItem('esiminder_theme', THEME); applyTheme(); render(); }
function toggleLang(){ LANG = LANG === 'zh' ? 'en' : 'zh'; localStorage.setItem('esiminder_lang', LANG); applyLangAll(); }
function themeIconSvg(){ var dark = document.documentElement.getAttribute('data-theme') === 'dark'; if (dark) return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'; return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13.6A8.6 8.6 0 1 1 10.4 4a7.2 7.2 0 0 0 9.6 9.6Z"/></svg>'; }
var SB_FAVICON = '<svg class="sb-fv sb-fv-light" width="34" height="34" viewBox="0 0 96 96" aria-hidden="true"><defs> <linearGradient id="f1gf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".16"/><stop offset=".45" stop-color="#ffffff" stop-opacity=".10"/><stop offset="1" stop-color="#ffffff" stop-opacity=".22"/></linearGradient> <linearGradient id="f1gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141414" stop-opacity=".95"/><stop offset=".5" stop-color="#5a5a5a" stop-opacity=".5"/><stop offset="1" stop-color="#141414" stop-opacity=".7"/></linearGradient> <linearGradient id="f1gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".3" stop-color="#f2cd72"/><stop offset=".55" stop-color="#d99a1f"/><stop offset=".78" stop-color="#f7dc8f"/><stop offset="1" stop-color="#c9930a"/></linearGradient> </defs> <path d="M66 20a13 13 0 0 1 10-8" fill="none" stroke="#c9930a" stroke-width="4" stroke-linecap="round"/> <path d="M71.5 20a7 7 0 0 1 5-4.4" fill="none" stroke="#c9930a" stroke-width="4" stroke-linecap="round"/> <circle cx="79" cy="21" r="3.2" fill="#c9930a"/> <path d="M18 26h44l16 16v24a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V30a4 4 0 0 1 4-4Z" fill="url(#f1gf)" stroke="#111111" stroke-width="5" stroke-linejoin="round"/> <path d="M18 26h44l16 16v6L20 34a8 8 0 0 1-6-6Z" fill="#ffffff" opacity=".14"/> <g transform="translate(23,39)"> <rect x="0" y="0" width="24" height="18" rx="3.4" fill="none" stroke="#c9930a" stroke-width="3"/> <rect x="3" y="2.8" width="18" height="12.4" rx="2.2" fill="none" stroke="#c9930a" stroke-width="2"/> <rect x="8.6" y="5.8" width="6.8" height="6.4" rx="1.4" fill="none" stroke="#c9930a" stroke-width="2"/> <path d="M3 9h5.6M15.4 9H21M12 2.8v3M12 12.2v3" stroke="#c9930a" stroke-width="2" fill="none"/> </g></svg><svg class="sb-fv sb-fv-dark" width="34" height="34" viewBox="0 0 96 96" aria-hidden="true"><defs> <linearGradient id="f2gf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".34"/><stop offset=".45" stop-color="#ffffff" stop-opacity=".10"/><stop offset="1" stop-color="#ffffff" stop-opacity=".22"/></linearGradient> <linearGradient id="f2gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".5" stop-color="#cfe9ff" stop-opacity=".5"/><stop offset="1" stop-color="#ffffff" stop-opacity=".7"/></linearGradient> <linearGradient id="f2gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".3" stop-color="#f2cd72"/><stop offset=".55" stop-color="#d99a1f"/><stop offset=".78" stop-color="#f7dc8f"/><stop offset="1" stop-color="#c9930a"/></linearGradient> </defs> <path d="M66 20a13 13 0 0 1 10-8" fill="none" stroke="#f2cd72" stroke-width="4" stroke-linecap="round"/> <path d="M71.5 20a7 7 0 0 1 5-4.4" fill="none" stroke="#f2cd72" stroke-width="4" stroke-linecap="round"/> <circle cx="79" cy="21" r="3.2" fill="#f2cd72"/> <path d="M18 26h44l16 16v24a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V30a4 4 0 0 1 4-4Z" fill="url(#f2gf)" stroke="#ffffff" stroke-width="5" stroke-linejoin="round"/> <path d="M18 26h44l16 16v6L20 34a8 8 0 0 1-6-6Z" fill="#ffffff" opacity=".14"/> <g transform="translate(23,39)"> <rect x="0" y="0" width="24" height="18" rx="3.4" fill="none" stroke="#f2cd72" stroke-width="3"/> <rect x="3" y="2.8" width="18" height="12.4" rx="2.2" fill="none" stroke="#f2cd72" stroke-width="2"/> <rect x="8.6" y="5.8" width="6.8" height="6.4" rx="1.4" fill="none" stroke="#f2cd72" stroke-width="2"/> <path d="M3 9h5.6M15.4 9H21M12 2.8v3M12 12.2v3" stroke="#f2cd72" stroke-width="2" fill="none"/> </g></svg>';
function layout(content, active){
  var tabs = NAVS.map(function(n){
    return '<a href="' + n.hash + '" class="' + (active === n.k ? 'on' : '') + '"><span class="ic">' + n.ic + '</span><span>' + t(n.label) + '</span></a>';
  }).join('');
  var side = NAVS.map(function(n){
    return '<a href="' + n.hash + '" class="' + (active === n.k ? 'on' : '') + '"><span class="ic">' + n.ic + '</span><span>' + t(n.label) + '</span></a>';
  }).join('');
  return '<div class="appwrap"><div class="sidebar"><div class="logo" style="display:flex;align-items:center;gap:9px;">' + SB_FAVICON + '<span>eSIMinder</span></div>' + side + '<div style="margin-top:auto;padding-top:16px;">' + EXT_LINKS + '</div></div>'
    + '<div class="page' + (active === 'home' ? '' : ' sub') + '" style="flex:1">' + content + '</div></div>'
    + '<div class="topbar"><button class="tb-btn" onclick="toggleLang()" aria-label="Language">' + (LANG === 'zh' ? 'EN' : '中文') + '</button>'
    + '<button class="tb-btn" onclick="toggleTheme()" aria-label="Theme">' + themeIconSvg() + '</button></div>'
    + '<div class="tabbar">' + tabs + '</div>';
}
function setView(html){ document.getElementById('app').innerHTML = html; window.scrollTo(0, 0); }
function skeleton(n){
  var h = '';
  for (var i = 0; i < (n || 3); i++) h += '<div class="skel" style="height:96px;margin-bottom:12px;"></div>';
  return h;
}
/* ---------- shared components ---------- */
function statusPill(ds){
  return '<span class="pill st-' + ds + '">' + statusDot() + ' ' + t('st_' + ds) + '</span>';
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
    + '<div class="top"><span class="flag">' + flagFor(e.country, 36, e.name + ' ' + (e.carrier || '') + ' ' + (e.provider || '')) + '</span>'
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
  modalOpen('<h3>' + icon('lock', 20) + ' ' + t('mustChangePw') + '</h3>'
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
  else toast('✕ ' + (d.error || 'error'));
}
/* ---------- dashboard ---------- */
async function renderDashboard(){
  setView(layout('<div class="pagetitle">' + greeting() + '</div><div class="pagesub">' + t('appSub') + '</div>' + skeleton(4), 'home'));
  var d = await api('GET', '/api/dashboard');
  if (!d.ok) return;
  S.dash = d;
  var h = '<div class="pagetitle">' + greeting() + '</div><div class="pagesub">' + t('myEsims') + '</div>';
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
  h += d.esims.length ? d.esims.slice(0, 6).map(esimCard).join('') : emptyState(icon('esim', 46), t('emptyEsims'));
  h += '<button class="fab" onclick="nav(\\'#/esim/new\\')">' + icon('plus', 26) + '</button>';
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
  setView(layout('<div class="pagetitle pt-tab">' + t('navEsims') + '</div>' + skeleton(4), 'esims'));
  var d = await api('GET', '/api/esims');
  if (!d.ok) return;
  var tags = await api('GET', '/api/tags');
  S.tags = tags.ok ? tags.tags : [];
  paintEsimList(d.items, q0);
}
function paintEsimList(items, q0){
  var q = q0.q || '', status = q0.status || '', tag = q0.tag || '';
  var h = '<div class="pagetitle pt-tab">' + t('navEsims') + '</div>';
  h += '<div class="searchbar"><span class="sic">' + icon('search', 19) + '</span><input type="text" id="q" placeholder="' + t('searchPh') + '" value="' + esc(q) + '"></div>';
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
  h += '<div id="elist">' + (list.length ? list.map(esimCard).join('') : emptyState(icon('search', 46), t('emptyEsims'))) + '</div>';
  h += '<button class="fab" onclick="nav(\\'#/esim/new\\')">' + icon('plus', 26) + '</button>';
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
  var h = '<button class="backbtn" onclick="nav(\\'#/esims\\')">' + icon('chev', 18) + t('back') + '</button>';
  h += '<div class="detailhead"><span class="flag">' + flagFor(e.country, 52, e.name + ' ' + (e.carrier || '') + ' ' + (e.provider || '')) + '</span><div>'
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
    h += '<div class="btnrow"><a class="btn block" href="' + esc(e.renewalUrl) + '" target="_blank" rel="noopener">' + t('goRenew') + ' ' + icon('external', 15) + '</a></div>';
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
  h += '<div class="btnrow"><button class="btn" onclick="openRenew(\\'' + e.id + '\\')">' + icon('refresh', 17) + ' ' + t('renewBtn') + '</button>'
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
    if (d.ok) { toast(t('deleted')); nav('#/esims'); } else toast('✕ error');
  });
}
/* ---------- renew (server-authoritative dates) ---------- */
async function openRenew(id){
  var pv = await api('POST', '/api/esims/' + encodeURIComponent(id) + '/renew/preview');
  if (!pv.ok) { toast(pv.error === 'no cycle' ? t('needCycle') : '✕ ' + (pv.error || 'error')); return; }
  var body = '<div class="card" style="box-shadow:none;margin:10px 0;">'
    + rowline(t('renewCurrent'), esc(pv.currentExpiresAt || '—'))
    + rowline(t('renewCycle'), t('detailCycleDays').replace('{n}', pv.cycleDays) + (pv.fromToday ? ' <span class="lbl">' + t('renewFromToday') + '</span>' : ''))
    + rowline('<b>' + t('renewNew') + '</b>', '<b style="color:var(--accent)">' + esc(pv.newExpiresAt) + '</b>')
    + '</div>';
  confirmModal(t('renewTitle'), body, t('confirmRenew'), async function(){
    var rid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
    var d = await api('POST', '/api/esims/' + encodeURIComponent(id) + '/renew', { requestId: rid });
    if (d.ok) { toast(t('renewed')); render(); } else toast('✕ ' + (d.error || 'error'));
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
  var h = '<button class="backbtn" onclick="history.back()">' + icon('chev', 18) + t('back') + '</button>'
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
      return '<span class="tagpill" data-tg="' + esc(x) + '">+' + esc(x) + '</span>';
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
  else toast('✕ ' + (d.error || 'error'));
}
/* ---------- notifications ---------- */
var CH_DEFS = [
  { k: 'telegram', ic: icon('send', 20), f: [['tg_token', 'password', 'Bot Token', '123456:ABC-DEF...'], ['tg_chat', 'text', 'Chat ID', '123456789']] },
  { k: 'wecom', ic: icon('chat', 20), f: [['wc_hook', 'text', 'Webhook', 'https://qyapi.weixin.qq.com/...']] },
  { k: 'dingtalk', ic: icon('pin', 20), f: [['dd_hook', 'text', 'Webhook', 'https://oapi.dingtalk.com/...'], ['dd_secret', 'password', 'Sign secret', 'SEC...']] },
  { k: 'feishu', ic: icon('feather', 20), f: [['fs_hook', 'text', 'Webhook', 'https://open.feishu.cn/...'], ['fs_secret', 'password', 'Sign secret', '']] },
  { k: 'bark', ic: icon('bellring', 20), f: [['bark_key', 'text', 'Key', 'xxxxxx']] },
  { k: 'serverchan', ic: icon('signal', 20), f: [['sc_key', 'password', 'SendKey', 'SCT...']] },
  { k: 'email', ic: icon('mail', 20), f: [['em_key', 'password', 'API Key', 're_...'], ['em_from', 'text', 'From', 'eSIMinder <noreply@example.com>'], ['em_to', 'text', 'To', 'you@example.com']] }
];
var CH_MAP = { telegram: [['botToken', 'tg_token'], ['chatId', 'tg_chat']], wecom: [['webhook', 'wc_hook']], dingtalk: [['webhook', 'dd_hook'], ['secret', 'dd_secret']], feishu: [['webhook', 'fs_hook'], ['secret', 'fs_secret']], bark: [['key', 'bark_key']], serverchan: [['sendKey', 'sc_key']], email: [['apiKey', 'em_key'], ['from', 'em_from'], ['to', 'em_to']] };
var CH_LABEL = { telegram: 'ch_telegram', wecom: 'ch_wecom', dingtalk: 'ch_dingtalk', feishu: 'ch_feishu', bark: 'ch_bark', serverchan: 'ch_serverchan', email: 'ch_email' };
async function renderNotifications(){
  setView(layout('<div class="pagetitle pt-tab">' + t('notifTitle') + '</div>' + skeleton(4), 'notifs'));
  var d = await api('GET', '/api/notifications?limit=100');
  if (!d.ok) return;
  var h = '<div class="pagetitle pt-tab">' + t('notifTitle') + '</div>';
  h += '<div class="card"><div style="display:flex;gap:8px;align-items:center;">'
    + '<select id="test_ch" style="margin:0;flex:1"></select>'
    + '<button class="btn sm" style="white-space:nowrap" onclick="doTest()">' + t('sendTest') + '</button></div></div>';
  if (!d.items.length) { h += emptyState(icon('belloff', 46), t('notifEmpty')); }
  else {
    var lastDay = '';
    d.items.forEach(function(n){
      var day = fmtDay(n.createdAt);
      if (day !== lastDay) { h += '<div class="dayhead">' + esc(day) + '</div>'; lastDay = day; }
      var okc = n.status === 'ok'
        ? '<span class="okic">✓ ' + t('notifSent') + '</span>'
        : '<span class="failic">✕ ' + t('notifFailed') + ' · ' + (n.kind === 'reminder' ? t('willRetry') : t('manualRetry')) + '</span>';
      var title = n.kind === 'test' ? t('kindTest') : t('kindReminder');
      h += '<div class="notif"><span class="nic">' + (n.status === 'ok' ? icon('mail', 28) : icon('alert', 28, 'color:var(--red)')) + '</span><div class="nb">'
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
  if (!d.ok) { toast('✕ error'); return; }
  if (!d.results.length) { toast(t('notifEmpty')); return; }
  toast(d.results.map(function(r){ return (r.ok ? '✓ ' : '✕ ') + r.channel; }).join(' '));
  render();
}
async function doRetry(id){
  var d = await api('POST', '/api/notifications/' + encodeURIComponent(id) + '/retry');
  toast(d.ok && d.sent ? '✓' : '✕ ' + (d.error || 'error'));
  render();
}
/* ---------- settings ---------- */
var TIMEZONES = ['Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Taipei', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Singapore', 'Asia/Bangkok', 'Asia/Dubai', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Australia/Sydney', 'Pacific/Auckland', 'UTC'];
async function renderSettings(){
  setView(layout('<div class="pagetitle pt-tab">' + t('navSettings') + '</div>' + skeleton(3), 'settings'));
  var d = await api('GET', '/api/settings');
  if (!d.ok) return;
  S.settings = d.settings;
  var st = d.settings;
  var h = '<div class="pagetitle pt-tab">' + t('navSettings') + '</div>';
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
  h += '<div style="margin:26px 0;">' + EXT_LINKS + '</div>';
  setView(layout(h, 'settings'));
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
var CH_PICK = '';
function chPick(k){
  CH_PICK = k;
  Array.prototype.forEach.call(document.querySelectorAll('#chwrap .ch[data-ch]'), function(d){
    d.style.display = d.getAttribute('data-ch') === k ? '' : 'none';
  });
}
function paintChannels(chStatus){
  var el = document.getElementById('chwrap');
  var pick = CH_PICK;
  if (!pick) { var fc = CH_DEFS.filter(function(c){ return chStatus[c.k]; })[0]; pick = fc ? fc.k : CH_DEFS[0].k; }
  var sel = '<div class="card" style="margin-bottom:12px;"><label class="f">' + (LANG === 'zh' ? '选择通道' : 'Channel') + '</label>'
    + '<select id="ch_pick" onchange="chPick(this.value)">'
    + CH_DEFS.map(function(c){ return '<option value="' + c.k + '"' + (pick === c.k ? ' selected' : '') + '>' + t(CH_LABEL[c.k]) + (chStatus[c.k] ? ' ✓' : '') + '</option>'; }).join('')
    + '</select></div>';
  el.innerHTML = sel + CH_DEFS.map(function(c){
    var ok = chStatus[c.k];
    var fs = c.f.map(function(f){
      var elId = f[0], field = EL_TO_FIELD[elId] || elId;
      var ck = c.k + '__' + field;
      var cleared = !!CH_CLEARED[ck];
      var h = '<label class="f">' + esc(f[2]);
      if (ok) h += ' <a href="javascript:void(0)" data-clear="' + ck + '" style="font-size:12px;">' + (cleared ? t('cancel') : t('clear')) + '</a>';
      h += '</label><input id="' + elId + '" type="' + f[1] + '" placeholder="' + esc(ok ? '✓ ' + t('configured') : f[3]) + '" autocomplete="off"' + (cleared ? ' disabled' : '') + '>';
      if (cleared) h += '<div style="color:var(--red);font-size:12px;margin:2px 0 6px;">' + t('clear') + '</div>';
      return h;
    }).join('');
    return '<div class="ch" data-ch="' + c.k + '"' + (pick === c.k ? '' : ' style="display:none"') + '><h4>' + c.ic + ' ' + t(CH_LABEL[c.k]) + (ok ? ' <span class="st">✓ ' + t('configured') + '</span>' : '') + '</h4>' + fs + '</div>';
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
  toast(d.ok ? '✓ ' + t('saved') : '✕ error');
}
async function doSaveChannels(){
  var d = await api('PUT', '/api/channels', { channels: collectChannels() });
  if (d.ok) { toast('✓ ' + t('saved')); render(); } else toast('✕ error');
}
async function doChangePw(){
  var np = document.getElementById('s_npw').value;
  if (np.length < 6) { toast(t('pwShort')); return; }
  var d = await api('POST', '/api/admin-password', { newPassword: np });
  if (d.ok) { toast(t('pwChanged')); setTimeout(function(){ location.href = '/'; }, 1000); }
  else toast('✕ error');
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
    document.getElementById('app').innerHTML = '<div style="padding:48px 24px;text-align:center;font-size:14px;color:#8e8e93;">' + esc(String((e && e.message) || e)) + '</div>';
  });
} catch (e) {
  document.getElementById('app').innerHTML = '<div style="padding:48px 24px;text-align:center;font-size:14px;color:#8e8e93;">' + esc(String((e && e.message) || e)) + '</div>';
}
`;
