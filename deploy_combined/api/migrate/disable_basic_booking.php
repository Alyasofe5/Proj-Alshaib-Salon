<?php
/**
 * Migration: Disable booking page for 'basic' plan type
 * Updates ALL basic plans in the DB to have has_booking_page = false
 * 
 * Run: /api/migrate/disable_basic_booking.php?key=ALSHAIB_MIGRATE_2026
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
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );

    $results = [];

    // Get all basic plans
    $plans = $pdo->query("SELECT id, name, name_ar, plan_type, features_config FROM subscription_plans WHERE plan_type = 'basic'")->fetchAll();

    if (count($plans) === 0) {
        $results[] = 'No basic plans found.';
    }

    foreach ($plans as $plan) {
        $config = $plan['features_config'] ? json_decode($plan['features_config'], true) : [];
        $oldValue = $config['has_booking_page'] ?? 'not set';

        // Set has_booking_page to false
        $config['has_booking_page'] = false;

        $newConfig = json_encode($config, JSON_UNESCAPED_UNICODE);
        $pdo->prepare("UPDATE subscription_plans SET features_config = ? WHERE id = ?")
            ->execute([$newConfig, $plan['id']]);

        $results[] = "Plan #{$plan['id']} ({$plan['name_ar']}): has_booking_page changed from {$oldValue} → false";
    }

    // Verify all plans
    $allPlans = $pdo->query("SELECT id, name_ar, plan_type, features_config FROM subscription_plans ORDER BY price")->fetchAll();
    foreach ($allPlans as &$p) {
        $p['features_config'] = json_decode($p['features_config'], true);
    }

    echo json_encode([
        'success' => true,
        'changes' => $results,
        'all_plans' => $allPlans,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
