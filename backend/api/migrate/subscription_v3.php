<?php
/**
 * Subscription System v3 Migration
 * ================================
 * 1. Add plan_type (free/basic/professional/enterprise) to subscription_plans
 * 2. Add features_config (structured JSON) to subscription_plans  
 * 3. Add owner_user_id to salons for multi-branch linking
 * 4. Add parent_salon_id to salons for branch hierarchy
 * 
 * Run: /api/migrate/subscription_v3.php?key=ALSHAIB_MIGRATE_2026
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');

$key = $_GET['key'] ?? '';
if ($key !== 'ALSHAIB_MIGRATE_2026') {
    http_response_code(403);
    die(json_encode(['error' => 'Invalid key']));
}

try {
    $pdo = new PDO(
        "mysql:host=localhost;dbname=u778871816_alshaib;charset=utf8mb4",
        "u778871816_admin",
        "Salon2026!pass",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $results = [];
    $pdo->beginTransaction();

    // ── 1. Add plan_type to subscription_plans ──
    $check = $pdo->query("SHOW COLUMNS FROM subscription_plans LIKE 'plan_type'")->fetch();
    if (!$check) {
        $pdo->exec("ALTER TABLE subscription_plans ADD COLUMN plan_type ENUM('free','basic','professional','enterprise') NOT NULL DEFAULT 'basic' AFTER name_ar");
        $results[] = 'Added: plan_type column to subscription_plans';
    } else {
        $results[] = 'Already exists: plan_type';
    }

    // ── 2. Add features_config (structured JSON) to subscription_plans ──
    $check = $pdo->query("SHOW COLUMNS FROM subscription_plans LIKE 'features_config'")->fetch();
    if (!$check) {
        $pdo->exec("ALTER TABLE subscription_plans ADD COLUMN features_config JSON DEFAULT NULL AFTER features");
        $results[] = 'Added: features_config column';
    } else {
        $results[] = 'Already exists: features_config';
    }

    // ── 3. Add owner_user_id to salons (links salon to owning user) ──
    $check = $pdo->query("SHOW COLUMNS FROM salons LIKE 'owner_user_id'")->fetch();
    if (!$check) {
        $pdo->exec("ALTER TABLE salons ADD COLUMN owner_user_id INT DEFAULT NULL AFTER owner_phone");
        $pdo->exec("ALTER TABLE salons ADD INDEX idx_owner_user (owner_user_id)");
        $results[] = 'Added: owner_user_id to salons';
    } else {
        $results[] = 'Already exists: owner_user_id';
    }

    // ── 4. Add parent_salon_id to salons (for branch hierarchy) ──
    $check = $pdo->query("SHOW COLUMNS FROM salons LIKE 'parent_salon_id'")->fetch();
    if (!$check) {
        $pdo->exec("ALTER TABLE salons ADD COLUMN parent_salon_id INT DEFAULT NULL AFTER owner_user_id");
        $pdo->exec("ALTER TABLE salons ADD INDEX idx_parent_salon (parent_salon_id)");
        $results[] = 'Added: parent_salon_id to salons';
    } else {
        $results[] = 'Already exists: parent_salon_id';
    }

    // ── 5. Update existing plans with plan_type & features_config ──
    
    // Plan 1: Free (مجاني)
    $freeConfig = json_encode([
        'has_booking_page'    => false,
        'has_advanced_reports'=> false,
        'has_whatsapp'        => false,
        'has_multi_branch'    => false,
        'has_custom_api'      => false,
        'has_priority_support'=> false,
        'has_full_customize'  => false,
        'max_bookings_month'  => 50,
    ], JSON_UNESCAPED_UNICODE);
    
    $pdo->prepare("UPDATE subscription_plans SET plan_type='free', features_config=? WHERE id=1")
        ->execute([$freeConfig]);
    $results[] = 'Updated Plan 1: Free — no booking page, basic features';

    // Plan 2: Professional (احترافي)
    $proConfig = json_encode([
        'has_booking_page'    => true,
        'has_advanced_reports'=> true,
        'has_whatsapp'        => true,
        'has_multi_branch'    => false,
        'has_custom_api'      => false,
        'has_priority_support'=> true,
        'has_full_customize'  => true,
        'max_bookings_month'  => -1, // unlimited
    ], JSON_UNESCAPED_UNICODE);
    
    $pdo->prepare("UPDATE subscription_plans SET plan_type='professional', features_config=? WHERE id=2")
        ->execute([$proConfig]);
    $results[] = 'Updated Plan 2: Professional — full features, no multi-branch';

    // Plan 3: Enterprise (مؤسسات)
    $entConfig = json_encode([
        'has_booking_page'    => true,
        'has_advanced_reports'=> true,
        'has_whatsapp'        => true,
        'has_multi_branch'    => true,
        'has_custom_api'      => true,
        'has_priority_support'=> true,
        'has_full_customize'  => true,
        'max_bookings_month'  => -1, // unlimited
    ], JSON_UNESCAPED_UNICODE);
    
    $pdo->prepare("UPDATE subscription_plans SET plan_type='enterprise', features_config=? WHERE id=3")
        ->execute([$entConfig]);
    $results[] = 'Updated Plan 3: Enterprise — all features + multi-branch';

    $pdo->commit();
    $results[] = '✅ SUBSCRIPTION v3 MIGRATION COMPLETE';

    echo json_encode(['success' => true, 'steps' => $results], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage(), 'line' => $e->getLine()], JSON_UNESCAPED_UNICODE);
}
