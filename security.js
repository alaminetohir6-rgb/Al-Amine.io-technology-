import crypto from 'node:crypto';

export function safeEqual(a = '', b = '') {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export function sign(value, secret) {
  const payload = Buffer.from(value).toString('base64url');
  const mac = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${mac}`;
}

export function verifySigned(value, secret) {
  if (!value || !secret) return null;
  const [payload, mac] = value.split('.');
  if (!payload || !mac) return null;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (!safeEqual(mac, expected)) return null;
  try { return Buffer.from(payload, 'base64url').toString(); } catch { return null; }
}
