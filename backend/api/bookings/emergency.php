<?php
/**
 * Emergency Cancellation API
 * POST /api/bookings/emergency.php
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

[$user, $salonId, $salon] = resolveCurrentTenant();

if (!isSuperAdmin($user) && $user['role'] !== 'admin' && $user['role'] !== 'employee') {
    sendError('غير مصرح لك', 403);
}

$method = getMethod();

if ($method === 'POST') {
    $data = getRequestBody();
    $empId = !empty($data['employee_id']) ? (int)$data['employee_id'] : null;
    $date = $data['date'] ?? date('Y-m-d');
    $reason = trim($data['reason'] ?? 'ظرف طارئ');

    if (!$empId) sendError('الموظف مطلوب');

    // Security: Employee belongs to salon
    $empCheck = $pdo->prepare("SELECT id, name, phone FROM employees WHERE id = ? AND salon_id = ?");
    $empCheck->execute([$empId, $salonId]);
    $emp = $empCheck->fetch();
    if (!$emp) sendError('الموظف غير موجود', 404);

    // Permission: Employee can only declare emergency for themselves
    if ($user['role'] === 'employee' && $user['employee_id'] != $empId) {
        sendError('لا يمكنك التصريح بظرف طارئ لموظف آخر', 403);
    }

    // 1. Get all pending/confirmed bookings to notify them
    $stmt = $pdo->prepare("SELECT id, customer_name, customer_phone, booking_time 
                           FROM bookings 
                           WHERE employee_id = ? AND booking_date = ? AND status IN ('pending', 'confirmed')");
    $stmt->execute([$empId, $date]);
    $toNotify = $stmt->fetchAll();

    // 2. Cancel the bookings
    $cancel = $pdo->prepare("UPDATE bookings SET status = 'cancelled', notes = CONCAT(COALESCE(notes,''), ' [إلغاء طارئ: ', ?, ']') 
                             WHERE employee_id = ? AND booking_date = ? AND status IN ('pending', 'confirmed')");
    $cancel->execute([$reason, $empId, $date]);
    $count = $cancel->rowCount();

    // 3. Mark the day as Leave for this employee automatically
    $leave = $pdo->prepare("INSERT IGNORE INTO employee_leaves (salon_id, employee_id, leave_date, reason) 
                            VALUES (?,?,?,?)");
    $leave->execute([$salonId, $empId, $date, "ظرف طارئ: " . $reason]);

    // 4. (Placeholder) Notification logic
    // In a real scenario, you'd loop $toNotify and send WhatsApp/SMS
    // We'll return the list so the frontend can show who was affected
    
    sendSuccess([
        'cancelled_count' => $count,
        'affected_customers' => $toNotify,
        'message_template' => "نعتذر منك عميلنا العزيز، الحلاق {$emp['name']} غير متوفر اليوم بسبب {$reason}. تم إلغاء حجزك وسنتواصل معك لتحديد موعد بديل."
    ], 200, "تم إلغاء $count حجزاً بنجاح وتم تسجيل اليوم كإجازة طارئة للموظف");
}

sendError('Method not allowed', 405);
