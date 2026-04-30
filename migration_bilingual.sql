-- =====================================================================
--  BILINGUAL FIELDS MIGRATION — Professional Schema Refactor
--  Splits "Arabic||English" strings into clean separate columns.
--  Safe, reversible, and backwards-compatible.
--
--  RUN ORDER:
--    1. Backup the database first  (mysqldump > backup.sql)
--    2. Run this script in phpMyAdmin / mysql client
--    3. Verify with the SELECT queries at the bottom
--    4. Update backend endpoints to read/write *_ar / *_en
--    5. Once stable, drop the legacy single-column fields
-- =====================================================================

START TRANSACTION;

-- ─── 1. SERVICES.name ──────────────────────────────────────────────────
ALTER TABLE services
    ADD COLUMN IF NOT EXISTS name_ar VARCHAR(150) NULL AFTER name,
    ADD COLUMN IF NOT EXISTS name_en VARCHAR(150) NULL AFTER name_ar;

UPDATE services
SET
    name_ar = COALESCE(NULLIF(TRIM(SUBSTRING_INDEX(name, '||', 1)), ''), name),
    name_en = NULLIF(TRIM(SUBSTRING_INDEX(name, '||', -1)), '')
WHERE (name_ar IS NULL OR name_ar = '');

-- ─── 2. EMPLOYEES.name ─────────────────────────────────────────────────
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS name_ar VARCHAR(150) NULL AFTER name,
    ADD COLUMN IF NOT EXISTS name_en VARCHAR(150) NULL AFTER name_ar;

UPDATE employees
SET
    name_ar = COALESCE(NULLIF(TRIM(SUBSTRING_INDEX(name, '||', 1)), ''), name),
    name_en = NULLIF(TRIM(SUBSTRING_INDEX(name, '||', -1)), '')
WHERE (name_ar IS NULL OR name_ar = '');

-- ─── 3. SALONS.name ────────────────────────────────────────────────────
ALTER TABLE salons
    ADD COLUMN IF NOT EXISTS name_ar VARCHAR(150) NULL AFTER name,
    ADD COLUMN IF NOT EXISTS name_en VARCHAR(150) NULL AFTER name_ar;

UPDATE salons
SET
    name_ar = COALESCE(NULLIF(TRIM(SUBSTRING_INDEX(name, '||', 1)), ''), name),
    name_en = NULLIF(TRIM(SUBSTRING_INDEX(name, '||', -1)), '')
WHERE (name_ar IS NULL OR name_ar = '');

-- ─── 4. BOOKINGS.customer_name ─────────────────────────────────────────
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS customer_name_ar VARCHAR(100) NULL AFTER customer_name,
    ADD COLUMN IF NOT EXISTS customer_name_en VARCHAR(100) NULL AFTER customer_name_ar;

UPDATE bookings
SET
    customer_name_ar = COALESCE(NULLIF(TRIM(SUBSTRING_INDEX(customer_name, '||', 1)), ''), customer_name),
    customer_name_en = NULLIF(TRIM(SUBSTRING_INDEX(customer_name, '||', -1)), '')
WHERE (customer_name_ar IS NULL OR customer_name_ar = '');

-- ─── 5. INDEXES for fast lookup by name ────────────────────────────────
ALTER TABLE services    ADD INDEX IF NOT EXISTS idx_services_name_ar    (name_ar);
ALTER TABLE employees   ADD INDEX IF NOT EXISTS idx_employees_name_ar   (name_ar);
ALTER TABLE salons      ADD INDEX IF NOT EXISTS idx_salons_name_ar      (name_ar);
ALTER TABLE bookings    ADD INDEX IF NOT EXISTS idx_bookings_customer   (customer_name_ar);

-- ─── 6. TRIGGERS — keep legacy `name` column in sync (until Phase 2) ───
-- Why: backend code currently writes to `name` only. Until all endpoints
--      are updated to write to name_ar/name_en, we auto-split on insert/update.

DELIMITER $$

DROP TRIGGER IF EXISTS trg_services_split_name_ins$$
CREATE TRIGGER trg_services_split_name_ins
BEFORE INSERT ON services
FOR EACH ROW
BEGIN
    IF NEW.name_ar IS NULL OR NEW.name_ar = '' THEN
        SET NEW.name_ar = TRIM(SUBSTRING_INDEX(NEW.name, '||', 1));
        SET NEW.name_en = NULLIF(TRIM(SUBSTRING_INDEX(NEW.name, '||', -1)), NEW.name_ar);
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_services_split_name_upd$$
CREATE TRIGGER trg_services_split_name_upd
BEFORE UPDATE ON services
FOR EACH ROW
BEGIN
    IF NEW.name <> OLD.name THEN
        SET NEW.name_ar = TRIM(SUBSTRING_INDEX(NEW.name, '||', 1));
        SET NEW.name_en = NULLIF(TRIM(SUBSTRING_INDEX(NEW.name, '||', -1)), NEW.name_ar);
    END IF;
END$$

-- Same triggers for employees / salons / bookings.customer_name
DROP TRIGGER IF EXISTS trg_employees_split_name_ins$$
CREATE TRIGGER trg_employees_split_name_ins BEFORE INSERT ON employees FOR EACH ROW
BEGIN
    IF NEW.name_ar IS NULL OR NEW.name_ar = '' THEN
        SET NEW.name_ar = TRIM(SUBSTRING_INDEX(NEW.name, '||', 1));
        SET NEW.name_en = NULLIF(TRIM(SUBSTRING_INDEX(NEW.name, '||', -1)), NEW.name_ar);
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_employees_split_name_upd$$
CREATE TRIGGER trg_employees_split_name_upd BEFORE UPDATE ON employees FOR EACH ROW
BEGIN
    IF NEW.name <> OLD.name THEN
        SET NEW.name_ar = TRIM(SUBSTRING_INDEX(NEW.name, '||', 1));
        SET NEW.name_en = NULLIF(TRIM(SUBSTRING_INDEX(NEW.name, '||', -1)), NEW.name_ar);
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_salons_split_name_ins$$
CREATE TRIGGER trg_salons_split_name_ins BEFORE INSERT ON salons FOR EACH ROW
BEGIN
    IF NEW.name_ar IS NULL OR NEW.name_ar = '' THEN
        SET NEW.name_ar = TRIM(SUBSTRING_INDEX(NEW.name, '||', 1));
        SET NEW.name_en = NULLIF(TRIM(SUBSTRING_INDEX(NEW.name, '||', -1)), NEW.name_ar);
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_salons_split_name_upd$$
CREATE TRIGGER trg_salons_split_name_upd BEFORE UPDATE ON salons FOR EACH ROW
BEGIN
    IF NEW.name <> OLD.name THEN
        SET NEW.name_ar = TRIM(SUBSTRING_INDEX(NEW.name, '||', 1));
        SET NEW.name_en = NULLIF(TRIM(SUBSTRING_INDEX(NEW.name, '||', -1)), NEW.name_ar);
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_bookings_split_customer_ins$$
CREATE TRIGGER trg_bookings_split_customer_ins BEFORE INSERT ON bookings FOR EACH ROW
BEGIN
    IF NEW.customer_name_ar IS NULL OR NEW.customer_name_ar = '' THEN
        SET NEW.customer_name_ar = TRIM(SUBSTRING_INDEX(NEW.customer_name, '||', 1));
        SET NEW.customer_name_en = NULLIF(TRIM(SUBSTRING_INDEX(NEW.customer_name, '||', -1)), NEW.customer_name_ar);
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_bookings_split_customer_upd$$
CREATE TRIGGER trg_bookings_split_customer_upd BEFORE UPDATE ON bookings FOR EACH ROW
BEGIN
    IF NEW.customer_name <> OLD.customer_name THEN
        SET NEW.customer_name_ar = TRIM(SUBSTRING_INDEX(NEW.customer_name, '||', 1));
        SET NEW.customer_name_en = NULLIF(TRIM(SUBSTRING_INDEX(NEW.customer_name, '||', -1)), NEW.customer_name_ar);
    END IF;
END$$

DELIMITER ;

COMMIT;

-- =====================================================================
--  VERIFICATION — run these manually after migration to confirm success
-- =====================================================================

-- Should show clean separated values, no "||" remaining in name_ar:
-- SELECT id, name, name_ar, name_en FROM services LIMIT 20;
-- SELECT id, name, name_ar, name_en FROM employees LIMIT 20;
-- SELECT id, name, name_ar, name_en FROM salons LIMIT 20;
-- SELECT id, customer_name, customer_name_ar, customer_name_en FROM bookings ORDER BY id DESC LIMIT 20;

-- Detect any rows that didn't split correctly (should return 0 rows):
-- SELECT id, name FROM services    WHERE name_ar LIKE '%||%';
-- SELECT id, name FROM employees   WHERE name_ar LIKE '%||%';
-- SELECT id, name FROM salons      WHERE name_ar LIKE '%||%';

-- =====================================================================
--  PHASE 2 (run only after backend is fully migrated to read *_ar/*_en)
-- =====================================================================
-- ALTER TABLE services    DROP COLUMN name;
-- ALTER TABLE employees   DROP COLUMN name;
-- ALTER TABLE salons      DROP COLUMN name;
-- ALTER TABLE bookings    DROP COLUMN customer_name;
-- DROP TRIGGER trg_services_split_name_ins;  -- etc — drop all triggers
