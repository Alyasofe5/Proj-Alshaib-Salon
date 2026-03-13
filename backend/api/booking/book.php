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

    sendSuccess([
        'booked_slots' => $booked->fetchAll(),
    ]);
}

// ===== POST: إنشاء حجز =====
if ($method === 'POST') {
    $data = getRequestBody();

    $slug = trim($data['salon_slug'] ?? '');
    $serviceId = !empty($data['service_id']) ? (int) $data['service_id'] : null;
    $employeeId = !empty($data['employee_id']) ? (int) $data['employee_id'] : null;
    $customerName = trim($data['customer_name'] ?? '');
    $customerPhone = trim($data['customer_phone'] ?? '');
    $bookingDate = $data['booking_date'] ?? '';
    $bookingTime = $data['booking_time'] ?? '';
    $notes = trim($data['notes'] ?? '');

    // Validation
    if (empty($slug)) sendError('رابط الصالون مطلوب');
    if (empty($customerName)) sendError('الاسم مطلوب');
    if (empty($customerPhone)) sendError('رقم الهاتف مطلوب');
    if (empty($bookingDate)) sendError('التاريخ مطلوب');
    if (empty($bookingTime)) sendError('الوقت مطلوب');

    // تحقق من الصالون
    $stmt = $pdo->prepare("SELECT id FROM salons WHERE slug = ? AND status = 'active'");
    $stmt->execute([$slug]);
    $salon = $stmt->fetch();
    if (!$salon) sendError('الصالون غير موجود أو غير نشط', 404);
    $salonId = (int) $salon['id'];

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
    }

    // التاريخ يجب أن يكون اليوم أو بعده
    if ($bookingDate < date('Y-m-d')) {
        sendError('لا يمكن الحجز في تاريخ سابق');
    }

    // إنشاء الحجز
    $stmt = $pdo->prepare("
        INSERT INTO bookings (salon_id, service_id, employee_id, customer_name, customer_phone, booking_date, booking_time, notes) 
        VALUES (?,?,?,?,?,?,?,?)
    ");
    $stmt->execute([$salonId, $serviceId, $employeeId, $customerName, $customerPhone, $bookingDate, $bookingTime, $notes]);

    sendSuccess([
        'id' => (int) $pdo->lastInsertId(),
        'booking_date' => $bookingDate,
        'booking_time' => $bookingTime,
    ], 201, 'تم الحجز بنجاح! سيتم تأكيد موعدك قريباً');
}

sendError('Method not allowed', 405);
