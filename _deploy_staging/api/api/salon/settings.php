<?php
/**
 * Salon Settings API (Admin Auth Required)
 * GET  /api/salon/settings.php → Get salon settings
 * PUT  /api/salon/settings.php → Update salon settings
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/response.php';

$user = requireAdmin();
$salonId = $user['salon_id'];

// Ensure settings column exists
try {
    $check = $pdo->query("SHOW COLUMNS FROM salons LIKE 'settings'")->fetch();
    if (!$check) {
        $pdo->exec("ALTER TABLE salons ADD COLUMN settings JSON DEFAULT NULL");
    }
} catch (Exception $e) { /* ignore */ }

if (getMethod() === 'GET') {
    $stmt = $pdo->prepare("
        SELECT name, slug, logo_path, owner_name, owner_email, owner_phone, settings
        FROM salons WHERE id = ?
    ");
    $stmt->execute([$salonId]);
    $salon = $stmt->fetch();

    if (!$salon) sendError('الصالون غير موجود', 404);

    // Parse JSON settings
    $settings = !empty($salon['settings']) ? json_decode($salon['settings'], true) : [];

    // Build logo URL
    $logoUrl = null;
    if ($salon['logo_path']) {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $logoUrl = $protocol . '://' . $host . '/' . $salon['logo_path'];
    }

    // Hero image URL
    $heroImageUrl = null;
    if (!empty($settings['hero_image'])) {
        $protocol2 = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $heroImageUrl = $protocol2 . '://' . $_SERVER['HTTP_HOST'] . '/' . $settings['hero_image'];
    }

    sendSuccess([
        'name' => $salon['name'],
        'slug' => $salon['slug'],
        'logo' => $logoUrl,
        'owner_name' => $salon['owner_name'],
        'owner_email' => $salon['owner_email'],
        'owner_phone' => $salon['owner_phone'],
        'description' => $settings['description'] ?? '',
        'address' => $settings['address'] ?? '',
        'instagram' => $settings['instagram'] ?? '',
        'work_start' => $settings['work_start'] ?? '09:00',
        'work_end' => $settings['work_end'] ?? '22:00',
        'work_interval' => $settings['work_interval'] ?? 30,
        'off_days' => $settings['off_days'] ?? [],
        'booking_days' => $settings['booking_days'] ?? 7,
        'booking_message' => $settings['booking_message'] ?? '',
        'hero_image' => $heroImageUrl,
    ]);
}

if (getMethod() === 'PUT') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        $name = trim($data['name'] ?? '');
        $ownerPhone = trim($data['owner_phone'] ?? '');
        $ownerEmail = trim($data['owner_email'] ?? '');

        if (empty($name)) sendError('اسم الصالون مطلوب');

        // Preserve hero_image from existing settings
        $existingStmt = $pdo->prepare("SELECT settings FROM salons WHERE id = ?");
        $existingStmt->execute([$salonId]);
        $existingSalon = $existingStmt->fetch();
        $existingSettings = $existingSalon['settings'] ? json_decode($existingSalon['settings'], true) : [];

        $settings = json_encode([
            'description' => trim($data['description'] ?? ''),
            'address' => trim($data['address'] ?? ''),
            'instagram' => trim($data['instagram'] ?? ''),
            'work_start' => $data['work_start'] ?? '09:00',
            'work_end' => $data['work_end'] ?? '22:00',
            'work_interval' => (int)($data['work_interval'] ?? 30),
            'off_days' => $data['off_days'] ?? [],
            'booking_days' => (int)($data['booking_days'] ?? 7),
            'booking_message' => trim($data['booking_message'] ?? ''),
            'hero_image' => $existingSettings['hero_image'] ?? '',
        ], JSON_UNESCAPED_UNICODE);

        $stmt = $pdo->prepare("
            UPDATE salons 
            SET name = ?, owner_phone = ?, owner_email = ?, settings = ?
            WHERE id = ?
        ");
        $stmt->execute([$name, $ownerPhone, $ownerEmail, $settings, $salonId]);

        sendSuccess(['message' => 'تم تحديث إعدادات الصالون']);
    } catch (Exception $e) {
        sendError('خطأ: ' . $e->getMessage(), 500);
    }
}

sendError('Method not allowed', 405);
