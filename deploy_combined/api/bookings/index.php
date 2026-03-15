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

    if (!in_array($newStatus, ['confirmed', 'cancelled', 'completed'])) {
        sendError('الحالة غير صحيحة');
    }

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
