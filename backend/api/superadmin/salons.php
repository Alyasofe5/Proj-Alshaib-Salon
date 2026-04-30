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

// ── Ensure settings column exists in salons table ──
try {
    $col = $pdo->query("SHOW COLUMNS FROM salons LIKE 'settings'")->fetch();
    if (!$col) {
        $pdo->exec("ALTER TABLE salons ADD COLUMN settings JSON DEFAULT NULL");
    }
} catch (Exception $e) { /* ignore */ }

// ===== GET: قائمة الصالونات =====
if ($method === 'GET') {
    if ($id) {
        // صالون واحد مع تفاصيل
        $stmt = $pdo->prepare("
            SELECT s.*, sp.name_ar as plan_name, sp.price as plan_price,
                   sp.max_employees, sp.max_services, sp.plan_type, sp.features_config,
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
        SELECT s.*, sp.name_ar as plan_name, sp.plan_type,
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
    $durationDays = max(1, (int) ($data['duration_days'] ?? 30));
    $adminUsername = trim($data['admin_username'] ?? '');
    $adminPasswordRaw = (string) ($data['admin_password'] ?? '');

    if ($name === '') sendError('اسم الصالون مطلوب', 422);
    if ($slug === '') sendError('الرابط المخصص مطلوب', 422);
    if (!preg_match('/^[a-z0-9-]{2,50}$/i', $slug)) {
        sendError('الرابط المخصص يجب أن يحتوي حروف إنجليزية وأرقام فقط (٢-٥٠ حرف)', 422);
    }
    if ($ownerEmail !== '' && !filter_var($ownerEmail, FILTER_VALIDATE_EMAIL)) {
        sendError('البريد الإلكتروني غير صحيح', 422);
    }
    if ($adminUsername !== '' || $adminPasswordRaw !== '') {
        if ($adminUsername === '' || $adminPasswordRaw === '') {
            sendError('اسم الدخول وكلمة المرور للمدير مطلوبان معاً', 422);
        }
        if (strlen($adminPasswordRaw) < 6) {
            sendError('كلمة مرور المدير يجب أن تكون ٦ أحرف على الأقل', 422);
        }
    }

    // تحقق من تكرار slug
    $stmt = $pdo->prepare("SELECT id FROM salons WHERE slug = ?");
    $stmt->execute([$slug]);
    if ($stmt->fetch()) sendError('الرابط المخصص مستخدم مسبقاً', 409);

    // تحقق من تكرار اسم الدخول قبل البدء بالـ transaction
    if ($adminUsername !== '') {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$adminUsername]);
        if ($stmt->fetch()) sendError('اسم الدخول للمدير مستخدم مسبقاً', 409);
    }

    // تحقق من وجود الباقة
    $stmt = $pdo->prepare("SELECT id FROM subscription_plans WHERE id = ? AND is_active = 1");
    $stmt->execute([$planId]);
    if (!$stmt->fetch()) sendError('الباقة المختارة غير متاحة', 422);

    try {
        $pdo->beginTransaction();

        // إنشاء الصالون
        $stmt = $pdo->prepare("
            INSERT INTO salons (name, slug, owner_name, owner_email, owner_phone, status, subscription_plan_id, subscription_starts_at, subscription_expires_at)
            VALUES (?, ?, ?, ?, ?, 'active', ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY))
        ");
        $stmt->execute([$name, $slug, $ownerName, $ownerEmail, $ownerPhone, $planId, $durationDays]);
        $salonId = (int) $pdo->lastInsertId();
        if ($salonId <= 0) throw new Exception('تعذّر إنشاء الصالون');

        // إنشاء حساب admin للصالون (اختياري)
        if ($adminUsername !== '' && $adminPasswordRaw !== '') {
            $adminPassword = password_hash($adminPasswordRaw, PASSWORD_BCRYPT);
            $adminDisplayName = $ownerName !== '' ? $ownerName : ($name . ' Admin');
            $stmt = $pdo->prepare("INSERT INTO users (salon_id, name, username, password, role) VALUES (?, ?, ?, ?, 'admin')");
            $stmt->execute([$salonId, $adminDisplayName, $adminUsername, $adminPassword]);
        }

        // سجل الاشتراك (آمن — لا يفشل العملية إذا فشل التسجيل)
        try {
            $pdo->prepare("INSERT INTO subscription_logs (salon_id, action, plan_id, created_by) VALUES (?, 'created', ?, ?)")
                ->execute([$salonId, $planId, $user['user_id']]);
        } catch (Exception $logErr) { /* ignore logging errors */ }

        $pdo->commit();
        sendSuccess(['id' => $salonId], 201, 'تم إنشاء الصالون بنجاح');
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        sendError('فشل إنشاء الصالون: ' . $e->getMessage(), 500);
    }
}

// ===== PUT: تعديل صالون =====
if ($method === 'PUT' && $id) {
    $data = getRequestBody();

    $name = trim($data['name'] ?? '');
    if (empty($name)) sendError('اسم الصالون مطلوب');

    $stmt = $pdo->prepare("
        UPDATE salons SET name=?, owner_name=?, owner_email=?, owner_phone=?, subscription_plan_id=?, settings=?
        WHERE id=?
    ");
    $stmt->execute([
        $name,
        trim($data['owner_name'] ?? ''),
        trim($data['owner_email'] ?? ''),
        trim($data['owner_phone'] ?? ''),
        (int) ($data['subscription_plan_id'] ?? 1),
        isset($data['settings']) ? (is_array($data['settings']) ? json_encode($data['settings']) : $data['settings']) : null,
        $id
    ]);

    sendSuccess(null, 200, 'تم تعديل الصالون');
}

// ===== PATCH: تغيير حالة الصالون / تحديث الاشتراك =====
if ($method === 'PATCH' && $id) {
    $data = getRequestBody();
    $newStatus = $data['status'] ?? '';

    if (!in_array($newStatus, ['active', 'suspended', 'expired'])) {
        sendError('حالة غير صحيحة');
    }

    $pdo->prepare("UPDATE salons SET status=? WHERE id=?")->execute([$newStatus, $id]);

    // تغيير الباقة إذا تم تحديدها
    if (!empty($data['subscription_plan_id'])) {
        $newPlanId = (int) $data['subscription_plan_id'];
        $pdo->prepare("UPDATE salons SET subscription_plan_id=? WHERE id=?")->execute([$newPlanId, $id]);
        
        // سجل تغيير الباقة (في try-catch لتجنب أخطاء جدول السجلات)
        try {
            $pdo->prepare("INSERT INTO subscription_logs (salon_id, action, created_by) VALUES (?,'plan_changed',?)")
                ->execute([$id, $user['user_id']]);
        } catch (Exception $e) { /* ignore logging errors */ }
    }

    // تجديد الاشتراك عند التفعيل
    if ($newStatus === 'active' && !empty($data['duration_days'])) {
        $days = (int) $data['duration_days'];
        
        // إذا الاشتراك لسا ما انتهى، نمدد من تاريخ الانتهاء الحالي
        $stmt = $pdo->prepare("SELECT subscription_expires_at FROM salons WHERE id = ?");
        $stmt->execute([$id]);
        $current = $stmt->fetch();
        $currentExpiry = $current['subscription_expires_at'] ?? null;
        
        if ($currentExpiry && strtotime($currentExpiry) > time()) {
            $pdo->prepare("UPDATE salons SET subscription_expires_at = DATE_ADD(subscription_expires_at, INTERVAL ? DAY) WHERE id = ?")
                ->execute([$days, $id]);
        } else {
            $pdo->prepare("UPDATE salons SET subscription_starts_at = CURDATE(), subscription_expires_at = DATE_ADD(CURDATE(), INTERVAL ? DAY) WHERE id = ?")
                ->execute([$days, $id]);
        }
    }

    // سجل الحالة
    try {
        $action = $newStatus === 'active' ? 'reactivated' : $newStatus;
        $pdo->prepare("INSERT INTO subscription_logs (salon_id, action, created_by) VALUES (?,?,?)")
            ->execute([$id, $action, $user['user_id']]);
    } catch (Exception $e) { /* ignore logging errors */ }

    sendSuccess(null, 200, 'تم تحديث الصالون بنجاح');
}

// ===== DELETE: حذف صالون نهائي مع جميع بياناته =====
if ($method === 'DELETE' && $id) {

    // حماية: لا يمكن حذف الصالون الرئيسي
    if ($id == 1) sendError('لا يمكن حذف الصالون الرئيسي', 403);

    // تحقق من وجود الصالون
    $stmt = $pdo->prepare("SELECT id, name FROM salons WHERE id = ?");
    $stmt->execute([$id]);
    $salon = $stmt->fetch();
    if (!$salon) sendError('الصالون غير موجود', 404);

    // تأكيد نصي (الـ frontend يرسل اسم الصالون)
    $data = getRequestBody();
    $confirmName = trim($data['confirm_name'] ?? '');
    if (strtolower($confirmName) !== strtolower($salon['name'])) {
        sendError('اسم التأكيد غير مطابق. يرجى كتابة اسم الصالون بدقة.', 422);
    }

    try {
        $pdo->beginTransaction();

        $tables = [
            'subscription_logs',  // سجلات الاشتراك
            'notifications',      // الإشعارات
            'bookings',           // الحجوزات
            'transactions',       // المعاملات المالية
            'expenses',           // المصاريف
            'services',           // الخدمات
            'employees',          // الموظفون
            'users',              // حسابات المستخدمين
        ];

        foreach ($tables as $table) {
            // تحقق من وجود الجدول قبل الحذف لتجنب الأخطاء
            $check = $pdo->query("SHOW TABLES LIKE '{$table}'")->fetch();
            if ($check) {
                $pdo->prepare("DELETE FROM {$table} WHERE salon_id = ?")->execute([$id]);
            }
        }

        // حذف الفروع المرتبطة (parent_salon_id)
        $checkBranches = $pdo->query("SHOW COLUMNS FROM salons LIKE 'parent_salon_id'")->fetch();
        if ($checkBranches) {
            $pdo->prepare("DELETE FROM salons WHERE parent_salon_id = ?")->execute([$id]);
        }

        // أخيراً: حذف الصالون نفسه
        $pdo->prepare("DELETE FROM salons WHERE id = ?")->execute([$id]);

        // سجّل العملية في super admin logs إذا موجود
        try {
            $pdo->prepare("INSERT INTO subscription_logs (salon_id, action, created_by) VALUES (?, 'permanently_deleted', ?)")
                ->execute([$id, $user['user_id']]);
        } catch (Exception $e) { /* ignore if log already deleted */ }

        $pdo->commit();
        sendSuccess(null, 200, "تم حذف صالون '{$salon['name']}' وجميع بياناته نهائياً");

    } catch (Exception $e) {
        $pdo->rollBack();
        sendError('فشل الحذف: ' . $e->getMessage(), 500);
    }
}

sendError('Method not allowed', 405);
