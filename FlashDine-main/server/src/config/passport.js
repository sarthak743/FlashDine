'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');

const {
  getAdminByEmailAndRestaurant,
  upsertAdminGoogle,
  getRestaurantById,
} = require('../db/postgres');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const DEFAULT_GOOGLE_CALLBACK_URL = `http://localhost:${process.env.PORT || '3001'}/api/auth/google/callback`;
const GOOGLE_CALLBACK_URL = (process.env.GOOGLE_CALLBACK_URL || DEFAULT_GOOGLE_CALLBACK_URL).trim();
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

function decodeGoogleState(stateValue) {
  if (!stateValue || typeof stateValue !== 'string') {
    return { restaurantId: DEFAULT_RESTAURANT_ID };
  }

  try {
    const decoded = JSON.parse(Buffer.from(stateValue, 'base64url').toString('utf8'));
    const restaurantId = normalizeRestaurantId(decoded?.restaurantId);
    return { restaurantId };
  } catch {
    return { restaurantId: DEFAULT_RESTAURANT_ID };
  }
}

/**
 * Local Strategy - Email & Password Authentication
 * Verify user with restaurantId, email, and password
 */
passport.use(
  'local',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        const { restaurantId } = req.body;

        if (!restaurantId) {
          return done(null, false, { message: 'Restaurant ID is required' });
        }

        // Verify restaurant exists
        const restaurant = await getRestaurantById(restaurantId);
        if (!restaurant) {
          return done(null, false, { message: 'Restaurant not found' });
        }

        // Get admin by email and restaurant
        const admin = await getAdminByEmailAndRestaurant(email, restaurantId);
        if (!admin) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!admin.password_hash) {
          return done(null, false, { message: 'Password login is not configured for this admin account' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Success - return user object with restaurantId
        return done(null, {
          id: admin.id,
          email: admin.email,
          restaurantId,
          role: 'admin',
        });
      } catch (err) {
        console.error('[passport] Local strategy error:', err);
        return done(err);
      }
    }
  )
);

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  console.log(`[passport] Google OAuth enabled: callbackURL=${GOOGLE_CALLBACK_URL}, clientID=${GOOGLE_CLIENT_ID.slice(0, 24)}...`);
  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const stateRaw = (typeof req.query.state === 'string' ? req.query.state : null)
            || req.session?.googleAuthState
            || null;
          const { restaurantId } = decodeGoogleState(stateRaw);

          const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
          if (!email) {
            return done(null, false, { message: 'Google account email is required' });
          }

          const admin = await upsertAdminGoogle(
            profile.id,
            email,
            restaurantId
          );

          return done(null, {
            id: admin.id,
            email: admin.email,
            restaurantId: admin.restaurant_id,
            role: 'admin',
          });
        } catch (err) {
          if (err && err.code === 'GOOGLE_NOT_REGISTERED') {
            return done(null, false, { 
              message: 'Selected Google email is not found for admin access.',
              attempted_email: err.attempted_email 
            });
          }
          if (err && err.code === '23505') {
            return done(null, false, { message: 'Restaurant already has an admin account.' });
          }
          console.error('[passport] Google strategy error:', err);
          return done(err);
        }
      }
    )
  );
} else {
  console.warn('[passport] Google OAuth disabled: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env');
}

/**
 * Serialize user for session storage
 * Sessions store only the user ID
 */
passport.serializeUser((user, done) => {
  // Store both user ID and restaurantId in session
  done(null, { id: user.id, restaurantId: user.restaurantId });
});

/**
 * Deserialize user from session
 * Restore full user object from database
 */
passport.deserializeUser(async (obj, done) => {
  try {
    // In a real app, you'd fetch the user from the database
    // For now, we'll reconstruct from session data
    // In production, verify the user still exists and has permissions
    done(null, {
      id: obj.id,
      restaurantId: obj.restaurantId,
      role: 'admin',
    });
  } catch (err) {
    console.error('[passport] Deserialize error:', err);
    done(err);
  }
});

module.exports = passport;
