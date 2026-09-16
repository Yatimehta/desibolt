-- ============================================================
-- DESI BOLT — PostgreSQL Production Database Migration
-- Railway PostgreSQL | Malta Grocery Delivery Platform
-- Run: psql $DATABASE_URL -f migrate.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------
-- USERS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'driver')),
  phone         VARCHAR(30),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -------------------------------------------------------
-- CATEGORIES
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id           VARCHAR(60) PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  icon         VARCHAR(10),
  product_count INT NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INT NOT NULL DEFAULT 0
);

INSERT INTO categories (id, name, product_count, sort_order) VALUES
  ('fresh-produce',    'Fresh Fruits & Vegetables', 840,  1),
  ('dairy-paneer',     'Dairy, Paneer & Eggs',       420,  2),
  ('rice-atta',        'Atta, Flours & Basmati Rice', 650,  3),
  ('dal-pulses',       'Dals, Lentils & Pulses',      530,  4),
  ('spices-masalas',   'Spices, Masalas & Seasonings',1240, 5),
  ('frozen-ready',     'Frozen Foods & Instant Meals', 780, 6),
  ('snacks-sweets',    'Snacks, Namkeen & Mithai',   1120,  7),
  ('beverages-tea',    'Tea, Coffee & Cold Beverages', 690, 8),
  ('bakery-breads',    'Bakery, Rusk & Naan',          412, 9),
  ('household-care',   'Household & Personal Care',    480, 10)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- PRODUCTS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku              VARCHAR(60) UNIQUE NOT NULL,
  name             VARCHAR(255) NOT NULL,
  brand            VARCHAR(120) NOT NULL DEFAULT 'DESI BOLT',
  category_id      VARCHAR(60) REFERENCES categories(id),
  price            NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  original_price   NUMERIC(10, 2),
  unit             VARCHAR(60) NOT NULL,
  image_url        TEXT,
  stock            INT NOT NULL DEFAULT 0,
  in_stock         BOOLEAN GENERATED ALWAYS AS (stock > 0) STORED,
  rating           NUMERIC(2,1) NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  review_count     INT NOT NULL DEFAULT 0,
  description      TEXT,
  origin           VARCHAR(60),
  is_organic       BOOLEAN NOT NULL DEFAULT false,
  is_vegetarian    BOOLEAN NOT NULL DEFAULT false,
  is_best_seller   BOOLEAN NOT NULL DEFAULT false,
  vat_rate         NUMERIC(4,2) NOT NULL DEFAULT 0.00,  -- 0.00 food, 0.18 standard
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku        ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name       ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(is_best_seller) WHERE is_best_seller = true;

-- -------------------------------------------------------
-- ORDERS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number             VARCHAR(30) UNIQUE NOT NULL,
  user_id                  UUID REFERENCES users(id),
  status                   VARCHAR(30) NOT NULL DEFAULT 'confirmed'
                             CHECK (status IN ('confirmed','packing','dispatched','out_for_delivery','delivered','cancelled')),
  -- Address (Malta)
  delivery_full_name       VARCHAR(120),
  delivery_phone           VARCHAR(30),
  delivery_email           VARCHAR(255),
  delivery_street          VARCHAR(255),
  delivery_locality        VARCHAR(120),
  delivery_postal_code     VARCHAR(20),
  delivery_lat             NUMERIC(9, 6),
  delivery_lng             NUMERIC(9, 6),
  -- Financials (EUR)
  subtotal                 NUMERIC(10, 2) NOT NULL DEFAULT 0,
  vat_amount               NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee             NUMERIC(10, 2) NOT NULL DEFAULT 2.50,
  discount                 NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total                    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency                 CHAR(3) NOT NULL DEFAULT 'EUR',
  -- Payment
  payment_method           VARCHAR(20) NOT NULL DEFAULT 'stripe',
  payment_status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                             CHECK (payment_status IN ('pending','paid','failed','refunded')),
  stripe_payment_intent_id VARCHAR(100),
  -- Delivery
  delivery_slot            VARCHAR(40) NOT NULL DEFAULT 'instant_bolt',
  estimated_delivery_time  VARCHAR(40),
  -- Driver
  driver_name              VARCHAR(120),
  driver_phone             VARCHAR(30),
  driver_vehicle           VARCHAR(80),
  driver_plate             VARCHAR(20),
  driver_lat               NUMERIC(9, 6),
  driver_lng               NUMERIC(9, 6),

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe  ON orders(stripe_payment_intent_id);

-- -------------------------------------------------------
-- ORDER ITEMS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  sku         VARCHAR(60),
  name        VARCHAR(255) NOT NULL,
  brand       VARCHAR(120),
  image_url   TEXT,
  price       NUMERIC(10, 2) NOT NULL,
  quantity    INT NOT NULL CHECK (quantity > 0),
  unit        VARCHAR(60),
  vat_rate    NUMERIC(4, 2) NOT NULL DEFAULT 0,
  line_total  NUMERIC(10, 2) GENERATED ALWAYS AS (price * quantity) STORED
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- -------------------------------------------------------
-- UPDATED_AT TRIGGER
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users', 'products', 'orders'] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
      CREATE TRIGGER trg_%s_updated_at
        BEFORE UPDATE ON %s
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END $$;

-- -------------------------------------------------------
-- ADMIN USER SEED
-- -------------------------------------------------------
-- Password hash for 'DesiBolt@2026' (bcrypt rounds=10)
-- Re-generate in production with a strong password
INSERT INTO users (name, email, password_hash, role, phone) VALUES
  ('DESI BOLT Admin', 'admin@desibolt.com',
   '$2a$10$7vN8K9QWp9e6qG2aYn4zLeO6mP8xK5wJ3kL2mQ1wE4rT7yU0iO.Pa',
   'admin', '+356 2133 8899')
ON CONFLICT (email) DO NOTHING;

-- -------------------------------------------------------
-- REFUND COLUMNS (additive — safe on existing DB)
-- -------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_refund_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_refund ON orders(stripe_refund_id)
  WHERE stripe_refund_id IS NOT NULL;

-- -------------------------------------------------------
-- PAYMENT EVENTS (audit log for all Stripe webhook events)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  stripe_event_id VARCHAR(100) UNIQUE NOT NULL,
  event_type      VARCHAR(80)  NOT NULL,
  payment_intent  VARCHAR(100),
  amount          NUMERIC(10, 2),
  currency        CHAR(3),
  status          VARCHAR(40),
  raw_payload     JSONB,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order   ON payment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_intent  ON payment_events(payment_intent);
CREATE INDEX IF NOT EXISTS idx_payment_events_type    ON payment_events(event_type);

-- -------------------------------------------------------
-- PROMOS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS promos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(20) UNIQUE NOT NULL,
  discount_type   VARCHAR(10) NOT NULL CHECK (discount_type IN ('fixed', 'percent')),
  discount_value  NUMERIC(10, 2) NOT NULL,
  min_cart_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  max_uses        INT,
  usage_count     INT NOT NULL DEFAULT 0,
  active          BOOLEAN NOT NULL DEFAULT true,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promos_code ON promos(code);

-- -------------------------------------------------------
-- DRIVERS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS drivers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  name              VARCHAR(120) NOT NULL,
  phone             VARCHAR(30) NOT NULL,
  vehicle           VARCHAR(80) NOT NULL,
  plate_number      VARCHAR(20),
  rating            NUMERIC(2, 1) NOT NULL DEFAULT 5.0,
  status            VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_delivery', 'offline')),
  current_lat       NUMERIC(9, 6),
  current_lng       NUMERIC(9, 6),
  current_order_id  UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- -------------------------------------------------------
-- ORDER EXTENSIONS (driver, promo, delivery proof)
-- -------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(20) REFERENCES promos(code);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_promo     ON orders(promo_code);

-- -------------------------------------------------------
-- PROMOS & DRIVERS INITIAL SEED DATA
-- -------------------------------------------------------
INSERT INTO promos (code, discount_type, discount_value, min_cart_amount, max_uses, expires_at, active)
VALUES 
  ('WELCOME20', 'percent', 20, 15, 100, NOW() + INTERVAL '30 days', true),
  ('SAVE5EUR', 'fixed', 5, 25, 50, NOW() + INTERVAL '60 days', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO drivers (name, phone, vehicle, plate_number, rating, status, current_lat, current_lng)
VALUES
  ('Josef Vella', '+356 7944 8833', 'DESI BOLT Eco-Scooter #14', 'BOLT-77-MT', 4.9, 'available', 35.8978, 14.4795),
  ('Marco Grech', '+356 7988 2211', 'Honda PCX 125', 'DB-892-MT', 4.8, 'available', 35.9065, 14.4920),
  ('Kurt Borg', '+356 7955 1144', 'Yamaha NMAX 155', 'DB-341-MT', 5.0, 'available', 35.9122, 14.5042)
ON CONFLICT DO NOTHING;

-- Verify migration
SELECT 'Migration complete ✓' AS status,
       (SELECT COUNT(*) FROM categories)      AS categories_seeded,
       (SELECT COUNT(*) FROM users)           AS users_seeded,
       (SELECT COUNT(*) FROM promos)          AS promos_seeded,
       (SELECT COUNT(*) FROM drivers)         AS drivers_seeded,
       (SELECT COUNT(*) FROM payment_events)  AS payment_events_ready;

