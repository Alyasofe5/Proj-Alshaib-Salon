<?php
/**
 * Public - My Bookings by Phone
 * GET /api/public/my-bookings.php?phone=07XXXXXXXX
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $phone = trim($_GET['phone'] ?? '');
    if (empty($phone)) sendError('رقم الهاتف مطلوب', 400);
    if (!preg_match('/^07\d{8}$/', $phone)) sendError('رقم الهاتف غير صحيح', 400);

    $stmt = $pdo->prepare("
        SELECT 
            b.id,
            b.booking_date,
            b.booking_time,
            b.status,
            b.notes,
            b.customer_name_ar as customer_name,
            b.created_at,
            COALESCE(sa.name_ar, sa.name_en) as salon_name,
            sa.slug as salon_slug,
            e.name_ar as employee_name,
            GROUP_CONCAT(COALESCE(s.name_ar, 'خدمة') SEPARATOR ' + ') as service_names,
            SUM(COALESCE(s.price, 0)) as total_price
        FROM bookings b
        LEFT JOIN salons sa ON b.salon_id = sa.id
        LEFT JOIN employees e ON b.employee_id = e.id
        LEFT JOIN booking_services bs ON b.id = bs.booking_id
        LEFT JOIN services s ON bs.service_id = s.id
        WHERE b.customer_phone = ?
        GROUP BY b.id
        ORDER BY b.booking_date DESC, b.booking_time DESC
        LIMIT 50
    ");
    $stmt->execute([$phone]);
    $bookings = $stmt->fetchAll();

    // Separate upcoming and past
    $today = date('Y-m-d');
    $upcoming = [];
    $past = [];
    foreach ($bookings as $b) {
        $row = [
            'id'            => (int)$b['id'],
            'booking_date'  => $b['booking_date'],
            'booking_time'  => $b['booking_time'],
            'status'        => $b['status'],
            'salon_name'    => $b['salon_name'],
            'salon_slug'    => $b['salon_slug'],
            'employee_name' => $b['employee_name'],
            'service_names' => $b['service_names'],
            'total_price'   => (float)$b['total_price'],
            'notes'         => $b['notes'],
            'customer_name' => $b['customer_name'],
            'created_at'    => $b['created_at'],
        ];
        if ($b['booking_date'] >= $today) {
            $upcoming[] = $row;
        } else {
            $past[] = $row;
        }
    }

    sendSuccess([
        'upcoming' => $upcoming,
        'past'     => $past,
        'total'    => count($bookings),
    ]);
}

sendError('Method not allowed', 405);
