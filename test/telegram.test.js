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
