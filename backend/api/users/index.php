<?php
/**
 * Users API (SaaS Multi-Tenant)
 * GET  /api/users        → كل المستخدمين (scoped by salon_id)
 * POST /api/users        → إضافة مستخدم (with salon_id)
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

// ===== GET: قائمة المستخدمين =====
if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT u.id, u.name, u.username, u.role, u.employee_id, u.is_active, u.created_at,
               e.name_ar as emp_name, e.name_en as emp_name_en
        FROM users u
        LEFT JOIN employees e ON u.employee_id = e.id
        WHERE u.salon_id = ?
        ORDER BY u.role, u.name
    ");
    $stmt->execute([$salonId]);
    $users = $stmt->fetchAll();

    $stmt = $pdo->prepare("SELECT id, COALESCE(name_ar, name) as name, name_en FROM employees WHERE salon_id = ? AND is_active=1 ORDER BY name_ar");
    $stmt->execute([$salonId]);
    $employees = $stmt->fetchAll();

    sendSuccess([
        'users' => $users,
        'employees' => $employees,
    ]);
}

// ===== POST: إضافة مستخدم =====
if ($method === 'POST') {
    $data = getRequestBody();

    $name = trim($data['name'] ?? '');
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'employee';
    $employeeId = !empty($data['employee_id']) ? (int) $data['employee_id'] : null;

    // لا يسمح بإنشاء super_admin إلا لـ super_admin
    if ($role === 'super_admin' && !isSuperAdmin($currentUser)) {
        sendError('لا يمكنك إنشاء حساب مدير منصة', 403);
    }

    if (empty($name)) sendError('الاسم مطلوب');
    if (empty($username)) sendError('اسم الدخول مطلوب');
    if (empty($password)) sendError('كلمة المرور مطلوبة');

    // تحقق من تكرار اسم الدخول (عالمي - لا يتكرر حتى بين الصالونات)
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        sendError('اسم الدخول مستخدم مسبقاً');
    }

    $hashedPw = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("INSERT INTO users (salon_id, name, username, password, role, employee_id) VALUES (?,?,?,?,?,?)");
    $stmt->execute([$salonId, $name, $username, $hashedPw, $role, $employeeId]);

    sendSuccess(['id' => (int) $pdo->lastInsertId()], 201, 'تم إضافة المستخدم بنجاح');
}

sendError('Method not allowed', 405);
