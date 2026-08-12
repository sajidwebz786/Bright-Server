const { TelegramConnection } = require('../models');
const { createConnectLink, processTelegramUpdate, telegramRequest, findAdminChatId } = require('../services/telegram');

exports.getTelegramStatus = async (req, res) => {
  try {
    const connection = await TelegramConnection.findOne({ where: { userId: req.user.id, role: 'customer', isActive: true } });
    res.json({ configured: Boolean(process.env.TELEGRAM_BOT_TOKEN), connected: Boolean(connection?.chatId), username: process.env.TELEGRAM_BOT_USERNAME || null });
  } catch (error) { res.status(500).json({ message: 'Unable to check Telegram connection', error: error.message }); }
};

exports.createTelegramConnectLink = async (req, res) => {
  try { res.json({ url: await createConnectLink(req.user.id, 'customer'), expiresInSeconds: 900 }); }
  catch (error) { res.status(503).json({ message: error.message }); }
};

exports.disconnectTelegram = async (req, res) => {
  await TelegramConnection.update({ isActive: false }, { where: { userId: req.user.id, role: 'customer' } });
  res.json({ message: 'Telegram alerts disconnected' });
};

exports.telegramWebhook = async (req, res) => {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET || '';
  const supplied = req.get('X-Telegram-Bot-Api-Secret-Token') || '';
  if (!expected || supplied !== expected) return res.sendStatus(401);
  res.sendStatus(200);
  processTelegramUpdate(req.body).catch(error => console.error('Telegram webhook processing failed:', error.message));
};

exports.getTelegramAdminStatus = async (_req, res) => {
  try {
    const chatId = await findAdminChatId();
    res.json({ configured: Boolean(process.env.TELEGRAM_BOT_TOKEN), connected: Boolean(chatId), username: process.env.TELEGRAM_BOT_USERNAME || null });
  } catch (error) { res.status(500).json({ message: 'Unable to check Telegram admin connection', error: error.message }); }
};

exports.createTelegramAdminConnectLink = async (req, res) => {
  try {
    await TelegramConnection.destroy({ where: { role: 'admin' } });
    res.json({ url: await createConnectLink(req.user.id, 'admin'), expiresInSeconds: 900 });
  } catch (error) { res.status(503).json({ message: error.message }); }
};

exports.testTelegramAdmin = async (_req, res) => {
  try {
    const chatId = await findAdminChatId();
    if (!chatId) return res.status(400).json({ message: 'Admin Telegram chat is not connected' });
    const result = await telegramRequest('sendMessage', { chat_id: chatId, text: 'Bright Soul Telegram integration test successful.' });
    res.json({ message: 'Test message sent', messageId: result.result?.message_id });
  } catch (error) { res.status(502).json({ message: 'Telegram test failed', error: error.message }); }
};
