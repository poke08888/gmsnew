# GMS Revenue Telegram Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A standalone Node process that watches the GMS `orders` collection via MongoDB change stream and posts a revenue + KPI report to a Telegram group on every new order.

**Architecture:** Single long-running Node service (pm2) connecting to MongoDB Atlas (`gms`). A change stream on `orders` (insert only) drives an `onInsert` handler that enriches the order, computes per-order revenue, today/month cumulative revenue (by `createdAt`, VN time), and per-channel monthly KPI progress (by `orderDate` + `listprice`, mirroring the GMS dashboard), then formats and sends a Telegram HTML message with retry. Pure calculation/formatting modules are unit-tested; DB queries and the change-stream loop are verified with a dry-run against live data.

**Tech Stack:** Node.js v22 (ESM), `mongodb` native driver (change streams + aggregation), global `fetch` for Telegram, Node built-in test runner (`node --test`), `node --env-file=.env` for secrets. Only runtime dependency: `mongodb`.

## Global Constraints

- Node.js ESM (`"type": "module"` in package.json). Target Node v22 (server has v22.23.1).
- Only runtime dependency allowed: `mongodb`. Everything else uses Node built-ins (`fetch`, `node:test`, `node:fs`, `Intl`). No `dotenv`, no `mongoose`, no `axios`, no telegram SDK.
- Secrets come only from environment (`.env`, chmod 600). Never hardcode Mongo URI / bot token / chat ID in source or tests.
- Timezone for all "today"/"month"/KPI-period boundaries: `Asia/Ho_Chi_Minh` = UTC+7 (no DST). Compute offsets explicitly (`VN_OFFSET_MS`); do not rely on the process TZ.
- Money: Vietnamese formatting via `Intl.NumberFormat('vi-VN')`. Per-order & cumulative shown as full VND (`đ`); KPI actual/target shown in billions (`tỷ`).
- Telegram messages use `parse_mode: 'HTML'`; all interpolated names must be HTML-escaped.
- Cumulative today/month = ALL orders (every brand/channel) filtered by `createdAt`. KPI actual = orders of the channel's partners filtered by `orderDate`, summed on `listprice × qty` (this is what the GMS dashboard does — do NOT use net/gross for KPI).
- `kpis.timeframe` is stored NON-zero-padded, e.g. `"2026-7"`. Parse by splitting on `-` and `Number()`.
- Order/partner/channel/brand/user `_id` values are strings (custom string ids), not ObjectIds — query with the raw string.

---

## File Structure

```
gms-revenue-bot/
├── package.json                 # ESM, mongodb dep, test/start/dry-run scripts
├── .env.example                 # documents required env vars (no real secrets)
├── .gitignore                   # node_modules, .env, .state
├── src/
│   ├── config.js                # loadConfig(env) -> validated config object
│   ├── revenue.js               # PURE: order sums, VN date ranges, KPI period math
│   ├── format.js                # PURE: escapeHtml, money/date formatting, buildMessage
│   ├── telegram.js              # createTelegram(token, chatId) -> { sendMessage } w/ retry
│   ├── db.js                    # connect() -> { client, db }
│   ├── queries.js               # fetchOrderContext, cumulativeByCreatedAt, channelKpiProgress
│   ├── message-data.js          # buildOrderMessageData(db, order, now) -> data for buildMessage
│   ├── watcher.js               # tokenStore(stateDir), runWatcher({db,store,onInsert})
│   └── index.js                 # bootstrap: config -> db -> telegram -> watcher
├── scripts/
│   └── dry-run.js               # compute+send report for the latest order (verification)
└── test/
    ├── config.test.js
    ├── revenue.test.js
    ├── format.test.js
    ├── telegram.test.js
    └── watcher.test.js          # tokenStore load/save only
```

---

### Task 1: Project scaffold + config module

**Files:**
- Create: `package.json`, `.env.example`, `.gitignore` (already exists — verify contents)
- Create: `src/config.js`
- Test: `test/config.test.js`

**Interfaces:**
- Produces: `loadConfig(env = process.env) -> { mongoUri, botToken, chatId, dbName, stateDir }`. Throws `Error` listing missing vars if any of `MONGODB_URI`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` are absent. `dbName` defaults to `'gms'`, `stateDir` defaults to `'.state'`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "gms-revenue-bot",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20.6.0" },
  "scripts": {
    "test": "node --test",
    "start": "node --env-file=.env src/index.js",
    "dry-run": "node --env-file=.env scripts/dry-run.js"
  },
  "dependencies": {
    "mongodb": "^6.10.0"
  }
}
```

- [ ] **Step 2: Create `.env.example`**

```bash
# MongoDB Atlas connection for the GMS database
MONGODB_URI=mongodb+srv://USER:PASS@cluster1-dinh.uxgbola.mongodb.net/gms?appName=Cluster1-dinh
# Telegram bot token from @BotFather
TELEGRAM_BOT_TOKEN=123456789:ABCdef...
# Target chat id (group "BM+ Nonelab" = -5166227019)
TELEGRAM_CHAT_ID=-5166227019
# Optional overrides
GMS_DB_NAME=gms
STATE_DIR=.state
```

- [ ] **Step 3: Verify `.gitignore` contains**

```
node_modules/
.env
.state/
*.log
```

- [ ] **Step 4: Write the failing test — `test/config.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

test('loadConfig returns config when all required vars present', () => {
  const cfg = loadConfig({
    MONGODB_URI: 'mongodb://x',
    TELEGRAM_BOT_TOKEN: 't',
    TELEGRAM_CHAT_ID: '-1',
  });
  assert.equal(cfg.mongoUri, 'mongodb://x');
  assert.equal(cfg.botToken, 't');
  assert.equal(cfg.chatId, '-1');
  assert.equal(cfg.dbName, 'gms');
  assert.equal(cfg.stateDir, '.state');
});

test('loadConfig throws listing all missing vars', () => {
  assert.throws(() => loadConfig({}), /MONGODB_URI.*TELEGRAM_BOT_TOKEN.*TELEGRAM_CHAT_ID/);
});

test('loadConfig honours optional overrides', () => {
  const cfg = loadConfig({
    MONGODB_URI: 'm', TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: 'c',
    GMS_DB_NAME: 'other', STATE_DIR: '/var/state',
  });
  assert.equal(cfg.dbName, 'other');
  assert.equal(cfg.stateDir, '/var/state');
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `node --test test/config.test.js`
Expected: FAIL — `Cannot find module '../src/config.js'`.

- [ ] **Step 6: Implement `src/config.js`**

```js
export function loadConfig(env = process.env) {
  const required = ['MONGODB_URI', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
  const missing = required.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  return {
    mongoUri: env.MONGODB_URI,
    botToken: env.TELEGRAM_BOT_TOKEN,
    chatId: env.TELEGRAM_CHAT_ID,
    dbName: env.GMS_DB_NAME || 'gms',
    stateDir: env.STATE_DIR || '.state',
  };
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `node --test test/config.test.js`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add package.json .env.example .gitignore src/config.js test/config.test.js
git commit -m "feat: scaffold project and config loader"
```

---

### Task 2: Revenue & KPI-period pure functions

**Files:**
- Create: `src/revenue.js`
- Test: `test/revenue.test.js`

**Interfaces:**
- Produces:
  - `VN_OFFSET_MS` = `25200000` (7h).
  - `orderNet(order) / orderGross(order) / orderList(order) -> number` — Σ(price × qty) over `order.items`, tolerant of missing items/fields.
  - `dayRangeVN(now: Date) -> { start: Date, end: Date }` — VN calendar day containing `now`.
  - `monthRangeVN(now: Date) -> { start: Date, end: Date }` — VN calendar month containing `now`.
  - `vnMonthLabel(now: Date) -> "MM/YYYY"`.
  - `kpiProgress(currentValue: number, amount: number) -> number` — `min(100, round(currentValue/amount*100, 2))`, `0` when amount ≤ 0.
  - `isCurrentPeriod(kpi, now) -> boolean` and `periodRangeVN(kpi, now) -> { start, end }` — mirror GMS dashboard logic for MONTH/QUARTER/YEAR.

- [ ] **Step 1: Write the failing test — `test/revenue.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VN_OFFSET_MS, orderNet, orderGross, orderList,
  dayRangeVN, monthRangeVN, vnMonthLabel, kpiProgress,
  isCurrentPeriod, periodRangeVN,
} from '../src/revenue.js';

const order = {
  items: [
    { qty: 2, netprice: 95194, grossprice: 102809.52, listprice: 149000 },
    { qty: 2, netprice: 0, grossprice: 0, listprice: 0 },
  ],
};

test('order sums multiply price by qty', () => {
  assert.equal(orderNet(order), 190388);
  assert.equal(orderGross(order), 205619.04);
  assert.equal(orderList(order), 298000);
});

test('order sums tolerate missing items', () => {
  assert.equal(orderNet({}), 0);
  assert.equal(orderGross({ items: [] }), 0);
});

test('dayRangeVN covers the VN calendar day', () => {
  // 2026-07-16T04:21:09Z is 11:21 VN on 2026-07-16
  const { start, end } = dayRangeVN(new Date('2026-07-16T04:21:09Z'));
  assert.equal(start.toISOString(), '2026-07-15T17:00:00.000Z'); // 2026-07-16 00:00 VN
  assert.equal(end.toISOString(), '2026-07-16T16:59:59.999Z');   // 2026-07-16 23:59:59.999 VN
});

test('dayRangeVN rolls to next VN day near UTC midnight', () => {
  // 2026-07-16T18:00:00Z is 2026-07-17 01:00 VN
  const { start } = dayRangeVN(new Date('2026-07-16T18:00:00Z'));
  assert.equal(start.toISOString(), '2026-07-16T17:00:00.000Z'); // 2026-07-17 00:00 VN
});

test('monthRangeVN covers the VN calendar month', () => {
  const { start, end } = monthRangeVN(new Date('2026-07-16T04:21:09Z'));
  assert.equal(start.toISOString(), '2026-06-30T17:00:00.000Z'); // 2026-07-01 00:00 VN
  assert.equal(end.toISOString(), '2026-07-31T16:59:59.999Z');   // 2026-07-31 23:59:59.999 VN
});

test('vnMonthLabel is zero-padded MM/YYYY', () => {
  assert.equal(vnMonthLabel(new Date('2026-07-16T04:21:09Z')), '07/2026');
});

test('kpiProgress caps at 100 and rounds to 2 decimals', () => {
  assert.equal(kpiProgress(1_950_000_000, 3_000_000_000), 65);
  assert.equal(kpiProgress(1, 3), 33.33);
  assert.equal(kpiProgress(5, 3), 100);
  assert.equal(kpiProgress(5, 0), 0);
});

test('isCurrentPeriod matches non-zero-padded MONTH timeframe', () => {
  const now = new Date('2026-07-16T04:21:09Z'); // VN July 2026
  assert.equal(isCurrentPeriod({ period: 'MONTH', timeframe: '2026-7' }, now), true);
  assert.equal(isCurrentPeriod({ period: 'MONTH', timeframe: '2026-6' }, now), false);
  assert.equal(isCurrentPeriod({ period: 'QUARTER', timeframe: '2026-9' }, now), true); // Q3
  assert.equal(isCurrentPeriod({ period: 'YEAR', timeframe: '2026-1' }, now), true);
});

test('periodRangeVN for MONTH equals monthRangeVN', () => {
  const now = new Date('2026-07-16T04:21:09Z');
  const r = periodRangeVN({ period: 'MONTH', timeframe: '2026-7' }, now);
  assert.equal(r.start.toISOString(), '2026-06-30T17:00:00.000Z');
  assert.equal(r.end.toISOString(), '2026-07-31T16:59:59.999Z');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/revenue.test.js`
Expected: FAIL — cannot find `../src/revenue.js`.

- [ ] **Step 3: Implement `src/revenue.js`**

```js
export const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function sumItems(order, field) {
  return (order?.items || []).reduce(
    (total, it) => total + (it?.[field] || 0) * (it?.qty || 0),
    0,
  );
}
export const orderNet = (order) => sumItems(order, 'netprice');
export const orderGross = (order) => sumItems(order, 'grossprice');
export const orderList = (order) => sumItems(order, 'listprice');

function vnParts(now) {
  const d = new Date(now.getTime() + VN_OFFSET_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
}

export function dayRangeVN(now) {
  const { y, m, d } = vnParts(now);
  const start = new Date(Date.UTC(y, m, d) - VN_OFFSET_MS);
  const end = new Date(Date.UTC(y, m, d + 1) - VN_OFFSET_MS - 1);
  return { start, end };
}

export function monthRangeVN(now) {
  const { y, m } = vnParts(now);
  const start = new Date(Date.UTC(y, m, 1) - VN_OFFSET_MS);
  const end = new Date(Date.UTC(y, m + 1, 1) - VN_OFFSET_MS - 1);
  return { start, end };
}

export function vnMonthLabel(now) {
  const { y, m } = vnParts(now);
  return `${String(m + 1).padStart(2, '0')}/${y}`;
}

export function kpiProgress(currentValue, amount) {
  if (!amount || amount <= 0) return 0;
  return Math.min(100, Math.round((currentValue / amount) * 10000) / 100);
}

function parseTimeframe(timeframe, now) {
  const vp = vnParts(now);
  const [yrStr, moStr] = String(timeframe || '').split('-');
  const year = Number(yrStr) || vp.y;
  const month = Number(moStr) || vp.m + 1;
  return { year, month };
}

export function isCurrentPeriod(kpi, now) {
  const vp = vnParts(now);
  const curYear = vp.y;
  const curMonth = vp.m + 1;
  const curQuarter = Math.floor((curMonth - 1) / 3) + 1;
  const { year, month } = parseTimeframe(kpi.timeframe, now);
  const quarter = Math.floor((month - 1) / 3) + 1;
  if (kpi.period === 'MONTH') return year === curYear && month === curMonth;
  if (kpi.period === 'QUARTER') return year === curYear && quarter === curQuarter;
  if (kpi.period === 'YEAR') return year === curYear;
  return false;
}

export function periodRangeVN(kpi, now) {
  const { year, month } = parseTimeframe(kpi.timeframe, now);
  let startMonth;
  let endMonth;
  if (kpi.period === 'MONTH') {
    startMonth = month;
    endMonth = month;
  } else if (kpi.period === 'QUARTER') {
    endMonth = month;
    startMonth = month - 2;
  } else {
    startMonth = 1;
    endMonth = 12;
  }
  const start = new Date(Date.UTC(year, startMonth - 1, 1) - VN_OFFSET_MS);
  const end = new Date(Date.UTC(year, endMonth, 1) - VN_OFFSET_MS - 1);
  return { start, end };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/revenue.test.js`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/revenue.js test/revenue.test.js
git commit -m "feat: revenue sums and VN date/KPI-period math"
```

---

### Task 3: Message formatting

**Files:**
- Create: `src/format.js`
- Test: `test/format.test.js`

**Interfaces:**
- Consumes: nothing from other tasks (pure).
- Produces:
  - `escapeHtml(s) -> string`
  - `formatVND(n) -> string` e.g. `"190.388đ"`
  - `formatTy(n) -> string` e.g. `"3 tỷ"`, `"4,25 tỷ"`
  - `formatDateTimeVN(date) -> "DD/MM/YYYY HH:mm"` (VN time)
  - `buildMessage(data) -> string` (Telegram HTML). `data` shape:
    `{ orderCode, brandName, channelName, partnerName, userName, createdAt: Date, itemCount, unitCount, orderNet, orderGross, today: {net,gross}, month: {net,gross}, monthLabel, kpis: [{channelName, progress, currentValue, amount, isOrderChannel}] }`

- [ ] **Step 1: Write the failing test — `test/format.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml, formatVND, formatTy, formatDateTimeVN, buildMessage,
} from '../src/format.js';

test('escapeHtml escapes angle brackets and ampersand', () => {
  assert.equal(escapeHtml('A & <B>'), 'A &amp; &lt;B&gt;');
  assert.equal(escapeHtml(null), '');
});

test('formatVND uses vi-VN grouping and rounds', () => {
  assert.equal(formatVND(190388), '190.388đ');
  assert.equal(formatVND(205619.04), '205.619đ');
});

test('formatTy shows billions', () => {
  assert.equal(formatTy(3_000_000_000), '3 tỷ');
  assert.equal(formatTy(4_250_000_000), '4,25 tỷ');
});

test('formatDateTimeVN renders VN wall clock', () => {
  assert.equal(formatDateTimeVN(new Date('2026-07-16T04:21:09Z')), '16/07/2026 11:21');
});

const data = {
  orderCode: 'Menow20260716852282',
  brandName: 'Menow', channelName: 'TikTok Shop', partnerName: 'ABC & Co',
  userName: 'Nguyễn Văn A', createdAt: new Date('2026-07-16T04:21:09Z'),
  itemCount: 2, unitCount: 4, orderNet: 190388, orderGross: 205619.04,
  today: { net: 190388, gross: 205619.04 },
  month: { net: 5_000_000, gross: 5_400_000 },
  monthLabel: '07/2026',
  kpis: [
    { channelName: 'TikTok Shop', progress: 65, currentValue: 1_950_000_000, amount: 3_000_000_000, isOrderChannel: true },
    { channelName: 'Shopee', progress: 42.3, currentValue: 1_800_000_000, amount: 4_250_000_000, isOrderChannel: false },
  ],
};

test('buildMessage includes order code, escaped partner, both revenues, and KPI lines', () => {
  const msg = buildMessage(data);
  assert.match(msg, /Menow20260716852282/);
  assert.match(msg, /ABC &amp; Co/);            // HTML-escaped
  assert.match(msg, /190\.388đ/);               // net
  assert.match(msg, /205\.619đ/);               // gross
  assert.match(msg, /07\/2026/);                // month label
  assert.match(msg, /⭐/);                       // order-channel marker
  assert.match(msg, /TikTok Shop/);
  assert.match(msg, /65/);                       // progress
});

test('buildMessage shows placeholder when no channel KPIs', () => {
  const msg = buildMessage({ ...data, kpis: [] });
  assert.match(msg, /Chưa đặt KPI/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/format.test.js`
Expected: FAIL — cannot find `../src/format.js`.

- [ ] **Step 3: Implement `src/format.js`**

```js
const VN_TZ = 'Asia/Ho_Chi_Minh';
const nfVND = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const nfTy = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const dtfVN = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TZ, day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: false,
});

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatVND(n) {
  return `${nfVND.format(Math.round(n || 0))}đ`;
}

export function formatTy(n) {
  return `${nfTy.format((n || 0) / 1e9)} tỷ`;
}

export function formatDateTimeVN(date) {
  // vi-VN gives "16/07/2026 11:21" (parts: dd/mm/yyyy, HH:mm)
  const parts = dtfVN.formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value || '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

function progressBar(progress) {
  const filled = Math.round((Math.min(100, progress) / 100) * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

export function buildMessage(d) {
  const lines = [];
  lines.push(`🛒 <b>ĐƠN HÀNG MỚI</b> — <code>${escapeHtml(d.orderCode)}</code>`);
  lines.push(`🏷 Brand: ${escapeHtml(d.brandName)} · Kênh: ${escapeHtml(d.channelName)} · Đối tác: ${escapeHtml(d.partnerName)}`);
  lines.push(`👤 NV: ${escapeHtml(d.userName)} · 🕒 ${formatDateTimeVN(d.createdAt)}`);
  lines.push('');
  lines.push(`📦 ${d.itemCount} mặt hàng · ${d.unitCount} sản phẩm`);
  lines.push(`💵 Doanh thu đơn: Net <b>${formatVND(d.orderNet)}</b> · Gross <b>${formatVND(d.orderGross)}</b>`);
  lines.push('');
  lines.push('📈 <b>Luỹ kế theo ngày tạo đơn (giờ VN)</b>');
  lines.push(`• Hôm nay: Net ${formatVND(d.today.net)} · Gross ${formatVND(d.today.gross)}`);
  lines.push(`• Tháng ${d.monthLabel}: Net ${formatVND(d.month.net)} · Gross ${formatVND(d.month.gross)}`);
  lines.push('');
  lines.push(`🎯 <b>Tiến độ KPI kênh — tháng ${d.monthLabel}</b>`);
  if (!d.kpis || d.kpis.length === 0) {
    lines.push('• Chưa đặt KPI kênh cho tháng này');
  } else {
    for (const k of d.kpis) {
      const mark = k.isOrderChannel ? '⭐' : '•';
      lines.push(
        `${mark} ${escapeHtml(k.channelName)}: <b>${nfTy.format(k.progress)}%</b> ` +
        `(${formatTy(k.currentValue)} / ${formatTy(k.amount)})`,
      );
      lines.push(`   <code>${progressBar(k.progress)}</code>`);
    }
  }
  return lines.join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/format.test.js`
Expected: PASS. (Note: `nfTy.format(65)` → `"65"`, matching `/65/`.)

- [ ] **Step 5: Commit**

```bash
git add src/format.js test/format.test.js
git commit -m "feat: Telegram HTML message formatting"
```

---

### Task 4: Telegram sender with retry

**Files:**
- Create: `src/telegram.js`
- Test: `test/telegram.test.js`

**Interfaces:**
- Produces: `createTelegram(botToken, chatId, { fetchFn = fetch, sleep } = {}) -> { sendMessage(text) -> Promise<object> }`. Posts to `sendMessage` API with `parse_mode: 'HTML'`, `disable_web_page_preview: true`. Retries up to 3 attempts on network error or `ok:false`, backoff `1s, 3s, 9s` via injectable `sleep`. Throws the last error after 3 failed attempts.

- [ ] **Step 1: Write the failing test — `test/telegram.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTelegram } from '../src/telegram.js';

const okResp = { ok: true, json: async () => ({ ok: true, result: { message_id: 1 } }) };

test('sendMessage posts HTML payload to correct URL', async () => {
  const calls = [];
  const fetchFn = async (url, opts) => { calls.push({ url, opts }); return okResp; };
  const tg = createTelegram('TOKEN', '-42', { fetchFn, sleep: async () => {} });
  await tg.sendMessage('hi');
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith('/botTOKEN/sendMessage'));
  const body = JSON.parse(calls[0].opts.body);
  assert.equal(body.chat_id, '-42');
  assert.equal(body.text, 'hi');
  assert.equal(body.parse_mode, 'HTML');
});

test('sendMessage retries then succeeds', async () => {
  let n = 0;
  const fetchFn = async () => {
    n += 1;
    if (n < 3) throw new Error('network');
    return okResp;
  };
  const waits = [];
  const tg = createTelegram('T', 'c', { fetchFn, sleep: async (ms) => waits.push(ms) });
  const res = await tg.sendMessage('x');
  assert.equal(res.ok, true);
  assert.equal(n, 3);
  assert.deepEqual(waits, [1000, 3000]);
});

test('sendMessage throws after 3 failures', async () => {
  const fetchFn = async () => ({ json: async () => ({ ok: false, description: 'bad' }) });
  const tg = createTelegram('T', 'c', { fetchFn, sleep: async () => {} });
  await assert.rejects(() => tg.sendMessage('x'), /bad/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/telegram.test.js`
Expected: FAIL — cannot find `../src/telegram.js`.

- [ ] **Step 3: Implement `src/telegram.js`**

```js
const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function createTelegram(botToken, chatId, { fetchFn = fetch, sleep = defaultSleep } = {}) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  async function sendMessage(text) {
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await sleep(1000 * 3 ** (attempt - 1)); // 1s, 3s before attempts 2,3
      try {
        const res = await fetchFn(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        });
        const data = await res.json();
        if (data.ok) return data;
        lastErr = new Error(`Telegram API error: ${data.description || 'unknown'}`);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr;
  }

  return { sendMessage };
}
```

> Note on backoff: sleeping BEFORE attempts 2 and 3 yields waits `[1000, 3000]` (matching the test), and caps at 3 attempts total.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/telegram.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/telegram.js test/telegram.test.js
git commit -m "feat: Telegram sender with retry/backoff"
```

---

### Task 5: DB connection + queries

**Files:**
- Create: `src/db.js`
- Create: `src/queries.js`

**Interfaces:**
- Consumes: `orderList`, `isCurrentPeriod`, `periodRangeVN`, `kpiProgress` from `src/revenue.js`.
- Produces:
  - `connect(mongoUri, dbName) -> Promise<{ client, db }>`
  - `fetchOrderContext(db, order) -> Promise<{ brandName, partnerName, userName, channelId, channelName }>`
  - `cumulativeByCreatedAt(db, { start, end }) -> Promise<{ net, gross }>`
  - `channelKpiProgress(db, now, orderChannelId) -> Promise<Array<{ channelId, channelName, amount, currentValue, progress, isOrderChannel }>>` — only `type:'Channel'`, `period:'MONTH'`, current period; deduped by channelId (keep highest amount); sorted by `progress` desc.

*(No unit test — these require live MongoDB; verified in Task 7's dry-run. Keep functions thin so correctness rests on the already-tested pure helpers.)*

- [ ] **Step 1: Implement `src/db.js`**

```js
import { MongoClient } from 'mongodb';

export async function connect(mongoUri, dbName) {
  const client = new MongoClient(mongoUri);
  await client.connect();
  return { client, db: client.db(dbName) };
}
```

- [ ] **Step 2: Implement `src/queries.js`**

```js
import { orderList, isCurrentPeriod, periodRangeVN, kpiProgress } from './revenue.js';

const netGrossFields = {
  net: { $sum: { $map: { input: '$items', as: 'i', in: { $multiply: ['$$i.netprice', '$$i.qty'] } } } },
  gross: { $sum: { $map: { input: '$items', as: 'i', in: { $multiply: ['$$i.grossprice', '$$i.qty'] } } } },
};

export async function fetchOrderContext(db, order) {
  const [brand, partner, user] = await Promise.all([
    db.collection('brands').findOne({ _id: order.brandId }),
    db.collection('partners').findOne({ _id: order.partnerId }),
    db.collection('users').findOne({ _id: order.userId }),
  ]);
  let channel = null;
  if (partner?.channelId) {
    channel = await db.collection('channels').findOne({ _id: partner.channelId });
  }
  return {
    brandName: brand?.name || '—',
    partnerName: partner?.name || '—',
    userName: user?.name || '—',
    channelId: partner?.channelId || null,
    channelName: channel?.name || '—',
  };
}

export async function cumulativeByCreatedAt(db, range) {
  const agg = await db.collection('orders').aggregate([
    { $match: { createdAt: { $gte: range.start, $lte: range.end } } },
    { $addFields: netGrossFields },
    { $group: { _id: null, net: { $sum: '$net' }, gross: { $sum: '$gross' } } },
  ]).toArray();
  return { net: agg[0]?.net || 0, gross: agg[0]?.gross || 0 };
}

export async function channelKpiProgress(db, now, orderChannelId) {
  const kpis = await db.collection('kpis')
    .find({ type: 'Channel', period: 'MONTH' })
    .toArray();
  const current = kpis.filter((k) => isCurrentPeriod(k, now));

  // Dedupe by channel, keep the highest target amount.
  const byChannel = new Map();
  for (const k of current) {
    const prev = byChannel.get(k.targetId);
    if (!prev || (k.amount || 0) > (prev.amount || 0)) byChannel.set(k.targetId, k);
  }

  const results = [];
  for (const kpi of byChannel.values()) {
    const range = periodRangeVN(kpi, now);
    const partnerIds = await db.collection('partners')
      .find({ channelId: kpi.targetId }).map((p) => p._id).toArray();
    const channel = await db.collection('channels').findOne({ _id: kpi.targetId });

    let currentValue = 0;
    if (partnerIds.length) {
      const agg = await db.collection('orders').aggregate([
        { $match: { orderDate: { $gte: range.start, $lte: range.end }, partnerId: { $in: partnerIds } } },
        { $addFields: { listRev: { $sum: { $map: { input: '$items', as: 'i', in: { $multiply: ['$$i.listprice', '$$i.qty'] } } } } } },
        { $group: { _id: null, total: { $sum: '$listRev' } } },
      ]).toArray();
      currentValue = agg[0]?.total || 0;
    }

    results.push({
      channelId: kpi.targetId,
      channelName: channel?.name || '—',
      amount: kpi.amount || 0,
      currentValue,
      progress: kpiProgress(currentValue, kpi.amount),
      isOrderChannel: kpi.targetId === orderChannelId,
    });
  }

  results.sort((a, b) => b.progress - a.progress);
  return results;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/db.js src/queries.js
git commit -m "feat: MongoDB connection and revenue/KPI queries"
```

---

### Task 6: Message-data assembly + change-stream watcher + bootstrap

**Files:**
- Create: `src/message-data.js`
- Create: `src/watcher.js`
- Create: `src/index.js`
- Test: `test/watcher.test.js` (tokenStore only)

**Interfaces:**
- Consumes: `fetchOrderContext`, `cumulativeByCreatedAt`, `channelKpiProgress` (queries.js); `orderNet`, `orderGross`, `dayRangeVN`, `monthRangeVN`, `vnMonthLabel` (revenue.js); `buildMessage` (format.js); `createTelegram` (telegram.js); `connect` (db.js); `loadConfig` (config.js).
- Produces:
  - `buildOrderMessageData(db, order, now) -> Promise<data>` (shape from Task 3).
  - `tokenStore(stateDir) -> { load(): token|null, save(token): void, clear(): void }`.
  - `runWatcher({ db, store, onInsert, logger }) -> Promise<never>` — resumable change-stream loop over `orders` inserts.

- [ ] **Step 1: Implement `src/message-data.js`**

```js
import { fetchOrderContext, cumulativeByCreatedAt, channelKpiProgress } from './queries.js';
import { orderNet, orderGross, dayRangeVN, monthRangeVN, vnMonthLabel } from './revenue.js';

export async function buildOrderMessageData(db, order, now) {
  const ctx = await fetchOrderContext(db, order);
  const [today, month, kpis] = await Promise.all([
    cumulativeByCreatedAt(db, dayRangeVN(now)),
    cumulativeByCreatedAt(db, monthRangeVN(now)),
    channelKpiProgress(db, now, ctx.channelId),
  ]);
  const items = order.items || [];
  return {
    orderCode: order.orderCode || order._id,
    brandName: ctx.brandName,
    channelName: ctx.channelName,
    partnerName: ctx.partnerName,
    userName: ctx.userName,
    createdAt: order.createdAt ? new Date(order.createdAt) : now,
    itemCount: items.length,
    unitCount: items.reduce((t, i) => t + (i.qty || 0), 0),
    orderNet: orderNet(order),
    orderGross: orderGross(order),
    today,
    month,
    monthLabel: vnMonthLabel(now),
    kpis,
  };
}
```

- [ ] **Step 2: Write the failing test — `test/watcher.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { tokenStore } from '../src/watcher.js';

test('tokenStore persists, loads and clears a resume token', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tok-'));
  const store = tokenStore(dir);
  assert.equal(store.load(), null);
  store.save({ _data: 'abc' });
  assert.deepEqual(store.load(), { _data: 'abc' });
  store.clear();
  assert.equal(store.load(), null);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test test/watcher.test.js`
Expected: FAIL — cannot find `../src/watcher.js`.

- [ ] **Step 4: Implement `src/watcher.js`**

```js
import fs from 'node:fs';
import path from 'node:path';

export function tokenStore(stateDir) {
  const file = path.join(stateDir, 'resume-token.json');
  return {
    load() {
      try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch {
        return null;
      }
    },
    save(token) {
      fs.mkdirSync(stateDir, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(token));
    },
    clear() {
      try { fs.unlinkSync(file); } catch { /* already gone */ }
    },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// MongoDB error codes meaning the resume token can no longer be used.
const UNRESUMABLE = new Set([286 /* ChangeStreamHistoryLost */, 260 /* invalid resume token */]);

export async function runWatcher({ db, store, onInsert, logger = console }) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const resumeAfter = store.load();
    const options = { fullDocument: 'default' };
    if (resumeAfter) options.resumeAfter = resumeAfter;

    const stream = db.collection('orders').watch(
      [{ $match: { operationType: 'insert' } }],
      options,
    );
    try {
      for await (const change of stream) {
        try {
          await onInsert(change.fullDocument);
        } catch (err) {
          logger.error(`onInsert failed for ${change.fullDocument?.orderCode}:`, err);
        }
        store.save(change._id);
      }
    } catch (err) {
      logger.error('change stream error:', err.message);
      if (UNRESUMABLE.has(err.code)) {
        logger.warn('resume token unusable, clearing and starting fresh');
        store.clear();
      }
      await sleep(5000);
    } finally {
      await stream.close().catch(() => {});
    }
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/watcher.test.js`
Expected: PASS.

- [ ] **Step 6: Implement `src/index.js`**

```js
import { loadConfig } from './config.js';
import { connect } from './db.js';
import { createTelegram } from './telegram.js';
import { tokenStore, runWatcher } from './watcher.js';
import { buildOrderMessageData } from './message-data.js';
import { buildMessage } from './format.js';

async function main() {
  const cfg = loadConfig();
  const { client, db } = await connect(cfg.mongoUri, cfg.dbName);
  const tg = createTelegram(cfg.botToken, cfg.chatId);
  const store = tokenStore(cfg.stateDir);

  async function onInsert(order) {
    if (!order) return;
    const data = await buildOrderMessageData(db, order, new Date());
    await tg.sendMessage(buildMessage(data));
    console.log(`[${new Date().toISOString()}] sent notification for order ${order.orderCode}`);
  }

  const shutdown = async (sig) => {
    console.log(`received ${sig}, shutting down`);
    await client.close().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  console.log('gms-revenue-bot started, watching orders for inserts…');
  await runWatcher({ db, store, onInsert });
}

main().catch((err) => {
  console.error('fatal:', err);
  process.exit(1);
});
```

- [ ] **Step 7: Run the full test suite**

Run: `node --test`
Expected: PASS — all suites (config, revenue, format, telegram, watcher).

- [ ] **Step 8: Commit**

```bash
git add src/message-data.js src/watcher.js src/index.js test/watcher.test.js
git commit -m "feat: message assembly, change-stream watcher, bootstrap"
```

---

### Task 7: Dry-run script, local verification, and deploy to server under pm2

**Files:**
- Create: `scripts/dry-run.js`
- Create: `README.md` (short run/deploy notes)

**Interfaces:**
- Consumes: everything above.
- Produces: `scripts/dry-run.js` — connects, takes the most recent order (or an `--order <orderCode>`), builds the message, and (unless `--print`) sends it to Telegram once, then exits. Used to eyeball numbers vs the GMS dashboard before going live.

- [ ] **Step 1: Implement `scripts/dry-run.js`**

```js
import { loadConfig } from '../src/config.js';
import { connect } from '../src/db.js';
import { createTelegram } from '../src/telegram.js';
import { buildOrderMessageData } from '../src/message-data.js';
import { buildMessage } from '../src/format.js';

async function run() {
  const printOnly = process.argv.includes('--print');
  const codeIdx = process.argv.indexOf('--order');
  const orderCode = codeIdx >= 0 ? process.argv[codeIdx + 1] : null;

  const cfg = loadConfig();
  const { client, db } = await connect(cfg.mongoUri, cfg.dbName);
  try {
    const order = orderCode
      ? await db.collection('orders').findOne({ orderCode })
      : (await db.collection('orders').find().sort({ createdAt: -1 }).limit(1).toArray())[0];
    if (!order) throw new Error('no order found');

    const data = await buildOrderMessageData(db, order, new Date());
    const msg = buildMessage(data);
    console.log('--- message preview ---\n' + msg + '\n-----------------------');

    if (!printOnly) {
      const tg = createTelegram(cfg.botToken, cfg.chatId);
      await tg.sendMessage('[DRY-RUN] ' + msg);
      console.log('sent to Telegram.');
    }
  } finally {
    await client.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Create `.env` locally (NOT committed) and print-only dry-run**

```bash
cat > .env <<'EOF'
MONGODB_URI=mongodb+srv://USER:PASS@cluster1-dinh.uxgbola.mongodb.net/gms?appName=Cluster1-dinh
TELEGRAM_BOT_TOKEN=<TELEGRAM_BOT_TOKEN>
TELEGRAM_CHAT_ID=-5166227019
EOF
chmod 600 .env
npm install
node --env-file=.env scripts/dry-run.js --print
```

Expected: prints a fully-populated message (real brand/channel/partner names, non-zero month cumulative, KPI lines with realistic %). Verify KPI % against the GMS dashboard for the current month.

- [ ] **Step 3: Live dry-run — send one message to the group**

```bash
node --env-file=.env scripts/dry-run.js
```

Expected: a `[DRY-RUN] …` message appears in the **BM+ Nonelab** group. Sanity-check numbers.

- [ ] **Step 4: Write `README.md`**

```markdown
# gms-revenue-bot

Watches the GMS `orders` collection (MongoDB Atlas change stream) and posts a
revenue + channel-KPI report to the Telegram group **BM+ Nonelab** on every new order.

## Run locally
    npm install
    cp .env.example .env   # fill in secrets
    npm test               # unit tests
    npm run dry-run -- --print   # preview against latest order, no send
    npm start              # start the watcher

## Deploy (server, pm2)
    pm2 start src/index.js --name gms-revenue-bot --node-args="--env-file=.env"
    pm2 save

Cumulative today/month use `createdAt` (VN time). KPI progress uses `orderDate` +
`listprice` to match the GMS dashboard.
```

- [ ] **Step 5: Commit**

```bash
git add scripts/dry-run.js README.md
git commit -m "feat: dry-run script and docs"
```

- [ ] **Step 6: Deploy to server**

```bash
# from local project root — copy source (exclude local .env, node_modules, .state, .git)
rsync -az --exclude node_modules --exclude .env --exclude .state --exclude .git \
  ./ root@150.95.104.255:/root/gms-revenue-bot/

# on the server: create .env, install deps, start under pm2
ssh root@150.95.104.255 '
  cd /root/gms-revenue-bot &&
  cat > .env <<EOF
MONGODB_URI=mongodb+srv://USER:PASS@cluster1-dinh.uxgbola.mongodb.net/gms?appName=Cluster1-dinh
TELEGRAM_BOT_TOKEN=<TELEGRAM_BOT_TOKEN>
TELEGRAM_CHAT_ID=-5166227019
TZ=Asia/Ho_Chi_Minh
EOF
  chmod 600 .env &&
  npm install --omit=dev &&
  pm2 start src/index.js --name gms-revenue-bot --node-args="--env-file=.env" &&
  pm2 save
'
```

Expected: `pm2 list` shows `gms-revenue-bot` **online**; startup log line "watching orders for inserts…".

- [ ] **Step 7: End-to-end verification with a real insert**

Insert a throwaway order that matches the schema, confirm the group receives a real (non-dry-run) message, then delete it.

```bash
ssh root@150.95.104.255 'docker exec nonelab-gms-1 node -e "
const m=require(\"mongoose\");
m.connect(process.env.MONGODB_URI||\"mongodb+srv://USER:PASS@cluster1-dinh.uxgbola.mongodb.net/gms?appName=Cluster1-dinh\").then(async()=>{
  const db=m.connection.db;
  const anyOrder=await db.collection(\"orders\").findOne({}, {sort:{createdAt:-1}});
  const doc={...anyOrder, _id:\"test-\"+Date.now(), orderCode:\"TEST-\"+Date.now(), createdAt:new Date(), orderDate:new Date()};
  await db.collection(\"orders\").insertOne(doc);
  console.log(\"inserted\", doc.orderCode);
  await new Promise(r=>setTimeout(r,8000));
  await db.collection(\"orders\").deleteOne({_id:doc._id});
  console.log(\"deleted\", doc.orderCode);
  process.exit(0);
});
"'
```

Expected: within a few seconds a message for `TEST-…` appears in the group; the row is then deleted. Confirm `pm2 logs gms-revenue-bot` shows the "sent notification" line.

- [ ] **Step 8: Final commit (if any tweaks were needed)**

```bash
git add -A
git commit -m "chore: deployment verified"
```

---

## Self-Review Notes

- **Spec coverage:** per-order Net+Gross (Task 2/3), today+month cumulative by `createdAt` VN (Task 2 ranges, Task 5 query, Task 6 assembly), all-channel monthly KPI % by `listprice`/`orderDate` (Task 2 period math, Task 5 `channelKpiProgress`), change-stream realtime + resume (Task 6), Telegram delivery w/ retry (Task 4), pm2 deploy + verification (Task 7). ✅
- **Secrets:** only in `.env` (gitignored), never in committed source or tests. Real secrets appear only in Task 7 shell steps that write `.env`, not in tracked files. ✅
- **Type consistency:** `buildOrderMessageData` output matches `buildMessage` input shape (orderCode, brand/channel/partner/user names, createdAt, itemCount, unitCount, orderNet, orderGross, today{net,gross}, month{net,gross}, monthLabel, kpis[{channelName,progress,currentValue,amount,isOrderChannel}]). `channelKpiProgress` returns exactly those kpi fields. ✅
- **KPI vs dashboard:** actual uses `listprice × qty` over `orderDate` range — matches `routes/dashboard/index.tsx`. `timeframe` parsed non-zero-padded. ✅
```
