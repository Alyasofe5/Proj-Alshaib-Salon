<?php
/**
 * Yearly Report API (SaaS Multi-Tenant)
 * GET /api/reports/yearly.php?year=2026
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

$year = $_GET['year'] ?? date('Y');

// ===== إجمالي المبيعات والزبائن للسنة =====
$stmt = $pdo->prepare("
    SELECT COALESCE(SUM(total_amount),0) as total_sales, COUNT(*) as total_customers
    FROM transactions
    WHERE salon_id = ? AND YEAR(created_at) = ?
");
$stmt->execute([$salonId, $year]);
$totals = $stmt->fetch();

$totalSales     = (float) ($totals['total_sales'] ?? 0);
$totalCustomers = (int)   ($totals['total_customers'] ?? 0);

// ===== إجمالي المصاريف للسنة =====
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE salon_id = ? AND YEAR(created_at) = ?");
$stmt->execute([$salonId, $year]);
$totalExpenses = (float) ($stmt->fetchColumn() ?: 0);

// ===== أداء الموظفين للسنة =====
$stmt = $pdo->prepare("
    SELECT e.id, e.name_ar as name, e.name_en, e.commission_rate, e.salary_type,
           COUNT(t.id) as cnt, COALESCE(SUM(t.total_amount),0) as total
    FROM employees e
    LEFT JOIN transactions t ON e.id = t.employee_id AND YEAR(t.created_at) = ?
    WHERE e.salon_id = ? AND e.is_active = 1
    GROUP BY e.id ORDER BY total DESC
");
$stmt->execute([$year, $salonId]);
$empStats = $stmt->fetchAll();

// ===== بيانات الرسم البياني (شهري) =====
$monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
$chartLabels = [];
$chartSales  = [];
$chartExpenses = [];

for ($m = 1; $m <= 12; $m++) {
    $monthStr = $year . '-' . str_pad($m, 2, '0', STR_PAD_LEFT);
    $chartLabels[] = $monthNames[$m - 1];

    $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) FROM transactions WHERE salon_id = ? AND DATE_FORMAT(created_at,'%Y-%m')=?");
    $stmt->execute([$salonId, $monthStr]);
    $chartSales[] = (float) ($stmt->fetchColumn() ?: 0);

    $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE salon_id = ? AND DATE_FORMAT(created_at,'%Y-%m')=?");
    $stmt->execute([$salonId, $monthStr]);
    $chartExpenses[] = (float) ($stmt->fetchColumn() ?: 0);
}

sendSuccess([
    'year'            => $year,
    'total_sales'     => $totalSales,
    'total_customers' => $totalCustomers,
    'total_expenses'  => $totalExpenses,
    'net_profit'      => $totalSales - $totalExpenses,
    'employee_stats'  => $empStats,
    'chart' => [
        'labels'   => $chartLabels,
        'sales'    => $chartSales,
        'expenses' => $chartExpenses,
    ],
]);
