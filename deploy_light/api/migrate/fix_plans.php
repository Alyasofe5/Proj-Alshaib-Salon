<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

if (($_GET['key'] ?? '') !== 'ALSHAIB_MIGRATE_2026') {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid key']);
    exit;
}

// Delete duplicate free plan (keep only ID 8)
$pdo->prepare("DELETE FROM subscription_plans WHERE id = 9")->execute();

// Verify
$all = $pdo->query("SELECT id, name, name_ar, price, plan_type, is_active FROM subscription_plans ORDER BY price")->fetchAll();
echo json_encode(['success' => true, 'plans' => $all], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
