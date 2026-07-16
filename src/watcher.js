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
