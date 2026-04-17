'use strict';

const express = require('express');
const { getMenuStock, upsertMenuStock } = require('../db/postgres');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// Public route to get menu stock for a restaurant
router.get('/stock/:restaurantId', async (req, res) => {
  try {
    const stock = await getMenuStock(req.params.restaurantId);
    // Convert to a dictionary for easy frontend access: { itemId: inStock }
    const stockMap = {};
    stock.forEach((row) => {
      stockMap[row.item_id] = row.in_stock;
    });
    res.json(stockMap);
  } catch (err) {
    console.error('[Menu] Fetch stock error:', err);
    res.status(500).json({ error: 'Failed to fetch menu stock' });
  }
});

// Admin-only route to update menu stock
router.post('/stock', requireAdmin, async (req, res) => {
  try {
    const { itemId, inStock } = req.body;
    // ensure req.user.restaurantId is used so an admin can only alter their own restaurant's stock
    const restaurantId = req.user.restaurantId;

    if (!itemId || typeof inStock !== 'boolean') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const updated = await upsertMenuStock(restaurantId, itemId, inStock);
    res.json({ success: true, itemId: updated.item_id, inStock: updated.in_stock });
  } catch (err) {
    console.error('[Menu] Update stock error:', err);
    res.status(500).json({ error: 'Failed to update menu stock' });
  }
});

module.exports = function registerMenuRoutes(app) {
  app.use('/api/menu', router);
};
