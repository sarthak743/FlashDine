import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Store the database file next to the server directory so it persists across restarts.
const DB_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'flashdine.db');

// Ensure the data directory exists.
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// Schema migrations — run once on startup
// ---------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id               TEXT PRIMARY KEY,
    receipt_id       TEXT NOT NULL UNIQUE,
    table_id         TEXT NOT NULL,
    customer_name    TEXT NOT NULL,
    customer_phone   TEXT NOT NULL,
    customer_email   TEXT,
    items_json       TEXT NOT NULL,
    subtotal         REAL NOT NULL,
    tax              REAL NOT NULL,
    total            REAL NOT NULL,
    status           TEXT NOT NULL DEFAULT 'received',
    payment_method   TEXT NOT NULL,
    is_paid          INTEGER NOT NULL DEFAULT 0,
    estimated_time   INTEGER,
    razorpay_order_id   TEXT,
    razorpay_payment_id TEXT,
    receipt_banned_at   INTEGER,
    created_at       INTEGER NOT NULL,
    updated_at       INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS banned_receipts (
    receipt_id  TEXT PRIMARY KEY,
    banned_at   INTEGER NOT NULL
  );
`);

console.log(`[DB] SQLite database ready at ${DB_PATH}`);
