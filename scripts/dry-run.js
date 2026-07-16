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
