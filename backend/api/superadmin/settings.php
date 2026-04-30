<?php
/**
 * Super Admin - Platform Settings API
 * GET    /api/superadmin/settings.php  → Get platform settings
 * PUT    /api/superadmin/settings.php  → Update platform settings
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireSuperAdmin();
$method = getMethod();

// ── Ensure platform_settings table exists ──
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS platform_settings (
            id INT PRIMARY KEY DEFAULT 1,
            email VARCHAR(255) DEFAULT 'info@maqas.site',
            phone VARCHAR(20) DEFAULT '+962 78 171 7990',
            whatsapp VARCHAR(20) DEFAULT '962781717990',
            address TEXT DEFAULT 'عمان، الأردن',
            instagram VARCHAR(255) DEFAULT 'https://instagram.com/maqas',
            facebook VARCHAR(255) DEFAULT 'https://facebook.com/maqas',
            tiktok VARCHAR(255) DEFAULT 'https://tiktok.com/@maqas',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    // Ensure a default record exists
    $check = $pdo->query("SELECT id FROM platform_settings WHERE id = 1")->fetch();
    if (!$check) {
        $pdo->exec("INSERT INTO platform_settings (id) VALUES (1)");
    }
} catch (Exception $e) {
    // Table might already exist or DB restricted, ignore if already exists
}

// ── GET: Return all settings ──
if ($method === 'GET') {
    $settings = $pdo->query("SELECT * FROM platform_settings WHERE id = 1")->fetch();
    sendSuccess($settings);
}

// ── PUT: Update settings ──
if ($method === 'PUT') {
    $data = getRequestBody();

    $stmt = $pdo->prepare("
        UPDATE platform_settings SET 
            email = ?, 
            phone = ?, 
            whatsapp = ?, 
            address = ?, 
            instagram = ?, 
            facebook = ?, 
            tiktok = ?
        WHERE id = 1
    ");

    $stmt->execute([
        $data['email'] ?? 'info@maqas.site',
        $data['phone'] ?? '+962 78 171 7990',
        $data['whatsapp'] ?? '962781717990',
        $data['address'] ?? 'عمان، الأردن',
        $data['instagram'] ?? '',
        $data['facebook'] ?? '',
        $data['tiktok'] ?? ''
    ]);

    sendSuccess(null, 200, 'تم تحديث الإعدادات بنجاح');
}

sendError('Method not allowed', 405);
