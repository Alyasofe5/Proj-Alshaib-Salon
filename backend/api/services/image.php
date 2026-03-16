<?php
/**
 * Service Image Upload API
 * POST /api/services/image.php?id=1 → Upload service image
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAdmin();
$salonId = $user['salon_id'];

// Ensure image_path column exists
try {
    $check = $pdo->query("SHOW COLUMNS FROM services LIKE 'image_path'")->fetch();
    if (!$check) {
        $pdo->exec("ALTER TABLE services ADD COLUMN image_path VARCHAR(255) DEFAULT NULL");
    }
} catch (Exception $e) { /* ignore */ }

if (getMethod() !== 'POST') sendError('Method not allowed', 405);

$serviceId = (int)($_GET['id'] ?? 0);
if (!$serviceId) sendError('معرف الخدمة مطلوب');

// Verify service belongs to salon
$stmt = $pdo->prepare("SELECT id FROM services WHERE id = ? AND salon_id = ?");
$stmt->execute([$serviceId, $salonId]);
if (!$stmt->fetch()) sendError('الخدمة غير موجودة', 404);

if (empty($_FILES['image'])) sendError('الصورة مطلوبة');

$file = $_FILES['image'];
$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

if (!in_array($file['type'], $allowed)) {
    sendError('نوع الملف غير مدعوم. يُسمح بـ JPG, PNG, WebP, GIF');
}

if ($file['size'] > 5 * 1024 * 1024) {
    sendError('حجم الملف أكبر من 5 ميجابايت');
}

// Create upload directory (use document root for public access)
$docRoot = $_SERVER['DOCUMENT_ROOT'];
$uploadDir = $docRoot . '/uploads/services/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Delete old image if exists
$oldStmt = $pdo->prepare("SELECT image_path FROM services WHERE id = ?");
$oldStmt->execute([$serviceId]);
$old = $oldStmt->fetch();
if (!empty($old['image_path'])) {
    $oldFile = $docRoot . '/' . $old['image_path'];
    if (file_exists($oldFile)) unlink($oldFile);
}

// Save new image
$ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
$filename = 'service_' . $salonId . '_' . $serviceId . '_' . time() . '.' . $ext;
$filePath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    sendError('فشل رفع الصورة', 500);
}

$relativePath = 'uploads/services/' . $filename;

$stmt = $pdo->prepare("UPDATE services SET image_path = ? WHERE id = ? AND salon_id = ?");
$stmt->execute([$relativePath, $serviceId, $salonId]);

// Return relative path — frontend's assetUrl() handles URL resolution
sendSuccess(['image' => $relativePath, 'message' => 'تم رفع صورة الخدمة بنجاح']);
