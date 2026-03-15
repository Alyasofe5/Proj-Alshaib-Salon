<?php
/**
 * Database Configuration & Connection
 * Alshaib Salon - REST API Backend
 */

// إعدادات XAMPP المحلية
// define('DB_HOST', 'localhost');
// define('DB_NAME', 'alshaib_salon');
// define('DB_USER', 'root');
// define('DB_PASS', '');

// إعدادات Hostinger
define('DB_HOST', 'localhost');
define('DB_NAME', 'u778871816_alshaib');
define('DB_USER', 'u778871816_admin');
define('DB_PASS', 'Salon2026!pass');
define('DB_CHARSET', 'utf8mb4');

// تعيين timezone
date_default_timezone_set('Asia/Kuwait');

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

    $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");

    try {
        $offset = date('P');
        $pdo->exec("SET time_zone = '$offset'");
    } catch (PDOException $tzErr) {
        // تجاهل إذا لم تدعم الاستضافة
    }

} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'فشل الاتصال بقاعدة البيانات']));
}
