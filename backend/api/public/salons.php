<?php
/**
 * Public - Salons List
 * GET /api/public/salons.php
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../middleware/response.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    try {
        // Mock data to prevent timeout if local MySQL is not running
        $salons = [
            [
                'id' => 1,
                'slug' => 'golden-scissors',
                'status' => 'active',
                'name' => 'صالون المقص الذهبي',
                'services_count' => 12,
                'employees_count' => 4
            ],
            [
                'id' => 2,
                'slug' => 'beauty-touch',
                'status' => 'active',
                'name' => 'لمسة جمال',
                'services_count' => 8,
                'employees_count' => 3
            ]
        ];

        sendSuccess(['salons' => $salons]);
    } catch (Exception $e) {
        sendError('فشل جلب الصالونات: ' . $e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
