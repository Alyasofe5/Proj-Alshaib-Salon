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

    $sql = "SELECT b.id,
                   b.customer_name_ar as customer_name,
                   b.customer_name_en, b.customer_phone, b.booking_date, b.booking_time,
                   b.status, b.notes, b.employee_id,
                   GROUP_CONCAT(COALESCE(s.name_ar, 'غير معروف') SEPARATOR ' + ') as service_names,
                   GROUP_CONCAT(COALESCE(s.name_en, s.name_ar, 'Unknown') SEPARATOR ' + ') as service_names_en,
                   SUM(COALESCE(s.price, 0)) as total_price,
                   e.name_ar as employee_name,
                   e.name_en as employee_name_en
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
            'employee_id'   => $b['employee_id'] ? (int)$b['employee_id'] : null,
            'notes'         => $b['notes'],
            'booking_date'  => $b['booking_date'],
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
                       GROUP_CONCAT(COALESCE(s.name_ar, 'غير معروف') SEPARATOR ' + ') as service_names,
                       GROUP_CONCAT(COALESCE(s.name_en, s.name_ar, 'Unknown') SEPARATOR ' + ') as service_names_en,
                       SUM(COALESCE(s.price, 0)) as total_price,
                       e.name_ar as employee_name,
                   e.name_en as employee_name_en,
                   sa.name_ar as salon_name,
                   sa.name_en as salon_name_en
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
                   GROUP_CONCAT(COALESCE(s.name_ar, 'غير معروف') SEPARATOR ' + ') as service_names,
                   GROUP_CONCAT(COALESCE(s.name_en, s.name_ar, 'Unknown') SEPARATOR ' + ') as service_names_en,
                   SUM(COALESCE(s.price, 0)) as total_price,
                   e.name_ar as employee_name,
                   e.name_en as employee_name_en,
                   sa.name_ar as salon_name,
                   sa.name_en as salon_name_en
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
        $empCheck = $pdo->prepare("SELECT id, COALESCE(name_ar, name_en) as name FROM employees WHERE id = ? AND salon_id = ? AND is_active = 1");
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

// ===== PUT: تعديل بيانات الحجز =====
if ($method === 'PUT') {
    $id = $_GET['id'] ?? null;
    if (!$id) sendError('معرف الحجز مطلوب');

    $data = getRequestBody();

    // Fetch current booking
    $fetchSql = "SELECT * FROM bookings WHERE id = ?";
    $fetchParams = [(int)$id];
    if ($filterSalon) { $fetchSql .= " AND salon_id = ?"; $fetchParams[] = $filterSalon; }
    $fetchStmt = $pdo->prepare($fetchSql);
    $fetchStmt->execute($fetchParams);
    $current = $fetchStmt->fetch();
    if (!$current) sendError('الحجز غير موجود', 404);

    // Fields that can be updated
    $customerName = trim($data['customer_name'] ?? $current['customer_name']);
    $customerPhone = trim($data['customer_phone'] ?? $current['customer_phone']);
    $bookingDate = $data['booking_date'] ?? $current['booking_date'];
    $bookingTime = $data['booking_time'] ?? $current['booking_time'];
    $employeeId = isset($data['employee_id']) ? (int)$data['employee_id'] : (int)$current['employee_id'];
    $notes = trim($data['notes'] ?? $current['notes'] ?? '');

    // Validate
    if (empty($customerName)) sendError('اسم العميل مطلوب');
    if (empty($customerPhone)) sendError('رقم الهاتف مطلوب');

    // Validate employee if changed
    if ($employeeId != $current['employee_id']) {
        $empCheck = $pdo->prepare("SELECT id, COALESCE(name_ar, name_en) as name FROM employees WHERE id = ? AND salon_id = ? AND is_active = 1");
        $empCheck->execute([$employeeId, $current['salon_id']]);
        if (!$empCheck->fetch()) sendError('الموظف المختار غير موجود أو غير نشط');
    }

    // Check for duplicate if time/date/employee changed
    if ($bookingDate !== $current['booking_date'] || $bookingTime !== $current['booking_time'] || $employeeId != $current['employee_id']) {
        $dupCheck = $pdo->prepare("
            SELECT id FROM bookings 
            WHERE salon_id = ? AND employee_id = ? AND booking_date = ? AND booking_time = ?
            AND status IN ('pending', 'confirmed') AND id != ?
        ");
        $dupCheck->execute([$current['salon_id'], $employeeId, $bookingDate, $bookingTime, (int)$id]);
        if ($dupCheck->fetch()) {
            sendError('هذا الموعد محجوز مسبقاً لهذا الموظف');
        }
    }

    $bi = splitBilingual($customerName);
    $sql = "UPDATE bookings SET customer_name_ar = ?, customer_name_en = ?, customer_phone = ?, booking_date = ?, booking_time = ?, employee_id = ?, notes = ? WHERE id = ?";
    $params = [$bi['ar'], $bi['en'], $customerPhone, $bookingDate, $bookingTime, $employeeId, $notes, (int)$id];
    if ($filterSalon) { $sql .= " AND salon_id = ?"; $params[] = $filterSalon; }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendSuccess([
        'id' => (int)$id,
        'customer_name' => $customerName,
        'customer_phone' => $customerPhone,
        'booking_date' => $bookingDate,
        'booking_time' => $bookingTime,
        'employee_id' => $employeeId,
        'notes' => $notes,
    ], 200, 'تم تعديل الحجز بنجاح');
}

// ===== POST: إضافة حجز يدوي من الأدمن =====
if ($method === 'POST') {
    $data = getRequestBody();

    $customerName = trim($data['customer_name'] ?? '');
    $customerPhone = trim($data['customer_phone'] ?? '');
    $bookingDate = $data['booking_date'] ?? '';
    $bookingTime = $data['booking_time'] ?? '';
    $employeeId = !empty($data['employee_id']) ? (int)$data['employee_id'] : null;
    $serviceIds = [];
    if (!empty($data['service_ids']) && is_array($data['service_ids'])) {
        $serviceIds = array_map('intval', $data['service_ids']);
    }
    $notes = trim($data['notes'] ?? '');

    // Validation
    if (empty($customerName)) sendError('اسم العميل مطلوب');
    if (empty($customerPhone)) sendError('رقم الهاتف مطلوب');
    if (empty($bookingDate)) sendError('التاريخ مطلوب');
    if (empty($bookingTime)) sendError('الوقت مطلوب');
    if (empty($employeeId)) sendError('يجب اختيار موظف');
    if (empty($serviceIds)) sendError('يجب اختيار خدمة واحدة على الأقل');

    // Validate employee belongs to this salon and is active
    $empCheck = $pdo->prepare("SELECT id, COALESCE(name_ar, name_en) as name FROM employees WHERE id = ? AND salon_id = ? AND is_active = 1");
    $empCheck->execute([$employeeId, $salonId]);
    $emp = $empCheck->fetch();
    if (!$emp) sendError('الموظف المختار غير موجود أو غير نشط');

    // Duplicate prevention: check same employee + date + time
    $dupCheck = $pdo->prepare("
        SELECT id FROM bookings 
        WHERE salon_id = ? AND employee_id = ? AND booking_date = ? AND booking_time = ?
        AND status IN ('pending', 'confirmed')
    ");
    $dupCheck->execute([$salonId, $employeeId, $bookingDate, $bookingTime]);
    if ($dupCheck->fetch()) {
        sendError('هذا الموعد محجوز مسبقاً لهذا الموظف، يرجى اختيار وقت آخر');
    }

    // Validate services exist and belong to this salon
    $primaryServiceId = $serviceIds[0];
    foreach ($serviceIds as $sid) {
        $svcCheck = $pdo->prepare("SELECT id FROM services WHERE id = ? AND salon_id = ?");
        $svcCheck->execute([$sid, $salonId]);
        if (!$svcCheck->fetch()) sendError("الخدمة رقم $sid غير موجودة");
    }

    // Create booking with 'confirmed' status (admin-created = auto-confirmed)
    $bi = splitBilingual($customerName);
    $stmt = $pdo->prepare("
        INSERT INTO bookings (salon_id, service_id, employee_id, customer_name_ar, customer_name_en, customer_phone, booking_date, booking_time, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
    ");
    $stmt->execute([$salonId, $primaryServiceId, $employeeId, $bi['ar'], $bi['en'], $customerPhone, $bookingDate, $bookingTime, $notes]);
    $bookingId = (int)$pdo->lastInsertId();

    // Insert all booking services
    $svcStmt = $pdo->prepare("INSERT IGNORE INTO booking_services (booking_id, service_id) VALUES (?, ?)");
    foreach ($serviceIds as $sid) {
        $svcStmt->execute([$bookingId, $sid]);
    }

    sendSuccess([
        'id' => $bookingId,
        'booking_date' => $bookingDate,
        'booking_time' => $bookingTime,
        'employee_name' => $emp['name'],
    ], 201, 'تم إنشاء الحجز بنجاح');
}

sendError('Method not allowed', 405);
