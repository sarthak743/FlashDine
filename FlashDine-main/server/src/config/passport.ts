import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import type { Request } from 'express';

import {
  getAdminByEmailAndRestaurant,
  upsertAdminGoogle,
  getRestaurantById,
} from '../db/postgres';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const DEFAULT_GOOGLE_CALLBACK_URL = `http://localhost:${process.env.PORT || '3001'}/api/auth/google/callback`;
const GOOGLE_CALLBACK_URL = (process.env.GOOGLE_CALLBACK_URL || DEFAULT_GOOGLE_CALLBACK_URL).trim();

function decodeGoogleState(stateValue: string | null) {
  if (!stateValue) {
    return { restaurantId: null as string | null };
  }

  try {
    const decoded = JSON.parse(Buffer.from(stateValue, 'base64url').toString('utf8')) as {
      restaurantId?: string | null;
    };
    const restaurantId = typeof decoded?.restaurantId === 'string' && decoded.restaurantId.trim()
      ? decoded.restaurantId
      : null;
    return { restaurantId };
  } catch {
    return { restaurantId: null as string | null };
  }
}

interface IUser {
  id: number;
  email: string;
  restaurantId: string;
  role: string;
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
      async (
        req: Request,
        _accessToken: string,
        _refreshToken: string,
        profile: { id: string; emails?: Array<{ value: string }> },
        done: (err: Error | null, user?: any, info?: { message?: string }) => void
      ) => {
        try {
          const requestWithSession = req as typeof req & {
            session?: { googleAuthState?: string };
            query: { state?: string | string[] };
          };

          const stateRaw =
            (typeof requestWithSession.query.state === 'string' ? requestWithSession.query.state : null)
            || requestWithSession.session?.googleAuthState
            || null;

          const { restaurantId } = decodeGoogleState(stateRaw);

          const email = profile.emails?.[0]?.value;
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
          if ((err as { code?: string })?.code === 'GOOGLE_NOT_REGISTERED') {
            return done(null, false, { 
              message: 'Selected Google email is not found for admin access.',
              attempted_email: (err as any).attempted_email 
            } as any);
          }
          if ((err as { code?: string })?.code === '23505') {
            return done(null, false, { message: 'Restaurant already has an admin account.' });
          }

          console.error('[passport] Google strategy error:', err);
          return done(err as Error);
        }
      }
    )
  );
} else {
  console.warn('[passport] Google OAuth disabled: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env');
}

/**
 * Serialize user for session storage
 * Sessions store only the user ID and restaurantId
 */
passport.serializeUser((user, done) => {
  const sessionUser = user as IUser;
  // Store both user ID and restaurantId in session
  done(null, { id: sessionUser.id, restaurantId: sessionUser.restaurantId });
});

/**
 * Deserialize user from session
 * Restore full user object from database
 */
passport.deserializeUser(async (obj: any, done) => {
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

export default passport;
