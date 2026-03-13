<?php
/**
 * SaaS Migration - Debug Version
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');

$key = $_GET['key'] ?? '';
if ($key !== 'ALSHAIB_MIGRATE_2026') {
    http_response_code(403);
    die(json_encode(['error' => 'Invalid key']));
}

try {
    // اتصال مباشر بقاعدة البيانات
    $pdo = new PDO(
        "mysql:host=localhost;dbname=u778871816_alshaib;charset=utf8mb4",
        "u778871816_admin",
        "Salon2026!pass",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $results = [];
    $pdo->beginTransaction();

    // 1. subscription_plans
    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");
    $results[] = 'Created: subscription_plans';

    $pdo->exec("
        INSERT IGNORE INTO subscription_plans (id, name, name_ar, price, duration_days, max_employees, max_services) VALUES
        (1, 'Basic', 'أساسي', 10.000, 30, 5, 20),
        (2, 'Professional', 'احترافي', 20.000, 30, 15, 100),
        (3, 'Enterprise', 'متقدم', 35.000, 30, 999, 999)
    ");
    $results[] = 'Inserted: plans';

    // 2. salons
    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");
    $results[] = 'Created: salons';

    $pdo->exec("
        INSERT IGNORE INTO salons (id, name, slug, owner_name, status, subscription_plan_id, subscription_starts_at, subscription_expires_at) 
        VALUES (1, 'AL SHAYEB SALON', 'alshaib', 'وسيم', 'active', 3, CURDATE(), '2099-12-31')
    ");
    $results[] = 'Inserted: AL SHAYEB SALON';

    // 3. salon_id columns
    $tables = ['users', 'employees', 'services', 'expenses', 'transactions'];
    foreach ($tables as $table) {
        $check = $pdo->query("SHOW COLUMNS FROM `$table` LIKE 'salon_id'")->fetch();
        if (!$check) {
            $pdo->exec("ALTER TABLE `$table` ADD COLUMN salon_id INT NOT NULL DEFAULT 1 AFTER id");
            $pdo->exec("ALTER TABLE `$table` ADD INDEX idx_{$table}_salon (salon_id)");
            $results[] = "Added salon_id to: $table";
        } else {
            $results[] = "Already exists in: $table";
        }
    }

    // 4. Update existing data
    foreach ($tables as $table) {
        $pdo->exec("UPDATE `$table` SET salon_id = 1 WHERE salon_id = 0 OR salon_id IS NULL");
    }
    $results[] = 'Data linked to Salon 1';

    // 5. Add super_admin role
    try {
        $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','admin','employee') NOT NULL DEFAULT 'employee'");
        $results[] = 'Updated role ENUM';
    } catch (Exception $e) {
        $results[] = 'Role ENUM: ' . $e->getMessage();
    }

    $pdo->exec("UPDATE users SET role = 'super_admin' WHERE id = 1 AND role = 'admin'");
    $results[] = 'Promoted user 1 to super_admin';

    // 6. subscription_logs
    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");
    $results[] = 'Created: subscription_logs';

    $pdo->commit();
    $results[] = 'MIGRATION COMPLETE!';

    echo json_encode(['success' => true, 'steps' => $results], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage(), 'line' => $e->getLine()], JSON_UNESCAPED_UNICODE);
}
