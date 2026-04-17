/**
 * PostgreSQL Database Module
 * Handles admin authentication and restaurant-specific data
 */

'use strict';

const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'flashdine',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection errors
pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client', err);
});

/**
 * Initialize database schema on startup
 */
async function initializeSchema() {
  const client = await pool.connect();
  try {
    console.log('[PostgreSQL] Initializing schema...');

    // Create restaurants table (if not exists)
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cuisine VARCHAR(100),
        rating DECIMAL(2,1),
        delivery_time_min INTEGER,
        delivery_time_max INTEGER,
        min_order DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        restaurant_id VARCHAR(50) NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        oauth_google_id VARCHAR(255),
        oauth_google_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(restaurant_id, email)
      );
    `);

    // Create index on email for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
    `);

    // Migration safety for existing databases created before OAuth columns existed.
    await client.query(`
      ALTER TABLE admins
      ADD COLUMN IF NOT EXISTS oauth_google_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS oauth_google_email VARCHAR(255);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admins_oauth_google_id ON admins(oauth_google_id);
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_google_id_unique
      ON admins(oauth_google_id)
      WHERE oauth_google_id IS NOT NULL;
    `);

    // Create menu_stock table (if it doesn't exist)
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_stock (
        restaurant_id VARCHAR(50) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        item_id VARCHAR(50) NOT NULL,
        in_stock BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (restaurant_id, item_id)
      );
    `);

    console.log('[PostgreSQL] Schema initialized successfully');
  } catch (err) {
    console.error('[PostgreSQL] Schema initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get admin by email and restaurant_id
 */
async function getAdminByEmailAndRestaurant(email, restaurantId) {
  const result = await pool.query(
    `SELECT id, restaurant_id, email, password_hash, oauth_google_id, oauth_google_email
     FROM admins
     WHERE email = $1 AND restaurant_id = $2`,
    [email, restaurantId]
  );
  return result.rows[0] || null;
}

/**
 * Get admin by Google OAuth ID
 */
async function getAdminByGoogleId(googleId) {
  const result = await pool.query(
    `SELECT id, restaurant_id, email, password_hash, oauth_google_id, oauth_google_email
     FROM admins
     WHERE oauth_google_id = $1`,
    [googleId]
  );
  return result.rows[0] || null;
}

/**
 * Create or update admin with manual credentials
 */
async function upsertAdminManual(restaurantId, email, passwordHash) {
  const result = await pool.query(
    `INSERT INTO admins (restaurant_id, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (restaurant_id, email)
     DO UPDATE SET password_hash = $3, updated_at = CURRENT_TIMESTAMP
     RETURNING id, restaurant_id, email, password_hash`,
    [restaurantId, email, passwordHash]
  );
  return result.rows[0];
}

/**
 * Create admin with manual credentials
 */
async function createAdminManual(restaurantId, email, passwordHash) {
  const result = await pool.query(
    `INSERT INTO admins (restaurant_id, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, restaurant_id, email, password_hash`,
    [restaurantId, email, passwordHash]
  );
  return result.rows[0];
}

/**
 * Create or log in admin with Google OAuth.
 * - Login: existing Google account or existing email account can be linked.
 * - Register: requires restaurantId and creates a new admin row.
 */
async function upsertAdminGoogle(googleId, email, restaurantId, isRegistrationIntent = false) {
  const targetRestaurantId = restaurantId || 'default';
  const existingByGoogle = await getAdminByGoogleId(googleId);
  if (existingByGoogle) {
    const result = await pool.query(
      `UPDATE admins
       SET email = $1,
           oauth_google_email = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, restaurant_id, email, password_hash, oauth_google_id, oauth_google_email`,
      [email, email, existingByGoogle.id]
    );
    return result.rows[0];
  }

  if (!isRegistrationIntent) {
    // Login path: allow only emails that already exist in admins table.
    const existingByEmail = await pool.query(
      `SELECT id, restaurant_id, email, password_hash, oauth_google_id, oauth_google_email
       FROM admins
       WHERE email = $1
       ORDER BY CASE WHEN restaurant_id = $2 THEN 0 ELSE 1 END, created_at ASC
       LIMIT 1`,
      [email, targetRestaurantId]
    );

    if (existingByEmail.rows[0]) {
      const linked = await pool.query(
        `UPDATE admins
         SET oauth_google_id = $1,
             oauth_google_email = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, restaurant_id, email, password_hash, oauth_google_id, oauth_google_email`,
        [googleId, email, existingByEmail.rows[0].id]
      );
      return linked.rows[0];
    }

    const error = new Error('Selected Google email is not registered in FlashDine admins.');
    error.code = 'GOOGLE_NOT_REGISTERED';
    throw error;
  }

  if (!restaurantId) {
    const error = new Error('Restaurant ID is required for Google registration.');
    error.code = 'RESTAURANT_REQUIRED';
    throw error;
  }

  const result = await pool.query(
    `INSERT INTO admins (restaurant_id, email, password_hash, oauth_google_id, oauth_google_email)
     VALUES ($1, $2, NULL, $3, $4)
     RETURNING id, restaurant_id, email, password_hash, oauth_google_id, oauth_google_email`,
    [restaurantId, email, googleId, email]
  );
  return result.rows[0];
}

/**
 * Get restaurant by ID
 */
async function getRestaurantById(restaurantId) {
  const result = await pool.query(
    `SELECT * FROM restaurants WHERE id = $1`,
    [restaurantId]
  );
  return result.rows[0] || null;
}

/**
 * Get all stock statuses for a restaurant
 */
async function getMenuStock(restaurantId) {
  const result = await pool.query(
    `SELECT item_id, in_stock FROM menu_stock WHERE restaurant_id = $1`,
    [restaurantId]
  );
  return result.rows;
}

/**
 * Upsert stock status for an item
 */
async function upsertMenuStock(restaurantId, itemId, inStock) {
  const result = await pool.query(
    `INSERT INTO menu_stock (restaurant_id, item_id, in_stock)
     VALUES ($1, $2, $3)
     ON CONFLICT (restaurant_id, item_id)
     DO UPDATE SET in_stock = $3, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [restaurantId, itemId, inStock]
  );
  return result.rows[0];
}

/**
 * Create default restaurants if they don't exist
 */
async function seedDefaultRestaurants() {
  const defaultRestaurants = [
    {
      id: 'default',
      name: 'Campus Delights',
      description: 'Your favorite campus dining destination',
      cuisine: 'Multi-Cuisine',
      rating: 4.5,
      deliveryTimeMin: 10,
      deliveryTimeMax: 20,
      minOrder: 100,
    },
    {
      id: 'spice_house',
      name: 'Spice House',
      description: 'Authentic Indian flavors with a modern twist',
      cuisine: 'Indian',
      rating: 4.7,
      deliveryTimeMin: 15,
      deliveryTimeMax: 25,
      minOrder: 150,
    },
    {
      id: 'pizza_palace',
      name: 'Pizza Palace',
      description: 'Freshly baked pizzas and Italian delights',
      cuisine: 'Italian',
      rating: 4.6,
      deliveryTimeMin: 12,
      deliveryTimeMax: 22,
      minOrder: 200,
    },
    {
      id: 'fusion_hub',
      name: 'Fusion Hub',
      description: 'East meets West with innovative dishes',
      cuisine: 'Fusion',
      rating: 4.4,
      deliveryTimeMin: 20,
      deliveryTimeMax: 30,
      minOrder: 120,
    },
  ];

  const client = await pool.connect();
  try {
    for (const restaurant of defaultRestaurants) {
      await client.query(
        `INSERT INTO restaurants (id, name, description, cuisine, rating, delivery_time_min, delivery_time_max, min_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          restaurant.id,
          restaurant.name,
          restaurant.description,
          restaurant.cuisine,
          restaurant.rating,
          restaurant.deliveryTimeMin,
          restaurant.deliveryTimeMax,
          restaurant.minOrder,
        ]
      );
    }

    // Seed demo admins for local development (password = admin123)
    const demoAdminHash = '$2b$12$tLGQTao2RVkDuRhjc1Ba/uPUmYHU5wP3/0h7qI4JSC2VgL2qbpGme';
    const demoAdmins = [
      { restaurantId: 'default', email: 'admin@campus-delights.com' },
      { restaurantId: 'spice_house', email: 'admin@spice-house.com' },
      { restaurantId: 'pizza_palace', email: 'admin@pizza-palace.com' },
      { restaurantId: 'fusion_hub', email: 'admin@fusion-hub.com' },
    ];

    for (const admin of demoAdmins) {
      await client.query(
        `INSERT INTO admins (restaurant_id, email, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [admin.restaurantId, admin.email, demoAdminHash]
      );
    }

    console.log('[PostgreSQL] Default restaurants and demo admins seeded successfully');
  } catch (err) {
    console.error('[PostgreSQL] Seed error:', err);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  getDbPool: () => pool,
  initializeSchema,
  getAdminByEmailAndRestaurant,
  getAdminByGoogleId,
  upsertAdminManual,
  createAdminManual,
  upsertAdminGoogle,
  getRestaurantById,
  seedDefaultRestaurants,
  getMenuStock,
  upsertMenuStock,
};
