'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_DIR  = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'flashdine.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// WAL mode for better concurrent read performance.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Check if table exists
const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'").get();

if (!tableExists) {
  // Create fresh schema
  db.exec(`
    CREATE TABLE orders (
      id                  TEXT PRIMARY KEY,
      receipt_id          TEXT NOT NULL UNIQUE,
      token               INTEGER NOT NULL,
      table_id            TEXT NOT NULL,
      restaurant_id       TEXT DEFAULT 'default',
      customer_name       TEXT NOT NULL,
      customer_phone      TEXT NOT NULL,
      customer_email      TEXT,
      items_json          TEXT NOT NULL,
      subtotal            REAL NOT NULL,
      tax                 REAL NOT NULL,
      total               REAL NOT NULL,
      status              TEXT NOT NULL DEFAULT 'received',
      payment_method      TEXT NOT NULL,
      is_paid             INTEGER NOT NULL DEFAULT 0,
      estimated_time      INTEGER,
      razorpay_order_id   TEXT,
      razorpay_payment_id TEXT,
      receipt_banned_at   INTEGER,
      created_at          INTEGER NOT NULL,
      updated_at          INTEGER NOT NULL
    );

    CREATE TABLE banned_receipts (
      receipt_id  TEXT PRIMARY KEY,
      banned_at   INTEGER NOT NULL
    );
    
    CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
    CREATE INDEX idx_orders_restaurant_token ON orders(restaurant_id, token);
  `);
  console.log('[DB] Created fresh schema with restaurant_id support');
} else {
  // Check if restaurant_id column exists
  try {
    const columns = db.prepare("PRAGMA table_info(orders)").all();
    const hasRestaurantId = columns.some(col => col.name === 'restaurant_id');
    const hasToken = columns.some(col => col.name === 'token');
    
    if (!hasRestaurantId) {
      console.log('[DB] Migrating: Adding restaurant_id column to existing orders table...');
      db.exec('ALTER TABLE orders ADD COLUMN restaurant_id TEXT DEFAULT "default"');
      db.exec('CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id)');
      console.log('[DB] Migration completed successfully');
    }

    if (!hasToken) {
      console.log('[DB] Migrating: Adding token column to existing orders table...');
      db.exec('ALTER TABLE orders ADD COLUMN token INTEGER');

      const rows = db.prepare(`
        SELECT id, restaurant_id
        FROM orders
        ORDER BY COALESCE(restaurant_id, 'default') ASC, created_at ASC, id ASC
      `).all();

      const nextTokenByRestaurant = new Map();
      const updateToken = db.prepare('UPDATE orders SET token = ? WHERE id = ?');

      const migration = db.transaction(() => {
        for (const row of rows) {
          const restaurantId = row.restaurant_id || 'default';
          const nextToken = (nextTokenByRestaurant.get(restaurantId) || 0) + 1;
          nextTokenByRestaurant.set(restaurantId, nextToken);
          updateToken.run(nextToken, row.id);
        }
      });

      migration();
      db.exec('CREATE INDEX IF NOT EXISTS idx_orders_restaurant_token ON orders(restaurant_id, token)');
      console.log('[DB] Token migration completed successfully');
    }
  } catch (err) {
    console.warn('[DB] Migration check error:', err.message);
  }
}

// Create banned_receipts table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS banned_receipts (
    receipt_id  TEXT PRIMARY KEY,
    banned_at   INTEGER NOT NULL
  );
`);

console.log('[DB] SQLite database ready at ' + DB_PATH);

module.exports = { db };
