'use strict';

require('dotenv/config');

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const session   = require('express-session');
const _rateLimit = require('express-rate-limit');
const rateLimit  = _rateLimit.default || _rateLimit;
const passport  = require('passport');
const pgSession = require('connect-pg-simple').default || require('connect-pg-simple');

// Initialize session store - pass session module to pgSession
const SessionStore = pgSession(session);

const registerAuthRoutes     = require('./routes/auth');
const registerOrderRoutes    = require('./routes/orders');
const registerPaymentRoutes  = require('./routes/payments');
const registerMenuRoutes     = require('./routes/menu');

// Load Passport configuration
require('./config/passport');

// Initialize PostgreSQL
const { initializeSchema, seedDefaultRestaurants, getDbPool } = require('./db/postgres');

const app  = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// In dev, allow any localhost / 127.0.0.1 origin regardless of port.
const localOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
);

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------
app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || localOriginPattern.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies to be sent with requests
}));

// Keep raw body only for the Razorpay webhook (needs raw buffer for HMAC).
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') {
    express.json({ type: '*/*' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// ---------------------------------------------------------------------------
// Session configuration with PostgreSQL store
// ---------------------------------------------------------------------------
const sessionSecret = process.env.SESSION_SECRET || 'flashdine_session_secret_change_in_production';
const sessionConfig = {
  store: new SessionStore({
    pool: getDbPool(),
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    sameSite: 'lax',
  },
  name: 'flashdine.sid',
};

app.use(session(sessionConfig));

// ---------------------------------------------------------------------------
// Passport initialization and session management
// ---------------------------------------------------------------------------
app.use(passport.initialize());
app.use(passport.session());

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment requests. Please slow down.' },
});

// ---------------------------------------------------------------------------
// Apply rate limiting middleware to specific routes
// ---------------------------------------------------------------------------
// app.use('/api/auth', authLimiter);  // Login rate limiting removed
app.use('/api/orders', apiLimiter);
app.use('/api/payments', paymentLimiter);

// ---------------------------------------------------------------------------
// Register routes
// ---------------------------------------------------------------------------
registerAuthRoutes(app);
registerOrderRoutes(app);
registerPaymentRoutes(app);
registerMenuRoutes(app);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
(async () => {
  try {
    // Initialize PostgreSQL schema
    await initializeSchema();
    // Seed default restaurants
    await seedDefaultRestaurants();
    
    app.listen(PORT, () => {
      console.log(`[FlashDine API] Listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[FlashDine API] Failed to start:', err);
    process.exit(1);
  }
})();

module.exports = app;
