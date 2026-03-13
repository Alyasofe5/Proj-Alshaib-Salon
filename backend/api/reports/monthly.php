<?php
/**
 * Monthly Report API (SaaS Multi-Tenant)
 * GET /api/reports/monthly.php?month=2026-03
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

$month = $_GET['month'] ?? date('Y-m');

$stmt = $pdo->prepare("
    SELECT e.id, e.name, e.commission_rate, e.salary_type,
           COUNT(t.id) as cnt, COALESCE(SUM(t.total_amount),0) as total
    FROM employees e
    LEFT JOIN transactions t ON e.id = t.employee_id AND DATE_FORMAT(t.created_at,'%Y-%m') = ?
    WHERE e.salon_id = ? AND e.is_active = 1 GROUP BY e.id ORDER BY total DESC
");
$stmt->execute([$month, $salonId]);
$empStats = $stmt->fetchAll();

$totalSales = 0.0;
$totalCustomers = 0;
foreach ($empStats as $s) {
    $totalSales += (float) ($s['total'] ?? 0);
    $totalCustomers += (int) ($s['cnt'] ?? 0);
}

$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE salon_id = ? AND DATE_FORMAT(created_at,'%Y-%m')=?");
$stmt->execute([$salonId, $month]);
$totalExpenses = (float) ($stmt->fetchColumn() ?: 0);

$chartLabels = [];
$chartData = [];
$daysInMonth = (int) date('t', strtotime($month . '-01'));
for ($d = 1; $d <= $daysInMonth; $d++) {
    $chartLabels[] = $d;
    $fullDate = $month . '-' . str_pad($d, 2, '0', STR_PAD_LEFT);
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) FROM transactions WHERE salon_id = ? AND DATE(created_at)=?");
    $stmt->execute([$salonId, $fullDate]);
    $chartData[] = (float) ($stmt->fetchColumn() ?: 0);
}

sendSuccess([
    'month' => $month,
    'total_sales' => $totalSales,
    'total_customers' => $totalCustomers,
    'total_expenses' => $totalExpenses,
    'net_profit' => $totalSales - $totalExpenses,
    'employee_stats' => $empStats,
    'chart' => [
        'labels' => $chartLabels,
        'data' => $chartData,
    ],
]);
