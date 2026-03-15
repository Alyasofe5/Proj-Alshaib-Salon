<?php
/**
 * Plans Migration v2 — adds is_popular column + updates plan data to match landing page
 * Run once: /api/migrate/plans_v2.php?key=ALSHAIB_MIGRATE_2026
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

    // 1. Add is_popular column if not exists
    $check = $pdo->query("SHOW COLUMNS FROM subscription_plans LIKE 'is_popular'")->fetch();
    if (!$check) {
        $pdo->exec("ALTER TABLE subscription_plans ADD COLUMN is_popular TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active");
        $results[] = 'Added: is_popular column';
    } else {
        $results[] = 'Already exists: is_popular column';
    }

    // 2. Update plans to match landing page layout exactly
    // Plan 1: مجاني (Free)
    $pdo->prepare("
        UPDATE subscription_plans SET
            name = 'Free', name_ar = 'مجاني',
            price = 0.000, duration_days = 30,
            max_employees = 2, max_services = 50,
            features = ?,
            is_popular = 0, is_active = 1
        WHERE id = 1
    ")->execute([json_encode(["حتى 2 موظف", "50 حجز/شهر", "تقارير أساسية", "رابط حجز مخصص"], JSON_UNESCAPED_UNICODE)]);
    $results[] = 'Updated: Plan 1 (Free)';

    // Plan 2: احترافي (Professional)
    $pdo->prepare("
        UPDATE subscription_plans SET
            name = 'Professional', name_ar = 'احترافي',
            price = 15.000, duration_days = 30,
            max_employees = 999, max_services = 999,
            features = ?,
            is_popular = 1, is_active = 1
        WHERE id = 2
    ")->execute([json_encode(["موظفين غير محدود", "حجوزات غير محدودة", "تقارير متقدمة", "إشعارات واتساب", "دعم فني أولوية", "تخصيص كامل"], JSON_UNESCAPED_UNICODE)]);
    $results[] = 'Updated: Plan 2 (Professional)';

    // Plan 3: مؤسسات (Enterprise)
    $pdo->prepare("
        UPDATE subscription_plans SET
            name = 'Enterprise', name_ar = 'مؤسسات',
            price = 35.000, duration_days = 30,
            max_employees = 999, max_services = 999,
            features = ?,
            is_popular = 0, is_active = 1
        WHERE id = 3
    ")->execute([json_encode(["فروع متعددة", "كل مميزات الاحترافي", "API مخصص", "مدير حساب خاص", "تدريب الفريق"], JSON_UNESCAPED_UNICODE)]);
    $results[] = 'Updated: Plan 3 (Enterprise)';

    $results[] = 'MIGRATION v2 COMPLETE ✓';

    echo json_encode(['success' => true, 'steps' => $results], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage(), 'line' => $e->getLine()], JSON_UNESCAPED_UNICODE);
}
