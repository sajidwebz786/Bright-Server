const crypto = require('crypto');
const { Op } = require('sequelize');
const { TelegramConnection, Booking, Service } = require('../models');

const apiBase = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const configured = () => Boolean(process.env.TELEGRAM_BOT_TOKEN);

async function telegramRequest(method, payload = {}) {
  if (!configured()) return { ok: false, skipped: true, description: 'Telegram bot is not configured' };
  const response = await fetch(`${apiBase()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.description || `Telegram API returned ${response.status}`);
  return result;
}

async function sendTelegramText(chatId, text) {
  if (!chatId) return { sent: false, skipped: true, reason: 'Telegram chat is not connected' };
  const result = await telegramRequest('sendMessage', {
    chat_id: String(chatId),
    text: String(text).slice(0, 4096),
    disable_web_page_preview: true
  });
  if (result.skipped) return { sent: false, ...result };
  return { sent: true, chatId: String(chatId), messageId: result.result?.message_id };
}

async function findAdminChatId() {
  if (process.env.TELEGRAM_ADMIN_CHAT_ID) return process.env.TELEGRAM_ADMIN_CHAT_ID;
  const connection = await TelegramConnection.findOne({ where: { role: 'admin', isActive: true, chatId: { [Op.ne]: null } } });
  return connection?.chatId || null;
}

async function sendTelegramNotifications({ userId, customerMessage, adminMessage }) {
  const [customer, adminChatId] = await Promise.all([
    userId ? TelegramConnection.findOne({ where: { userId, role: 'customer', isActive: true } }) : null,
    findAdminChatId()
  ]);
  const deliveries = [
    { audience: 'customer', chatId: customer?.chatId, message: customerMessage },
    { audience: 'admin', chatId: adminChatId, message: adminMessage }
  ];
  return Promise.all(deliveries.map(async item => {
    if (!item.chatId || !item.message) return { sent: false, skipped: true, audience: item.audience, reason: 'Telegram chat is not connected' };
    try { return { audience: item.audience, ...await sendTelegramText(item.chatId, item.message) }; }
    catch (error) {
      console.error(`Telegram ${item.audience} notification failed:`, error.message);
      return { sent: false, audience: item.audience, reason: error.message };
    }
  }));
}

async function createConnectLink(userId, role = 'customer') {
  if (!configured()) throw new Error('Telegram bot is not configured');
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || (await telegramRequest('getMe')).result?.username;
  if (!botUsername) throw new Error('Telegram bot username could not be determined');
  const token = crypto.randomBytes(24).toString('base64url');
  const connectTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const connectTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await TelegramConnection.upsert({ userId, role, connectTokenHash, connectTokenExpiresAt, isActive: true });
  return `https://t.me/${botUsername.replace(/^@/, '')}?start=${role}_${token}`;
}

async function processTelegramUpdate(update) {
  const message = update?.message;
  if (!message?.chat?.id || !message.text) return;
  const chatId = String(message.chat.id);
  const telegramUserId = String(message.from?.id || '');
  const telegramUsername = message.from?.username || null;
  const text = message.text.trim();

  const connectionMatch = text.match(/^\/start (customer|admin)_([A-Za-z0-9_-]+)$/);
  if (connectionMatch) {
    const [, role, token] = connectionMatch;
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const connection = await TelegramConnection.findOne({
      where: { connectTokenHash: hash, connectTokenExpiresAt: { [Op.gt]: new Date() }, role }
    });
    if (!connection) return sendTelegramText(chatId, 'This connection link is invalid or expired. Please create a new link from your Bright Soul account.');
    await connection.update({ chatId, telegramUserId, telegramUsername, connectedAt: new Date(), connectTokenHash: null, connectTokenExpiresAt: null, isActive: true });
    return sendTelegramText(chatId, role === 'admin' ? 'Bright Soul admin alerts are now connected to this Telegram chat.' : 'Telegram alerts are now connected to your Bright Soul account. You will receive booking, timing, and payment updates here.');
  }

  if (text === '/stop') {
    await TelegramConnection.update({ isActive: false }, { where: { chatId } });
    return sendTelegramText(chatId, 'Bright Soul Telegram alerts have been paused. You can reconnect from your account at any time.');
  }

  if (text === '/start' || text === '/help') {
    return sendTelegramText(chatId, 'Welcome to Bright Soul Spa & Salon. Customers can connect alerts from their website account. Admins can use the private setup command supplied during deployment.');
  }
}

async function sendDueAppointmentReminders() {
  if (!configured()) return;
  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const startDate = now.toISOString().slice(0, 10);
  const endDate = horizon.toISOString().slice(0, 10);
  const bookings = await Booking.findAll({
    where: {
      status: 'confirmed', telegramReminderSentAt: null,
      bookingDate: { [Op.between]: [startDate, endDate] }
    },
    include: [{ model: Service, as: 'service' }]
  });
  for (const booking of bookings) {
    const appointment = new Date(`${booking.bookingDate}T${String(booking.bookingTime).slice(0, 8)}+05:30`);
    const hours = (appointment.getTime() - now.getTime()) / 3600000;
    if (hours < 23 || hours > 24.25) continue;
    const message = `Bright Soul appointment reminder\n\n${booking.service?.name || 'Spa service'}\nDate: ${booking.bookingDate}\nTime: ${String(booking.bookingTime).slice(0, 5)}\n\nPlease arrive 15 minutes early. We look forward to welcoming you.`;
    const result = await sendTelegramNotifications({ userId: booking.userId, customerMessage: message, adminMessage: null });
    if (result.some(item => item.audience === 'customer' && item.sent)) await booking.update({ telegramReminderSentAt: new Date() });
  }
}

async function configureTelegramWebhook() {
  if (!configured()) return { configured: false, skipped: true };
  const publicUrl = String(process.env.PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!publicUrl || !secret) return { configured: false, skipped: true, reason: 'PUBLIC_BACKEND_URL or TELEGRAM_WEBHOOK_SECRET is missing' };
  await telegramRequest('setWebhook', {
    url: `${publicUrl}/api/telegram/webhook`, secret_token: secret,
    allowed_updates: ['message'], drop_pending_updates: false
  });
  return { configured: true, url: `${publicUrl}/api/telegram/webhook` };
}

module.exports = {
  telegramRequest, sendTelegramText, sendTelegramNotifications, createConnectLink,
  processTelegramUpdate, sendDueAppointmentReminders, findAdminChatId, configureTelegramWebhook
};
