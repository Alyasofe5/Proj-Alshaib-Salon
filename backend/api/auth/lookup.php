<?php
/**
 * Salon Lookup API (Public - No Auth Required)
 * GET /api/auth/lookup.php?username=waseem
 * 
 * Returns: salon name, logo, slug for login page branding
 * Does NOT return sensitive data
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

if (getMethod() !== 'GET') sendError('Method not allowed', 405);

$username = trim($_GET['username'] ?? '');

if (empty($username)) {
    sendSuccess(['found' => false]);
}

// البحث عن المستخدم والصالون المرتبط
$stmt = $pdo->prepare("
    SELECT s.name as salon_name, s.slug as salon_slug, s.logo_path as salon_logo,
           s.status as salon_status
    FROM users u
    JOIN salons s ON u.salon_id = s.id
    WHERE u.username = ? AND u.is_active = 1
    LIMIT 1
");
$stmt->execute([$username]);
$result = $stmt->fetch();

if (!$result) {
    sendSuccess(['found' => false]);
}

// Always return logo_path from DB — frontend handles missing images gracefully
$logoUrl = null;
$logoPath = $result['salon_logo'];
if ($logoPath) {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $logoUrl = $protocol . '://' . $_SERVER['HTTP_HOST'] . '/' . $logoPath;
}

sendSuccess([
    'found' => true,
    'salon' => [
        'name' => $result['salon_name'],
        'slug' => $result['salon_slug'],
        'logo' => $logoUrl,
        'status' => $result['salon_status'],
    ],
]);
