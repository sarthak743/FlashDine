import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRouter from './routes/auth';
import ordersRouter from './routes/orders';
import paymentsRouter from './routes/payments';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const localOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(helmet());

// CORS — allow the Vite dev server and any deployed frontend origin.
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
);

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (e.g., mobile apps, curl, same-origin)
      if (!origin || allowedOrigins.has(origin) || localOriginPattern.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

// Parse JSON bodies — use the raw body for the Razorpay webhook (needs raw buffer for HMAC).
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') {
    express.json({ type: '*/*' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
// Strict limit on admin login endpoint to prevent brute-force attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

// Standard API limit: 200 requests per minute per IP (covers both customers and admin).
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

// Slightly tighter limit for payment operations.
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment requests. Please slow down.' },
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/orders', apiLimiter, ordersRouter);
app.use('/api/payments', paymentLimiter, paymentsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`[FlashDine API] Listening on http://localhost:${PORT}`);
});

export default app;
