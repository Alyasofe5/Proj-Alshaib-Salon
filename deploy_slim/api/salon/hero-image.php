<?php
/**
 * Hero Image Upload API
 * POST /api/salon/hero-image.php → Upload hero background image
 * DELETE /api/salon/hero-image.php → Remove hero image
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/response.php';

$user = requireAdmin();
$salonId = $user['salon_id'];

if (getMethod() === 'POST') {
    if (isset($_FILES['image'])) {
        $file = $_FILES['image'];
    } elseif (isset($_FILES['hero_image'])) {
        $file = $_FILES['hero_image'];
    } else {
        sendError('لم يتم إرسال صورة');
    }
    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    if (!in_array($file['type'], $allowed)) {
        sendError('نوع الملف غير مدعوم. فقط JPG, PNG, WEBP');
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        sendError('حجم الملف كبير جداً (الحد الأقصى 5MB)');
    }

    // Create upload directory (use document root for public access)
    $docRoot = $_SERVER['DOCUMENT_ROOT'];
    $uploadDir = $docRoot . '/uploads/hero/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Delete old hero image if exists
    $stmt = $pdo->prepare("SELECT settings FROM salons WHERE id = ?");
    $stmt->execute([$salonId]);
    $salon = $stmt->fetch();
    $settings = $salon['settings'] ? json_decode($salon['settings'], true) : [];

    if (!empty($settings['hero_image'])) {
        $oldFile = $docRoot . '/' . $settings['hero_image'];
        if (file_exists($oldFile)) unlink($oldFile);
    }

    // Save new file
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $filename = 'hero_' . $salonId . '_' . time() . '.' . $ext;
    $filepath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        sendError('فشل في رفع الصورة', 500);
    }

    $relativePath = 'uploads/hero/' . $filename;

    // Update settings
    $settings['hero_image'] = $relativePath;
    $settingsJson = json_encode($settings, JSON_UNESCAPED_UNICODE);

    $stmt = $pdo->prepare("UPDATE salons SET settings = ? WHERE id = ?");
    $stmt->execute([$settingsJson, $salonId]);

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $fullUrl = $protocol . '://' . $host . '/' . $relativePath;

    sendSuccess(['hero_image' => $fullUrl, 'message' => 'تم رفع الصورة بنجاح']);
}

if (getMethod() === 'DELETE') {
    $stmt = $pdo->prepare("SELECT settings FROM salons WHERE id = ?");
    $stmt->execute([$salonId]);
    $salon = $stmt->fetch();
    $settings = $salon['settings'] ? json_decode($salon['settings'], true) : [];

    if (!empty($settings['hero_image'])) {
        $oldFile = $_SERVER['DOCUMENT_ROOT'] . '/' . $settings['hero_image'];
        if (file_exists($oldFile)) unlink($oldFile);
    }

    $settings['hero_image'] = '';
    $settingsJson = json_encode($settings, JSON_UNESCAPED_UNICODE);

    $stmt = $pdo->prepare("UPDATE salons SET settings = ? WHERE id = ?");
    $stmt->execute([$settingsJson, $salonId]);

    sendSuccess(['message' => 'تم حذف الصورة']);
}

sendError('Method not allowed', 405);
