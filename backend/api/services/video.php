<?php
/**
 * Service Video Upload/Delete API
 * POST   /api/services/video.php?id=1
 * DELETE /api/services/video.php?id=1
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAdmin();
$salonId = $user['salon_id'];

try {
    $check = $pdo->query("SHOW COLUMNS FROM services LIKE 'video_path'")->fetch();
    if (!$check) {
        $pdo->exec("ALTER TABLE services ADD COLUMN video_path VARCHAR(255) DEFAULT NULL");
    }
} catch (Exception $e) {
    // Ignore schema sync failures.
}

$serviceId = (int)($_GET['id'] ?? 0);
if (!$serviceId) sendError('معرف الخدمة مطلوب');

$stmt = $pdo->prepare("SELECT video_path FROM services WHERE id = ? AND salon_id = ?");
$stmt->execute([$serviceId, $salonId]);
$service = $stmt->fetch();
if (!$service) sendError('الخدمة غير موجودة', 404);

$storageRoot = dirname($_SERVER['DOCUMENT_ROOT']) . '/user_uploads';
if (!is_dir($storageRoot)) mkdir($storageRoot, 0755, true);
$uploadDir = $storageRoot . '/services/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

if (getMethod() === 'DELETE') {
    if (!empty($service['video_path'])) {
        $oldFile = $storageRoot . '/services/' . basename($service['video_path']);
        if (file_exists($oldFile)) @unlink($oldFile);
    }

    $pdo->prepare("UPDATE services SET video_path = NULL WHERE id = ? AND salon_id = ?")
        ->execute([$serviceId, $salonId]);

    sendSuccess(['message' => 'تم حذف فيديو الخدمة']);
}

if (getMethod() !== 'POST') sendError('Method not allowed', 405);
if (empty($_FILES['video'])) sendError('الفيديو مطلوب');

$file = $_FILES['video'];
$allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
if (!in_array($file['type'], $allowed, true)) {
    sendError('نوع الملف غير مدعوم. يُسمح بـ MP4, WebM, MOV');
}
if ($file['size'] > 120 * 1024 * 1024) {
    sendError('حجم الفيديو أكبر من 120 ميجابايت');
}

if (!empty($service['video_path'])) {
    $oldFile = $storageRoot . '/services/' . basename($service['video_path']);
    if (file_exists($oldFile)) @unlink($oldFile);
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) ?: 'mp4';
$filename = 'service_video_' . $salonId . '_' . $serviceId . '_' . time() . '.' . $ext;
$target = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    sendError('فشل رفع الفيديو', 500);
}

$relativePath = 'uploads/services/' . $filename;
$pdo->prepare("UPDATE services SET video_path = ? WHERE id = ? AND salon_id = ?")
    ->execute([$relativePath, $serviceId, $salonId]);

sendSuccess(['video' => $relativePath, 'message' => 'تم رفع فيديو الخدمة بنجاح']);
