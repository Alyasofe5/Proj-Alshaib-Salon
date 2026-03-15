<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

if (($_GET['key'] ?? '') !== 'ALSHAIB_MIGRATE_2026') {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid key']);
    exit;
}

// Force create free plan
$stmt = $pdo->prepare("
    INSERT INTO subscription_plans 
    (name, name_ar, price, duration_days, max_employees, max_services, features, is_popular, is_active, plan_type, features_config)
    VALUES 
    ('Free', ?, 0, 365, 2, 5, ?, 0, 1, 'free', ?)
");

$features = json_encode([
    'إدارة الحجوزات الأساسية',
    'إدارة الموظفين (حتى 2)',
    'إدارة الخدمات (حتى 5)',
    'تقارير محدودة',
], JSON_UNESCAPED_UNICODE);

$featuresConfig = json_encode([
    'has_booking_page' => false,
    'has_advanced_reports' => false,
    'has_whatsapp' => false,
    'has_multi_branch' => false,
    'has_custom_api' => false,
    'has_priority_support' => false,
    'has_full_customize' => false,
    'max_bookings_month' => 50,
]);

$stmt->execute(['مجاني', $features, $featuresConfig]);
$newId = $pdo->lastInsertId();

// Verify
$all = $pdo->query("SELECT id, name, name_ar, price, plan_type, is_active FROM subscription_plans ORDER BY price")->fetchAll();

echo json_encode([
    'success' => true, 
    'created_id' => $newId,
    'all_plans' => $all
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
