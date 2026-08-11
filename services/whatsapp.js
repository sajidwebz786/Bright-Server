function normalizeWhatsAppNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

async function sendWhatsAppText(to, body) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION;
  const recipient = normalizeWhatsAppNumber(to);

  if (!accessToken || !phoneNumberId || !apiVersion) {
    return { sent: false, skipped: true, reason: 'WhatsApp Business API is not configured' };
  }
  if (!recipient) {
    return { sent: false, skipped: true, reason: 'Recipient phone number is missing' };
  }

  const templateName = process.env.WHATSAPP_NOTIFICATION_TEMPLATE_NAME || process.env.WHATSAPP_PAYMENT_TEMPLATE_NAME;
  const payload = templateName ? {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'template',
    template: {
      name: templateName,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en' },
      components: [{ type: 'body', parameters: [{ type: 'text', text: body }] }]
    }
  } : {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: { preview_url: false, body }
  };

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error?.message || `WhatsApp API returned ${response.status}`);
  }
  return { sent: true, messageId: result?.messages?.[0]?.id, recipient };
}

async function sendWhatsAppNotifications({ customerPhone, customerMessage, adminMessage }) {
  const deliveries = [
    { audience: 'customer', recipient: normalizeWhatsAppNumber(customerPhone), message: customerMessage },
    { audience: 'admin', recipient: normalizeWhatsAppNumber(process.env.WHATSAPP_ADMIN_NUMBER), message: adminMessage }
  ].filter(item => item.recipient && item.message)
    .filter((item, index, list) => list.findIndex(other => other.recipient === item.recipient && other.message === item.message) === index);

  if (!deliveries.length) return [{ sent: false, skipped: true, reason: 'No WhatsApp recipients are configured' }];

  return Promise.all(deliveries.map(async ({ audience, recipient, message }) => {
    try {
      return { audience, ...await sendWhatsAppText(recipient, message) };
    } catch (error) {
      console.error(`WhatsApp ${audience} notification failed for ${recipient}:`, error.message);
      return { sent: false, audience, recipient, reason: error.message };
    }
  }));
}

async function sendPaymentWhatsAppNotifications({ customerPhone, message, customerMessage, adminMessage }) {
  return sendWhatsAppNotifications({
    customerPhone,
    customerMessage: customerMessage || message,
    adminMessage: adminMessage || message
  });
}

module.exports = { sendWhatsAppNotifications, sendPaymentWhatsAppNotifications };
