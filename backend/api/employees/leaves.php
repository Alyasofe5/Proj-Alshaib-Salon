<?php
/**
 * Employee Leaves API
 * GET    /api/employees/leaves.php         → List leaves
 * POST   /api/employees/leaves.php         → Add leave
 * DELETE /api/employees/leaves.php?id=1    → Remove leave
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

[$user, $salonId, $salon] = resolveCurrentTenant();

// Any logged in user from the salon (Admin/Employee) can access
// But POST/DELETE might need higher permission? 
// User said "Employee dashboard and owner dashboard" - so both can add?
// Usually employee adds their own leave, admin adds for anyone.

$method = getMethod();

// ===== GET: List leaves =====
if ($method === 'GET') {
    $empId = $_GET['employee_id'] ?? null;
    $date = $_GET['date'] ?? null;
    $month = $_GET['month'] ?? null;

    $sql = "SELECT l.*, e.name_ar as employee_name, e.name_en as employee_name_en
            FROM employee_leaves l 
            JOIN employees e ON l.employee_id = e.id 
            WHERE l.salon_id = ?";
    $params = [$salonId];

    if ($empId) {
        $sql .= " AND l.employee_id = ?";
        $params[] = (int)$empId;
    }
    if ($date) {
        $sql .= " AND l.leave_date = ?";
        $params[] = $date;
    } elseif ($month) {
        $sql .= " AND l.leave_date LIKE ?";
        $params[] = $month . '%';
    } else {
        // Default to current month onwards
        $sql .= " AND l.leave_date >= CURDATE()";
    }

    $sql .= " ORDER BY l.leave_date ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    sendSuccess($stmt->fetchAll());
}

// ===== POST: Add leave =====
if ($method === 'POST') {
    $data = getRequestBody();
    $empId = !empty($data['employee_id']) ? (int)$data['employee_id'] : null;
    $offDate = $data['leave_date'] ?? null;
    $reason = trim($data['reason'] ?? '');

    if (!$empId || !$offDate) {
        sendError('الموظف والتاريخ مطلوبان');
    }

    // Security check: Employee must belong to salon
    $check = $pdo->prepare("SELECT id FROM employees WHERE id = ? AND salon_id = ?");
    $check->execute([$empId, $salonId]);
    if (!$check->fetch()) sendError('الموظف غير موجود', 404);

    // Permission check: if employee, can only add for themselves
    if ($user['role'] === 'employee' && $user['employee_id'] != $empId) {
        sendError('لا يمكنك إضافة إجازة لموظف آخر', 403);
    }

    // Check if already exists
    $dup = $pdo->prepare("SELECT id FROM employee_leaves WHERE employee_id = ? AND leave_date = ?");
    $dup->execute([$empId, $offDate]);
    if ($dup->fetch()) sendError('هذا اليوم مسجّل كإجازة مسبقاً لهذا الموظف');

    $stmt = $pdo->prepare("INSERT INTO employee_leaves (salon_id, employee_id, leave_date, reason) VALUES (?,?,?,?)");
    $stmt->execute([$salonId, $empId, $offDate, $reason]);

    sendSuccess(['id' => (int)$pdo->lastInsertId()], 201, 'تم تسجيل الإجازة بنجاح');
}

// ===== DELETE: Remove leave =====
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) sendError('المعرف مطلوب');

    // Security: Check if leave belongs to salon
    $stmt = $pdo->prepare("SELECT employee_id FROM employee_leaves WHERE id = ? AND salon_id = ?");
    $stmt->execute([(int)$id, $salonId]);
    $leave = $stmt->fetch();
    if (!$leave) sendError('الإجازة غير موجودة', 404);

    // Permission check
    if ($user['role'] === 'employee' && $user['employee_id'] != $leave['employee_id']) {
        sendError('لا يمكنك حذف إجازة لموظف آخر', 403);
    }

    $del = $pdo->prepare("DELETE FROM employee_leaves WHERE id = ?");
    $del->execute([(int)$id]);

    sendSuccess(null, 200, 'تم حذف الإجازة');
}

sendError('Method not allowed', 405);
