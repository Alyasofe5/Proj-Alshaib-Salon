<?php
/**
 * Services API (SaaS Multi-Tenant)
 * GET  /api/services         → كل الخدمات (scoped by salon_id)
 * POST /api/services         → إضافة خدمة (with salon_id + limit check)
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

$method = getMethod();

// ===== GET: قائمة الخدمات =====
if ($method === 'GET') {
    [$user, $salonId, $salon] = resolveCurrentTenant();

    // Ensure image_path column exists
    try {
        $check = $pdo->query("SHOW COLUMNS FROM services LIKE 'image_path'")->fetch();
        if (!$check) {
            $pdo->exec("ALTER TABLE services ADD COLUMN image_path VARCHAR(255) DEFAULT NULL");
        }
    } catch (Exception $e) { /* ignore */ }

    $activeOnly = $_GET['active_only'] ?? '0';

    if ($activeOnly === '1') {
        $stmt = $pdo->prepare("SELECT * FROM services WHERE salon_id = ? AND is_active = 1 ORDER BY name");
    } else {
        $stmt = $pdo->prepare("SELECT * FROM services WHERE salon_id = ? ORDER BY is_active DESC, created_at DESC");
    }
    $stmt->execute([$salonId]);
    $services = $stmt->fetchAll();

    sendSuccess($services);
}

// ===== POST: إضافة خدمة =====
if ($method === 'POST') {
    [$user, $salonId, $salon] = resolveCurrentTenant();
    if (!isSuperAdmin($user) && $user['role'] !== 'admin') {
        sendError('هذا الإجراء يتطلب صلاحية المدير', 403);
    }

    checkServiceLimit($salonId, $salon);

    $data = getRequestBody();
    $name = trim($data['name'] ?? '');
    $price = (float) ($data['price'] ?? 0);

    if (empty($name)) sendError('اسم الخدمة مطلوب');
    if ($price <= 0) sendError('السعر يجب أن يكون أكبر من صفر');

    $stmt = $pdo->prepare("INSERT INTO services (salon_id, name, price) VALUES (?,?,?)");
    $stmt->execute([$salonId, $name, $price]);

    sendSuccess(['id' => (int) $pdo->lastInsertId()], 201, 'تم إضافة الخدمة بنجاح');
}

sendError('Method not allowed', 405);
