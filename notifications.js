export async function notifyOwnerWhatsApp(message, env = process.env) {
  const { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, OWNER_WHATSAPP_TO } = env;
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !OWNER_WHATSAPP_TO) {
    return { sent: false, reason: 'WhatsApp credentials are not configured.' };
  }
  const response = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: OWNER_WHATSAPP_TO,
      type: 'text',
      text: { body: message }
    })
  });
  if (!response.ok) throw new Error(`WhatsApp API returned ${response.status}`);
  return { sent: true };
}
