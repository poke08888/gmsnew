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
