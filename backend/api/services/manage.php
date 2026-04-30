<?php
/**
 * Single Service API (SaaS Multi-Tenant)
 * PUT    /api/services/manage.php?id=1  -> update
 * PATCH  /api/services/manage.php?id=1  -> toggle active
 * DELETE /api/services/manage.php?id=1  -> delete
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

try {
    $columns = [
        'duration_minutes' => "ALTER TABLE services ADD COLUMN duration_minutes INT DEFAULT NULL",
        'video_path' => "ALTER TABLE services ADD COLUMN video_path VARCHAR(255) DEFAULT NULL",
    ];
    foreach ($columns as $name => $sql) {
        $check = $pdo->query("SHOW COLUMNS FROM services LIKE '{$name}'")->fetch();
        if (!$check) {
            $pdo->exec($sql);
        }
    }
} catch (Exception $e) {
    // Ignore schema sync failures.
}

$method = getMethod();
$id = getResourceId();

if (!$id) sendError('معرف الخدمة مطلوب');

if ($method === 'PUT') {
    $data = getRequestBody();
    $name = trim($data['name'] ?? '');
    $duration = isset($data['duration_minutes']) && $data['duration_minutes'] !== ''
        ? (int)$data['duration_minutes']
        : null;

    if ($name === '') sendError('اسم الخدمة مطلوب');
    if ($duration !== null && $duration <= 0) sendError('مدة الخدمة يجب أن تكون أكبر من صفر');

    $bi = splitBilingual($name);
    $stmt = $pdo->prepare("
        UPDATE services
        SET name_ar = ?, name_en = ?, price = ?, duration_minutes = ?
        WHERE id = ? AND salon_id = ?
    ");
    $stmt->execute([$bi['ar'], $bi['en'], (float)($data['price'] ?? 0), $duration, $id, $salonId]);

    sendSuccess(null, 200, 'تم تعديل الخدمة');
}

if ($method === 'PATCH') {
    $stmt = $pdo->prepare("UPDATE services SET is_active = NOT is_active WHERE id = ? AND salon_id = ?");
    $stmt->execute([$id, $salonId]);
    sendSuccess(null, 200, 'تم تغيير حالة الخدمة');
}

if ($method === 'DELETE') {
    try {
        $pdo->prepare("DELETE FROM services WHERE id = ? AND salon_id = ?")->execute([$id, $salonId]);
        sendSuccess(null, 200, 'تم حذف الخدمة نهائيا');
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') {
            sendError('لا يمكن حذف هذه الخدمة لوجود فواتير مرتبطة بها', 409);
        }
        sendError('حدث خطأ أثناء الحذف', 500);
    }
}

sendError('Method not allowed', 405);
