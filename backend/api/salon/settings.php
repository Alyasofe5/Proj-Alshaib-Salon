<?php
/**
 * Salon Settings API (Admin Auth Required)
 * GET  /api/salon/settings.php → Get salon settings
 * PUT  /api/salon/settings.php → Update salon settings
 *
 * IMPORTANT: PUT only updates user-editable fields.
 * All other fields (hero_image, hero_video, hero_type, faqs, etc.)
 * are managed by their own dedicated endpoints and MUST be preserved.
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

// ── GET: Return all settings ──
if (getMethod() === 'GET') {
    $stmt = $pdo->prepare("
        SELECT name, slug, logo_path, owner_name, owner_email, owner_phone, settings
        FROM salons WHERE id = ?
    ");
    $stmt->execute([$salonId]);
    $salon = $stmt->fetch();

    if (!$salon) sendError('الصالون غير موجود', 404);

    $settings = !empty($salon['settings']) ? json_decode($salon['settings'], true) : [];

    // Return relative paths — frontend's assetUrl() handles URL resolution
    sendSuccess([
        'name'            => $salon['name'],
        'slug'            => $salon['slug'],
        'logo'            => $salon['logo_path'] ?: null,
        'owner_name'      => $salon['owner_name'],
        'owner_email'     => $salon['owner_email'],
        'owner_phone'     => $salon['owner_phone'],
        'description'     => $settings['description']     ?? '',
        'address'         => $settings['address']         ?? '',
        'instagram'       => $settings['instagram']       ?? '',
        'work_start'      => $settings['work_start']      ?? '09:00',
        'work_end'        => $settings['work_end']        ?? '22:00',
        'work_interval'   => $settings['work_interval']   ?? 30,
        'off_days'        => $settings['off_days']        ?? [],
        'booking_days'    => $settings['booking_days']    ?? 7,
        'booking_message' => $settings['booking_message'] ?? '',
        // ── Media (managed by hero-media.php — returned for display only) ──
        'hero_image'      => $settings['hero_image']      ?? null,
        'hero_video'      => $settings['hero_video']      ?? null,
        'hero_type'       => $settings['hero_type']       ?? '',
        'services_title'  => $settings['services_title']  ?? 'خدمات نخبوية',
        'services_subtitle' => $settings['services_subtitle'] ?? 'نقدم مجموعة واسعة من الخدمات لتظهر بأفضل صورة',
        'team_title'      => $settings['team_title']      ?? 'فريقنا',
        'team_subtitle'   => $settings['team_subtitle']   ?? 'خبراء محترفون يجمعون بين المهارة والإبداع',
        'gallery_title'   => $settings['gallery_title']   ?? 'معرض أعمالنا',
        'gallery_subtitle' => $settings['gallery_subtitle'] ?? 'لمحة عن إبداعاتنا وأعمالنا المميزة',
    ]);
}

// ── PUT: Update only user-editable fields, PRESERVE everything else ──
if (getMethod() === 'PUT') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        $name       = trim($data['name']        ?? '');
        $ownerPhone = trim($data['owner_phone'] ?? '');
        $ownerEmail = trim($data['owner_email'] ?? '');

        if (empty($name)) sendError('اسم الصالون مطلوب');

        // Load EXISTING settings — we must merge, not overwrite
        $existingStmt = $pdo->prepare("SELECT settings FROM salons WHERE id = ?");
        $existingStmt->execute([$salonId]);
        $existingSalon    = $existingStmt->fetch();
        $existingSettings = $existingSalon['settings']
            ? json_decode($existingSalon['settings'], true)
            : [];

        // Merge: user-editable fields overwrite, everything else is preserved as-is
        $merged = array_merge($existingSettings, [
            'description'     => trim($data['description']     ?? ''),
            'address'         => trim($data['address']         ?? ''),
            'instagram'       => trim($data['instagram']       ?? ''),
            'work_start'      => $data['work_start']           ?? '09:00',
            'work_end'        => $data['work_end']             ?? '22:00',
            'work_interval'   => (int)($data['work_interval']  ?? 30),
            'off_days'        => $data['off_days']             ?? [],
            'booking_days'    => (int)($data['booking_days']   ?? 7),
            'booking_message' => trim($data['booking_message'] ?? ''),
            'services_title'  => trim($data['services_title']  ?? 'خدمات نخبوية'),
            'services_subtitle' => trim($data['services_subtitle'] ?? 'نقدم مجموعة واسعة من الخدمات لتظهر بأفضل صورة'),
            'team_title'      => trim($data['team_title']      ?? 'فريقنا'),
            'team_subtitle'   => trim($data['team_subtitle']   ?? 'خبراء محترفون يجمعون بين المهارة والإبداع'),
            'gallery_title'   => trim($data['gallery_title']   ?? 'معرض أعمالنا'),
            'gallery_subtitle' => trim($data['gallery_subtitle'] ?? 'لمحة عن إبداعاتنا وأعمالنا المميزة'),
        ]);

        $stmt = $pdo->prepare("
            UPDATE salons
            SET name = ?, owner_phone = ?, owner_email = ?, settings = ?
            WHERE id = ?
        ");
        $stmt->execute([$name, $ownerPhone, $ownerEmail, json_encode($merged, JSON_UNESCAPED_UNICODE), $salonId]);

        sendSuccess(['message' => 'تم تحديث إعدادات الصالون']);
    } catch (Exception $e) {
        sendError('خطأ: ' . $e->getMessage(), 500);
    }
}

sendError('Method not allowed', 405);
