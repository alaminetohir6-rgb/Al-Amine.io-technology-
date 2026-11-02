import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { createDb } from './db.js';
import { sign, verifySigned, safeEqual } from './security.js';
import { classifyIncomingRequest } from './ai.js';
import { notifyOwnerWhatsApp } from './notifications.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const secret = process.env.SESSION_SECRET || 'development-only-change-me';
const db = createDb(process.env.DATABASE_PATH || './data/al-amine.sqlite');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
app.use(express.static(path.resolve(__dirname, '../public')));

const orderSchema = z.object({
  customerName: z.string().trim().min(1).max(100),
  contact: z.string().trim().min(3).max(100),
  service: z.string().trim().min(2).max(120),
  details: z.string().max(4000).optional().default('')
});

function requireOwner(req, res, next) {
  const username = verifySigned(req.cookies.owner_session, secret);
  if (!username || username !== process.env.OWNER_USERNAME) return res.status(401).json({ error: 'Owner login required.' });
  next();
}
function log(event, detail = '') {
  db.prepare('INSERT INTO activity(event, detail) VALUES (?, ?)').run(event, detail);
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'Al-Amine.io Internal AI starter' }));

app.post('/api/orders', async (req, res) => {
  const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!process.env.INTERNAL_API_TOKEN || !safeEqual(auth, process.env.INTERNAL_API_TOKEN)) {
    return res.status(401).json({ error: 'Invalid API token.' });
  }
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid order details.', issues: parsed.error.issues });
  const order = parsed.data;
  const result = db.prepare(`
    INSERT INTO orders(customer_name, contact, service, details)
    VALUES (@customerName, @contact, @service, @details)
  `).run(order);
  const route = await classifyIncomingRequest(order);
  log('New order received', `Order #${result.lastInsertRowid}; ${route.route}`);
  try {
    await notifyOwnerWhatsApp(`New Al-Amine.io order #${result.lastInsertRowid}\nCustomer: ${order.customerName}\nContact: ${order.contact}\nService: ${order.service}\nDetails: ${order.details || 'None'}`);
  } catch (error) {
    log('WhatsApp notification failed', error.message);
  }
  res.status(201).json({ id: result.lastInsertRowid, status: 'new', route });
});

app.post('/api/owner/login', (req, res) => {
  const username = String(req.body?.username || '');
  const password = String(req.body?.password || '');
  if (!safeEqual(username, process.env.OWNER_USERNAME || '') || !safeEqual(password, process.env.OWNER_PASSWORD || '')) {
    return res.status(401).json({ error: 'Incorrect login.' });
  }
  res.cookie('owner_session', sign(username, secret), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000 });
  res.json({ ok: true });
});
app.post('/api/owner/logout', (_req, res) => { res.clearCookie('owner_session'); res.json({ ok: true }); });
app.get('/api/owner/summary', requireOwner, (_req, res) => {
  const count = db.prepare('SELECT status, COUNT(*) AS total FROM orders GROUP BY status').all();
  const pending = db.prepare("SELECT COUNT(*) AS total FROM orders WHERE payment_status != 'verified'").get().total;
  res.json({ counts: count, paymentsNeedingReview: pending });
});
app.get('/api/owner/orders', requireOwner, (_req, res) => res.json(db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 100').all()));
app.get('/api/owner/activity', requireOwner, (_req, res) => res.json(db.prepare('SELECT * FROM activity ORDER BY id DESC LIMIT 100').all()));
app.post('/api/owner/orders/:id/approve', requireOwner, (req, res) => {
  const result = db.prepare("UPDATE orders SET status='approved' WHERE id=?").run(Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: 'Order not found.' });
  log('Order approved', `Order #${req.params.id}`);
  res.json({ ok: true });
});
app.post('/api/owner/orders/:id/payment-review', requireOwner, (req, res) => {
  const status = req.body?.status;
  if (!['verified', 'rejected', 'unverified'].includes(status)) return res.status(400).json({ error: 'Invalid payment status.' });
  const result = db.prepare('UPDATE orders SET payment_status=? WHERE id=?').run(status, Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: 'Order not found.' });
  log('Payment review updated', `Order #${req.params.id}: ${status}`);
  res.json({ ok: true });
});

app.get('/webhooks/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && safeEqual(String(token || ''), process.env.META_WEBHOOK_VERIFY_TOKEN || '')) return res.status(200).send(String(challenge || ''));
  res.sendStatus(403);
});
app.post('/webhooks/meta', (req, res) => {
  const appSecret = process.env.META_APP_SECRET;
  if (appSecret) {
    const signature = req.get('x-hub-signature-256') || '';
    const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(JSON.stringify(req.body)).digest('hex');
    if (!safeEqual(signature, expected)) return res.sendStatus(401);
  }
  log('Meta webhook received', 'Payload accepted for later event processing.');
  res.sendStatus(200);
});

app.get('*', (_req, res) => res.sendFile(path.resolve(__dirname, '../public/index.html')));
app.listen(port, () => console.log(`Al-Amine.io Internal AI starter listening on ${port}`));
