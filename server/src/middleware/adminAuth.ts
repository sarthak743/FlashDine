import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Must stay in sync with the secret used in routes/auth.ts
const JWT_SIGNING_SECRET = process.env.JWT_SECRET || 'flashdine_dev_secret_do_not_use_in_production';

export interface AdminJWTPayload {
  role: 'admin';
  iat: number;
  exp: number;
}

/**
 * Express middleware that verifies the admin JWT in the Authorization header.
 * Usage: router.patch('/orders/:id/status', requireAdmin, handler)
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing admin token' });
    return;
  }

  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SIGNING_SECRET) as AdminJWTPayload;
    if (payload.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
