<?php
/**
 * Super Admin - Platform Stats
 * GET /api/superadmin/stats.php
 * 
 * إحصائيات المنصة: عدد الصالونات، الاشتراكات، الإيرادات
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireSuperAdmin();

if (getMethod() !== 'GET') sendError('Method not allowed', 405);

// إجمالي الصالونات
$totalSalons = (int) $pdo->query("SELECT COUNT(*) FROM salons")->fetchColumn();
$activeSalons = (int) $pdo->query("SELECT COUNT(*) FROM salons WHERE status='active'")->fetchColumn();
$suspendedSalons = (int) $pdo->query("SELECT COUNT(*) FROM salons WHERE status='suspended'")->fetchColumn();
$expiredSalons = (int) $pdo->query("SELECT COUNT(*) FROM salons WHERE status='expired'")->fetchColumn();

// اشتراكات تنتهي خلال 7 أيام
$expiringSoon = (int) $pdo->query("
    SELECT COUNT(*) FROM salons 
    WHERE status='active' 
    AND subscription_expires_at BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
")->fetchColumn();

// إجمالي المستخدمين والموظفين
$totalUsers = (int) $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
$totalEmployees = (int) $pdo->query("SELECT COUNT(*) FROM employees WHERE is_active=1")->fetchColumn();

// إجمالي الإيرادات (كل الصالونات) - الشهر الحالي
$monthRevenue = (float) $pdo->query("
    SELECT COALESCE(SUM(total_amount),0) FROM transactions 
    WHERE DATE_FORMAT(created_at,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m')
")->fetchColumn();

// إيرادات آخر 6 أشهر
$revenueChart = [];
for ($i = 5; $i >= 0; $i--) {
    $m = date('Y-m', strtotime("-$i months"));
    $label = date('M Y', strtotime($m . '-01'));
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) FROM transactions WHERE DATE_FORMAT(created_at,'%Y-%m')=?");
    $stmt->execute([$m]);
    $revenueChart[] = [
        'month' => $label,
        'revenue' => (float) $stmt->fetchColumn(),
    ];
}

// آخر 5 صالونات مسجلة
$recentSalons = $pdo->query("
    SELECT s.*, sp.name_ar as plan_name,
           (SELECT COUNT(*) FROM employees e WHERE e.salon_id = s.id AND e.is_active=1) as emp_count,
           (SELECT COUNT(*) FROM transactions t WHERE t.salon_id = s.id) as tx_count
    FROM salons s
    LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
    ORDER BY s.created_at DESC LIMIT 5
")->fetchAll();

sendSuccess([
    'salons' => [
        'total' => $totalSalons,
        'active' => $activeSalons,
        'suspended' => $suspendedSalons,
        'expired' => $expiredSalons,
        'expiring_soon' => $expiringSoon,
    ],
    'users' => [
        'total' => $totalUsers,
        'employees' => $totalEmployees,
    ],
    'revenue' => [
        'this_month' => $monthRevenue,
        'chart' => $revenueChart,
    ],
    'recent_salons' => $recentSalons,
]);
