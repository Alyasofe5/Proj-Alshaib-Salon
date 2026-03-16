<?php
/**
 * Add Free Plan Migration
 * Adds a free (مجاني) subscription plan if it doesn't already exist
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

if (($_GET['key'] ?? '') !== 'ALSHAIB_MIGRATE_2026') {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid key']);
    exit;
}

$steps = [];

// Check if a free plan already exists
$stmt = $pdo->prepare("SELECT id FROM subscription_plans WHERE plan_type = 'free' LIMIT 1");
$stmt->execute();
$existing = $stmt->fetch();

if ($existing) {
    $steps[] = "Free plan already exists with ID: " . $existing['id'];
} else {
    // Create the free plan
    $stmt = $pdo->prepare("
        INSERT INTO subscription_plans 
        (name, name_ar, price, duration_days, max_employees, max_services, features, is_popular, is_active, plan_type, features_config)
        VALUES 
        ('Free', 'مجاني', 0, 365, 2, 5, ?, 0, 1, 'free', ?)
    ");
    
    $features = json_encode([
        'إدارة الحجوزات الأساسية',
        'إدارة الموظفين (حتى 2)',
        'إدارة الخدمات (حتى 5)',
        'تقارير محدودة',
    ]);
    
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
    
    $stmt->execute([$features, $featuresConfig]);
    $newId = $pdo->lastInsertId();
    $steps[] = "✅ Created Free plan with ID: $newId";
}

// Also ensure existing plans have correct plan_type
$plans = $pdo->query("SELECT id, name, price, plan_type FROM subscription_plans ORDER BY price ASC")->fetchAll();
foreach ($plans as $p) {
    $steps[] = "Plan #{$p['id']}: {$p['name']} — price: {$p['price']} — type: {$p['plan_type']}";
}

echo json_encode(['success' => true, 'steps' => $steps], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
