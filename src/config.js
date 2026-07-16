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
