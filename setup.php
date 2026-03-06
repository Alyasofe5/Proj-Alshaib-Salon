<?php
/**
 * سكريبت الإعداد الأولي
 * قم بتشغيله مرة واحدة فقط لإنشاء قاعدة البيانات وإضافة البيانات الأولية
 * http://localhost/Proj-Alshaib%20Salon/setup.php
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'alshaib_salon');

try {
    // Connect without database first
    $pdo = new PDO("mysql:host=" . DB_HOST . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `" . DB_NAME . "`");

    // Create tables
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS employees (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            salary_type ENUM('fixed','commission') NOT NULL DEFAULT 'commission',
            base_salary DECIMAL(10,3) DEFAULT 0,
            commission_rate DECIMAL(5,2) DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin','employee') NOT NULL DEFAULT 'employee',
            employee_id INT DEFAULT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            price DECIMAL(10,3) NOT NULL DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            total_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
            payment_method ENUM('cash','knet','transfer') NOT NULL DEFAULT 'cash',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS transaction_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            transaction_id INT NOT NULL,
            service_id INT NOT NULL,
            price DECIMAL(10,3) NOT NULL,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            amount DECIMAL(10,3) NOT NULL,
            type ENUM('rent','salary','supplies','utilities','other') NOT NULL DEFAULT 'other',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");


    // Seed employees
    $count = $pdo->query("SELECT COUNT(*) FROM employees")->fetchColumn();
    if ($count == 0) {
        $pdo->exec("INSERT INTO employees (name, phone, salary_type, commission_rate, base_salary) VALUES
            ('أحمد الشايب', '96512345678', 'commission', 30.00, 0),
            ('محمد علي', '96598765432', 'commission', 25.00, 0),
            ('خالد عبدالله', '96555544433', 'fixed', 0, 150.000)
        ");
    }

    // Seed users with correct bcrypt hashes
    $count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($count == 0) {
        $adminPw = password_hash('admin123', PASSWORD_BCRYPT);
        $empPw = password_hash('password', PASSWORD_BCRYPT);

        $stmt = $pdo->prepare("INSERT INTO users (name, username, password, role, employee_id) VALUES (?,?,?,?,?)");
        $stmt->execute(['صاحب المحل', 'admin', $adminPw, 'admin', null]);
        $stmt->execute(['أحمد الشايب', 'ahmed', $empPw, 'employee', 1]);
        $stmt->execute(['محمد علي', 'mohammed', $empPw, 'employee', 2]);
    }

    // Seed services
    $count = $pdo->query("SELECT COUNT(*) FROM services")->fetchColumn();
    if ($count == 0) {
        $pdo->exec("INSERT INTO services (name, price) VALUES
            ('حلاقة شعر', 3.000),
            ('تشذيب لحية', 1.500),
            ('حلاقة + لحية', 4.000),
            ('حلاقة أطفال', 2.500),
            ('صبغة شعر', 8.000),
            ('تنظيف بشرة', 5.000),
            ('قص شعر فاشن', 5.000)
        ");
    }


    // Seed expenses
    $count = $pdo->query("SELECT COUNT(*) FROM expenses")->fetchColumn();
    if ($count == 0) {
        $pdo->exec("INSERT INTO expenses (title, amount, type) VALUES
            ('إيجار المحل - فبراير 2026', 200.000, 'rent'),
            ('مستلزمات حلاقة', 45.500, 'supplies'),
            ('فاتورة كهرباء', 25.000, 'utilities')
        ");
    }

    echo '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet"/>
    <style>body{font-family:Tajawal,sans-serif;background:#111;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
    .box{background:#1c1c1c;border:1px solid rgba(201,168,76,0.3);border-radius:12px;padding:40px;max-width:500px;text-align:center;}
    h2{color:#C9A84C;} .btn{display:inline-block;margin-top:20px;padding:12px 32px;background:linear-gradient(135deg,#C9A84C,#e8c96a);color:#111;font-weight:700;border-radius:8px;text-decoration:none;font-size:16px;}
    table{width:100%;margin-top:20px;border-collapse:collapse;text-align:right;} td,th{padding:8px 12px;border-bottom:1px solid #333;} th{color:#C9A84C;font-size:13px;}
    </style></head><body><div class="box">
    <h2>✅ تم الإعداد بنجاح!</h2>
    <p>تم إنشاء قاعدة البيانات وإضافة البيانات الأولية</p>
    <table>
      <tr><th>المستخدم</th><th>اسم الدخول</th><th>كلمة المرور</th></tr>
      <tr><td>👑 صاحب المحل</td><td>admin</td><td>admin123</td></tr>
      <tr><td>👨‍🔧 أحمد الشايب</td><td>ahmed</td><td>password</td></tr>
      <tr><td>👨‍🔧 محمد علي</td><td>mohammed</td><td>password</td></tr>
    </table>
    <a href="/auth/login.php" class="btn">🚀 الذهاب لتسجيل الدخول</a>
    <p style="margin-top:16px;color:#555;font-size:12px;">⚠️ احذف هذا الملف بعد الإعداد</p>
    </div></body></html>';

} catch (PDOException $e) {
    echo '<div style="font-family:monospace;color:red;padding:20px;">خطأ: ' . $e->getMessage() . '</div>';
}
