<?php
/**
 * Single Expense API (SaaS Multi-Tenant)
 * DELETE /api/expenses/manage.php?id=1  → حذف مصروف
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

if (!$id) sendError('معرف المصروف مطلوب');

if ($method === 'DELETE') {
    $stmt = $pdo->prepare("DELETE FROM expenses WHERE id=? AND salon_id=?");
    $stmt->execute([$id, $salonId]);
    sendSuccess(null, 200, 'تم حذف المصروف');
}

sendError('Method not allowed', 405);
