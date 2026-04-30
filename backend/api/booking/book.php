<?php
/**
 * Public Booking API (No Auth Required)
 * POST /api/public/book.php     → إنشاء حجز جديد
 * GET  /api/public/book.php     → الحجوزات المحجوزة (لعرض الأوقات المتاحة)
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

$method = getMethod();

// ===== GET: الأوقات المحجوزة ليوم معين =====
if ($method === 'GET') {
    $slug = trim($_GET['slug'] ?? '');
    $date = $_GET['date'] ?? date('Y-m-d');

    if (empty($slug)) sendError('رابط الصالون مطلوب');

    $stmt = $pdo->prepare("SELECT id FROM salons WHERE slug = ? AND status = 'active'");
    $stmt->execute([$slug]);
    $salon = $stmt->fetch();
    if (!$salon) sendError('الصالون غير موجود', 404);

    // الأوقات المحجوزة
    $booked = $pdo->prepare("
        SELECT booking_time, employee_id 
        FROM bookings 
        WHERE salon_id = ? AND booking_date = ? AND status IN ('pending','confirmed')
    ");
    $booked->execute([$salon['id'], $date]);

    // الموظفين اللي عندهم إجازة اليوم
    $leaves = $pdo->prepare("
        SELECT employee_id FROM employee_leaves 
        WHERE salon_id = ? AND leave_date = ?
    ");
    $leaves->execute([$salon['id'], $date]);
    $offEmployeeIds = $leaves->fetchAll(PDO::FETCH_COLUMN);

    sendSuccess([
        'booked_slots' => $booked->fetchAll(),
        'off_employees_ids' => $offEmployeeIds
    ]);
}

// ===== POST: إنشاء حجز =====
if ($method === 'POST') {
    $data = getRequestBody();

    $slug = trim($data['salon_slug'] ?? '');
    
    // دعم مصفوفة من معرفات الخدمات
    $serviceIds = [];
    if (!empty($data['service_ids']) && is_array($data['service_ids'])) {
        $serviceIds = array_map('intval', $data['service_ids']);
    } elseif (!empty($data['service_id'])) {
        $serviceIds = [(int)$data['service_id']];
    }
    
    // أول خدمة للحفاظ على التوافق مع النسخ القديمة
    $primaryServiceId = count($serviceIds) > 0 ? $serviceIds[0] : null;

    $employeeId = !empty($data['employee_id']) ? (int) $data['employee_id'] : null;
    $customerName = trim($data['customer_name'] ?? '');
    $customerPhone = trim($data['customer_phone'] ?? '');
    $bookingDate = $data['booking_date'] ?? '';
    $bookingTime = $data['booking_time'] ?? '';
    $notes = trim($data['notes'] ?? '');

    // Validation
    if (empty($slug)) sendError('رابط الصالون مطلوب');
    if (empty($serviceIds)) sendError('يجب اختيار خدمة واحدة على الأقل');
    if (empty($customerName)) sendError('الاسم مطلوب');
    if (mb_strlen(trim($customerName)) < 3) sendError('الاسم يجب أن يكون 3 أحرف على الأقل');
    if (empty($customerPhone)) sendError('رقم الهاتف مطلوب');
    if (!preg_match('/^07\d{8}$/', $customerPhone)) sendError('رقم الهاتف يجب أن يكون أردني بصيغة 07XXXXXXXX (10 أرقام)');
    if (empty($bookingDate)) sendError('التاريخ مطلوب');
    if (empty($bookingTime)) sendError('الوقت مطلوب');

    // تحقق من الصالون
    $stmt = $pdo->prepare("SELECT id FROM salons WHERE slug = ? AND status = 'active'");
    $stmt->execute([$slug]);
    $salon = $stmt->fetch();
    if (!$salon) sendError('الصالون غير موجود أو غير نشط', 404);
    $salonId = (int) $salon['id'];

    // الجديد: تحقق من أن الحلاق ليس في إجازة
    if ($employeeId) {
        $leaveCheck = $pdo->prepare("SELECT id FROM employee_leaves WHERE employee_id = ? AND leave_date = ?");
        $leaveCheck->execute([$employeeId, $bookingDate]);
        if ($leaveCheck->fetch()) {
            sendError('عذراً، هذا الحلاق في إجازة في هذا التاريخ، يرجى اختيار حلاق آخر أو تاريخ آخر');
        }
    }

    // تحقق من عدم تكرار الحجز (نفس الوقت + الموظف)
    if ($employeeId) {
        $check = $pdo->prepare("
            SELECT id FROM bookings 
            WHERE salon_id = ? AND employee_id = ? AND booking_date = ? AND booking_time = ? 
            AND status IN ('pending','confirmed')
        ");
        $check->execute([$salonId, $employeeId, $bookingDate, $bookingTime]);
        if ($check->fetch()) {
            sendError('هذا الموعد محجوز مسبقاً لهذا الموظف، يرجى اختيار وقت آخر');
        }
    } else {
        // إذا ما اختار حلاق — نتحقق إنه في على الأقل حلاق واحد متاح (وليس في إجازة)
        $allEmployees = $pdo->prepare("SELECT id FROM employees WHERE salon_id = ? AND is_active = 1");
        $allEmployees->execute([$salonId]);
        $activeEmpIds = $allEmployees->fetchAll(PDO::FETCH_COLUMN);
        
        // استبعاد من هم في إجازة
        $leaveEmps = $pdo->prepare("SELECT employee_id FROM employee_leaves WHERE salon_id = ? AND leave_date = ?");
        $leaveEmps->execute([$salonId, $bookingDate]);
        $onLeaveIds = $leaveEmps->fetchAll(PDO::FETCH_COLUMN);
        
        $empIds = array_diff($activeEmpIds, $onLeaveIds);

        if (count($empIds) > 0) {
            $placeholders = implode(',', array_fill(0, count($empIds), '?'));
            $checkAll = $pdo->prepare("
                SELECT employee_id FROM bookings 
                WHERE salon_id = ? AND booking_date = ? AND booking_time = ? 
                AND status IN ('pending','confirmed')
                AND employee_id IN ($placeholders)
            ");
            $checkAll->execute(array_merge([$salonId, $bookingDate, $bookingTime], array_values($empIds)));
            $bookedEmpIds = $checkAll->fetchAll(PDO::FETCH_COLUMN);
            
            if (count($bookedEmpIds) >= count($empIds)) {
                sendError('جميع الحلاقين محجوزين في هذا الوقت، يرجى اختيار وقت آخر');
            }
        } else {
            sendError('عذراً، لا يوجد حلاقون متاحون في هذا اليوم');
        }
    }

    // التاريخ يجب أن يكون اليوم أو بعده
    if ($bookingDate < date('Y-m-d')) {
        sendError('لا يمكن الحجز في تاريخ سابق');
    }

    // لا يمكن حجز وقت فات اليوم
    if ($bookingDate === date('Y-m-d') && $bookingTime < date('H:i')) {
        sendError('هذا الوقت فات، يرجى اختيار وقت لاحق');
    }

    // التأكد من وجود جدول الخدمات الملحقة بالحجز
    $pdo->exec("CREATE TABLE IF NOT EXISTS booking_services (
        booking_id INT NOT NULL,
        service_id INT NOT NULL,
        PRIMARY KEY (booking_id, service_id),
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;");

    // إنشاء الحجز
    $bi = splitBilingual($customerName);
    $stmt = $pdo->prepare("
        INSERT INTO bookings (salon_id, service_id, employee_id, customer_name_ar, customer_name_en, customer_phone, booking_date, booking_time, notes)
        VALUES (?,?,?,?,?,?,?,?,?)
    ");
    $stmt->execute([$salonId, $primaryServiceId, $employeeId, $bi['ar'], $bi['en'], $customerPhone, $bookingDate, $bookingTime, $notes]);
    $bookingId = (int) $pdo->lastInsertId();

    // إدراج جميع الخدمات المختارة
    if (count($serviceIds) > 0) {
        $svcStmt = $pdo->prepare("INSERT IGNORE INTO booking_services (booking_id, service_id) VALUES (?, ?)");
        foreach ($serviceIds as $sid) {
            $svcStmt->execute([$bookingId, $sid]);
        }
    }

    sendSuccess([
        'id' => $bookingId,
        'booking_date' => $bookingDate,
        'booking_time' => $bookingTime,
    ], 201, 'تم الحجز بنجاح! سيتم تأكيد موعدك قريباً');
}

sendError('Method not allowed', 405);
