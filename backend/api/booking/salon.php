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

// معلومات الصالون
$stmt = $pdo->prepare("
    SELECT id, name, slug, logo_path, status, owner_phone, settings
    FROM salons WHERE slug = ? AND status = 'active'
");
$stmt->execute([$slug]);
$salon = $stmt->fetch();

if (!$salon) sendError('الصالون غير موجود أو غير نشط', 404);

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

// Add missing fields with defaults
foreach ($servicesList as &$svc) {
    if (!isset($svc['image_path'])) $svc['image_path'] = null;
    if (!isset($svc['duration_minutes'])) $svc['duration_minutes'] = null;
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
if ($salon['logo_path'] && file_exists($_SERVER['DOCUMENT_ROOT'] . '/' . $salon['logo_path'])) {
    $logoUrl = $baseUrl . $salon['logo_path'];
}

// بناء رابط صورة الخلفية
$heroImageUrl = null;
if (!empty($settingsData['hero_image'])) {
    $heroImageUrl = $baseUrl . $settingsData['hero_image'];
}

// Build full URLs for service images
foreach ($servicesList as &$svc) {
    if (!empty($svc['image_path'])) {
        $svc['image'] = $baseUrl . $svc['image_path'];
    } else {
        $svc['image'] = null;
    }
    unset($svc['image_path']);
}
unset($svc);

sendSuccess([
    'salon' => [
        'name' => $salon['name'],
        'slug' => $salon['slug'],
        'logo' => $logoUrl,
        'phone' => $salon['owner_phone'],
        'description' => $settingsData['description'] ?? '',
        'address' => $settingsData['address'] ?? '',
        'instagram' => $settingsData['instagram'] ?? '',
        'booking_message' => $settingsData['booking_message'] ?? '',
        'hero_image' => $heroImageUrl,
    ],
    'services' => $servicesList,
    'employees' => $employees->fetchAll(),
    'work_hours' => $workHours,
    'off_days' => $settingsData['off_days'] ?? [],
    'booking_days' => (int)($settingsData['booking_days'] ?? 7),
]);
