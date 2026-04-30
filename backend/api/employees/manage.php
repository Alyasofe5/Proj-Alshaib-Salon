<?php
/**
 * Single Employee API (SaaS Multi-Tenant)
 * GET    /api/employees/manage.php?id=1  → موظف واحد
 * PUT    /api/employees/manage.php?id=1  → تعديل
 * DELETE /api/employees/manage.php?id=1  → حذف
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

if (!$id) {
    sendError('معرف الموظف مطلوب');
}

// Auto-add photo_path column if it doesn't exist
try {
    $pdo->query("SELECT photo_path FROM employees LIMIT 1");
} catch (Exception $e) {
    $pdo->exec("ALTER TABLE employees ADD COLUMN photo_path VARCHAR(500) DEFAULT NULL");
}

// ===== GET: موظف واحد =====
if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM employees WHERE id = ? AND salon_id = ?");
    $stmt->execute([$id, $salonId]);
    $employee = $stmt->fetch();

    if (!$employee) {
        sendError('الموظف غير موجود', 404);
    }

    sendSuccess($employee);
}


// Auto-add columns if they don't exist
try { $pdo->query("SELECT photo_path FROM employees LIMIT 1"); }
catch (Exception $e) { $pdo->exec("ALTER TABLE employees ADD COLUMN photo_path VARCHAR(500) DEFAULT NULL"); }
try { $pdo->query("SELECT specialty FROM employees LIMIT 1"); }
catch (Exception $e) { $pdo->exec("ALTER TABLE employees ADD COLUMN specialty VARCHAR(200) DEFAULT NULL"); }

// ===== PUT: تعديل موظف =====
if ($method === 'PUT') {
    $data = getRequestBody();

    $name = trim($data['name'] ?? '');
    if (empty($name)) {
        sendError('اسم الموظف مطلوب');
    }

    $bi = splitBilingual($name);
    $stmt = $pdo->prepare("UPDATE employees SET name_ar=?, name_en=?, phone=?, salary_type=?, commission_rate=?, base_salary=?, specialty=? WHERE id=? AND salon_id=?");
    $stmt->execute([
        $bi['ar'], $bi['en'],
        trim($data['phone'] ?? ''),
        $data['salary_type'] ?? 'commission',
        (float) ($data['commission_rate'] ?? 0),
        (float) ($data['base_salary'] ?? 0),
        trim($data['specialty'] ?? ''),
        $id,
        $salonId
    ]);

    sendSuccess(null, 200, 'تم تعديل بيانات الموظف');
}

// ===== DELETE: حذف موظف =====
if ($method === 'DELETE') {
    try {
        $stmt = $pdo->prepare("DELETE FROM employees WHERE id=? AND salon_id=?");
        $stmt->execute([$id, $salonId]);
        sendSuccess(null, 200, 'تم حذف الموظف نهائياً');
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') {
            sendError('لا يمكن حذف الموظف لوجود عمليات مالية مسجلة باسمه', 409);
        }
        sendError('حدث خطأ أثناء الحذف', 500);
    }
}

sendError('Method not allowed', 405);
