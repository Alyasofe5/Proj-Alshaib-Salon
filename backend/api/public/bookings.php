<?php
/**
 * Public - Submit Booking
 * POST /api/public/bookings.php
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../middleware/response.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $salon_id = $data['salon_id'] ?? null;
        $services = $data['services'] ?? [];
        $date = $data['date'] ?? null;
        $time = $data['time'] ?? null;
        
        if (!$salon_id || empty($services) || !$date || !$time) {
            sendError('جميع حقول الحجز مطلوبة (الصالون، الخدمات، التاريخ، الوقت)', 400);
            return;
        }

        // Mock Booking Success - Simulate saving to database
        $booking_id = 'BKG-' . rand(1000, 9999) . '-' . time();

        sendSuccess([
            'message' => 'تم تأكيد حجزك بنجاح!',
            'booking_id' => $booking_id,
            'details' => [
                'salon_id' => $salon_id,
                'date' => $date,
                'time' => $time,
                'services_count' => count($services)
            ]
        ]);
    } catch (Exception $e) {
        sendError('فشل تأكيد الحجز: ' . $e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
