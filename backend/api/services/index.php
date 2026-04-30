<?php
/**
 * Services API (SaaS Multi-Tenant)
 * GET  /api/services         -> list services scoped by salon_id
 * POST /api/services         -> create service
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

$method = getMethod();

function ensureServiceMediaColumns(PDO $pdo): void {
    try {
        $columns = [
            'image_path' => "ALTER TABLE services ADD COLUMN image_path VARCHAR(255) DEFAULT NULL",
            'video_path' => "ALTER TABLE services ADD COLUMN video_path VARCHAR(255) DEFAULT NULL",
            'duration_minutes' => "ALTER TABLE services ADD COLUMN duration_minutes INT DEFAULT NULL",
        ];

        foreach ($columns as $name => $sql) {
            $check = $pdo->query("SHOW COLUMNS FROM services LIKE '{$name}'")->fetch();
            if (!$check) {
                $pdo->exec($sql);
            }
        }
    } catch (Exception $e) {
        // Ignore schema sync errors to preserve backward compatibility.
    }
}

if ($method === 'GET') {
    [$user, $salonId, $salon] = resolveCurrentTenant();
    ensureServiceMediaColumns($pdo);

    $activeOnly = $_GET['active_only'] ?? '0';
    if ($activeOnly === '1') {
        $stmt = $pdo->prepare("SELECT * FROM services WHERE salon_id = ? AND is_active = 1 ORDER BY name_ar");
    } else {
        $stmt = $pdo->prepare("SELECT * FROM services WHERE salon_id = ? ORDER BY is_active DESC, created_at DESC");
    }

    $stmt->execute([$salonId]);
    sendSuccess($stmt->fetchAll());
}

if ($method === 'POST') {
    [$user, $salonId, $salon] = resolveCurrentTenant();
    if (!isSuperAdmin($user) && $user['role'] !== 'admin') {
        sendError('هذا الإجراء يتطلب صلاحية المدير', 403);
    }

    ensureServiceMediaColumns($pdo);
    checkServiceLimit($salonId, $salon);

    $data = getRequestBody();
    $name = trim($data['name'] ?? '');
    $price = (float)($data['price'] ?? 0);
    $duration = isset($data['duration_minutes']) && $data['duration_minutes'] !== ''
        ? (int)$data['duration_minutes']
        : null;

    if ($name === '') sendError('اسم الخدمة مطلوب');
    if ($price <= 0) sendError('السعر يجب أن يكون أكبر من صفر');
    if ($duration !== null && $duration <= 0) sendError('مدة الخدمة يجب أن تكون أكبر من صفر');

    $bi = splitBilingual($name);
    $stmt = $pdo->prepare("
        INSERT INTO services (salon_id, name_ar, name_en, price, duration_minutes)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$salonId, $bi['ar'], $bi['en'], $price, $duration]);

    sendSuccess(['id' => (int)$pdo->lastInsertId()], 201, 'تم إضافة الخدمة بنجاح');
}

sendError('Method not allowed', 405);
