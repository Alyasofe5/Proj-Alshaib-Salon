<?php
/**
 * Dashboard Stats API (SaaS Multi-Tenant)
 * GET /api/dashboard/stats
 * 
 * Returns: Today stats, month stats, expenses, chart data, best employee, employees today, last transactions
 * All scoped by salon_id
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

if (getMethod() !== 'GET') {
    sendError('Method not allowed', 405);
}

[$user, $salonId, $salon] = resolveCurrentTenant();

// Super Admin أو Admin يقدر يشوف Dashboard
if (!isSuperAdmin($user) && $user['role'] !== 'admin') {
    sendError('هذا الإجراء يتطلب صلاحية المدير', 403);
}

// ===== إحصائيات اليوم =====
$stmt = $pdo->prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total FROM transactions WHERE salon_id = ? AND DATE(created_at) = CURDATE()");
$stmt->execute([$salonId]);
$todayStats = $stmt->fetch();

// ===== إحصائيات الشهر =====
$stmt = $pdo->prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total FROM transactions WHERE salon_id = ? AND DATE_FORMAT(created_at,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m')");
$stmt->execute([$salonId]);
$monthStats = $stmt->fetch();

// ===== مصاريف الشهر =====
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE salon_id = ? AND DATE_FORMAT(created_at,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m')");
$stmt->execute([$salonId]);
$monthExpenses = (float) $stmt->fetchColumn();

// ===== صافي الربح =====
$netProfit = (float) ($monthStats['total'] ?? 0) - $monthExpenses;

// ===== أفضل موظف اليوم =====
$stmt = $pdo->prepare("
    SELECT e.name, COUNT(t.id) as cnt, COALESCE(SUM(t.total_amount),0) as total
    FROM transactions t
    JOIN employees e ON t.employee_id = e.id
    WHERE t.salon_id = ? AND DATE(t.created_at) = CURDATE()
    GROUP BY t.employee_id
    ORDER BY total DESC LIMIT 1
");
$stmt->execute([$salonId]);
$bestEmployee = $stmt->fetch() ?: null;

// ===== دخل كل موظف اليوم =====
$stmt = $pdo->prepare("
    SELECT e.name, COUNT(t.id) as cnt, COALESCE(SUM(t.total_amount),0) as total,
           e.commission_rate, e.salary_type
    FROM employees e
    LEFT JOIN transactions t ON e.id = t.employee_id AND DATE(t.created_at) = CURDATE()
    WHERE e.salon_id = ? AND e.is_active = 1
    GROUP BY e.id
    ORDER BY total DESC
");
$stmt->execute([$salonId]);
$employeesToday = $stmt->fetchAll();

// ===== بيانات الرسم البياني - آخر 7 أيام =====
$chartLabels = [];
$chartData = [];
for ($i = 6; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $chartLabels[] = date('d/m', strtotime($date));
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) FROM transactions WHERE salon_id = ? AND DATE(created_at) = ?");
    $stmt->execute([$salonId, $date]);
    $chartData[] = (float) $stmt->fetchColumn();
}

// ===== آخر 5 عمليات =====
$stmt = $pdo->prepare("
    SELECT t.*, e.name as emp_name
    FROM transactions t
    JOIN employees e ON t.employee_id = e.id
    WHERE t.salon_id = ?
    ORDER BY t.created_at DESC LIMIT 5
");
$stmt->execute([$salonId]);
$lastTransactions = $stmt->fetchAll();

sendSuccess([
    'today' => [
        'customers' => (int) $todayStats['cnt'],
        'income' => (float) $todayStats['total'],
    ],
    'month' => [
        'customers' => (int) $monthStats['cnt'],
        'income' => (float) $monthStats['total'],
        'expenses' => $monthExpenses,
        'net_profit' => $netProfit,
    ],
    'best_employee' => $bestEmployee,
    'employees_today' => $employeesToday,
    'chart' => [
        'labels' => $chartLabels,
        'data' => $chartData,
    ],
    'last_transactions' => $lastTransactions,
    'salon' => [
        'name' => $salon['name'],
        'days_left' => getSubscriptionDaysLeft($salon),
    ],
]);
