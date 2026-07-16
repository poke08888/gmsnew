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
