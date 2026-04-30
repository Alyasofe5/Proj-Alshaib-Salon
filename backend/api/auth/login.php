<?php
/**
 * Login API Endpoint (SaaS Multi-Tenant)
 * POST /api/auth/login
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../middleware/response.php';

if (getMethod() !== 'POST') {
    sendError('Method not allowed', 405);
}

$data = getRequestBody();
$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');
$salonSlug = trim($data['salon_slug'] ?? '');

if ($username === '' || $password === '') {
    sendError('يرجى إدخال اسم المستخدم وكلمة المرور');
}

$hasSalonStatus = dbHasColumn('salons', 'status');
$hasSalonExpires = dbHasColumn('salons', 'subscription_expires_at');
$hasSalonPlanId = dbHasColumn('salons', 'subscription_plan_id');
$hasPlanTable = dbTableExists('subscription_plans');
$hasPlanType = $hasPlanTable && dbHasColumn('subscription_plans', 'plan_type');
$hasFeaturesConfig = $hasPlanTable && dbHasColumn('subscription_plans', 'features_config');

$query = "
    SELECT u.*, e.name_ar AS emp_name, e.name_en AS emp_name_en,
           s.id AS s_id,
           s.name_ar AS s_name, s.name_en AS s_name_en,
           s.slug AS s_slug,
           s.logo_path AS s_logo,
           " . ($hasSalonStatus ? "s.status" : "'active'") . " AS s_status,
           " . ($hasSalonExpires ? "s.subscription_expires_at" : "NULL") . " AS s_expires
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    LEFT JOIN salons s ON u.salon_id = s.id
    WHERE u.username = ? AND u.is_active = 1
";

$params = [$username];

if ($salonSlug !== '') {
    $query .= " AND s.slug = ?";
    $params[] = $salonSlug;
}

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $user = $stmt->fetch();
} catch (PDOException $e) {
    sendError('Login temporarily unavailable: user lookup failed', 500, ['detail' => $e->getMessage()]);
}

if (!$user || !password_verify($password, $user['password'])) {
    sendError('اسم المستخدم أو كلمة المرور غير صحيحة', 401);
}

if (($user['role'] ?? '') !== 'super_admin') {
    if (empty($user['s_id'])) {
        sendError('لم يتم ربط حسابك بأي صالون. تواصل مع الإدارة.', 403);
    }

    if (($user['s_status'] ?? 'active') === 'suspended') {
        sendError('تم إيقاف اشتراك هذا الصالون. يرجى التواصل مع الإدارة لتفعيل الاشتراك.', 403);
    }

    if (($user['s_status'] ?? 'active') === 'expired' ||
        (!empty($user['s_expires']) && strtotime($user['s_expires']) < time())) {
        sendError('انتهى اشتراك هذا الصالون. يرجى تجديد الاشتراك.', 403);
    }
}

$token = createJWT([
    'user_id' => (int)$user['id'],
    'salon_id' => (int)$user['salon_id'],
    'username' => $user['username'],
    'name' => $user['name'],
    'role' => $user['role'],
    'employee_id' => $user['employee_id'] ? (int)$user['employee_id'] : null,
]);

$daysLeft = null;
if (!empty($user['s_expires'])) {
    $daysLeft = max(0, (int)ceil((strtotime($user['s_expires']) - time()) / 86400));
}

$planType = 'free';
$featuresConfig = [];
$branches = [];

if (!empty($user['s_id']) && $hasSalonPlanId && $hasPlanTable) {
    $planQuery = "
        SELECT " . ($hasPlanType ? "sp.plan_type" : "'free'") . " AS plan_type,
               " . ($hasFeaturesConfig ? "sp.features_config" : "NULL") . " AS features_config
        FROM salons s
        LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
        WHERE s.id = ?
    ";

    try {
        $planStmt = $pdo->prepare($planQuery);
        $planStmt->execute([$user['s_id']]);
        $planInfo = $planStmt->fetch();

        if ($planInfo) {
            $planType = $planInfo['plan_type'] ?? 'free';
            $rawFeatures = $planInfo['features_config'] ?? null;
            $featuresConfig = $rawFeatures ? (json_decode($rawFeatures, true) ?: []) : [];
        }
    } catch (PDOException $e) {
        // Older DB schema: keep fallback defaults instead of failing login.
    }

    if ($planType === 'enterprise' || ($user['role'] ?? '') === 'super_admin') {
        require_once __DIR__ . '/../../middleware/salon.php';
        $branches = getSalonBranches((int)$user['id']);
    }
}

sendSuccess([
    'token' => $token,
    'user' => [
        'id' => (int)$user['id'],
        'name' => $user['emp_name'] ?: ($user['name'] ?: $user['username']),
        'username' => $user['username'],
        'role' => $user['role'],
        'employee_id' => $user['employee_id'] ? (int)$user['employee_id'] : null,
        'employee_name' => $user['emp_name'],
        'salon_id' => (int)$user['salon_id'],
    ],
    'salon' => [
        'id' => (int)($user['s_id'] ?? 0),
        'name' => $user['s_name'] ?? '',
        'slug' => $user['s_slug'] ?? '',
        'logo' => $user['s_logo'] ?? null,
        'status' => $user['s_status'] ?? 'active',
        'days_left' => $daysLeft,
        'plan_type' => $planType,
        'features' => $featuresConfig,
    ],
    'branches' => $branches,
], 200, 'تم تسجيل الدخول بنجاح');
