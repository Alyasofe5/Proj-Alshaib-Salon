<?php
/**
 * Login API Endpoint (SaaS Multi-Tenant)
 * POST /api/auth/login
 * 
 * Body: { "username": "admin", "password": "...", "salon_slug": "alshaib" }
 * Returns: JWT Token + User info + Salon info
 * 
 * Flow:
 * 1. Find user by username
 * 2. Verify password
 * 3. Check salon status & subscription
 * 4. Generate JWT with salon_id
 * 5. Return user + salon data
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

if (empty($username) || empty($password)) {
    sendError('يرجى إدخال اسم المستخدم وكلمة المرور');
}

// البحث عن المستخدم مع بيانات الصالون
$query = "
    SELECT u.*, e.name as emp_name, 
           s.id as s_id, s.name as s_name, s.slug as s_slug, 
           s.logo_path as s_logo, s.status as s_status,
           s.subscription_expires_at as s_expires
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    LEFT JOIN salons s ON u.salon_id = s.id
    WHERE u.username = ? AND u.is_active = 1
";

$params = [$username];

// إذا تم إرسال salon_slug، فلتر بالصالون المحدد
if (!empty($salonSlug)) {
    $query .= " AND s.slug = ?";
    $params[] = $salonSlug;
}

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    sendError('اسم المستخدم أو كلمة المرور غير صحيحة', 401);
}

// التحقق من حالة الصالون (Super Admin يتجاوز)
if ($user['role'] !== 'super_admin') {
    if (!$user['s_id']) {
        sendError('لم يتم ربط حسابك بأي صالون. تواصل مع الإدارة.', 403);
    }
    if ($user['s_status'] === 'suspended') {
        sendError('تم إيقاف اشتراك هذا الصالون. يرجى التواصل مع الإدارة لتفعيل الاشتراك.', 403);
    }
    if ($user['s_status'] === 'expired' || 
        ($user['s_expires'] && strtotime($user['s_expires']) < time())) {
        sendError('انتهى اشتراك هذا الصالون. يرجى تجديد الاشتراك.', 403);
    }
}

// إنشاء JWT Token (يحتوي salon_id)
$token = createJWT([
    'user_id'     => (int)$user['id'],
    'salon_id'    => (int)$user['salon_id'],
    'username'    => $user['username'],
    'name'        => $user['name'],
    'role'        => $user['role'],
    'employee_id' => $user['employee_id'] ? (int)$user['employee_id'] : null,
]);

// حساب الأيام المتبقية
$daysLeft = null;
if ($user['s_expires']) {
    $daysLeft = max(0, (int)ceil((strtotime($user['s_expires']) - time()) / 86400));
}

// الحصول على بيانات الباقة والمميزات
$planType = 'free';
$featuresConfig = [];
$branches = [];

if ($user['s_id']) {
    // Get plan info
    $planStmt = $pdo->prepare("
        SELECT sp.plan_type, sp.features_config
        FROM salons s
        LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
        WHERE s.id = ?
    ");
    $planStmt->execute([$user['s_id']]);
    $planInfo = $planStmt->fetch();
    if ($planInfo) {
        $planType = $planInfo['plan_type'] ?? 'free';
        $rawFeatures = $planInfo['features_config'] ?? null;
        $featuresConfig = $rawFeatures ? (json_decode($rawFeatures, true) ?: []) : [];
    }

    // If enterprise plan, fetch available branches
    if ($planType === 'enterprise' || $user['role'] === 'super_admin') {
        require_once __DIR__ . '/../../middleware/salon.php';
        $branches = getSalonBranches($user['id']);
    }
}

sendSuccess([
    'token' => $token,
    'user' => [
        'id'            => (int)$user['id'],
        'name'          => $user['emp_name'] ?: ($user['name'] ?: $user['username']),
        'username'      => $user['username'],
        'role'          => $user['role'],
        'employee_id'   => $user['employee_id'] ? (int)$user['employee_id'] : null,
        'employee_name' => $user['emp_name'],
        'salon_id'      => (int)$user['salon_id'],
    ],
    'salon' => [
        'id'        => (int)($user['s_id'] ?? 0),
        'name'      => $user['s_name'] ?? '',
        'slug'      => $user['s_slug'] ?? '',
        'logo'      => $user['s_logo'] ?? null,
        'status'    => $user['s_status'] ?? 'active',
        'days_left' => $daysLeft,
        'plan_type' => $planType,
        'features'  => $featuresConfig,
    ],
    'branches' => $branches,
], 200, 'تم تسجيل الدخول بنجاح');
