<?php
/**
 * Public - Platform Settings API
 * GET    /api/public/settings.php  → Get platform settings (Public)
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

$method = getMethod();

if ($method === 'GET') {
    // Check if table exists first to avoid crash
    $tableExists = $pdo->query("SHOW TABLES LIKE 'platform_settings'")->fetch();
    
    if (!$tableExists) {
        // Return defaults if table doesn't exist yet
        sendSuccess([
            'email' => 'info@maqas.site',
            'phone' => '+962 78 171 7990',
            'whatsapp' => '962781717990',
            'address' => 'عمان، الأردن',
            'instagram' => 'https://instagram.com/maqas',
            'facebook' => 'https://facebook.com/maqas',
            'tiktok' => 'https://tiktok.com/@maqas'
        ]);
    }

    $settings = $pdo->query("SELECT * FROM platform_settings WHERE id = 1")->fetch();
    if (!$settings) {
        sendSuccess([
            'email' => 'info@maqas.site',
            'phone' => '+962 78 171 7990',
            'whatsapp' => '962781717990',
            'address' => 'عمان، الأردن',
            'instagram' => 'https://instagram.com/maqas',
            'facebook' => 'https://facebook.com/maqas',
            'tiktok' => 'https://tiktok.com/@maqas'
        ]);
    }
    
    sendSuccess($settings);
}

sendError('Method not allowed', 405);
