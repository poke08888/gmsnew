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
