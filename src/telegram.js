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
