<?php
/**
 * Super Admin - Plans CRUD
 * GET    /api/superadmin/plans.php        → list all plans
 * POST   /api/superadmin/plans.php        → create plan
 * PUT    /api/superadmin/plans.php?id=1   → update plan
 * DELETE /api/superadmin/plans.php?id=1   → delete plan
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireSuperAdmin();
$method = getMethod();
$id = getResourceId();

// ===== GET =====
if ($method === 'GET') {
    $plans = $pdo->query("
        SELECT sp.*,
               (SELECT COUNT(*) FROM salons s WHERE s.subscription_plan_id = sp.id) as salons_count
        FROM subscription_plans sp
        ORDER BY sp.price ASC
    ")->fetchAll();

    // Decode features JSON
    foreach ($plans as &$p) {
        if ($p['features'] && is_string($p['features'])) {
            $p['features'] = json_decode($p['features'], true) ?? [];
        } else {
            $p['features'] = [];
        }
    }

    sendSuccess($plans);
}

// ===== POST: Create plan =====
if ($method === 'POST') {
    $data = getRequestBody();

    $name    = trim($data['name']    ?? '');
    $name_ar = trim($data['name_ar'] ?? '');
    $price   = (float) ($data['price'] ?? 0);
    $features = $data['features'] ?? [];
    $max_employees = (int) ($data['max_employees'] ?? 999);
    $max_services  = (int) ($data['max_services']  ?? 999);
    $duration_days = (int) ($data['duration_days'] ?? 30);
    $is_popular    = (int) (!empty($data['is_popular']));

    if (empty($name) || empty($name_ar)) sendError('الاسم مطلوب (عربي وإنجليزي)', 422);
    if ($price < 0) sendError('السعر غير صحيح', 422);

    $stmt = $pdo->prepare("
        INSERT INTO subscription_plans (name, name_ar, price, duration_days, max_employees, max_services, features, is_popular, is_active)
        VALUES (?,?,?,?,?,?,?,?,1)
    ");
    $stmt->execute([
        $name, $name_ar, $price, $duration_days,
        $max_employees, $max_services,
        json_encode($features, JSON_UNESCAPED_UNICODE),
        $is_popular
    ]);

    sendSuccess(['id' => (int) $pdo->lastInsertId()], 201, 'تم إنشاء الباقة بنجاح');
}

// ===== PUT: Update plan =====
if ($method === 'PUT' && $id) {
    $data = getRequestBody();

    $name    = trim($data['name']    ?? '');
    $name_ar = trim($data['name_ar'] ?? '');
    $price   = (float) ($data['price'] ?? 0);
    $features = $data['features'] ?? [];
    $max_employees = (int) ($data['max_employees'] ?? 999);
    $max_services  = (int) ($data['max_services']  ?? 999);
    $duration_days = (int) ($data['duration_days'] ?? 30);
    $is_popular    = (int) (!empty($data['is_popular']));
    $is_active     = (int) (!empty($data['is_active']));

    if (empty($name) || empty($name_ar)) sendError('الاسم مطلوب (عربي وإنجليزي)', 422);

    // If marking as popular, unset others
    if ($is_popular) {
        $pdo->prepare("UPDATE subscription_plans SET is_popular = 0 WHERE id != ?")->execute([$id]);
    }

    $stmt = $pdo->prepare("
        UPDATE subscription_plans
        SET name=?, name_ar=?, price=?, duration_days=?, max_employees=?, max_services=?, features=?, is_popular=?, is_active=?
        WHERE id=?
    ");
    $stmt->execute([
        $name, $name_ar, $price, $duration_days,
        $max_employees, $max_services,
        json_encode($features, JSON_UNESCAPED_UNICODE),
        $is_popular, $is_active, $id
    ]);

    sendSuccess(null, 200, 'تم تحديث الباقة بنجاح — التغييرات تنعكس فوراً على كل مكان');
}

// ===== DELETE =====
if ($method === 'DELETE' && $id) {
    // Check if plan has salons
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM salons WHERE subscription_plan_id = ?");
    $stmt->execute([$id]);
    $count = (int) $stmt->fetchColumn();

    if ($count > 0) {
        sendError("لا يمكن حذف هذه الباقة — هناك {$count} صالون يستخدمها. قم بتغيير باقتهم أولاً.", 409);
    }

    $pdo->prepare("DELETE FROM subscription_plans WHERE id=?")->execute([$id]);
    sendSuccess(null, 200, 'تم حذف الباقة');
}

sendError('Method not allowed', 405);
