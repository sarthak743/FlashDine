-- Migration: Add restaurant_id support to orders table
-- This script updates the SQLite orders table to track which restaurant each order belongs to

-- Since SQLite doesn't support ADD COLUMN with NOT NULL without a DEFAULT,
-- we'll add a column with a default value and then update existing records

ALTER TABLE orders ADD COLUMN restaurant_id TEXT DEFAULT 'default';

-- Create an index for faster restaurant_id lookups
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);

-- Update the schema to reflect the change
-- Note: For future orders, the restaurant_id should be passed when creating orders
-- and can be determined from the KDS session or order context

-- Verify the migration
SELECT COUNT(*) as total_orders, restaurant_id FROM orders GROUP BY restaurant_id;
