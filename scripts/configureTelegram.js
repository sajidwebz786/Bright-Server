require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function request(method, payload = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing');
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!result.ok) throw new Error(result.description || `Telegram returned ${response.status}`);
  return result.result;
}

async function main() {
  const publicUrl = String(process.env.PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!publicUrl) throw new Error('PUBLIC_BACKEND_URL is missing');
  if (!secret) throw new Error('TELEGRAM_WEBHOOK_SECRET is missing');
  const bot = await request('getMe');
  await request('setWebhook', {
    url: `${publicUrl}/api/telegram/webhook`, secret_token: secret,
    allowed_updates: ['message'], drop_pending_updates: false
  });
  const webhook = await request('getWebhookInfo');
  console.log(JSON.stringify({ botUsername: bot.username, webhookUrl: webhook.url, pendingUpdates: webhook.pending_update_count, lastError: webhook.last_error_message || null }, null, 2));
}

main().catch(error => { console.error(error.message); process.exit(1); });
