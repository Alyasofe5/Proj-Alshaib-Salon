<?php
/**
 * Single Transaction API (SaaS Multi-Tenant)
 * GET    /api/transactions/manage.php?id=1  → تفاصيل عملية
 * DELETE /api/transactions/manage.php?id=1  → حذف عملية
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

[$user, $salonId, $salon] = resolveCurrentTenant();
$method = getMethod();
$id = getResourceId();

if (!$id) sendError('معرف العملية مطلوب');

// ===== GET: تفاصيل عملية =====
if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT t.*, COALESCE(e.name, 'محذوف') as emp_name
        FROM transactions t
        LEFT JOIN employees e ON t.employee_id = e.id
        WHERE t.id = ? AND t.salon_id = ?
    ");
    $stmt->execute([$id, $salonId]);
    $transaction = $stmt->fetch();

    if (!$transaction) sendError('العملية غير موجودة', 404);

    $stmt = $pdo->prepare("
        SELECT td.*, COALESCE(s.name, 'محذوفة') as service_name
        FROM transaction_details td
        LEFT JOIN services s ON td.service_id = s.id
        WHERE td.transaction_id = ?
    ");
    $stmt->execute([$id]);
    $transaction['details'] = $stmt->fetchAll();

    sendSuccess($transaction);
}

// ===== DELETE: حذف عملية =====
if ($method === 'DELETE') {
    if (!isSuperAdmin($user) && $user['role'] !== 'admin') {
        sendError('هذا الإجراء يتطلب صلاحية المدير', 403);
    }

    $stmt = $pdo->prepare("DELETE FROM transactions WHERE id=? AND salon_id=?");
    $stmt->execute([$id, $salonId]);
    sendSuccess(null, 200, 'تم حذف العملية');
}

sendError('Method not allowed', 405);
