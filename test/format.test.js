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
