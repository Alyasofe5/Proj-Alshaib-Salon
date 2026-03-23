<?php
/**
 * Hero Media Upload API (Image OR Video)
 * POST   /api/salon/hero-media.php  → Upload hero image or video
 * DELETE /api/salon/hero-media.php  → Remove hero media
 *
 * Files stored in: maqas.site/user_uploads/hero/ (ABOVE public_html — deploy-safe)
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/response.php';

$user    = requireAdmin();
$salonId = $user['salon_id'];

// Persistent storage root (above public_html — survives deploys)
$storageRoot = dirname($_SERVER['DOCUMENT_ROOT']) . '/user_uploads';

// ── Helper: get current settings ──
function getSettings(PDO $pdo, int $salonId): array {
    $stmt = $pdo->prepare("SELECT settings FROM salons WHERE id = ?");
    $stmt->execute([$salonId]);
    $row = $stmt->fetch();
    return $row && $row['settings'] ? json_decode($row['settings'], true) : [];
}

// ── Helper: save settings ──
function saveSettings(PDO $pdo, int $salonId, array $settings): void {
    $stmt = $pdo->prepare("UPDATE salons SET settings = ? WHERE id = ?");
    $stmt->execute([json_encode($settings, JSON_UNESCAPED_UNICODE), $salonId]);
}

// ── Helper: delete file from persistent storage ──
function deleteOldMedia(string $storageRoot, string $relativePath): void {
    if (empty($relativePath)) return;
    // relativePath format: uploads/hero/images/hero_1_xxx.mp4
    $subPath = str_replace('uploads/', '', $relativePath);
    $full = $storageRoot . '/' . ltrim($subPath, '/');
    if (file_exists($full)) @unlink($full);
}

if (getMethod() === 'POST') {

    // Detect input field name
    $fileKey = null;
    foreach (['media', 'image', 'video', 'hero_image', 'hero_media'] as $k) {
        if (!empty($_FILES[$k])) { $fileKey = $k; break; }
    }
    if (!$fileKey) sendError('لم يتم إرسال أي ملف');

    $file = $_FILES[$fileKey];
    $mime = mime_content_type($file['tmp_name']);

    $imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    $videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

    $isImage = in_array($mime, $imageTypes);
    $isVideo = in_array($mime, $videoTypes);

    if (!$isImage && !$isVideo) {
        sendError('نوع الملف غير مدعوم. يُسمح بـ: JPG, PNG, WEBP, MP4, WEBM');
    }

    $maxSize = $isVideo ? 150 * 1024 * 1024 : 8 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        $limit = $isVideo ? '150MB' : '8MB';
        sendError("حجم الملف كبير جداً. الحد الأقصى: {$limit}");
    }

    // Determine upload subdirectory & extension
    $subDir = $isVideo ? 'hero/videos' : 'hero/images';
    $ext    = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (empty($ext)) $ext = $isVideo ? 'mp4' : 'jpg';

    // Create persistent storage directory
    $uploadDir = $storageRoot . '/' . $subDir . '/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    // Delete previous media
    $settings = getSettings($pdo, $salonId);
    if ($isImage && !empty($settings['hero_image'])) deleteOldMedia($storageRoot, $settings['hero_image']);
    if ($isVideo && !empty($settings['hero_video'])) deleteOldMedia($storageRoot, $settings['hero_video']);

    // Save file to persistent storage
    $filename = 'hero_' . $salonId . '_' . time() . '.' . $ext;
    $destPath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        sendError('فشل في رفع الملف', 500);
    }

    // Optimize hero image if GD available
    if ($isImage && in_array($ext, ['jpg','jpeg']) && function_exists('imagecreatefromjpeg')) {
        $img = @imagecreatefromjpeg($destPath);
        if ($img) { imagejpeg($img, $destPath, 88); imagedestroy($img); }
    }

    // Relative path — URL: /uploads/hero/images/xxx.jpg → served by file-server.php
    $relativePath = 'uploads/' . $subDir . '/' . $filename;

    // Update settings in DB
    if ($isImage) {
        $settings['hero_image'] = $relativePath;
        $settings['hero_type']  = 'image';
    } else {
        $settings['hero_video'] = $relativePath;
        $settings['hero_type']  = 'video';
    }
    saveSettings($pdo, $salonId, $settings);

    sendSuccess([
        'path'       => $relativePath,
        'type'       => $isVideo ? 'video' : 'image',
        'hero_image' => $settings['hero_image'] ?? null,
        'hero_video' => $settings['hero_video'] ?? null,
        'hero_type'  => $settings['hero_type'],
    ], 200, 'تم رفع الملف بنجاح');
}

if (getMethod() === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $type = $data['type'] ?? 'image';

    $settings = getSettings($pdo, $salonId);

    if ($type === 'video') {
        deleteOldMedia($storageRoot, $settings['hero_video'] ?? '');
        $settings['hero_video'] = '';
        if (($settings['hero_type'] ?? '') === 'video') {
            $settings['hero_type'] = !empty($settings['hero_image']) ? 'image' : '';
        }
    } else {
        deleteOldMedia($storageRoot, $settings['hero_image'] ?? '');
        $settings['hero_image'] = '';
        if (($settings['hero_type'] ?? '') === 'image') {
            $settings['hero_type'] = !empty($settings['hero_video']) ? 'video' : '';
        }
    }

    saveSettings($pdo, $salonId, $settings);
    sendSuccess(['message' => 'تم الحذف بنجاح']);
}

sendError('Method not allowed', 405);
