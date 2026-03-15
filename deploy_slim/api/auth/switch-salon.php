<?php
/**
 * Switch Salon (Branch) API
 * POST /api/auth/switch-salon.php
 * 
 * Body: { "salon_id": 2 }
 * 
 * Allows Enterprise plan users to switch between their salons/branches.
 * Returns new JWT token with updated salon_id.
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

if (getMethod() !== 'POST') {
    sendError('Method not allowed', 405);
}

$currentUser = authenticate();
$data = getRequestBody();
$targetSalonId = (int)($data['salon_id'] ?? 0);

if ($targetSalonId <= 0) {
    sendError('يرجى تحديد الصالون', 400);
}

// Super admin can switch to any salon
if (isSuperAdmin($currentUser)) {
    $salon = getSalonInfo($targetSalonId);
} else {
    // Check user has access to this salon
    $branches = getSalonBranches($currentUser['user_id']);
    $allowed = false;
    foreach ($branches as $branch) {
        if ((int)$branch['id'] === $targetSalonId) {
            $allowed = true;
            break;
        }
    }
    
    if (!$allowed) {
        sendError('ليس لديك صلاحية الوصول لهذا الصالون', 403);
    }
    
    $salon = getSalonInfo($targetSalonId);
}

// Check if target salon has valid subscription
if ($salon['status'] !== 'active') {
    sendError('هذا الصالون غير نشط', 403);
}

// Get the user's record in the target salon
// First check if user has a direct account
$stmt = $pdo->prepare("
    SELECT u.id, u.name, u.username, u.role, u.employee_id, u.salon_id,
           e.name as emp_name
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    WHERE u.id = ?
");
$stmt->execute([$currentUser['user_id']]);
$user = $stmt->fetch();

if (!$user) {
    sendError('المستخدم غير موجود', 404);
}

// Generate new JWT with target salon_id
$token = createJWT([
    'user_id'     => (int)$user['id'],
    'salon_id'    => $targetSalonId,
    'username'    => $user['username'],
    'name'        => $user['name'],
    'role'        => $user['role'],
    'employee_id' => $user['employee_id'] ? (int)$user['employee_id'] : null,
]);

// Calculate days left
$daysLeft = null;
if ($salon['subscription_expires_at']) {
    $daysLeft = max(0, (int)ceil((strtotime($salon['subscription_expires_at']) - time()) / 86400));
}

// Verify logo exists
$logoPath = $salon['logo_path'];
if ($logoPath && !file_exists($_SERVER['DOCUMENT_ROOT'] . '/' . $logoPath)) {
    $logoPath = null;
}

// Get features config
$featuresConfig = getSalonFeaturesConfig($salon);

sendSuccess([
    'token' => $token,
    'user' => [
        'id'            => (int)$user['id'],
        'name'          => $user['emp_name'] ?: ($user['name'] ?: $user['username']),
        'username'      => $user['username'],
        'role'          => $user['role'],
        'employee_id'   => $user['employee_id'] ? (int)$user['employee_id'] : null,
        'salon_id'      => $targetSalonId,
    ],
    'salon' => [
        'id'        => (int)$salon['id'],
        'name'      => $salon['name'],
        'slug'      => $salon['slug'],
        'logo'      => $logoPath,
        'status'    => $salon['status'],
        'days_left' => $daysLeft,
        'plan_type' => getPlanType($salon),
        'features'  => $featuresConfig,
    ],
], 200, 'تم التبديل للصالون بنجاح');
