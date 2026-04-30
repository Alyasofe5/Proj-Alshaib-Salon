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
            show_email TINYINT(1) DEFAULT 1,
            show_phone TINYINT(1) DEFAULT 1,
            show_whatsapp TINYINT(1) DEFAULT 1,
            show_address TINYINT(1) DEFAULT 1,
            show_instagram TINYINT(1) DEFAULT 1,
            show_facebook TINYINT(1) DEFAULT 1,
            show_tiktok TINYINT(1) DEFAULT 1,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    // Ensure a default record exists
    $check = $pdo->query("SELECT id FROM platform_settings WHERE id = 1")->fetch();
    if (!$check) {
        $pdo->exec("INSERT INTO platform_settings (id) VALUES (1)");
    }

    // Add show_* columns if table existed before (safe migration)
    $showCols = ['show_email','show_phone','show_whatsapp','show_address','show_instagram','show_facebook','show_tiktok'];
    foreach ($showCols as $col) {
        $exists = $pdo->query("SHOW COLUMNS FROM platform_settings LIKE '{$col}'")->fetch();
        if (!$exists) {
            $pdo->exec("ALTER TABLE platform_settings ADD COLUMN {$col} TINYINT(1) DEFAULT 1");
        }
    }
} catch (Exception $e) {
    // ignore if already exists
}

// ── GET: Return all settings ──
if ($method === 'GET') {
    $settings = $pdo->query("SELECT * FROM platform_settings WHERE id = 1")->fetch();
    // Cast show_* to booleans for the frontend
    if ($settings) {
        foreach (['show_email','show_phone','show_whatsapp','show_address','show_instagram','show_facebook','show_tiktok'] as $col) {
            $settings[$col] = (bool)($settings[$col] ?? true);
        }
    }
    sendSuccess($settings);
}

// ── PUT: Update settings ──
if ($method === 'PUT') {
    $data = getRequestBody();

    $email = trim($data['email'] ?? '');
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('البريد الإلكتروني غير صحيح', 422);
    }

    $stmt = $pdo->prepare("
        UPDATE platform_settings SET
            email = ?, phone = ?, whatsapp = ?, address = ?,
            instagram = ?, facebook = ?, tiktok = ?,
            show_email = ?, show_phone = ?, show_whatsapp = ?, show_address = ?,
            show_instagram = ?, show_facebook = ?, show_tiktok = ?
        WHERE id = 1
    ");

    $stmt->execute([
        $data['email']     ?? 'info@maqas.site',
        $data['phone']     ?? '+962 78 171 7990',
        $data['whatsapp']  ?? '962781717990',
        $data['address']   ?? 'عمان، الأردن',
        $data['instagram'] ?? '',
        $data['facebook']  ?? '',
        $data['tiktok']    ?? '',
        isset($data['show_email'])     ? (int)(bool)$data['show_email']     : 1,
        isset($data['show_phone'])     ? (int)(bool)$data['show_phone']     : 1,
        isset($data['show_whatsapp'])  ? (int)(bool)$data['show_whatsapp']  : 1,
        isset($data['show_address'])   ? (int)(bool)$data['show_address']   : 1,
        isset($data['show_instagram']) ? (int)(bool)$data['show_instagram'] : 1,
        isset($data['show_facebook'])  ? (int)(bool)$data['show_facebook']  : 1,
        isset($data['show_tiktok'])    ? (int)(bool)$data['show_tiktok']    : 1,
    ]);

    sendSuccess(null, 200, 'تم تحديث الإعدادات بنجاح');
}

sendError('Method not allowed', 405);
