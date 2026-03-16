<?php
/**
 * Admin Bookings API
 * GET    /api/bookings/index.php          → قائمة الحجوزات
 * GET    /api/bookings/index.php?id=1     → حجز واحد
 * PATCH  /api/bookings/index.php?id=1     → تغيير حالة الحجز
 * DELETE /api/bookings/index.php?id=1     → حذف الحجز
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

// ===== Calendar View: accessible by admin + employee =====
if (getMethod() === 'GET' && isset($_GET['view']) && $_GET['view'] === 'calendar') {
    $user = requireAuth(); // any logged-in user
    $salonId = $user['salon_id'] ?? null;
    $role = $user['role'] ?? '';
    $employeeId = $user['employee_id'] ?? null;

    $month = $_GET['month'] ?? date('Y-m');
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        sendError('صيغة الشهر غير صحيحة، استخدم YYYY-MM');
    }

    $startDate = $month . '-01';
    $endDate = date('Y-m-t', strtotime($startDate));

    $sql = "SELECT b.id, b.customer_name, b.customer_phone, b.booking_date, b.booking_time, 
                   b.status, b.notes, b.employee_id,
                   GROUP_CONCAT(COALESCE(s.name, 'غير معروف') SEPARATOR ' + ') as service_names,
                   SUM(COALESCE(s.price, 0)) as total_price,
                   e.name as employee_name
            FROM bookings b
            LEFT JOIN booking_services bs ON b.id = bs.booking_id
            LEFT JOIN services s ON bs.service_id = s.id
            LEFT JOIN employees e ON b.employee_id = e.id
            WHERE b.booking_date BETWEEN ? AND ?
            AND b.status IN ('confirmed', 'completed')";
    $params = [$startDate, $endDate];

    if ($role !== 'super_admin' && $salonId) {
        $sql .= " AND b.salon_id = ?";
        $params[] = $salonId;
    }
    if ($role === 'employee' && $employeeId) {
        $sql .= " AND b.employee_id = ?";
        $params[] = $employeeId;
    }

    $sql .= " GROUP BY b.id ORDER BY b.booking_date ASC, b.booking_time ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $bookings = $stmt->fetchAll();

    $calendarData = [];
    foreach ($bookings as $b) {
        $date = $b['booking_date'];
        if (!isset($calendarData[$date])) $calendarData[$date] = [];
        $calendarData[$date][] = [
            'id'            => (int)$b['id'],
            'customer_name' => $b['customer_name'],
            'customer_phone'=> $b['customer_phone'],
            'time'          => $b['booking_time'],
            'status'        => $b['status'],
            'services'      => $b['service_names'],
            'price'         => (float)$b['total_price'],
            'employee_name' => $b['employee_name'],
            'notes'         => $b['notes'],
        ];
    }

    sendSuccess(['month' => $month, 'bookings' => $calendarData, 'total' => count($bookings)]);
}

$user = authenticate(['admin', 'super_admin']);
$method = getMethod();
$salonId = $user['salon_id'] ?? null;

// Super admin يمكنه رؤية كل الحجوزات
$filterSalon = ($user['role'] === 'super_admin') ? null : $salonId;

// ===== GET: قائمة الحجوزات =====
if ($method === 'GET') {
    $id = $_GET['id'] ?? null;

    if ($id) {
        $sql = "SELECT b.*, 
                       GROUP_CONCAT(COALESCE(s.name, 'غير معروف') SEPARATOR ' + ') as service_names,
                       SUM(COALESCE(s.price, 0)) as total_price,
                       e.name as employee_name, sa.name as salon_name
                FROM bookings b 
                LEFT JOIN booking_services bs ON b.id = bs.booking_id
                LEFT JOIN services s ON bs.service_id = s.id
                LEFT JOIN employees e ON b.employee_id = e.id
                LEFT JOIN salons sa ON b.salon_id = sa.id
                WHERE b.id = ?
                GROUP BY b.id";
        $params = [(int)$id];
        if ($filterSalon) { $sql .= " AND b.salon_id = ?"; $params[] = $filterSalon; }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $booking = $stmt->fetch();
        if (!$booking) sendError('الحجز غير موجود', 404);
        sendSuccess($booking);
    }

    // Query params
    $status = $_GET['status'] ?? null;
    $date = $_GET['date'] ?? null;
    $period = $_GET['period'] ?? 'today'; // today, week, month, all

    $sql = "SELECT b.*, 
                   GROUP_CONCAT(COALESCE(s.name, 'غير معروف') SEPARATOR ' + ') as service_names,
                   SUM(COALESCE(s.price, 0)) as total_price,
                   e.name as employee_name, sa.name as salon_name
            FROM bookings b
            LEFT JOIN booking_services bs ON b.id = bs.booking_id
            LEFT JOIN services s ON bs.service_id = s.id
            LEFT JOIN employees e ON b.employee_id = e.id
            LEFT JOIN salons sa ON b.salon_id = sa.id
            WHERE 1=1";
    $params = [];

    if ($filterSalon) { $sql .= " AND b.salon_id = ?"; $params[] = $filterSalon; }
    if ($status) { $sql .= " AND b.status = ?"; $params[] = $status; }

    if ($date) {
        $sql .= " AND b.booking_date = ?"; $params[] = $date;
    } else {
        switch ($period) {
            case 'today':
                $sql .= " AND b.booking_date = CURDATE()"; break;
            case 'tomorrow':
                $sql .= " AND b.booking_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)"; break;
            case 'week':
                $sql .= " AND b.booking_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)"; break;
            case 'month':
                $sql .= " AND b.booking_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)"; break;
            // 'all' = no date filter
        }
    }

    $sql .= " GROUP BY b.id ORDER BY b.booking_date ASC, b.booking_time ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Stats
    $statsSql = "SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN booking_date = CURDATE() THEN 1 ELSE 0 END) as today
        FROM bookings WHERE 1=1";
    $statsParams = [];
    if ($filterSalon) { $statsSql .= " AND salon_id = ?"; $statsParams[] = $filterSalon; }

    $statsStmt = $pdo->prepare($statsSql);
    $statsStmt->execute($statsParams);
    $stats = $statsStmt->fetch();

    sendSuccess([
        'bookings' => $stmt->fetchAll(),
        'stats' => $stats,
    ]);
}

// ===== PATCH: تغيير حالة الحجز =====
if ($method === 'PATCH') {
    $id = $_GET['id'] ?? null;
    if (!$id) sendError('معرف الحجز مطلوب');

    $data = getRequestBody();
    $newStatus = $data['status'] ?? '';
    $assignedEmployeeId = !empty($data['assigned_employee_id']) ? (int)$data['assigned_employee_id'] : null;

    if (!in_array($newStatus, ['confirmed', 'cancelled', 'completed'])) {
        sendError('الحالة غير صحيحة');
    }

    // جلب بيانات الحجز الحالي
    $fetchSql = "SELECT employee_id, salon_id FROM bookings WHERE id = ?";
    $fetchParams = [(int)$id];
    if ($filterSalon) { $fetchSql .= " AND salon_id = ?"; $fetchParams[] = $filterSalon; }
    $fetchStmt = $pdo->prepare($fetchSql);
    $fetchStmt->execute($fetchParams);
    $currentBooking = $fetchStmt->fetch();
    if (!$currentBooking) sendError('الحجز غير موجود', 404);

    // إذا كان "أي حلاق" (employee_id = null) والمدير يريد تأكيد — يجب اختيار حلاق
    if ($newStatus === 'confirmed' && $currentBooking['employee_id'] === null) {
        if (!$assignedEmployeeId) {
            sendError('يجب اختيار حلاق لتأكيد هذا الحجز');
        }
        // تحقق من أن الموظف ينتمي لنفس الصالون وهو نشط
        $empCheck = $pdo->prepare("SELECT id, name FROM employees WHERE id = ? AND salon_id = ? AND is_active = 1");
        $empCheck->execute([$assignedEmployeeId, $currentBooking['salon_id']]);
        $emp = $empCheck->fetch();
        if (!$emp) sendError('الموظف المختار غير موجود أو غير نشط');

        // تحديث الحجز: الحالة + تعيين الموظف
        $sql = "UPDATE bookings SET status = ?, employee_id = ? WHERE id = ?";
        $params = [$newStatus, $assignedEmployeeId, (int)$id];
        if ($filterSalon) { $sql .= " AND salon_id = ?"; $params[] = $filterSalon; }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        if ($stmt->rowCount() === 0) sendError('فشل التحديث', 500);

        sendSuccess([
            'status'        => $newStatus,
            'employee_id'   => $assignedEmployeeId,
            'employee_name' => $emp['name'],
        ], 200, 'تم تأكيد الحجز وتعيين الحلاق');
    }

    // الحالة العادية
    $sql = "UPDATE bookings SET status = ? WHERE id = ?";
    $params = [$newStatus, (int)$id];
    if ($filterSalon) { $sql .= " AND salon_id = ?"; $params[] = $filterSalon; }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    if ($stmt->rowCount() === 0) sendError('الحجز غير موجود', 404);

    sendSuccess(['status' => $newStatus], 200, 'تم تحديث حالة الحجز');
}

// ===== DELETE =====
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) sendError('معرف الحجز مطلوب');

    $sql = "DELETE FROM bookings WHERE id = ?";
    $params = [(int)$id];
    if ($filterSalon) { $sql .= " AND salon_id = ?"; $params[] = $filterSalon; }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) sendError('الحجز غير موجود', 404);
    sendSuccess(null, 200, 'تم حذف الحجز');
}

sendError('Method not allowed', 405);
