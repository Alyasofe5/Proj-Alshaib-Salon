<?php
/**
 * Current User Info API (SaaS Multi-Tenant)
 * GET /api/auth/me
 * 
 * Returns: Current authenticated user data + salon info + subscription status
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

if (getMethod() !== 'GET') {
    sendError('Method not allowed', 405);
}

$currentUser = authenticate();
$salonId = getSalonId($currentUser);

$stmt = $pdo->prepare("
    SELECT u.id, u.name, u.username, u.role, u.employee_id, u.salon_id,
           u.is_active, u.created_at,
           e.name_ar as employee_name, e.name_en as employee_name_en, e.phone, e.commission_rate, e.salary_type
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    WHERE u.id = ?
");
$stmt->execute([$currentUser['user_id']]);
$user = $stmt->fetch();

if (!$user) {
    sendError('المستخدم غير موجود', 404);
}

// جلب بيانات الصالون
$salon = getSalonInfo($salonId);
$daysLeft = getSubscriptionDaysLeft($salon);

// Always return logo_path from DB — frontend handles missing images gracefully
$logoPath = $salon['logo_path'] ?: null;

// Features config
$featuresConfig = getSalonFeaturesConfig($salon);
$planType = getPlanType($salon);

// Branches for enterprise / admin users
$branches = [];
if ($planType === 'enterprise' || ($user['role'] ?? '') === 'admin') {
    $branches = getSalonBranches($currentUser['user_id']);
}

sendSuccess([
    'user' => $user,
    'salon' => [
        'id'          => (int)$salon['id'],
        'name'        => $salon['name'],
        'slug'        => $salon['slug'],
        'logo'        => $logoPath,
        'status'      => $salon['status'],
        'plan'        => $salon['plan_name_ar'] ?? $salon['plan_name'] ?? 'أساسي',
        'plan_type'   => $planType,
        'features'    => $featuresConfig,
        'expires_at'  => $salon['subscription_expires_at'],
        'days_left'   => $daysLeft,
        'show_alert'  => ($daysLeft !== null && $daysLeft <= 7 && $daysLeft > 0),
    ],
    'branches' => $branches,
]);
