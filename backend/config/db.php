<?php
/**
 * Database Configuration & Connection
 * Alshaib Salon - REST API Backend
 *
 * Credentials are read from environment variables (or backend/.env file).
 * NEVER hard-code credentials here — this file is committed to git.
 *
 * Required environment variables:
 *   DB_HOST, DB_NAME, DB_USER, DB_PASS
 * Optional:
 *   DB_CHARSET (default: utf8mb4)
 *   APP_TIMEZONE (default: Asia/Kuwait)
 *
 * See backend/.env.example for the template.
 */

require_once __DIR__ . '/env.php';

define('DB_HOST',    env('DB_HOST', 'localhost'));
define('DB_NAME',    env('DB_NAME', ''));
define('DB_USER',    env('DB_USER', ''));
define('DB_PASS',    env('DB_PASS', ''));
define('DB_CHARSET', env('DB_CHARSET', 'utf8mb4'));

date_default_timezone_set(env('APP_TIMEZONE', 'Asia/Kuwait'));

if (DB_NAME === '' || DB_USER === '') {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database not configured. Missing DB_NAME or DB_USER environment variables.'
    ]));
}

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
