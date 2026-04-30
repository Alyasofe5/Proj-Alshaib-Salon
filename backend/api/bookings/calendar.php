<?php
/**
 * Bookings Calendar API
 * GET /api/bookings/calendar.php?month=2026-03
 * 
 * Returns confirmed/completed bookings for a given month.
 * - Admin/super_admin: all bookings for the salon
 * - Employee: only bookings assigned to their employee_id
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();
$method = getMethod();

if ($method !== 'GET') sendError('Method not allowed', 405);

$salonId = $user['salon_id'] ?? null;
$role = $user['role'] ?? '';
$employeeId = $user['employee_id'] ?? null;

// Month param: YYYY-MM (default: current month)
$month = $_GET['month'] ?? date('Y-m');
if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
    sendError('صيغة الشهر غير صحيحة، استخدم YYYY-MM');
}

$startDate = $month . '-01';
$endDate = date('Y-m-t', strtotime($startDate)); // last day of month

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

// Salon filter
if ($role !== 'super_admin' && $salonId) {
    $sql .= " AND b.salon_id = ?";
    $params[] = $salonId;
}

// Employee filter — employee sees only their own bookings
if ($role === 'employee') {
    if ($employeeId) {
        $sql .= " AND b.employee_id = ?";
        $params[] = $employeeId;
    } else {
        // Employee user without linked employee_id — try matching by user_id
        $sql .= " AND b.employee_id IN (SELECT id FROM employees WHERE user_id = ?)";
        $params[] = $user['user_id'];
    }
}

$sql .= " GROUP BY b.id ORDER BY b.booking_date ASC, b.booking_time ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$bookings = $stmt->fetchAll();

// Group bookings by date for easier calendar rendering
$calendarData = [];
foreach ($bookings as $b) {
    $date = $b['booking_date'];
    if (!isset($calendarData[$date])) {
        $calendarData[$date] = [];
    }
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

sendSuccess([
    'month'    => $month,
    'bookings' => $calendarData,
    'total'    => count($bookings),
]);
