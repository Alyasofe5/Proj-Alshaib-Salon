<?php
/**
 * Employee Report API (SaaS Multi-Tenant)
 * GET /api/reports/employee.php?period=daily|monthly|yearly
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

[$currentUser, $salonId, $salon] = resolveCurrentTenant();

if (!in_array($currentUser['role'], ['super_admin', 'admin', 'employee'])) {
    sendError('ليس لديك صلاحية', 403);
}

if (getMethod() !== 'GET') sendError('Method not allowed', 405);

// Admin/SuperAdmin يمكنهم تحديد الموظف عبر query param
$empId = $currentUser['employee_id'];
if (in_array($currentUser['role'], ['super_admin', 'admin']) && !empty($_GET['employee_id'])) {
    $empId = (int) $_GET['employee_id'];
}
if (!$empId) {
    // إذا لم يكن هناك employee_id، ارجع بيانات فارغة بدل خطأ
    sendSuccess([
        'employee' => null,
        'stats' => ['customers' => 0, 'income' => 0, 'commission' => 0],
        'transactions' => [],
    ]);
}

$period = $_GET['period'] ?? 'daily';
$date = $_GET['date'] ?? date('Y-m-d');
$month = $_GET['month'] ?? date('Y-m');
$year = $_GET['year'] ?? date('Y');

// بيانات الموظف (scoped by salon_id)
$stmt = $pdo->prepare("SELECT * FROM employees WHERE id=? AND salon_id=?");
$stmt->execute([$empId, $salonId]);
$employee = $stmt->fetch();

if (!$employee) sendError('الموظف غير موجود', 404);

if ($period === 'daily') {
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total FROM transactions WHERE employee_id=? AND salon_id=? AND DATE(created_at)=?");
    $stmt->execute([$empId, $salonId, $date]);
    $stats = $stmt->fetch();

    $stmt = $pdo->prepare("
        SELECT t.*, GROUP_CONCAT(s.name SEPARATOR ', ') as services
        FROM transactions t
        LEFT JOIN transaction_details td ON t.id = td.transaction_id
        LEFT JOIN services s ON td.service_id = s.id
        WHERE t.employee_id=? AND t.salon_id=? AND DATE(t.created_at)=?
        GROUP BY t.id ORDER BY t.created_at ASC
    ");
    $stmt->execute([$empId, $salonId, $date]);
    $transactions = $stmt->fetchAll();

    sendSuccess([
        'employee' => $employee,
        'date' => $date,
        'stats' => [
            'customers' => (int) $stats['cnt'],
            'income' => (float) $stats['total'],
            'commission' => calcCommission($stats['total'], $employee['commission_rate']),
        ],
        'transactions' => $transactions,
    ]);
}

if ($period === 'monthly') {
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total FROM transactions WHERE employee_id=? AND salon_id=? AND DATE_FORMAT(created_at,'%Y-%m')=?");
    $stmt->execute([$empId, $salonId, $month]);
    $stats = $stmt->fetch();

    $daysInMonth = (int) date('t', strtotime($month . '-01'));
    $dailyBreakdown = [];
    for ($d = 1; $d <= $daysInMonth; $d++) {
        $fullDate = $month . '-' . str_pad($d, 2, '0', STR_PAD_LEFT);
        $stmt2 = $pdo->prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total FROM transactions WHERE employee_id=? AND salon_id=? AND DATE(created_at)=?");
        $stmt2->execute([$empId, $salonId, $fullDate]);
        $row = $stmt2->fetch();
        $dailyBreakdown[] = [
            'day' => $d,
            'cnt' => (int) ($row['cnt'] ?? 0),
            'total' => (float) ($row['total'] ?? 0),
        ];
    }

    // عمليات الشهر
    $stmt = $pdo->prepare("
        SELECT t.*, GROUP_CONCAT(s.name SEPARATOR ', ') as services
        FROM transactions t
        LEFT JOIN transaction_details td ON t.id = td.transaction_id
        LEFT JOIN services s ON td.service_id = s.id
        WHERE t.employee_id=? AND t.salon_id=? AND DATE_FORMAT(t.created_at,'%Y-%m')=?
        GROUP BY t.id ORDER BY t.created_at ASC
    ");
    $stmt->execute([$empId, $salonId, $month]);
    $transactions = $stmt->fetchAll();

    sendSuccess([
        'employee' => $employee,
        'month' => $month,
        'stats' => [
            'customers' => (int) $stats['cnt'],
            'income' => (float) $stats['total'],
            'commission' => calcCommission($stats['total'], $employee['commission_rate']),
        ],
        'daily_breakdown' => $dailyBreakdown,
        'transactions' => $transactions,
    ]);
}

if ($period === 'yearly') {
    $monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    $monthlyBreakdown = [];
    $totalSales = 0;
    $totalCustomers = 0;
    
    for ($m = 1; $m <= 12; $m++) {
        $ym = $year . '-' . str_pad($m, 2, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total FROM transactions WHERE employee_id=? AND salon_id=? AND DATE_FORMAT(created_at,'%Y-%m')=?");
        $stmt->execute([$empId, $salonId, $ym]);
        $row = $stmt->fetch();
        $monthlyBreakdown[] = [
            'month' => $monthNames[$m - 1],
            'cnt' => (int) ($row['cnt'] ?? 0),
            'total' => (float) ($row['total'] ?? 0),
        ];
        $totalSales += (float) ($row['total'] ?? 0);
        $totalCustomers += (int) ($row['cnt'] ?? 0);
    }

    $commission = calcCommission($totalSales, $employee['commission_rate']);
    $avgMonthly = $totalSales / 12;

    sendSuccess([
        'employee' => $employee,
        'year' => $year,
        'stats' => [
            'customers' => $totalCustomers,
            'income' => $totalSales,
            'commission' => $commission,
        ],
        'avg_monthly' => $avgMonthly,
        'monthly_breakdown' => $monthlyBreakdown,
    ]);
}

sendError('Period غير صحيح، استخدم daily أو monthly أو yearly');
