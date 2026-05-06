<?php
/**
 * Public - Authentication
 * POST /api/public/auth.php
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../middleware/response.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $phone = $data['phone'] ?? null;

        if (!$phone) {
            sendError('رقم الهاتف مطلوب', 400);
            return;
        }

        // Mock User Logic - To allow seamless booking flow
        $user = [
            'id' => 99,
            'name' => 'ضيف',
            'phone' => $phone,
            'token' => 'mock_token_' . time()
        ];

        sendSuccess([
            'message' => 'تم تسجيل الدخول بنجاح',
            'user' => $user
        ]);
    } catch (Exception $e) {
        sendError('فشل تسجيل الدخول: ' . $e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
