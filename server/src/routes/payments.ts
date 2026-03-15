import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { db } from '../db/index';

const router = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

// Razorpay is only active when both keys are configured.
const razorpayEnabled = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

let razorpay: Razorpay | null = null;
if (razorpayEnabled) {
  razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  console.log('[Payments] Razorpay initialized with key:', RAZORPAY_KEY_ID);
} else {
  console.log('[Payments] Razorpay keys not configured — UPI deep-link fallback will be used.');
}

// Razorpay webhook payload types
interface RazorpayPaymentEntity {
  id: string;
  order_id?: string;
  receipt?: string;
  amount?: number;
  currency?: string;
  status?: string;
}

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
}
// ---------------------------------------------------------------------------
const createOrderSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(), // in INR (not paise)
});

const verifySchema = z.object({
  orderId: z.string(),                    // our internal FlashDine order ID
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

// ---------------------------------------------------------------------------
// POST /api/payments/create-order
// Creates a Razorpay order and returns the order details to the frontend.
// ---------------------------------------------------------------------------
router.post('/create-order', async (req: Request, res: Response) => {
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
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: orderId,
      notes: { flashdine_order_id: orderId },
    });

    // Store the Razorpay order ID against our order.
    db.prepare(
      'UPDATE orders SET razorpay_order_id = ?, updated_at = ? WHERE id = ?'
    ).run(rpOrder.id, Date.now(), orderId);

    res.json({
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,   // paise
      currency: rpOrder.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[payments] create-order error:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/payments/verify
// Verifies Razorpay payment signature after checkout.js success callback.
// ---------------------------------------------------------------------------
router.post('/verify', (req: Request, res: Response) => {
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

  // HMAC-SHA256 signature check: key_secret + razorpay_order_id|razorpay_payment_id
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSig = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSig !== razorpaySignature) {
    res.status(400).json({ error: 'Payment signature verification failed' });
    return;
  }

  // Mark order as paid in the DB.
  const result = db.prepare(
    'UPDATE orders SET is_paid = 1, razorpay_payment_id = ?, updated_at = ? WHERE id = ?'
  ).run(razorpayPaymentId, Date.now(), orderId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  res.json({ success: true, orderId, razorpayPaymentId });
});

// ---------------------------------------------------------------------------
// POST /api/payments/webhook
// Razorpay webhook endpoint — reliable server-side payment confirmation.
// Configure in Razorpay Dashboard → Settings → Webhooks.
// ---------------------------------------------------------------------------
router.post('/webhook', (req: Request, res: Response) => {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    // Webhook secret not configured — acknowledge without processing.
    res.json({ status: 'ok' });
    return;
  }

  const signature = req.headers['x-razorpay-signature'];
  if (typeof signature !== 'string') {
    res.status(400).json({ error: 'Missing webhook signature' });
    return;
  }

  // Verify webhook signature.
  const expectedSig = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (expectedSig !== signature) {
    res.status(400).json({ error: 'Invalid webhook signature' });
    return;
  }

  const event = req.body as RazorpayWebhookPayload;

  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    if (payment?.receipt && payment?.id) {
      const receipt = payment.receipt;
      const paymentId = payment.id;

      db.prepare(
        'UPDATE orders SET is_paid = 1, razorpay_payment_id = ?, updated_at = ? WHERE id = ?'
      ).run(paymentId, Date.now(), receipt);

      console.log(`[webhook] Payment captured for order ${receipt}`);
    }
  }

  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// GET /api/payments/config  — returns public Razorpay config to frontend
// ---------------------------------------------------------------------------
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    razorpayEnabled,
    keyId: razorpayEnabled ? RAZORPAY_KEY_ID : null,
    merchantUpi: process.env.MERCHANT_UPI || 'flashdine@upi',
    merchantName: process.env.MERCHANT_NAME || 'FlashDine',
  });
});

export default router;
