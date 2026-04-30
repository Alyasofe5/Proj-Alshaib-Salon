<?php
/**
 * Employees API (SaaS Multi-Tenant)
 * GET  /api/employees         → كل الموظفين (scoped by salon_id)
 * POST /api/employees         → إضافة موظف (with salon_id + limit check)
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

// Auto-add photo_path column if it doesn't exist
try {
    $pdo->query("SELECT photo_path FROM employees LIMIT 1");
} catch (Exception $e) {
    $pdo->exec("ALTER TABLE employees ADD COLUMN photo_path VARCHAR(500) DEFAULT NULL");
}

// ===== GET: قائمة الموظفين =====
if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT e.id, e.name_ar as name, e.name_en, e.phone, e.salary_type, e.commission_rate, e.base_salary,
               e.is_active, e.photo_path, e.created_at,
               u.username,
               (SELECT COUNT(*) FROM transactions t WHERE t.employee_id = e.id AND t.salon_id = ?) as tx_count,
               (SELECT COALESCE(SUM(total_amount),0) FROM transactions t WHERE t.employee_id = e.id AND t.salon_id = ?) as total_sales
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id
        WHERE e.salon_id = ? AND e.is_active = 1
        ORDER BY e.created_at DESC
    ");
    $stmt->execute([$salonId, $salonId, $salonId]);
    $employees = $stmt->fetchAll();

    sendSuccess($employees);
}


// ===== POST: إضافة موظف =====
if ($method === 'POST') {
    // التحقق من حد الموظفين في الباقة
    checkEmployeeLimit($salonId, $salon);

    $data = getRequestBody();

    $name = trim($data['name'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $salaryType = $data['salary_type'] ?? 'commission';
    $commissionRate = (float) ($data['commission_rate'] ?? 0);
    $baseSalary = (float) ($data['base_salary'] ?? 0);

    if (empty($name)) {
        sendError('اسم الموظف مطلوب');
    }

    $bi = splitBilingual($name);
    $stmt = $pdo->prepare("INSERT INTO employees (salon_id, name_ar, name_en, phone, salary_type, commission_rate, base_salary) VALUES (?,?,?,?,?,?,?)");
    $stmt->execute([$salonId, $bi['ar'], $bi['en'], $phone, $salaryType, $commissionRate, $baseSalary]);

    sendSuccess(['id' => (int) $pdo->lastInsertId()], 201, 'تم إضافة الموظف بنجاح');
}

sendError('Method not allowed', 405);
