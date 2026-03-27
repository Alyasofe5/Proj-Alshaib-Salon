<?php
/**
 * Public Salon Info API
 * GET /api/booking/salon.php?slug=alshaib
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

if (getMethod() !== 'GET') sendError('Method not allowed', 405);

$slug = trim($_GET['slug'] ?? '');
if ($slug === '') sendError('رابط الصالون مطلوب');

$stmt = $pdo->prepare("
    SELECT s.id, s.name, s.slug, s.logo_path, s.status, s.owner_phone, s.settings,
           sp.plan_type, sp.features_config
    FROM salons s
    LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
    WHERE s.slug = ? AND s.status = 'active'
");
$stmt->execute([$slug]);
$salon = $stmt->fetch();

if (!$salon) sendError('الصالون غير موجود أو غير نشط', 404);

$featuresConfig = $salon['features_config'] ? json_decode($salon['features_config'], true) : [];
$hasBookingPage = !empty($featuresConfig['has_booking_page']);
if (!$hasBookingPage) {
    sendError('صفحة الحجز غير متوفرة في الباقة الحالية لهذا الصالون. يرجى ترقية الاشتراك.', 403);
}

$salonId = (int)$salon['id'];
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$baseUrl = $protocol . '://' . $_SERVER['HTTP_HOST'] . '/';
$settingsData = !empty($salon['settings']) ? (json_decode($salon['settings'], true) ?: []) : [];

$hasImagePath = false;
$hasVideoPath = false;
$hasDuration = false;
try {
    $cols = $pdo->query("SHOW COLUMNS FROM services")->fetchAll();
    foreach ($cols as $col) {
        if ($col['Field'] === 'image_path') $hasImagePath = true;
        if ($col['Field'] === 'video_path') $hasVideoPath = true;
        if ($col['Field'] === 'duration_minutes') $hasDuration = true;
    }
} catch (Exception $e) {
    // Ignore schema inspection errors.
}

$selectFields = "id, name, price";
if ($hasImagePath) $selectFields .= ", image_path";
if ($hasVideoPath) $selectFields .= ", video_path";
if ($hasDuration) $selectFields .= ", duration_minutes";

$servicesStmt = $pdo->prepare("
    SELECT $selectFields
    FROM services
    WHERE salon_id = ? AND is_active = 1
    ORDER BY created_at DESC, id DESC
");
$servicesStmt->execute([$salonId]);
$servicesList = $servicesStmt->fetchAll();

foreach ($servicesList as &$service) {
    $service['image'] = !empty($service['image_path']) ? $baseUrl . $service['image_path'] : null;
    $service['video'] = !empty($service['video_path']) ? $baseUrl . $service['video_path'] : null;
    if (!isset($service['duration_minutes'])) $service['duration_minutes'] = null;
    unset($service['image_path'], $service['video_path']);
}
unset($service);

try { $pdo->query("SELECT photo_path FROM employees LIMIT 1"); }
catch (Exception $e) { $pdo->exec("ALTER TABLE employees ADD COLUMN photo_path VARCHAR(500) DEFAULT NULL"); }
try { $pdo->query("SELECT specialty FROM employees LIMIT 1"); }
catch (Exception $e) { $pdo->exec("ALTER TABLE employees ADD COLUMN specialty VARCHAR(200) DEFAULT NULL"); }

$empStmt = $pdo->prepare("
    SELECT id, name, photo_path, specialty
    FROM employees
    WHERE salon_id = ? AND is_active = 1
    ORDER BY created_at DESC, id DESC
");
$empStmt->execute([$salonId]);
$employeesList = $empStmt->fetchAll();
foreach ($employeesList as &$emp) {
    $emp['avatar'] = !empty($emp['photo_path']) ? $baseUrl . $emp['photo_path'] : null;
    $emp['role'] = $emp['specialty'] ?? null;
    unset($emp['photo_path'], $emp['specialty']);
}
unset($emp);

$galleryItems = [];
try {
    $galStmt = $pdo->prepare("
        SELECT id, file_path, file_type
        FROM salon_gallery
        WHERE salon_id = ?
        ORDER BY order_num ASC, created_at DESC
        LIMIT 30
    ");
    $galStmt->execute([$salonId]);
    $galleryItems = $galStmt->fetchAll();
    foreach ($galleryItems as &$item) {
        $item['url'] = $baseUrl . $item['file_path'];
    }
    unset($item);
} catch (Exception $e) {
    // Gallery table may not exist yet.
}

$logoUrl = !empty($salon['logo_path']) ? $baseUrl . $salon['logo_path'] : null;
$heroImageUrl = !empty($settingsData['hero_image']) ? $baseUrl . $settingsData['hero_image'] : null;
$heroVideoUrl = !empty($settingsData['hero_video']) ? $baseUrl . $settingsData['hero_video'] : null;
$aboutImage1Url = !empty($settingsData['about_image_1'])
    ? ((preg_match('/^https?:\/\//', $settingsData['about_image_1']) || strpos($settingsData['about_image_1'], '/') === 0)
        ? $settingsData['about_image_1']
        : $baseUrl . $settingsData['about_image_1'])
    : null;
$aboutImage2Url = !empty($settingsData['about_image_2'])
    ? ((preg_match('/^https?:\/\//', $settingsData['about_image_2']) || strpos($settingsData['about_image_2'], '/') === 0)
        ? $settingsData['about_image_2']
        : $baseUrl . $settingsData['about_image_2'])
    : null;

sendSuccess([
    'salon' => [
        'name' => $salon['name'],
        'slug' => $salon['slug'],
        'logo' => $logoUrl,
        'phone' => $salon['owner_phone'],
        'description' => $settingsData['description'] ?? '',
        'secondary_description' => $settingsData['secondary_description'] ?? '',
        'address' => $settingsData['address'] ?? '',
        'instagram' => $settingsData['instagram'] ?? '',
        'whatsapp' => $settingsData['whatsapp'] ?? '',
        'facebook' => $settingsData['facebook'] ?? '',
        'booking_message' => $settingsData['booking_message'] ?? '',
        'hero_image' => $heroImageUrl,
        'hero_video' => $heroVideoUrl,
        'hero_type' => $settingsData['hero_type'] ?? '',
        'hero_subtitle' => $settingsData['hero_subtitle'] ?? 'تأسس ٢٠٢٤ -- صالون فاخر',
        'hero_title' => $settingsData['hero_title'] ?? 'أين يلتقي الإبداع بالأناقة',
        'about_title' => $settingsData['about_title'] ?? 'قصتنا',
        'about_subtitle' => $settingsData['about_subtitle'] ?? 'لمسة من الإبداع',
        'about_description' => $settingsData['about_description'] ?? '',
        'about_image_1' => $aboutImage1Url,
        'about_image_2' => $aboutImage2Url,
        'services_title' => $settingsData['services_title'] ?? 'قائمة الخدمات',
        'services_subtitle' => $settingsData['services_subtitle'] ?? 'خدمات الصالون',
        'services_description' => $settingsData['services_description'] ?? '',
        'team_title' => $settingsData['team_title'] ?? 'فريقنا',
        'team_subtitle' => $settingsData['team_subtitle'] ?? 'فريق العمل',
        'team_description' => $settingsData['team_description'] ?? '',
        'gallery_title' => $settingsData['gallery_title'] ?? 'معرض أعمالنا',
        'gallery_subtitle' => $settingsData['gallery_subtitle'] ?? 'لمحة عن إبداعاتنا وأعمالنا المميزة',
        'reviews_title' => $settingsData['reviews_title'] ?? 'Ù…Ø§Ø°Ø§ ÙŠÙ‚ÙˆÙ„ Ø¹Ù†Ù‘Ø§ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡',
        'reviews_subtitle' => $settingsData['reviews_subtitle'] ?? 'Ø¢Ø±Ø§Ø¡ Ø¹Ù…Ù„Ø§Ø¦Ù†Ø§',
        'reviews' => $settingsData['reviews'] ?? [],
        'faqs' => $settingsData['faqs'] ?? [],
    ],
    'services' => $servicesList,
    'employees' => $employeesList,
    'gallery' => $galleryItems,
    'work_hours' => [
        'start' => $settingsData['work_start'] ?? '09:00',
        'end' => $settingsData['work_end'] ?? '22:00',
        'interval' => (int)($settingsData['work_interval'] ?? 30),
    ],
    'off_days' => $settingsData['off_days'] ?? [],
    'booking_days' => (int)($settingsData['booking_days'] ?? 7),
]);
