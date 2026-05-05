import { Request, Response, NextFunction } from 'express';

interface AuthenticatedAdminUser {
  role?: string;
  restaurantId?: string;
}

type AdminRequest = Request & {
  user?: AuthenticatedAdminUser;
  isAuthenticated?: () => boolean;
  adminRestaurantId?: string;
};

/**
 * Express middleware that verifies an authenticated admin session.
 * Usage: router.patch('/orders/:id/status', requireAdmin, handler)
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminReq = req as AdminRequest;
  if (!adminReq.isAuthenticated || !adminReq.isAuthenticated()) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!adminReq.user || adminReq.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  adminReq.adminRestaurantId = adminReq.user.restaurantId;
  next();
}
