<?php
// ===================================================
// انسخ هذا الملف باسم db.php واملأ البيانات الصحيحة
// ===================================================

// إعدادات XAMPP المحلية
// define('DB_HOST', 'localhost');
// define('DB_NAME', 'alshaib_salon');
// define('DB_USER', 'root');
// define('DB_PASS', '');

// إعدادات Hostinger
define('DB_HOST', 'localhost');
define('DB_NAME', 'u778871816_alshaib');
define('DB_USER', 'u778871816_alshaib');
define('DB_PASS', 'YOUR_PASSWORD_HERE'); // ← ضع كلمة مرور DB هنا
define('DB_CHARSET', 'utf8mb4');

// تحديد المسار الأساسي للمشروع تلقائياً
$_projectRoot = str_replace('\\', '/', realpath(__DIR__ . '/..'));
$_htdocsPath = str_replace('\\', '/', realpath($_SERVER['DOCUMENT_ROOT'] ?? dirname($_projectRoot)));
$_basePath = str_replace($_htdocsPath, '', $_projectRoot);
define('BASE_URL', $_basePath);

// تعيين timezone لـ PHP
date_default_timezone_set('Asia/Kuwait');

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

    // مزامنة timezone بين PHP وMySQL (اختياري -- بعض الاستضافات لا تدعمها)
    try {
        $offset = date('P'); // مثل: +03:00
        $pdo->exec("SET time_zone = '$offset'");
    } catch (PDOException $tzErr) {
        // تجاهل الخطأ إذا لم تدعم الاستضافة تعيين timezone
    }

} catch (PDOException $e) {
    die(json_encode(['error' => 'فشل الاتصال بقاعدة البيانات: ' . $e->getMessage()]));
}
