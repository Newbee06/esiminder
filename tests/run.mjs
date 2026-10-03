// eSIMinder V2.1 — real executable test suite (node:sqlite mocks D1).
// Run: npm test   (or: node tests/run.mjs)
import { DatabaseSync } from 'node:sqlite';

let pass = 0, fail = 0;
const results = [];
function ok(name, cond, extra = '') {
  if (cond) { pass++; results.push(`ok   ${name}`); }
  else { fail++; results.push(`FAIL ${name}${extra ? ' — ' + extra : ''}`); }
}

// ---------- mocks ----------
function makeD1() {
  const db = new DatabaseSync(':memory:');
  return {
    prepare(sql) {
      const s = db.prepare(sql);
      return {
        bind(...p) {
          return {
            all() { return { results: s.all(...p) }; },
            first() { const r = s.get(...p); return r === undefined ? null : r; },
            run() {
              const info = s.run(...p);
              return { success: true, meta: { changes: Number(info.changes) } };
            }
          };
        }
      };
    },
    async batch(stmts) {
      db.exec('BEGIN');
      try {
        const out = [];
        for (const st of stmts) out.push(st.run());
        db.exec('COMMIT');
        return out;
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    }
  };
}
function mockKV(init = {}) {
  const store = new Map(Object.entries(init));
  return {
    async get(k, type) { const v = store.get(k); if (v === undefined) return null; return type === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { store.set(k, typeof v === 'string' ? v : JSON.stringify(v)); },
    async delete(k) { store.delete(k); },
    async list({ prefix }) {
      return { keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true, cursor: '' };
    }
  };
}

const dbm = await import('../src/db.js');
await dbm.ensureSchema; // noop guard
const api = await import('../src/api.js');

// ---------- helpers ----------
async function setupEnv() {
  const env = { CFG: mockKV({ 'sess:s': JSON.stringify({ created: 1 }) }), DB: makeD1(), ADMIN_TOKEN: 'x' };
  await dbm.ensureSchema(env.DB);
  for (const [k, v] of [['reminderDays', '7,3,1,0'], ['timezone', 'Asia/Shanghai'], ['notifLang', 'zh'], ['pwChanged', '1']])
    await env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').bind(k, v).run();
  return env;
}
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
const shift = n => new Date(Date.parse(todayStr()) + n * 86400000).toLocaleDateString('en-CA');
async function addEsim(env, id, { expiresAt = '', cycleDays = 30, status = 'active' } = {}) {
  await env.DB.prepare(
    `INSERT INTO esims (id, name, country, region, carrier, phone, cycleDays, activatedAt, expiresAt,
      provider, renewalUrl, status, tags, note, createdAt, updatedAt, lastRenewedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, '卡' + id, '', '', '', '', cycleDays, '', expiresAt, '', '', status, '[]', '', 1, 1, 0).run();
}
const authed = (method, path, body) => new Request('https://x' + path, {
  method, headers: { Cookie: 'kb_session=s', 'Content-Type': 'application/json' },
  body: body ? JSON.stringify(body) : undefined
});

// ================= 1. 日期校验 =================
console.log('-- 日期校验 --');
ok('正常日期 2025-06-15', dbm.validDateStr('2025-06-15'));
ok('闰年 2024-02-29', dbm.validDateStr('2024-02-29'));
ok('非闰年 2025-02-28', dbm.validDateStr('2025-02-28'));
ok('拒绝 2024-02-30', !dbm.validDateStr('2024-02-30'));
ok('拒绝 2024-02-31', !dbm.validDateStr('2024-02-31'));
ok('拒绝 2025-02-29（非闰年）', !dbm.validDateStr('2025-02-29'));
ok('拒绝 2025-04-31', !dbm.validDateStr('2025-04-31'));
ok('拒绝 2025-13-01（非法月份）', !dbm.validDateStr('2025-13-01'));
ok('拒绝 2025-00-01', !dbm.validDateStr('2025-00-01'));
ok('拒绝空/格式错误', !dbm.validDateStr('') && !dbm.validDateStr('2025/06/15') && !dbm.validDateStr('abc'));

// ================= 2. 续费 =================
console.log('-- 续费 --');
{
  const env = await setupEnv();
  await addEsim(env, 'e1', { expiresAt: shift(17) });
  const r = await (await api.handleEsimRenew(authed('POST', '/api/esims/e1/renew', { requestId: 'r1' }), env, { id: 'e1' })).json();
  ok('正常续费：未过期从原到期日起算', r.ok && r.newExpiresAt === shift(47), JSON.stringify(r));
  const rec = await env.DB.prepare('SELECT COUNT(*) c FROM renewal_records').bind().first();
  ok('续费记录落库', rec.c === 1);
}
{
  const env = await setupEnv();
  await addEsim(env, 'e1', { expiresAt: shift(-32) });
  const r = await (await api.handleEsimRenew(authed('POST', '/api/esims/e1/renew', { requestId: 'r2' }), env, { id: 'e1' })).json();
  ok('已过期续费：从今天起算', r.ok && r.newExpiresAt === shift(30) && r.fromToday === true, JSON.stringify(r));
}
{
  const env = await setupEnv();
  await addEsim(env, 'e1', { expiresAt: '' });
  const r = await (await api.handleEsimRenew(authed('POST', '/api/esims/e1/renew', { requestId: 'r3' }), env, { id: 'e1' })).json();
  ok('无 expiresAt：从今天起算', r.ok && r.newExpiresAt === shift(30), JSON.stringify(r));
}
{
  const env = await setupEnv();
  await addEsim(env, 'e1', { expiresAt: shift(5), cycleDays: 0 });
  const r = await (await api.handleEsimRenew(authed('POST', '/api/esims/e1/renew', { requestId: 'r4' }), env, { id: 'e1' })).json();
  ok('cycleDays=0 拒绝', !r.ok && r.error === 'no cycle', JSON.stringify(r));
}
{
  // 幂等：同一 requestId 提交两次（顺序）
  const env = await setupEnv();
  await addEsim(env, 'e1', { expiresAt: shift(10) });
  const req = () => authed('POST', '/api/esims/e1/renew', { requestId: 'dup-1' });
  const r1 = await (await api.handleEsimRenew(req(), env, { id: 'e1' })).json();
  const r2 = await (await api.handleEsimRenew(req(), env, { id: 'e1' })).json();
  const cnt = await env.DB.prepare('SELECT COUNT(*) c FROM renewal_records').bind().first();
  const row = await env.DB.prepare('SELECT expiresAt FROM esims WHERE id=?').bind('e1').first();
  ok('重复 requestId：只续费一次', r1.ok && r2.ok && cnt.c === 1, `records=${cnt.c}`);
  ok('重复 requestId：返回第一次结果', r2.newExpiresAt === r1.newExpiresAt && r2.newExpiresAt === shift(40), JSON.stringify(r2));
  ok('重复 requestId：expiresAt 只延长一次', row.expiresAt === shift(40), row.expiresAt);
}
{
  // 测试 2：相同 requestId 并发
  const env = await setupEnv();
  await addEsim(env, 'e1', { expiresAt: shift(10) });
  const [a, b] = await Promise.all([
    api.handleEsimRenew(authed('POST', '/api/esims/e1/renew', { requestId: 'race-1' }), env, { id: 'e1' }).then(r => r.json()),
    api.handleEsimRenew(authed('POST', '/api/esims/e1/renew', { requestId: 'race-1' }), env, { id: 'e1' }).then(r => r.json())
  ]);
  const cnt = await env.DB.prepare('SELECT COUNT(*) c FROM renewal_records').bind().first();
  ok('测试2 相同 requestId 并发：只产生一次续费', a.ok && b.ok && cnt.c === 1, `records=${cnt.c} a=${a.newExpiresAt} b=${b.newExpiresAt}`);
  ok('测试2 相同 requestId 并发：两次结果一致', a.newExpiresAt === b.newExpiresAt && a.newExpiresAt === shift(40));
}
{
  // 测试 1：不同 requestId 并发续费 -> 一个成功，一个 409
  const env = await setupEnv();
  await addEsim(env, 'e1', { expiresAt: shift(10) });
  const [a, b] = await Promise.all([
    api.handleEsimRenew(authed('POST', '/api/esims/e1/renew', { requestId: 'race-a' }), env, { id: 'e1' }).then(async r => ({ status: r.status, body: await r.json() })),
    api.handleEsimRenew(authed('POST', '/api/esims/e1/renew', { requestId: 'race-b' }), env, { id: 'e1' }).then(async r => ({ status: r.status, body: await r.json() }))
  ]);
  const cnt = await env.DB.prepare('SELECT COUNT(*) c FROM renewal_records').bind().first();
  const row = await env.DB.prepare('SELECT expiresAt FROM esims WHERE id=?').bind('e1').first();
  const statuses = [a.status, b.status].sort().join(',');
  ok('测试1 不同 requestId 并发：一个成功一个409', statuses === '200,409', statuses);
  ok('测试1 不同 requestId 并发：renewal_records=1', cnt.c === 1, `records=${cnt.c}`);
  ok('测试1 不同 requestId 并发：expiresAt 只延长一次', row.expiresAt === shift(40), row.expiresAt);
}
{
  // 测试 3：requestId 跨 eSIM 重用 -> 409
  const env = await setupEnv();
  await addEsim(env, 'eA', { expiresAt: shift(10) });
  await addEsim(env, 'eB', { expiresAt: shift(10) });
  const rA = await (await api.handleEsimRenew(authed('POST', '/api/esims/eA/renew', { requestId: 'abc' }), env, { id: 'eA' }));
  const rB = await (await api.handleEsimRenew(authed('POST', '/api/esims/eB/renew', { requestId: 'abc' }), env, { id: 'eB' }));
  const bB = await rB.json();
  ok('测试3 跨 eSIM 重用 requestId：拒绝', rA.status === 200 && rB.status === 409 && bB.error.includes('another esim'), `A=${rA.status} B=${rB.status}`);
  const rowB = await env.DB.prepare('SELECT expiresAt FROM esims WHERE id=?').bind('eB').first();
  ok('测试3 跨 eSIM 重用：B 未被续费', rowB.expiresAt === shift(10), rowB.expiresAt);
}

// ================= 3. 配置 =================
console.log('-- 配置 --');
{
  const env = await setupEnv();
  const r = await (await api.handleSettingsPut(authed('PUT', '/api/settings', { reminderDays: '7,3,abc,1,hello,3,-5' }), env)).json();
  const v = await env.DB.prepare("SELECT value FROM settings WHERE key='reminderDays'").bind().first();
  ok('reminderDays：非数字/负数剔除、去重、排序', r.ok && v.value === '7,3,1', v.value);
}
{
  const env = await setupEnv();
  await (await api.handleSettingsPut(authed('PUT', '/api/settings', { reminderDays: '1,2,3,4,5,6,7,8,9,10,11,12,400' }), env)).json();
  const v = await env.DB.prepare("SELECT value FROM settings WHERE key='reminderDays'").bind().first();
  const parts = v.value.split(',').map(Number);
  ok('reminderDays：上限10个、阈值≤365', parts.length <= 10 && parts.every(n => n <= 365), v.value);
}
{
  const env = await setupEnv();
  const r = await (await api.handleSettingsPut(authed('PUT', '/api/settings', { timezone: 'America/New_York' }), env)).json();
  const v = await env.DB.prepare("SELECT value FROM settings WHERE key='timezone'").bind().first();
  ok('合法 timezone 通过', r.ok && v.value === 'America/New_York', v.value);
}
{
  const env = await setupEnv();
  const resp = await api.handleSettingsPut(authed('PUT', '/api/settings', { timezone: 'Mars/Olympus' }), env);
  const v = await env.DB.prepare("SELECT value FROM settings WHERE key='timezone'").bind().first();
  ok('非法 timezone 返回 400 且不写入', resp.status === 400 && v.value === 'Asia/Shanghai', `status=${resp.status} value=${v.value}`);
}

// ================= 4. 通知渠道 =================
console.log('-- 通知渠道 --');
const notifyMod = await import('../src/notify.js');
{
  // HTTP 状态码处理：错误信息包含状态码和 body 摘要
  const cases = [[400, 'chat not found'], [401, 'Unauthorized'], [429, 'Too Many'], [500, 'boom']];
  // 直接测 postJSON 行为：用 telegram 通道
  for (const [code, bodyText] of cases) {
    globalThis.fetch = async () => ({ ok: false, status: code, text: async () => bodyText });
    const m = await import('../src/notify.js');
    const res = await m.CHANNELS.find(([k]) => k === 'telegram')[1]({ botToken: 't', chatId: 'c' }, 'T', 'X');
    ok(`HTTP ${code} 错误信息可用`, !res.ok && res.error.includes('HTTP ' + code) && res.error.includes(bodyText),
      res.error);
  }
}
{
  // 错误 body 截断 240 字符
  globalThis.fetch = async () => ({ ok: false, status: 500, text: async () => 'E'.repeat(1000) });
  const m = await import('../src/notify.js');
  const res = await m.CHANNELS.find(([k]) => k === 'telegram')[1]({ botToken: 't', chatId: 'c' }, 'T', 'X');
  ok('错误 body 截断≤240字符', !res.ok && res.error.length <= ('HTTP 500: '.length + 240), `len=${res.error.length}`);
}
{
  // 超时：fetch 永远挂起，应在 ~10s 抛出 timeout
  globalThis.fetch = (url, opts) => new Promise((_, rej) => {
    if (opts && opts.signal) opts.signal.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });
  const m = await import('../src/notify.js');
  const t0 = Date.now();
  const res = await m.CHANNELS.find(([k]) => k === 'bark')[1]({ key: 'k' }, 'T', 'X');
  const dt = Date.now() - t0;
  ok('10s 超时中断挂起请求', !res.ok && res.error.includes('timeout') && dt >= 9500 && dt < 15000, `${res.error} ${dt}ms`);
}
{
  // HTTP 200 成功
  globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => '{}' });
  const m = await import('../src/notify.js');
  const res = await m.CHANNELS.find(([k]) => k === 'bark')[1]({ key: 'k' }, 'T', 'X');
  ok('HTTP 200 成功', res.ok === true);
}

// ================= 5. Cron D1 去重 =================
console.log('-- Cron D1 去重 --');
const cronMod = await import('../src/cron.js');
globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => '{}' });
async function cronEnv(channels) {
  const env = await setupEnv();
  await env.CFG.put('channels', JSON.stringify(channels));
  await env.CFG.put('dedup_migrated_v21', '1'); // skip KV migration in these tests
  return env;
}
const CH3 = { telegram: { botToken: 't', chatId: 'c' }, bark: { key: 'k' }, email: { apiKey: 'k', from: 'a@b', to: 'c@d' } };
{
  const env = await cronEnv(CH3);
  await addEsim(env, 'e1', { expiresAt: shift(2) });           // due: 7,3
  await addEsim(env, 'e2', { expiresAt: shift(2), status: 'inactive' });
  await addEsim(env, 'e3', { expiresAt: shift(2), status: 'disabled' });
  await addEsim(env, 'e4', { expiresAt: '' });                  // no expiry -> skip
  await addEsim(env, 'e5', { expiresAt: shift(30) });           // not due
  const r = await cronMod.handleCron(env);
  const rows = await env.DB.prepare("SELECT COUNT(*) c FROM notification_dedup WHERE status='sent'").bind().first();
  ok('Cron：只有 active 且到期 eSIM 发送', r.due === 1 && rows.c === 2 * 3, JSON.stringify(r) + ` sent_rows=${rows.c}`);
  const r2 = await cronMod.handleCron(env);
  const total = await env.DB.prepare('SELECT COUNT(*) c FROM notifications').bind().first();
  ok('Cron：成功后不重复发送', r2.due === 0 && total.c === 3, JSON.stringify(r2));
}
{
  // 失败重试：tg 失败，其余成功
  let failTg = true;
  globalThis.fetch = async (url) => {
    if (String(url).includes('api.telegram.org') && failTg) return { ok: false, status: 500, text: async () => 'tg down' };
    return { ok: true, status: 200, text: async () => '{}' };
  };
  const env = await cronEnv(CH3);
  await addEsim(env, 'e1', { expiresAt: shift(1) }); // due: 7,3,1
  await cronMod.handleCron(env);
  const failed = await env.DB.prepare("SELECT COUNT(*) c FROM notification_dedup WHERE status='failed'").bind().first();
  const sentN = await env.DB.prepare("SELECT COUNT(*) c FROM notification_dedup WHERE status='sent'").bind().first();
  ok('Cron：失败记 failed、成功记 sent', failed.c === 3 && sentN.c === 6, `failed=${failed.c} sent=${sentN.c}`);
  failTg = false;
  await cronMod.handleCron(env);
  const failed2 = await env.DB.prepare("SELECT COUNT(*) c FROM notification_dedup WHERE status='failed'").bind().first();
  const sent2 = await env.DB.prepare("SELECT COUNT(*) c FROM notification_dedup WHERE status='sent'").bind().first();
  ok('Cron：失败下次重试，成功不重发', failed2.c === 0 && sent2.c === 9, `failed=${failed2.c} sent=${sent2.c}`);
}
{
  // 并发 Cron：第二个抢不到 claim
  globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => '{}' });
  const env = await cronEnv(CH3);
  await addEsim(env, 'e1', { expiresAt: shift(0) }); // due: 7,3,1,0
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO notification_dedup (esim_id, threshold, channel, status, created_at, updated_at)
     VALUES ('e1', 7, 'telegram', 'sending', ?, ?)`
  ).bind(now, now).run();
  const r = await cronMod.handleCron(env);
  const tg7 = await env.DB.prepare(
    "SELECT status FROM notification_dedup WHERE esim_id='e1' AND threshold=7 AND channel='telegram'"
  ).bind().first();
  ok('Cron：新鲜 sending 行不被重复认领', tg7.status === 'sending', tg7.status);
  // stale sending（1小时前）可被认领
  await env.DB.prepare(
    "UPDATE notification_dedup SET updated_at=? WHERE esim_id='e1' AND threshold=7 AND channel='telegram'"
  ).bind(now - 7200 * 1000).run();
  await cronMod.handleCron(env);
  const tg7b = await env.DB.prepare(
    "SELECT status FROM notification_dedup WHERE esim_id='e1' AND threshold=7 AND channel='telegram'"
  ).bind().first();
  ok('Cron：过期 sending 行被认领并发送', tg7b.status === 'sent', tg7b.status);
  void r;
}
{
  // KV 旧数据迁移
  const env = await setupEnv();
  await env.CFG.put('channels', JSON.stringify(CH3));
  await env.CFG.put('state', JSON.stringify({ remindNotified: { e9: { '3': { telegram: true, bark: false } } } }));
  await addEsim(env, 'e9', { expiresAt: shift(2) });
  const r = await cronMod.handleCron(env);
  const tg = await env.DB.prepare(
    "SELECT status FROM notification_dedup WHERE esim_id='e9' AND threshold=3 AND channel='telegram'"
  ).bind().first();
  const migrated = await env.CFG.get('dedup_migrated_v21');
  ok('KV 迁移：已成功渠道记 sent', tg && tg.status === 'sent' && migrated === '1', JSON.stringify(tg));
  const barkLogs = await env.DB.prepare("SELECT COUNT(*) c FROM notifications WHERE channel='bark'").bind().first();
  ok('KV 迁移：未成功渠道继续发送', r.due >= 1 && barkLogs.c >= 1, `bark_logs=${barkLogs.c}`);
}

// ================= 6. V2.0 -> V2.1 migration =================
console.log('-- V2.1 migration --');
const migMod = await import('../src/migrate.js');
{
  // 测试 4：模拟 V2.0 老用户（migrated_v2=1，无 migrated_v21，无新表）
  const env = { CFG: mockKV({ migrated_v2: '1' }), DB: makeD1(), ADMIN_TOKEN: 'x' };
  // 故意不建新表，模拟老数据库
  await env.DB.prepare('CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT)').bind().run();
  await env.DB.prepare('CREATE TABLE esims (id TEXT PRIMARY KEY, name TEXT)').bind().run();
  await env.DB.prepare("INSERT INTO esims VALUES ('old1', '老卡')").bind().run();
  const r = await migMod.migrateV21IfNeeded(env);
  const t1 = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='notification_dedup'").bind().first();
  const t2 = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='renew_idempotency'").bind().first();
  const marker = await env.CFG.get('migrated_v21');
  const kept = await env.DB.prepare("SELECT name FROM esims WHERE id='old1'").bind().first();
  ok('测试4 V2.0升级：新表自动创建', r.ok && t1 && t2, JSON.stringify(r));
  ok('测试4 V2.0升级：标记写入', marker === '1');
  ok('测试4 V2.0升级：原有数据不丢失', kept && kept.name === '老卡');
}
{
  // 测试 5：重复执行 migration
  const env = { CFG: mockKV({ migrated_v2: '1' }), DB: makeD1(), ADMIN_TOKEN: 'x' };
  const r1 = await migMod.migrateV21IfNeeded(env);
  const r2 = await migMod.migrateV21IfNeeded(env);
  ok('测试5 migration 重复执行：都成功', r1.ok && r2.ok, `${r1.migrated}/${r2.migrated}`);
  ok('测试5 migration 重复执行：第二次跳过', r2.migrated === false);
  // cron 路径也能触发
  const env2 = { CFG: mockKV({ migrated_v2: '1' }), DB: makeD1(), ADMIN_TOKEN: 'x' };
  await dbm.ensureSchema(env2.DB);
  await cronMod.runScheduled(env2);
  const m2 = await env2.CFG.get('migrated_v21');
  ok('测试5 Cron 路径完成 V2.1 migration', m2 === '1');
}

// ================= 7. API 路由 =================
console.log('-- API 路由 --');
{
  const worker = (await import('../src/index.js')).default;
  const env = await setupEnv();
  const r404 = await worker.fetch(new Request('https://x/api/nope', { headers: { Cookie: 'kb_session=s' } }), env);
  ok('未知路由 404', r404.status === 404);
  const r401 = await worker.fetch(new Request('https://x/api/dashboard'), env);
  ok('未登录 401', r401.status === 401);
}

// ================= 汇总 =================
for (const line of results) console.log(line);
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
