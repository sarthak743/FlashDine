'use strict';

/**
 * Middleware to ensure user is authenticated via session
 * Checks if user has an active session
 * Usage: router.patch('/orders/:id/status', requireAdmin, handler)
 */
function requireAdmin(req, res, next) {
  // Check if user is authenticated via Passport session
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Verify user has admin role (should always be true for authenticated users in this app)
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  // Attach restaurantId to request for use in route handlers
  req.adminRestaurantId = req.user.restaurantId;
  next();
}

/**
 * Middleware to ensure restaurantId matches the authenticated user's restaurantId
 * Usage: router.patch('/orders/:id/status', requireAdmin, verifyRestaurant, handler)
 */
function verifyRestaurant(req, res, next) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { restaurantId } = req.body || req.params || req.query;
  
  if (restaurantId && restaurantId !== req.user.restaurantId) {
    res.status(403).json({ error: 'Access denied: Restaurant mismatch' });
    return;
  }

  next();
}

module.exports = { requireAdmin, verifyRestaurant };
