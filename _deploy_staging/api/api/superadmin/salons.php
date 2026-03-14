<?php
/**
 * Super Admin - Salons CRUD
 * GET    /api/superadmin/salons.php           → قائمة الصالونات
 * POST   /api/superadmin/salons.php           → إنشاء صالون جديد
 * PUT    /api/superadmin/salons.php?id=1      → تعديل صالون
 * PATCH  /api/superadmin/salons.php?id=1      → تغيير حالة (active/suspended)
 * DELETE /api/superadmin/salons.php?id=1      → حذف صالون
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

$user = requireSuperAdmin();
$method = getMethod();
$id = getResourceId();

// ===== GET: قائمة الصالونات =====
if ($method === 'GET') {
    if ($id) {
        // صالون واحد مع تفاصيل
        $stmt = $pdo->prepare("
            SELECT s.*, sp.name_ar as plan_name, sp.price as plan_price,
                   sp.max_employees, sp.max_services,
                   (SELECT COUNT(*) FROM users u WHERE u.salon_id = s.id) as users_count,
                   (SELECT COUNT(*) FROM employees e WHERE e.salon_id = s.id AND e.is_active=1) as employees_count,
                   (SELECT COUNT(*) FROM services sv WHERE sv.salon_id = s.id AND sv.is_active=1) as services_count,
                   (SELECT COUNT(*) FROM transactions t WHERE t.salon_id = s.id) as transactions_count,
                   (SELECT COALESCE(SUM(total_amount),0) FROM transactions t WHERE t.salon_id = s.id) as total_revenue
            FROM salons s
            LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
            WHERE s.id = ?
        ");
        $stmt->execute([$id]);
        $salon = $stmt->fetch();
        if (!$salon) sendError('الصالون غير موجود', 404);
        sendSuccess($salon);
    }

    // كل الصالونات
    $salons = $pdo->query("
        SELECT s.*, sp.name_ar as plan_name,
               (SELECT COUNT(*) FROM employees e WHERE e.salon_id = s.id AND e.is_active=1) as emp_count,
               (SELECT COUNT(*) FROM transactions t WHERE t.salon_id = s.id AND DATE_FORMAT(t.created_at,'%Y-%m')=DATE_FORMAT(NOW(),'%Y-%m')) as month_tx,
               (SELECT COALESCE(SUM(total_amount),0) FROM transactions t WHERE t.salon_id = s.id AND DATE_FORMAT(t.created_at,'%Y-%m')=DATE_FORMAT(NOW(),'%Y-%m')) as month_revenue
        FROM salons s
        LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
        ORDER BY s.created_at DESC
    ")->fetchAll();

    // الباقات
    $plans = $pdo->query("SELECT * FROM subscription_plans WHERE is_active=1 ORDER BY price")->fetchAll();

    sendSuccess(['salons' => $salons, 'plans' => $plans]);
}

// ===== POST: إنشاء صالون جديد =====
if ($method === 'POST') {
    $data = getRequestBody();

    $name = trim($data['name'] ?? '');
    $slug = trim($data['slug'] ?? '');
    $ownerName = trim($data['owner_name'] ?? '');
    $ownerEmail = trim($data['owner_email'] ?? '');
    $ownerPhone = trim($data['owner_phone'] ?? '');
    $planId = (int) ($data['subscription_plan_id'] ?? 1);
    $durationDays = (int) ($data['duration_days'] ?? 30);

    if (empty($name)) sendError('اسم الصالون مطلوب');
    if (empty($slug)) sendError('الرابط المخصص مطلوب');

    // تحقق من تكرار slug
    $stmt = $pdo->prepare("SELECT id FROM salons WHERE slug = ?");
    $stmt->execute([$slug]);
    if ($stmt->fetch()) sendError('الرابط المخصص مستخدم مسبقاً');

    // إنشاء الصالون
    $stmt = $pdo->prepare("
        INSERT INTO salons (name, slug, owner_name, owner_email, owner_phone, status, subscription_plan_id, subscription_starts_at, subscription_expires_at) 
        VALUES (?,?,?,?,?,'active',?,CURDATE(),DATE_ADD(CURDATE(), INTERVAL ? DAY))
    ");
    $stmt->execute([$name, $slug, $ownerName, $ownerEmail, $ownerPhone, $planId, $durationDays]);
    $salonId = (int) $pdo->lastInsertId();

    // إنشاء حساب admin للصالون (اختياري)
    if (!empty($data['admin_username']) && !empty($data['admin_password'])) {
        $adminUsername = trim($data['admin_username']);
        $adminPassword = password_hash($data['admin_password'], PASSWORD_BCRYPT);

        // تحقق من تكرار اسم الدخول
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$adminUsername]);
        if ($stmt->fetch()) {
            sendError('اسم الدخول للمدير مستخدم مسبقاً');
        }

        $stmt = $pdo->prepare("INSERT INTO users (salon_id, name, username, password, role) VALUES (?,?,?,?,'admin')");
        $stmt->execute([$salonId, $ownerName ?: $name . ' Admin', $adminUsername, $adminPassword]);
    }

    // سجل الاشتراك
    $pdo->prepare("INSERT INTO subscription_logs (salon_id, action, plan_id, created_by) VALUES (?,'created',?,?)")
        ->execute([$salonId, $planId, $user['user_id']]);

    sendSuccess(['id' => $salonId], 201, 'تم إنشاء الصالون بنجاح');
}

// ===== PUT: تعديل صالون =====
if ($method === 'PUT' && $id) {
    $data = getRequestBody();

    $name = trim($data['name'] ?? '');
    if (empty($name)) sendError('اسم الصالون مطلوب');

    $stmt = $pdo->prepare("
        UPDATE salons SET name=?, owner_name=?, owner_email=?, owner_phone=?, subscription_plan_id=?
        WHERE id=?
    ");
    $stmt->execute([
        $name,
        trim($data['owner_name'] ?? ''),
        trim($data['owner_email'] ?? ''),
        trim($data['owner_phone'] ?? ''),
        (int) ($data['subscription_plan_id'] ?? 1),
        $id
    ]);

    sendSuccess(null, 200, 'تم تعديل الصالون');
}

// ===== PATCH: تغيير حالة الصالون =====
if ($method === 'PATCH' && $id) {
    $data = getRequestBody();
    $newStatus = $data['status'] ?? '';

    if (!in_array($newStatus, ['active', 'suspended', 'expired'])) {
        sendError('حالة غير صحيحة');
    }

    $pdo->prepare("UPDATE salons SET status=? WHERE id=?")->execute([$newStatus, $id]);

    // تجديد الاشتراك عند التفعيل
    if ($newStatus === 'active' && !empty($data['duration_days'])) {
        $days = (int) $data['duration_days'];
        
        // إذا الاشتراك لسا ما انتهى، نمدد من تاريخ الانتهاء الحالي
        $stmt = $pdo->prepare("SELECT subscription_expires_at FROM salons WHERE id = ?");
        $stmt->execute([$id]);
        $current = $stmt->fetch();
        $currentExpiry = $current['subscription_expires_at'] ?? null;
        
        if ($currentExpiry && strtotime($currentExpiry) > time()) {
            // مدد من تاريخ الانتهاء الحالي
            $pdo->prepare("UPDATE salons SET subscription_expires_at = DATE_ADD(subscription_expires_at, INTERVAL ? DAY) WHERE id = ?")
                ->execute([$days, $id]);
        } else {
            // ابدأ من اليوم
            $pdo->prepare("UPDATE salons SET subscription_starts_at = CURDATE(), subscription_expires_at = DATE_ADD(CURDATE(), INTERVAL ? DAY) WHERE id = ?")
                ->execute([$days, $id]);
        }
    }

    // سجل
    $action = $newStatus === 'active' ? 'reactivated' : $newStatus;
    $pdo->prepare("INSERT INTO subscription_logs (salon_id, action, created_by) VALUES (?,?,?)")
        ->execute([$id, $action, $user['user_id']]);

    sendSuccess(null, 200, 'تم تغيير حالة الصالون');
}

// ===== DELETE: حذف صالون =====
if ($method === 'DELETE' && $id) {
    if ($id == 1) sendError('لا يمكن حذف الصالون الرئيسي', 403);

    $pdo->prepare("DELETE FROM salons WHERE id=?")->execute([$id]);
    sendSuccess(null, 200, 'تم حذف الصالون');
}

sendError('Method not allowed', 405);
