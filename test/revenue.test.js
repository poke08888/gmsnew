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
