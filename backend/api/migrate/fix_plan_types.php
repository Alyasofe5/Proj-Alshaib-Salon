<?php
/**
 * FIX: Correct plan_type values and restore booking page for professional/enterprise
 * 
 * Run: /api/migrate/fix_plan_types.php?key=ALSHAIB_MIGRATE_2026
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');

if (($_GET['key'] ?? '') !== 'ALSHAIB_MIGRATE_2026') {
    http_response_code(403);
    die(json_encode(['error' => 'Invalid key']));
}

try {
    $pdo = new PDO(
        "mysql:host=localhost;dbname=u778871816_alshaib;charset=utf8mb4",
        "u778871816_admin",
        "Salon2026!pass",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );

    $results = [];

    // Fix Plan #2 (احترافي) → plan_type = professional, has_booking_page = true
    $config2 = json_encode([
        'has_booking_page' => true,
        'has_advanced_reports' => true,
        'has_whatsapp' => true,
        'has_multi_branch' => false,
        'has_custom_api' => false,
        'has_priority_support' => true,
        'has_full_customize' => true,
        'max_bookings_month' => -1,
    ], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE subscription_plans SET plan_type = 'professional', features_config = ? WHERE id = 2")
        ->execute([$config2]);
    $results[] = "Plan #2 (احترافي): Fixed plan_type → professional, has_booking_page → true";

    // Fix Plan #3 (مؤسسات) → plan_type = enterprise, has_booking_page = true
    $config3 = json_encode([
        'has_booking_page' => true,
        'has_advanced_reports' => true,
        'has_whatsapp' => true,
        'has_multi_branch' => true,
        'has_custom_api' => true,
        'has_priority_support' => true,
        'has_full_customize' => true,
        'max_bookings_month' => -1,
    ], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE subscription_plans SET plan_type = 'enterprise', features_config = ? WHERE id = 3")
        ->execute([$config3]);
    $results[] = "Plan #3 (مؤسسات): Fixed plan_type → enterprise, has_booking_page → true";

    // Verify all plans
    $allPlans = $pdo->query("SELECT id, name_ar, plan_type, features_config FROM subscription_plans ORDER BY price")->fetchAll();
    foreach ($allPlans as &$p) {
        $p['features_config'] = json_decode($p['features_config'], true);
    }

    echo json_encode([
        'success' => true,
        'fixes' => $results,
        'all_plans' => $allPlans,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
