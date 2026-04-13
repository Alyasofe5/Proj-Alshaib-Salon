-- =====================================================
--  AL-HASON ROASTERY | Supabase Database Schema
--  Run this in: Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id            BIGSERIAL PRIMARY KEY,
    order_ref     TEXT UNIQUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),

    -- Customer Info
    customer_name  TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    customer_city  TEXT,
    customer_address TEXT,

    -- Order Details
    items         JSONB NOT NULL DEFAULT '[]',
    subtotal      DECIMAL(10,2) DEFAULT 0,
    discount      DECIMAL(10,2) DEFAULT 0,
    shipping      DECIMAL(10,2) DEFAULT 3.50,
    total         DECIMAL(10,2) NOT NULL,
    coupon_used   TEXT,

    -- Status
    status        TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','shipped','completed','cancelled')),
    payment_method TEXT DEFAULT 'cash',
    notes         TEXT
);

-- Auto-generate order_ref after insert (uses id)
CREATE OR REPLACE FUNCTION set_order_ref_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_ref IS NULL THEN
        NEW.order_ref := 'ORD-' || LPAD(NEW.id::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_ref ON orders;
CREATE TRIGGER trg_set_order_ref
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION set_order_ref_fn();

-- 2. VIDEO SETTINGS TABLE
CREATE TABLE IF NOT EXISTS video_settings (
    key         TEXT PRIMARY KEY,
    url         TEXT DEFAULT '',
    title       TEXT DEFAULT '',
    tag         TEXT DEFAULT '',
    description TEXT DEFAULT '',
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default video keys
INSERT INTO video_settings (key, url) VALUES
    ('coffee',  ''),
    ('nuts',    ''),
    ('spices',  ''),
    ('sweets',  ''),
    ('poster',  '')
ON CONFLICT (key) DO NOTHING;

-- 3. PRODUCTS TABLE (ENHANCED)
CREATE TABLE IF NOT EXISTS products (
    id            BIGSERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    description   TEXT,
    price         DECIMAL(10,2) NOT NULL DEFAULT 0,
    category      TEXT DEFAULT 'coffee',
    image_url     TEXT,
    is_draft      BOOLEAN DEFAULT false,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    
    -- New Advanced Fields
    weight_options TEXT DEFAULT '250g, 500g, 1kg', -- COMMA SEPARATED WEIGHTS
    origin        TEXT DEFAULT 'البرازيل',
    roast_level   TEXT DEFAULT 'وسط',
    taste_profile TEXT DEFAULT 'شوكولاتة، مكسرات',
    stock_status  TEXT DEFAULT 'in_stock'
);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES (open access)
CREATE POLICY "allow_all_products" ON products
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_video_settings" ON video_settings
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_orders" ON orders
    FOR ALL USING (true) WITH CHECK (true);

-- 5. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Done!
SELECT 'Schema created successfully!' AS result;
