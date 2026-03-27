<?php
/**
 * Database Configuration & Connection
 * Alshaib Salon - REST API Backend
 */

// XAMPP local settings
// define('DB_HOST', 'localhost');
// define('DB_NAME', 'alshaib_salon');
// define('DB_USER', 'root');
// define('DB_PASS', '');

// Hostinger settings
define('DB_HOST', 'localhost');
define('DB_NAME', 'u778871816_alshaib');
define('DB_USER', 'u778871816_admin');
define('DB_PASS', 'Salon2026!pass');
define('DB_CHARSET', 'utf8mb4');

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
        // Ignore on hosts that do not support setting session time zone.
    }
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}

function dbTableExists(string $table): bool
{
    global $pdo;

    static $cache = [];
    if (array_key_exists($table, $cache)) {
        return $cache[$table];
    }

    if (!preg_match('/^[A-Za-z0-9_]+$/', $table)) {
        return false;
    }

    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
    ");
    $stmt->execute([$table]);

    return $cache[$table] = ((int)$stmt->fetchColumn() > 0);
}

function dbHasColumn(string $table, string $column): bool
{
    global $pdo;

    static $cache = [];
    $key = $table . '.' . $column;
    if (array_key_exists($key, $cache)) {
        return $cache[$key];
    }

    if (!dbTableExists($table)) {
        return $cache[$key] = false;
    }

    if (!preg_match('/^[A-Za-z0-9_]+$/', $table) || !preg_match('/^[A-Za-z0-9_]+$/', $column)) {
        return $cache[$key] = false;
    }

    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
    ");
    $stmt->execute([$table, $column]);

    return $cache[$key] = ((int)$stmt->fetchColumn() > 0);
}
