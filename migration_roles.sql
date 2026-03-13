-- =============================================
-- تغيير أدوار المستخدمين
-- admin → صاحب صالون AL SHAYEB (role: admin)
-- administrator → Super Admin (role: super_admin)
-- =============================================

-- 1. تغيير admin إلى role admin مع ربطه بصالون alshaib
UPDATE users SET role = 'admin', salon_id = 1 WHERE username = 'admin';

-- 2. إنشاء مستخدم administrator كـ Super Admin
-- كلمة المرور: Admin@2026 (مشفرة بـ bcrypt)
INSERT INTO users (username, password, name, role, salon_id) 
VALUES ('administrator', '$2y$10$8K1p/a0dL1LXMw0YI0yz4eKJ2jPJqF2e9R7yZmQ3qK5xS8YqY8O3S', 'مدير المنصة', 'super_admin', NULL)
ON DUPLICATE KEY UPDATE role = 'super_admin', salon_id = NULL;
