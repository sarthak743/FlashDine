import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/index';
import { requireAdmin } from '../middleware/adminAuth';

const DEFAULT_RESTAURANT_ID = 'default';
const CAMPUS_DELIGHTS_ALIAS = 'campus-delights';

function normalizeRestaurantId(restaurantId?: string | null): string {
  if (!restaurantId) {
    return DEFAULT_RESTAURANT_ID;
  }

  const normalized = restaurantId.trim().toLowerCase();
  if (!normalized || normalized === CAMPUS_DELIGHTS_ALIAS) {
    return DEFAULT_RESTAURANT_ID;
  }

  return normalized;
}

const router = Router();

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const cartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().positive(),
  category: z.string().optional(),
  image: z.string().optional(),
  description: z.string().optional(),
  inStock: z.boolean().optional(),
  prepTime: z.number().optional(),
  isPopular: z.boolean().optional(),
});

const createOrderSchema = z.object({
  id: z.string(),
  receiptId: z.string(),
  tableId: z.string(),
  restaurantId: z.string().optional().default('default'),
  customerDetails: z.object({
    name: z.string().min(1),
    phone: z.string().min(10),
    email: z.string().email().optional(),
  }),
  items: z.array(cartItemSchema).min(1),
  subtotal: z.number().positive(),
  tax: z.number().nonnegative(),
  total: z.number().positive(),
  paymentMethod: z.enum(['upi']),
});

const updateStatusSchema = z.object({
  status: z.enum(['received', 'preparing', 'ready', 'completed']),
});

const setEstimatedTimeSchema = z.object({
  estimatedTime: z.number().int().positive(),
});

const banReceiptSchema = z.object({
  receiptId: z.string(),
});

// ---------------------------------------------------------------------------
// Helper: map DB row → Order object
// ---------------------------------------------------------------------------
function rowToOrder(row: Record<string, unknown>) {
  return {
    id: row.id,
    receiptId: row.receipt_id,
    restaurantId: row.restaurant_id,
    token: row.token,
    tableId: row.table_id,
    customerDetails: {
      name: row.customer_name,
      phone: row.customer_phone,
      email: row.customer_email ?? undefined,
    },
    items: JSON.parse(row.items_json as string),
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    status: row.status,
    paymentMethod: row.payment_method,
    isPaid: Boolean(row.is_paid),
    estimatedTime: row.estimated_time ?? undefined,
    razorpayOrderId: row.razorpay_order_id ?? undefined,
    razorpayPaymentId: row.razorpay_payment_id ?? undefined,
    receiptBannedAt: row.receipt_banned_at
      ? new Date(row.receipt_banned_at as number)
      : undefined,
    createdAt: new Date(row.created_at as number),
    updatedAt: new Date(row.updated_at as number),
  };
}

// ---------------------------------------------------------------------------
// POST /api/orders  — create a new order
// ---------------------------------------------------------------------------
router.post('/', (req: Request, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid order data', details: parsed.error.flatten() });
    return;
  }

  const { id, receiptId, tableId, customerDetails, items, subtotal, tax, total, paymentMethod } = parsed.data;
  const restaurantId = normalizeRestaurantId(parsed.data.restaurantId);
  const now = Date.now();

  try {
    const row = db.transaction(() => {
      const tokenRow = db.prepare(
        'SELECT COALESCE(MAX(token), 0) + 1 AS next_token FROM orders WHERE restaurant_id = ?'
      ).get(restaurantId) as { next_token: number };
      const token = tokenRow.next_token;

      db.prepare(`
        INSERT INTO orders
          (id, receipt_id, token, table_id, restaurant_id, customer_name, customer_phone, customer_email,
           items_json, subtotal, tax, total, status, payment_method, is_paid, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, 0, ?, ?)
      `).run(
        id,
        receiptId,
        token,
        tableId,
        restaurantId,
        customerDetails.name,
        customerDetails.phone,
        customerDetails.email ?? null,
        JSON.stringify(items),
        subtotal,
        tax,
        total,
        paymentMethod,
        now,
        now,
      );

      return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    })();

    res.status(201).json(rowToOrder(row));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Duplicate ID — return the existing order instead of erroring.
    if (message.includes('UNIQUE constraint')) {
      const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
      if (row) {
        res.status(200).json(rowToOrder(row));
        return;
      }
    }
    console.error('[orders] create error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/orders  — all orders (admin)
// ---------------------------------------------------------------------------
router.get('/', requireAdmin, (req: Request, res: Response) => {
  const requestedRestaurantId = typeof req.query.restaurantId === 'string' ? req.query.restaurantId : null;
  const restaurantId = normalizeRestaurantId(requestedRestaurantId);
  const rows = db.prepare('SELECT * FROM orders WHERE restaurant_id = ? ORDER BY token ASC, created_at ASC').all(restaurantId) as Record<string, unknown>[];
  res.json(rows.map(rowToOrder));
});

// ---------------------------------------------------------------------------
// GET /api/orders/:id  — single order (public — customer tracks their order)
// ---------------------------------------------------------------------------
router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(rowToOrder(row));
});

// ---------------------------------------------------------------------------
// PATCH /api/orders/:id/status  — update status (admin)
// ---------------------------------------------------------------------------
router.patch('/:id/status', requireAdmin, (req: Request, res: Response) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const result = db.prepare(
    'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?'
  ).run(parsed.data.status, Date.now(), req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json(rowToOrder(row));
});

// ---------------------------------------------------------------------------
// PATCH /api/orders/:id/estimated-time  — set prep time (admin)
// ---------------------------------------------------------------------------
router.patch('/:id/estimated-time', requireAdmin, (req: Request, res: Response) => {
  const parsed = setEstimatedTimeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid estimatedTime' });
    return;
  }

  const result = db.prepare(
    'UPDATE orders SET estimated_time = ?, updated_at = ? WHERE id = ?'
  ).run(parsed.data.estimatedTime, Date.now(), req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json(rowToOrder(row));
});

// ---------------------------------------------------------------------------
// PATCH /api/orders/:id/paid  — mark order as paid (called after payment verification)
// ---------------------------------------------------------------------------
router.patch('/:id/paid', (req: Request, res: Response) => {
  const razorpayPaymentId = typeof req.body.razorpayPaymentId === 'string'
    ? req.body.razorpayPaymentId
    : null;

  const result = db.prepare(
    'UPDATE orders SET is_paid = 1, razorpay_payment_id = ?, updated_at = ? WHERE id = ?'
  ).run(razorpayPaymentId, Date.now(), req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json(rowToOrder(row));
});

// ---------------------------------------------------------------------------
// POST /api/orders/ban-receipt  — ban a receipt (admin)
// ---------------------------------------------------------------------------
router.post('/ban-receipt', requireAdmin, (req: Request, res: Response) => {
  const parsed = banReceiptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'receiptId is required' });
    return;
  }

  const { receiptId } = parsed.data;
  const now = Date.now();

  db.prepare('INSERT OR REPLACE INTO banned_receipts (receipt_id, banned_at) VALUES (?, ?)').run(receiptId, now);
  db.prepare(
    'UPDATE orders SET receipt_banned_at = ?, updated_at = ? WHERE receipt_id = ?'
  ).run(now, now, receiptId);

  res.json({ success: true, receiptId });
});

// ---------------------------------------------------------------------------
// GET /api/orders/receipt-banned/:receiptId  — check if receipt is banned
// ---------------------------------------------------------------------------
router.get('/receipt-banned/:receiptId', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM banned_receipts WHERE receipt_id = ?').get(req.params.receiptId);
  res.json({ banned: !!row });
});

export default router;
