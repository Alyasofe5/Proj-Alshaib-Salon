<?php
/**
 * Single Service API (SaaS Multi-Tenant)
 * PUT    /api/services/manage.php?id=1  → تعديل
 * PATCH  /api/services/manage.php?id=1  → toggle active
 * DELETE /api/services/manage.php?id=1  → حذف
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

$method = getMethod();
$id = getResourceId();

if (!$id) sendError('معرف الخدمة مطلوب');

// ===== PUT: تعديل خدمة =====
if ($method === 'PUT') {
    $data = getRequestBody();
    $name = trim($data['name'] ?? '');
    if (empty($name)) sendError('اسم الخدمة مطلوب');

    $stmt = $pdo->prepare("UPDATE services SET name=?, price=? WHERE id=? AND salon_id=?");
    $stmt->execute([$name, (float) ($data['price'] ?? 0), $id, $salonId]);
    sendSuccess(null, 200, 'تم تعديل الخدمة');
}

// ===== PATCH: تغيير حالة الخدمة =====
if ($method === 'PATCH') {
    $stmt = $pdo->prepare("UPDATE services SET is_active = NOT is_active WHERE id=? AND salon_id=?");
    $stmt->execute([$id, $salonId]);
    sendSuccess(null, 200, 'تم تغيير حالة الخدمة');
}

// ===== DELETE: حذف خدمة =====
if ($method === 'DELETE') {
    try {
        $pdo->prepare("DELETE FROM services WHERE id=? AND salon_id=?")->execute([$id, $salonId]);
        sendSuccess(null, 200, 'تم حذف الخدمة نهائياً');
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') {
            sendError('لا يمكن حذف هذه الخدمة لوجود فواتير مرتبطة بها', 409);
        }
        sendError('حدث خطأ أثناء الحذف', 500);
    }
}

sendError('Method not allowed', 405);
