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
        'description'           => $settings['description']           ?? '',
        'secondary_description' => $settings['secondary_description'] ?? '',
        'address'               => $settings['address']               ?? '',
        'instagram'             => $settings['instagram']             ?? '',
        'whatsapp'              => $settings['whatsapp']              ?? '',
        'facebook'              => $settings['facebook']              ?? '',
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
        'hero_subtitle'   => $settings['hero_subtitle']   ?? 'تأسس ٢٠٢٤ -- صالون فاخر',
        'hero_title'      => $settings['hero_title']      ?? 'أين يلتقي الإبــــداع بالأناقة',
        'about_title'     => $settings['about_title']     ?? 'قصتنا',
        'about_subtitle'  => $settings['about_subtitle']  ?? 'لمسة من الإبداع',
        'about_description' => $settings['about_description'] ?? 'ادخل إلى عالم يروي فيه كل مظهر قصة. يجمع خبراء الشايب بين التقنيات الأصيلة والفن الحديث لخلق مظهرك الفريد، بأسلوب يعكس شخصيتك ويرتقي بتجربتك.',
        'about_image_1'   => $settings['about_image_1']   ?? 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1000',
        'about_image_2'   => $settings['about_image_2']   ?? 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=600',
        'services_title'  => $settings['services_title']  ?? 'قائمة الخدمات',
        'services_subtitle' => $settings['services_subtitle'] ?? 'خدمات الصالون',
        'services_description' => $settings['services_description'] ?? 'اختر الخدمة، شاهد لمحة فورية، ثم احجز بضغطة واحدة. تصميم واضح لتجربة راقية وعناية دقيقة تليق بك.',
        'team_title'      => $settings['team_title']      ?? 'أيدي مبدعة',
        'team_subtitle'   => $settings['team_subtitle']   ?? 'فريق العمل',
        'team_description' => $settings['team_description'] ?? 'خبراء محترفون يجمعون بين المهارة والإبداع لتقديم أفضل النتائج.',
        'gallery_title'   => $settings['gallery_title']   ?? 'معرض أعمالنا',
        'gallery_subtitle' => $settings['gallery_subtitle'] ?? 'لمحة عن إبداعاتنا وأعمالنا المميزة',
        'reviews_title'   => $settings['reviews_title']   ?? 'Ù…Ø§Ø°Ø§ ÙŠÙ‚ÙˆÙ„ Ø¹Ù†Ù‘Ø§ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡',
        'reviews_subtitle' => $settings['reviews_subtitle'] ?? 'Ø¢Ø±Ø§Ø¡ Ø¹Ù…Ù„Ø§Ø¦Ù†Ø§',
        'reviews'         => $settings['reviews']         ?? [],
    ]);
}

// ── PUT: Update only user-editable fields, PRESERVE everything else ──
if (getMethod() === 'PUT') {
    try {
        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);

        if (!$data) sendError('بيانات غير صالحة', 400);

        $name       = trim($data['name']        ?? '');
        $ownerPhone = trim($data['owner_phone'] ?? '');
        $ownerEmail = trim($data['owner_email'] ?? '');

        if (empty($name)) sendError('اسم الصالون مطلوب');

        // Load EXISTING settings — we must merge, not overwrite
        $existingStmt = $pdo->prepare("SELECT settings FROM salons WHERE id = ?");
        $existingStmt->execute([$salonId]);
        $existingSalon    = $existingStmt->fetch();
        $existingSettings = (!empty($existingSalon['settings']))
            ? (json_decode($existingSalon['settings'], true) ?: [])
            : [];

        // Explicitly map every user-editable field — everything else is preserved
        $merged = array_merge($existingSettings, [
            'description'           => (string)($data['description']           ?? ''),
            'secondary_description' => (string)($data['secondary_description'] ?? ''),
            'address'               => (string)($data['address']               ?? ''),
            'instagram'             => (string)($data['instagram']             ?? ''),
            'whatsapp'              => (string)($data['whatsapp']              ?? ''),
            'facebook'              => (string)($data['facebook']              ?? ''),
            'work_start'            => (string)($data['work_start']            ?? '09:00'),
            'work_end'              => (string)($data['work_end']              ?? '22:00'),
            'work_interval'         => (int)($data['work_interval']            ?? 30),
            'off_days'              => (array)($data['off_days']               ?? []),
            'booking_days'          => (int)($data['booking_days']             ?? 7),
            'booking_message'       => (string)($data['booking_message']       ?? ''),

            'hero_subtitle'         => (string)($data['hero_subtitle']         ?? ($existingSettings['hero_subtitle'] ?? 'تأسس ٢٠٢٤ -- صالون فاخر')),
            'hero_title'            => (string)($data['hero_title']            ?? ($existingSettings['hero_title'] ?? 'أين يلتقي الإبــــداع بالأناقة')),

            'about_title'           => (string)($data['about_title']           ?? ($existingSettings['about_title'] ?? 'قصتنا')),
            'about_subtitle'        => (string)($data['about_subtitle']        ?? ($existingSettings['about_subtitle'] ?? 'لمسة من الإبداع')),
            'about_description'     => (string)($data['about_description']     ?? ($existingSettings['about_description'] ?? '')),
            'about_image_1'         => (string)($data['about_image_1']         ?? ($existingSettings['about_image_1'] ?? '')),
            'about_image_2'         => (string)($data['about_image_2']         ?? ($existingSettings['about_image_2'] ?? '')),

            'services_title'        => (string)($data['services_title']        ?? 'قائمة الخدمات'),
            'services_subtitle'     => (string)($data['services_subtitle']     ?? 'خدمات الصالون'),
            'services_description'  => (string)($data['services_description']  ?? ''),

            'team_title'            => (string)($data['team_title']            ?? 'أيدي مبدعة'),
            'team_subtitle'         => (string)($data['team_subtitle']         ?? 'فريق العمل'),
            'team_description'      => (string)($data['team_description']      ?? ''),

            'gallery_title'         => (string)($data['gallery_title']         ?? 'معرض أعمالنا'),
            'gallery_subtitle'      => (string)($data['gallery_subtitle']      ?? 'لمحة عن إبداعاتنا وأعمالنا المميزة'),
            'reviews_title'         => (string)($data['reviews_title']         ?? 'Ù…Ø§Ø°Ø§ ÙŠÙ‚ÙˆÙ„ Ø¹Ù†Ù‘Ø§ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡'),
            'reviews_subtitle'      => (string)($data['reviews_subtitle']      ?? 'Ø¢Ø±Ø§Ø¡ Ø¹Ù…Ù„Ø§Ø¦Ù†Ø§'),
            'reviews'               => (array)($data['reviews']                ?? ($existingSettings['reviews'] ?? [])),
        ]);

        $settingsJson = json_encode($merged, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($settingsJson === false) {
            sendError('خطأ في ترميز البيانات: ' . json_last_error_msg(), 500);
        }

        $stmt = $pdo->prepare("UPDATE salons SET name = ?, owner_phone = ?, owner_email = ?, settings = ? WHERE id = ?");
        $stmt->execute([$name, $ownerPhone, $ownerEmail, $settingsJson, $salonId]);

        sendSuccess(['message' => 'تم تحديث إعدادات الصالون']);
    } catch (Exception $e) {
        sendError('خطأ: ' . $e->getMessage(), 500);
    }
}

sendError('Method not allowed', 405);
