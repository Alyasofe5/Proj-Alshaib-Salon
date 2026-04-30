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
    SELECT s.id, s.name_ar as name, s.name_en, s.slug, s.logo_path, s.status, s.owner_phone, s.settings,
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

try {
    $servicesStmt = $pdo->prepare("
        SELECT id, name_ar as name, name_en, price, image_path, video_path, duration_minutes
        FROM services
        WHERE salon_id = ? AND is_active = 1
        ORDER BY created_at DESC, id DESC
    ");
} catch (Exception $e) {
    // Fallback if schema doesn't have media columns yet
    $servicesStmt = $pdo->prepare("
        SELECT id, name_ar as name, name_en, price
        FROM services
        WHERE salon_id = ? AND is_active = 1
        ORDER BY created_at DESC, id DESC
    ");
}
$servicesStmt->execute([$salonId]);
$servicesList = $servicesStmt->fetchAll();

foreach ($servicesList as &$service) {
    $service['image'] = $service['image_path'] ?? null;
    $service['video'] = $service['video_path'] ?? null;
    if (!isset($service['duration_minutes'])) $service['duration_minutes'] = null;
    unset($service['image_path'], $service['video_path']);
}
unset($service);

try { $pdo->query("SELECT photo_path FROM employees LIMIT 1"); }
catch (Exception $e) { $pdo->exec("ALTER TABLE employees ADD COLUMN photo_path VARCHAR(500) DEFAULT NULL"); }
try { $pdo->query("SELECT specialty FROM employees LIMIT 1"); }
catch (Exception $e) { $pdo->exec("ALTER TABLE employees ADD COLUMN specialty VARCHAR(200) DEFAULT NULL"); }

$empStmt = $pdo->prepare("
    SELECT id, name_ar as name, name_en, photo_path, specialty
    FROM employees
    WHERE salon_id = ? AND is_active = 1
    ORDER BY created_at DESC, id DESC
");
$empStmt->execute([$salonId]);
$employeesList = $empStmt->fetchAll();
foreach ($employeesList as &$emp) {
    $emp['avatar'] = $emp['photo_path'] ?? null;
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
        $item['url'] = $item['file_path'];
    }
    unset($item);
} catch (Exception $e) {
    // Gallery table may not exist yet.
}

$logoUrl = $salon['logo_path'] ?? null;
$heroImageUrl = $settingsData['hero_image'] ?? null;
$heroVideoUrl = $settingsData['hero_video'] ?? null;
$aboutImage1Url = $settingsData['about_image_1'] ?? null;
$aboutImage2Url = $settingsData['about_image_2'] ?? null;

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
        'services_ticker' => $settingsData['services_ticker'] ?? "قصات دقيقة||Precision Cuts\nتلوين وميش الشعر||Hair Coloring\nتصفيف الشعر||Hair Styling\nتسريحات المناسبات||Event Hairstyles\nالتجديد العميق||Deep Restoration\nالعناية باللحية||Beard Care\nتنظيف البشرة||Skin Cleansing\nمساج استرخائي||Relax Massage",
        'team_title' => $settingsData['team_title'] ?? 'فريقنا',
        'team_subtitle' => $settingsData['team_subtitle'] ?? 'فريق العمل',
        'team_description' => $settingsData['team_description'] ?? '',
        'gallery_title' => $settingsData['gallery_title'] ?? 'معرض أعمالنا',
        'gallery_subtitle' => $settingsData['gallery_subtitle'] ?? 'لمحة عن إبداعاتنا وأعمالنا المميزة',
        'reviews_title' => $settingsData['reviews_title'] ?? 'ماذا يقول عنّا العملاء',
        'reviews_subtitle' => $settingsData['reviews_subtitle'] ?? 'آراء عملائنا',
        'reviews' => $settingsData['reviews'] ?? [],
        'faqs' => $settingsData['faqs'] ?? [],
        'faq_title' => $settingsData['faq_title'] ?? '',
        'faq_subtitle' => $settingsData['faq_subtitle'] ?? '',
        'stats_years' => $settingsData['stats_years'] ?? '7+',
        'stats_clients' => $settingsData['stats_clients'] ?? '15K+',
        'stats_experts' => $settingsData['stats_experts'] ?? '6',
        'discount_active' => $settingsData['discount_active'] ?? 0,
        'discount_percentage' => $settingsData['discount_percentage'] ?? '30',
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
