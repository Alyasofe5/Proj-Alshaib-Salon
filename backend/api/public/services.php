<?php
/**
 * Public - Salon Services
 * GET /api/public/services.php?salon_id=1
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../middleware/response.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    try {
        $salon_id = $_GET['salon_id'] ?? null;
        
        if (!$salon_id) {
            sendError('معرف الصالون مطلوب', 400);
            return;
        }

        // Mock data for services to ensure app works perfectly before DB migration
        $services = [
            [
                'id' => 's1',
                'name' => 'حلاقة شعر كلاسيكية',
                'price' => 5,
                'duration' => 30,
                'category' => 'Hair',
                'image' => 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1388&auto=format&fit=crop'
            ],
            [
                'id' => 's2',
                'name' => 'تحديد وتدريج اللحية',
                'price' => 3,
                'duration' => 20,
                'category' => 'Beard',
                'image' => 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1470&auto=format&fit=crop'
            ],
            [
                'id' => 's3',
                'name' => 'تنظيف بشرة وماسك',
                'price' => 10,
                'duration' => 45,
                'category' => 'Skincare',
                'image' => 'https://images.unsplash.com/photo-1512496015851-a1cbfca9ec38?q=80&w=1470&auto=format&fit=crop'
            ],
            [
                'id' => 's4',
                'name' => 'باقة العريس VIP',
                'price' => 50,
                'duration' => 120,
                'category' => 'VIP',
                'image' => 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1374&auto=format&fit=crop'
            ]
        ];

        sendSuccess(['services' => $services]);
    } catch (Exception $e) {
        sendError('فشل جلب الخدمات: ' . $e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
