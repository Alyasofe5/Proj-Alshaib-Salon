<?php
// ===== دالة توليد SQL =====
function generateSQL($pdo)
{
    $tables = ['employees', 'users', 'services', 'transactions', 'transaction_details', 'expenses'];
    $sql = "-- AL SHAYEB DATABASE BACKUP\n";
    $sql .= "-- Date: " . date('Y-m-d H:i:s') . "\n";
    $sql .= "-- Tables: " . implode(', ', $tables) . "\n\n";
    $sql .= "SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n";
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() == 0)
            continue;

        $row = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_NUM);
        $sql .= "-- ---- `$table` ----\n";
        $sql .= "DROP TABLE IF EXISTS `$table`;\n";
        $sql .= $row[1] . ";\n\n";
        $rows = $pdo->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_NUM);
        if ($rows) {
            foreach ($rows as $r) {
                $vals = array_map(fn($v) => $v === null ? 'NULL' : "'" . addslashes($v) . "'", $r);
                $sql .= "INSERT INTO `$table` VALUES (" . implode(',', $vals) . ");\n";
            }
            $sql .= "\n";
        }
    }
    $sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";
    return $sql;
}
