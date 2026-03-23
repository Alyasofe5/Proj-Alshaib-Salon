<?php
/**
 * Public Salon Info API (No Auth Required)
 * GET /api/public/salon.php?slug=alshaib
 * 
 * Returns salon info + services + employees for the booking page
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

if (getMethod() !== 'GET') sendError('Method not allowed', 405);

$slug = trim($_GET['slug'] ?? '');
if (empty($slug)) sendError('رابط الصالون مطلوب');

// معلومات الصالون مع بيانات الباقة
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

// التحقق من ميزة صفحة الحجز — المجاني لا يملك صفحة حجز
$featuresConfig = $salon['features_config'] ? json_decode($salon['features_config'], true) : [];
$hasBookingPage = !empty($featuresConfig['has_booking_page']);

if (!$hasBookingPage) {
    sendError('صفحة الحجز غير متوفرة في الباقة الحالية لهذا الصالون. يرجى ترقية الاشتراك.', 403);
}

$salonId = (int) $salon['id'];

// الخدمات النشطة
// Check which columns exist
$hasImagePath = false;
$hasDuration = false;
try {
    $cols = $pdo->query("SHOW COLUMNS FROM services")->fetchAll();
    foreach ($cols as $col) {
        if ($col['Field'] === 'image_path') $hasImagePath = true;
        if ($col['Field'] === 'duration_minutes') $hasDuration = true;
    }
} catch (Exception $e) { /* ignore */ }

$selectFields = "id, name, price";
if ($hasImagePath) $selectFields .= ", image_path";
if ($hasDuration) $selectFields .= ", duration_minutes";

$services = $pdo->prepare("
    SELECT $selectFields
    FROM services 
    WHERE salon_id = ? AND is_active = 1 
    ORDER BY name
");
$services->execute([$salonId]);
$servicesList = $services->fetchAll();

// Map image_path → image to match frontend Service type
foreach ($servicesList as &$svc) {
    if (!isset($svc['image_path'])) $svc['image_path'] = null;
    if (!isset($svc['duration_minutes'])) $svc['duration_minutes'] = null;
    // Frontend expects 'image' field, not 'image_path'
    $svc['image'] = !empty($svc['image_path']) ? $baseUrl . $svc['image_path'] : null;
    unset($svc['image_path']);
}
unset($svc);

// الموظفين النشطين
$employees = $pdo->prepare("
    SELECT id, name 
    FROM employees 
    WHERE salon_id = ? AND is_active = 1 
    ORDER BY name
");
$employees->execute([$salonId]);

// أوقات العمل من الإعدادات
$settings = $salon['settings'] ?? null;
$settingsData = $settings ? json_decode($settings, true) : [];

$workHours = [
    'start' => $settingsData['work_start'] ?? '09:00',
    'end' => $settingsData['work_end'] ?? '22:00',
    'interval' => (int)($settingsData['work_interval'] ?? 30),
];

// بناء رابط اللوجو الكامل
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$baseUrl = $protocol . '://' . $host . '/';

$logoUrl = null;
if ($salon['logo_path']) {
    $logoUrl = $baseUrl . $salon['logo_path'];
}

// بناء رابط الصورة الرئيسية (hero image)
$heroImageUrl = null;
if (!empty($settingsData['hero_image'])) {
    $heroImageUrl = $baseUrl . $settingsData['hero_image'];
}

// بناء رابط الفيديو الرئيسي (hero video)
$heroVideoUrl = null;
if (!empty($settingsData['hero_video'])) {
    $heroVideoUrl = $baseUrl . $settingsData['hero_video'];
}

// FAQs من الإعدادات
$faqs = $settingsData['faqs'] ?? [];

// الموظفين مع الصورة (auto-add photo_path if missing)
try { $pdo->query("SELECT photo_path FROM employees LIMIT 1"); }
catch (Exception $e) { $pdo->exec("ALTER TABLE employees ADD COLUMN photo_path VARCHAR(500) DEFAULT NULL"); }

try { $pdo->query("SELECT specialty FROM employees LIMIT 1"); }
catch (Exception $e) { $pdo->exec("ALTER TABLE employees ADD COLUMN specialty VARCHAR(200) DEFAULT NULL"); }

$empStmt = $pdo->prepare("SELECT id, name, photo_path, specialty FROM employees WHERE salon_id = ? AND is_active = 1 ORDER BY name");
$empStmt->execute([$salonId]);
$employeesList = $empStmt->fetchAll();

// Build full URLs for employee photos — return as 'avatar' to match frontend Employee type
foreach ($employeesList as &$emp) {
    $emp['avatar'] = !empty($emp['photo_path']) ? $baseUrl . $emp['photo_path'] : null;
    $emp['role'] = $emp['specialty'] ?? null;
    unset($emp['photo_path'], $emp['specialty']);
}
unset($emp);

// ── Gallery items (public — shown on booking page) ──
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
    foreach ($galleryItems as &$gi) {
        $gi['url'] = $baseUrl . $gi['file_path'];
    }
    unset($gi);
} catch (Exception $e) { /* table may not exist yet */ }

sendSuccess([
    'salon' => [
        'name'            => $salon['name'],
        'slug'            => $salon['slug'],
        'logo'            => $logoUrl,
        'phone'           => $salon['owner_phone'],
        'description'     => $settingsData['description'] ?? '',
        'address'         => $settingsData['address'] ?? '',
        'instagram'       => $settingsData['instagram'] ?? '',
        'booking_message' => $settingsData['booking_message'] ?? '',
        'hero_image'      => $heroImageUrl,
        'hero_video'      => $heroVideoUrl,
        'hero_type'       => $settingsData['hero_type'] ?? '',
        'services_title'  => $settingsData['services_title'] ?? 'خدمات نخبوية',
        'services_subtitle' => $settingsData['services_subtitle'] ?? 'نقدم مجموعة واسعة من الخدمات لتظهر بأفضل صورة',
        'team_title'      => $settingsData['team_title'] ?? 'فريقنا',
        'team_subtitle'   => $settingsData['team_subtitle'] ?? 'خبراء محترفون يجمعون بين المهارة والإبداع',
        'gallery_title'   => $settingsData['gallery_title'] ?? 'معرض أعمالنا',
        'gallery_subtitle' => $settingsData['gallery_subtitle'] ?? 'لمحة عن إبداعاتنا وأعمالنا المميزة',
        'faqs'            => $faqs,
    ],
    'services'     => $servicesList,
    'employees'    => $employeesList,
    'gallery'      => $galleryItems,
    'work_hours'   => $workHours,
    'off_days'     => $settingsData['off_days'] ?? [],
    'booking_days' => (int)($settingsData['booking_days'] ?? 7),
]);


