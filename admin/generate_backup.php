<?php
// CLI script for automated backup
if (php_sapi_name() !== 'cli') {
    die('Access Denied: CLI only');
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/backup_engine.php';

echo "Starting Backup...\n";
$backupDir = __DIR__ . '/../backups/';
if (!is_dir($backupDir))
    mkdir($backupDir, 0755, true);

$filename = 'auto_' . date('Y-m-d_H-i-s') . '.sql';
$filepath = $backupDir . $filename;

try {
    $sql = generateSQL($pdo);
    file_put_contents($filepath, $sql);
    echo "✅ Backup created successfully: $filename\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
