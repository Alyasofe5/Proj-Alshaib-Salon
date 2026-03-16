<?php
/**
 * Single User API (SaaS Multi-Tenant)
 * PUT    /api/users/manage.php?id=1  → تعديل (reset password, toggle)
 * DELETE /api/users/manage.php?id=1  → حذف
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

[$currentUser, $salonId, $salon] = resolveCurrentTenant();
if (!isSuperAdmin($currentUser) && $currentUser['role'] !== 'admin') {
    sendError('هذا الإجراء يتطلب صلاحية المدير', 403);
}

$method = getMethod();
$id = getResourceId();

if (!$id) sendError('معرف المستخدم مطلوب');

// ===== PUT: تعديل مستخدم =====
if ($method === 'PUT') {
    $data = getRequestBody();
    $action = $data['action'] ?? 'update';

    if ($action === 'reset_password') {
        $newPassword = $data['new_password'] ?? '';
        if (empty($newPassword)) sendError('كلمة المرور الجديدة مطلوبة');

        $hashedPw = password_hash($newPassword, PASSWORD_BCRYPT);
        $pdo->prepare("UPDATE users SET password=? WHERE id=? AND salon_id=?")->execute([$hashedPw, $id, $salonId]);
        sendSuccess(null, 200, 'تم تغيير كلمة المرور');
    }

    if ($action === 'toggle') {
        $pdo->prepare("UPDATE users SET is_active = NOT is_active WHERE id=? AND salon_id=?")->execute([$id, $salonId]);
        sendSuccess(null, 200, 'تم تغيير حالة المستخدم');
    }

    sendError('إجراء غير معروف');
}

// ===== DELETE: حذف مستخدم =====
if ($method === 'DELETE') {
    if ($id == $currentUser['user_id']) {
        sendError('لا يمكنك حذف حسابك الخاص', 403);
    }

    $pdo->prepare("DELETE FROM users WHERE id=? AND salon_id=?")->execute([$id, $salonId]);
    sendSuccess(null, 200, 'تم حذف المستخدم بنجاح');
}

sendError('Method not allowed', 405);
