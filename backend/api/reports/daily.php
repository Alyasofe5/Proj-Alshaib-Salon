<?php
/**
 * Daily Reports API (SaaS Multi-Tenant)
 * GET /api/reports/daily.php?date=2026-03-07
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

[$user, $salonId, $salon] = resolveCurrentTenant();
if (!isSuperAdmin($user) && $user['role'] !== 'admin') {
    sendError('هذا الإجراء يتطلب صلاحية المدير', 403);
}

if (getMethod() !== 'GET') sendError('Method not allowed', 405);

$date = $_GET['date'] ?? date('Y-m-d');

$stmt = $pdo->prepare("
    SELECT t.*, COALESCE(e.name, 'محذوف') as emp_name, COALESCE(e.commission_rate, 0) as commission_rate, COALESCE(e.salary_type, 'fixed') as salary_type
    FROM transactions t LEFT JOIN employees e ON t.employee_id = e.id
    WHERE t.salon_id = ? AND DATE(t.created_at) = ? ORDER BY t.created_at ASC
");
$stmt->execute([$salonId, $date]);
$transactions = $stmt->fetchAll();

$stmt = $pdo->prepare("
    SELECT e.id, e.name, e.commission_rate, e.salary_type,
           COUNT(t.id) as cnt, COALESCE(SUM(t.total_amount),0) as total
    FROM employees e
    LEFT JOIN transactions t ON e.id = t.employee_id AND DATE(t.created_at) = ?
    WHERE e.salon_id = ? AND e.is_active = 1 GROUP BY e.id
");
$stmt->execute([$date, $salonId]);
$empStats = $stmt->fetchAll();

$totalDay = 0.0;
foreach ($transactions as $tx) {
    $totalDay += (float) ($tx['total_amount'] ?? 0);
}

sendSuccess([
    'date' => $date,
    'total_income' => $totalDay,
    'total_customers' => count($transactions),
    'transactions' => $transactions,
    'employee_stats' => $empStats,
]);
