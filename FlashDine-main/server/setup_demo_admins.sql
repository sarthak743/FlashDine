-- FlashDine Admin Setup Script
-- Run this script in your PostgreSQL database to create demo admin accounts

-- Insert demo restaurants (if not already there)
INSERT INTO restaurants (id, name, description, cuisine, rating, delivery_time_min, delivery_time_max, min_order)
VALUES 
  ('default', 'Campus Delights', 'Your favorite campus dining destination', 'Multi-Cuisine', 4.5, 10, 20, 100),
  ('spice_house', 'Spice House', 'Authentic Indian flavors with a modern twist', 'Indian', 4.7, 15, 25, 150),
  ('pizza_palace', 'Pizza Palace', 'Freshly baked pizzas and Italian delights', 'Italian', 4.6, 12, 22, 200),
  ('fusion_hub', 'Fusion Hub', 'East meets West with innovative dishes', 'Fusion', 4.4, 20, 30, 120)
ON CONFLICT (id) DO NOTHING;

-- Create demo admin accounts for each restaurant
-- Password: admin123
-- Email: admin@campus-delights.com, admin@spice-house.com, etc.

-- For 'default' restaurant
INSERT INTO admins (restaurant_id, email, password_hash)
VALUES 
  ('default', 'admin@campus-delights.com', '$2b$12$tLGQTao2RVkDuRhjc1Ba/uPUmYHU5wP3/0h7qI4JSC2VgL2qbpGme')
ON CONFLICT (restaurant_id, email) DO NOTHING;

-- For 'spice_house' restaurant
INSERT INTO admins (restaurant_id, email, password_hash)
VALUES 
  ('spice_house', 'admin@spice-house.com', '$2b$12$tLGQTao2RVkDuRhjc1Ba/uPUmYHU5wP3/0h7qI4JSC2VgL2qbpGme')
ON CONFLICT (restaurant_id, email) DO NOTHING;

-- For 'pizza_palace' restaurant
INSERT INTO admins (restaurant_id, email, password_hash)
VALUES 
  ('pizza_palace', 'admin@pizza-palace.com', '$2b$12$tLGQTao2RVkDuRhjc1Ba/uPUmYHU5wP3/0h7qI4JSC2VgL2qbpGme')
ON CONFLICT (restaurant_id, email) DO NOTHING;

-- For 'fusion_hub' restaurant
INSERT INTO admins (restaurant_id, email, password_hash)
VALUES 
  ('fusion_hub', 'admin@fusion-hub.com', '$2b$12$tLGQTao2RVkDuRhjc1Ba/uPUmYHU5wP3/0h7qI4JSC2VgL2qbpGme')
ON CONFLICT (restaurant_id, email) DO NOTHING;

-- Verify the data was inserted
SELECT 'Admins created successfully!' as message;
SELECT r.name, a.email, a.password_hash IS NOT NULL as has_password FROM restaurants r 
LEFT JOIN admins a ON r.id = a.restaurant_id;
