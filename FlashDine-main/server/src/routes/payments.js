'use strict';

const crypto     = require('crypto');
const { z }      = require('zod');
const { db }     = require('../db/index');

// Razorpay supports CommonJS via its main bundle.
const _Razorpay = require('razorpay');
const Razorpay  = _Razorpay.default || _Razorpay;

const RAZORPAY_KEY_ID       = process.env.RAZORPAY_KEY_ID       || '';
const RAZORPAY_KEY_SECRET   = process.env.RAZORPAY_KEY_SECRET   || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

// Razorpay is only active when both keys are configured.
const razorpayEnabled = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

let razorpay = null;
if (razorpayEnabled) {
  razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  console.log('[Payments] Razorpay initialized with key:', RAZORPAY_KEY_ID);
} else {
  console.log('[Payments] Razorpay keys not configured — UPI deep-link fallback will be used.');
}

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
const createOrderSchema = z.object({
  orderId: z.string(),
  amount:  z.number().positive(), // in INR (not paise)
});

const verifySchema = z.object({
  orderId:            z.string(),
  razorpayOrderId:    z.string(),
  razorpayPaymentId:  z.string(),
  razorpaySignature:  z.string(),
});

/**
 * Register payment routes on the app
 * @param {express.Application} app - Express app instance
 */
function registerPaymentRoutes(app) {
  /**
   * POST /api/payments/create-order
   * Creates a Razorpay order and returns the details to the frontend.
   */
  app.post('/api/payments/create-order', async (req, res) => {
  if (!razorpayEnabled || !razorpay) {
    res.status(503).json({ error: 'Payment gateway not configured', razorpayEnabled: false });
    return;
  }

  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'orderId and amount are required' });
    return;
  }

  const { orderId, amount } = parsed.data;

  try {
    const rpOrder = await razorpay.orders.create({
      amount:   Math.round(amount * 100), // paise
      currency: 'INR',
      receipt:  orderId,
      notes:    { flashdine_order_id: orderId },
    });

    db.prepare(
      'UPDATE orders SET razorpay_order_id = ?, updated_at = ? WHERE id = ?'
    ).run(rpOrder.id, Date.now(), orderId);

    res.json({
      razorpayOrderId: rpOrder.id,
      amount:          rpOrder.amount,   // paise
      currency:        rpOrder.currency,
      keyId:           RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[payments] create-order error:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

  /**
   * POST /api/payments/verify
   * Verifies Razorpay payment HMAC signature after checkout.js success callback.
   */
  app.post('/api/payments/verify', (req, res) => {
  if (!razorpayEnabled) {
    res.status(503).json({ error: 'Payment gateway not configured' });
    return;
  }

  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Missing payment verification fields' });
    return;
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  // HMAC-SHA256: key_secret + razorpay_order_id|razorpay_payment_id
  const body        = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSig = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSig !== razorpaySignature) {
    res.status(400).json({ error: 'Payment signature verification failed' });
    return;
  }

  const result = db.prepare(
    'UPDATE orders SET is_paid = 1, razorpay_payment_id = ?, updated_at = ? WHERE id = ?'
  ).run(razorpayPaymentId, Date.now(), orderId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  res.json({ success: true, orderId, razorpayPaymentId });
});

  /**
   * POST /api/payments/webhook
   * Razorpay webhook — reliable server-side payment confirmation.
   * Configure in Razorpay Dashboard → Settings → Webhooks.
   */
  app.post('/api/payments/webhook', (req, res) => {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    res.json({ status: 'ok' });
    return;
  }

  const signature = req.headers['x-razorpay-signature'];
  if (typeof signature !== 'string') {
    res.status(400).json({ error: 'Missing webhook signature' });
    return;
  }

  const expectedSig = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (expectedSig !== signature) {
    res.status(400).json({ error: 'Invalid webhook signature' });
    return;
  }

  const event = req.body;
  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    if (payment?.receipt && payment?.id) {
      db.prepare(
        'UPDATE orders SET is_paid = 1, razorpay_payment_id = ?, updated_at = ? WHERE id = ?'
      ).run(payment.id, Date.now(), payment.receipt);
      console.log(`[webhook] Payment captured for order ${payment.receipt}`);
    }
  }

  res.json({ status: 'ok' });
});

  /**
   * GET /api/payments/config  — returns public payment config to frontend
   */
  app.get('/api/payments/config', (_req, res) => {
    res.json({
      razorpayEnabled,
      keyId:        razorpayEnabled ? RAZORPAY_KEY_ID : null,
      merchantUpi:  process.env.MERCHANT_UPI  || 'flashdine@upi',
      merchantName: process.env.MERCHANT_NAME || 'FlashDine',
    });
  });
}

module.exports = registerPaymentRoutes;
