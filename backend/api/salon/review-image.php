<?php
/**
 * Review Image Upload API
 * POST /api/salon/review-image.php → Upload a customer-review avatar; returns the stored path.
 * The caller (admin settings page) saves the returned path into settings.reviews[index].photo
 * via the standard PUT /api/salon/settings.php flow.
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/response.php';

$user    = requireAdmin();
$salonId = $user['salon_id'];

if (getMethod() !== 'POST') sendError('Method not allowed', 405);

if (empty($_FILES['image'])) sendError('لم يتم إرسال صورة');
$file = $_FILES['image'];

if (!empty($file['error'])) sendError('خطأ في رفع الملف (code ' . $file['error'] . ')');

// Detect MIME robustly — client-sent $file['type'] is unreliable across browsers.
$detectedMime = $file['type'] ?? '';
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
        $sniffed = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        if ($sniffed) $detectedMime = $sniffed;
    }
}

$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
if (!in_array($detectedMime, $allowed, true)) {
    sendError('نوع الملف غير مدعوم (' . $detectedMime . '). فقط JPG / PNG / WEBP / GIF');
}
if ($file['size'] > 5 * 1024 * 1024) sendError('حجم الملف كبير جداً (الحد الأقصى 5MB)');

$docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
if (empty($docRoot)) {
    // CLI / unusual SAPI — fall back to a path relative to the backend/uploads folder
    $docRoot = realpath(__DIR__ . '/../../..');
}
$uploadDir = rtrim($docRoot, '/\\') . '/uploads/reviews/';
if (!is_dir($uploadDir)) {
    if (!@mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
        sendError('تعذر إنشاء مجلد الرفع: ' . $uploadDir, 500);
    }
}
if (!is_writable($uploadDir)) sendError('مجلد الرفع غير قابل للكتابة: ' . $uploadDir, 500);

$ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg');
$filename = 'review_' . $salonId . '_' . time() . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
$filepath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    sendError('فشل في نقل الملف إلى ' . $filepath, 500);
}

sendSuccess(['path' => 'uploads/reviews/' . $filename, 'message' => 'تم رفع الصورة بنجاح']);
