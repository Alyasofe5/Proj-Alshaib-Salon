-- =============================================
-- SaaS Migration Script - Alshaib Salon Platform
-- شغّل هذا في phpMyAdmin على Hostinger
-- =============================================

-- 1. جدول الباقات
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    price DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    duration_days INT NOT NULL DEFAULT 30,
    max_employees INT NOT NULL DEFAULT 5,
    max_services INT NOT NULL DEFAULT 50,
    features JSON DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO subscription_plans (id, name, name_ar, price, duration_days, max_employees, max_services) VALUES
(1, 'Basic', 'أساسي', 10.000, 30, 5, 20),
(2, 'Professional', 'احترافي', 20.000, 30, 15, 100),
(3, 'Enterprise', 'متقدم', 35.000, 30, 999, 999);

-- 2. جدول الصالونات
CREATE TABLE IF NOT EXISTS salons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    logo_path VARCHAR(500) DEFAULT NULL,
    owner_name VARCHAR(100) DEFAULT NULL,
    owner_email VARCHAR(255) DEFAULT NULL,
    owner_phone VARCHAR(20) DEFAULT NULL,
    status ENUM('active','suspended','expired') NOT NULL DEFAULT 'active',
    subscription_plan_id INT DEFAULT 1,
    subscription_starts_at DATE DEFAULT NULL,
    subscription_expires_at DATE DEFAULT NULL,
    settings JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- إدراج صالون الشايب كأول مشترك
INSERT IGNORE INTO salons (id, name, slug, owner_name, status, subscription_plan_id, subscription_starts_at, subscription_expires_at) 
VALUES (1, 'AL SHAYEB SALON', 'alshaib', 'وسيم', 'active', 3, CURDATE(), '2099-12-31');

-- 3. إضافة salon_id للجداول الحالية
ALTER TABLE users ADD COLUMN IF NOT EXISTS salon_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salon_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE services ADD COLUMN IF NOT EXISTS salon_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS salon_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS salon_id INT NOT NULL DEFAULT 1 AFTER id;

-- 4. ربط البيانات الحالية بصالون الشايب
UPDATE users SET salon_id = 1 WHERE salon_id = 0 OR salon_id IS NULL;
UPDATE employees SET salon_id = 1 WHERE salon_id = 0 OR salon_id IS NULL;
UPDATE services SET salon_id = 1 WHERE salon_id = 0 OR salon_id IS NULL;
UPDATE expenses SET salon_id = 1 WHERE salon_id = 0 OR salon_id IS NULL;
UPDATE transactions SET salon_id = 1 WHERE salon_id = 0 OR salon_id IS NULL;

-- 5. إضافة super_admin role
ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','admin','employee') NOT NULL DEFAULT 'employee';

-- ترقية أول مستخدم لـ super_admin
UPDATE users SET role = 'super_admin' WHERE id = 1;

-- 6. جدول سجل الاشتراكات
CREATE TABLE IF NOT EXISTS subscription_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    salon_id INT NOT NULL,
    action ENUM('created','renewed','suspended','expired','reactivated') NOT NULL,
    plan_id INT DEFAULT NULL,
    amount DECIMAL(10,3) DEFAULT 0.000,
    notes TEXT DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_salon_log (salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. إضافة Indexes للأداء
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_salon (salon_id);
ALTER TABLE employees ADD INDEX IF NOT EXISTS idx_employees_salon (salon_id);
ALTER TABLE services ADD INDEX IF NOT EXISTS idx_services_salon (salon_id);
ALTER TABLE expenses ADD INDEX IF NOT EXISTS idx_expenses_salon (salon_id);
ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_transactions_salon (salon_id);
