'use strict';

const passport = require('passport');
const { z } = require('zod');

const {
  getRestaurantById,
  createAdminManual,
} = require('../db/postgres');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const localOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
const configuredOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const DEFAULT_RESTAURANT_ID = process.env.DEFAULT_RESTAURANT_ID || 'default';
const CAMPUS_DELIGHTS_ALIAS = 'campus-delights';

function normalizeRestaurantId(value) {
  if (!value || typeof value !== 'string') {
    return DEFAULT_RESTAURANT_ID;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === CAMPUS_DELIGHTS_ALIAS) {
    return DEFAULT_RESTAURANT_ID;
  }

  return normalized;
}

function normalizeOrigin(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isAllowedFrontendOrigin(origin) {
  if (!origin) {
    return false;
  }
  return origin === FRONTEND_URL || configuredOrigins.has(origin) || localOriginPattern.test(origin);
}

function decodeGoogleState(stateValue) {
  if (!stateValue || typeof stateValue !== 'string') {
    return { mode: 'login', restaurantId: DEFAULT_RESTAURANT_ID, frontendOrigin: null, redirectPath: '/kitchen' };
  }

  try {
    const decoded = JSON.parse(Buffer.from(stateValue, 'base64url').toString('utf8'));
    const mode = decoded?.mode === 'register' ? 'register' : 'login';
    const restaurantId = normalizeRestaurantId(decoded?.restaurantId);
    const frontendOrigin = normalizeOrigin(decoded?.frontendOrigin);
    const redirectPath = typeof decoded?.redirectPath === 'string'
      && (decoded.redirectPath === '/admin-dashboard' || decoded.redirectPath === '/kitchen')
      ? decoded.redirectPath
      : '/kitchen';
    return { mode, restaurantId, frontendOrigin, redirectPath };
  } catch {
    return { mode: 'login', restaurantId: DEFAULT_RESTAURANT_ID, frontendOrigin: null, redirectPath: '/kitchen' };
  }
}

function resolveFrontendBase(req) {
  const stateRaw = (typeof req.query.state === 'string' ? req.query.state : null)
    || req.session?.googleAuthState
    || null;
  const state = decodeGoogleState(stateRaw);

  const candidates = [
    state.frontendOrigin,
    normalizeOrigin(req.get('origin')),
    normalizeOrigin(req.get('referer')),
  ];

  // Try to find a matched allowed origin, but if none match (e.g. strict CORS),
  // fallback to state.frontendOrigin if it exists, otherwise FRONTEND_URL.
  const matched = candidates.find(isAllowedFrontendOrigin);
  return matched || state.frontendOrigin || FRONTEND_URL;
}

function buildFrontendRedirect(req, pathWithHashAndQuery) {
  return `${resolveFrontendBase(req)}${pathWithHashAndQuery}`;
}

// Validation schemas
const manualLoginSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurant ID required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const googleLoginSchema = z.object({
  mode: z.literal('login'),
  restaurantId: z.string().optional(),
  redirectPath: z.string().optional(),
});

function hasGoogleStrategy() {
  return typeof passport._strategy === 'function' && !!passport._strategy('google');
}

function encodeGoogleState(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/**
 * Register authentication routes on the app
 * @param {express.Application} app - Express app instance
 */
function registerAuthRoutes(app) {

  /**
   * POST /api/auth/login/manual
   * Authenticate with email and password
   * Body: { restaurantId: string, email: string, password: string }
   * Returns: { success: true, user: { id, email, restaurantId } }
   */
  app.post('/api/auth/login/manual', async (req, res, next) => {
    const parsed = manualLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMsg = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      res.status(400).json({ error: `Validation error: ${errorMsg}` });
      return;
    }

    // Use Passport's local strategy
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('[auth] Authentication error:', err);
        return res.status(500).json({ error: 'Authentication error' });
      }

      if (!user) {
        return res.status(401).json({ error: info?.message || 'Authentication failed' });
      }

      // Establish a login session
      req.logIn(user, (err) => {
        if (err) {
          console.error('[auth] Login error:', err);
          return res.status(500).json({ error: 'Login failed' });
        }

        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            restaurantId: user.restaurantId,
          },
        });
      });
    })(req, res, next);
  });

  /**
   * POST /api/auth/login/google/initiate
   * Initiate Google OAuth for login or register.
   * Body: { mode: 'login' | 'register', restaurantId?: string }
   */
  app.post('/api/auth/login/google/initiate', async (req, res) => {
    const parsed = googleLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMsg = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return res.status(400).json({ error: `Validation error: ${errorMsg}` });
    }

    const { mode } = parsed.data;
    const restaurantId = normalizeRestaurantId(parsed.data.restaurantId);
    const redirectPath = parsed.data.redirectPath || '/kitchen';
    if (!hasGoogleStrategy()) {
      return res.status(503).json({
        error: 'Google authentication is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in server/.env.',
      });
    }

    const originFromRequest = normalizeOrigin(req.get('origin')) || normalizeOrigin(req.get('referer'));
    const frontendOrigin = originFromRequest || FRONTEND_URL;

    const state = encodeGoogleState({
      mode,
      restaurantId,
      frontendOrigin,
      redirectPath,
    });

    return res.json({ redirectUrl: `/api/auth/google?state=${encodeURIComponent(state)}` });
  });

  /**
   * GET /api/auth/google
   * Redirect to Google OAuth.
   */
  app.get('/api/auth/google', (req, res, next) => {
    if (!hasGoogleStrategy()) {
      return res.redirect(buildFrontendRedirect(req, '/#/admin-login?error=google_auth_not_configured'));
    }

    const { state } = req.query;
    if (!state || typeof state !== 'string') {
      return res.redirect(buildFrontendRedirect(req, '/#/admin-login?error=google_state_missing'));
    }

    req.session.googleAuthState = state;

    passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'select_account',
      state,
    })(req, res, next);
  });

  /**
   * GET /api/auth/google/callback
   * Handle Google callback and establish app session.
   */
  app.get('/api/auth/google/callback', (req, res, next) => {
    if (!hasGoogleStrategy()) {
      return res.redirect(buildFrontendRedirect(req, '/#/admin-login?error=google_auth_not_configured'));
    }

    passport.authenticate('google', (err, user, info) => {
      if (err) {
        console.error('[auth] Google auth error:', err);
        const errMessage = typeof err.message === 'string' && err.message.trim()
          ? err.message
          : 'Google authentication failed';
        return res.redirect(buildFrontendRedirect(req, `/#/admin-login?error=${encodeURIComponent(errMessage)}`));
      }

      if (!user) {
        const errorMessage = info?.message || 'Authentication failed';
        const attemptedEmail = info?.attempted_email;
        let redirectUrl = `/#/admin-login?error=${encodeURIComponent(errorMessage)}`;
        if (attemptedEmail) {
          redirectUrl += `&attempted_email=${encodeURIComponent(attemptedEmail)}`;
        }
        return res.redirect(buildFrontendRedirect(req, redirectUrl));
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('[auth] Google login error:', loginErr);
          return res.redirect(buildFrontendRedirect(req, '/#/admin-login?error=login_failed'));
        }

        const stateRaw = (typeof req.query.state === 'string' ? req.query.state : null)
          || req.session?.googleAuthState
          || null;
        const { redirectPath } = decodeGoogleState(stateRaw);
        return res.redirect(buildFrontendRedirect(req, `/#${redirectPath}`));
      });
    })(req, res, next);
  });

  /**
   * GET /api/auth/me
   * Get current authenticated user
   * Requires: Active session
   */
  app.get('/api/auth/me', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        restaurantId: req.user.restaurantId,
      },
    });
  });

  /**
   * POST /api/auth/verify
   * Verify if user is currently authenticated
   * Returns: { authenticated: boolean, user?: {...} }
   */
  app.post('/api/auth/verify', (_req, res) => {
    if (_req.isAuthenticated()) {
      res.json({
        authenticated: true,
        user: {
          id: _req.user.id,
          email: _req.user.email,
          restaurantId: _req.user.restaurantId,
        },
      });
    } else {
      res.status(401).json({ authenticated: false, error: 'Not authenticated' });
    }
  });

  /**
   * POST /api/auth/logout
   * Log out the current user
   */
  app.post('/api/auth/logout', (req, res) => {
    req.logOut((err) => {
      if (err) {
        console.error('[auth] Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }

      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
}

module.exports = registerAuthRoutes;
