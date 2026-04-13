-- =====================================================
--  AL-HASON | Additional Tables Schema
--  Run this in: Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. B2B CLIENTS TABLE
CREATE TABLE IF NOT EXISTS b2b_clients (
    id           BIGSERIAL PRIMARY KEY,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    name         TEXT NOT NULL,
    sector       TEXT,
    monthly_qty  TEXT,
    phone        TEXT,
    contract_status TEXT DEFAULT 'pending'
                 CHECK (contract_status IN ('active','pending','suspended')),
    notes        TEXT
);

-- 2. COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
    id           BIGSERIAL PRIMARY KEY,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    code         TEXT UNIQUE NOT NULL,
    discount_type TEXT DEFAULT 'percent' CHECK (discount_type IN ('percent','fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    max_uses     INTEGER DEFAULT 100,
    used_count   INTEGER DEFAULT 0,
    expires_at   DATE,
    is_active    BOOLEAN DEFAULT true,
    description  TEXT
);

-- Insert default coupons
INSERT INTO coupons (code, discount_type, discount_value, max_uses, description) VALUES
    ('ALHASON10', 'percent', 10, 1000, 'خصم 10% عام'),
    ('ELITE20',   'percent', 20, 500,  'خصم النخبة 20%'),
    ('GOLDEN50',  'fixed',   50, 100,  'خصم كبار الشخصيات VIP'),
    ('WINTER26',  'percent', 15, 100,  'حملة الشتاء 2026')
ON CONFLICT (code) DO NOTHING;

-- 3. BOOKINGS / CALENDAR TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id           BIGSERIAL PRIMARY KEY,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    title        TEXT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME,
    type         TEXT DEFAULT 'meeting'
                 CHECK (type IN ('tasting','meeting','b2b','event')),
    client_name  TEXT,
    client_phone TEXT,
    notes        TEXT,
    status       TEXT DEFAULT 'confirmed'
                 CHECK (status IN ('confirmed','pending','cancelled'))
);

-- Insert sample bookings
INSERT INTO bookings (title, booking_date, booking_time, type, client_name) VALUES
    ('جلسة تذوق قهوة', CURRENT_DATE + 2, '11:00', 'tasting', 'فيصل العبدالله'),
    ('اجتماع فندق الريتز', CURRENT_DATE + 4, '14:00', 'b2b', 'فندق الريتز كارلتون'),
    ('دورة تحميص للموردين', CURRENT_DATE + 15, '10:00', 'event', 'مجموعة موردين')
ON CONFLICT DO NOTHING;

-- 4. ENABLE RLS
ALTER TABLE b2b_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings    ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES
CREATE POLICY "allow_all_b2b"      ON b2b_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_coupons"  ON coupons     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_bookings" ON bookings    FOR ALL USING (true) WITH CHECK (true);

-- Done!
SELECT 'Additional tables created successfully!' AS result;
