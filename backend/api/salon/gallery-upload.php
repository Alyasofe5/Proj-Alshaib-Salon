<?php
/**
 * Gallery Upload API (Admin Auth Required)
 * POST /api/salon/gallery-upload.php
 *
 * Accepts: image/jpeg, image/png, image/webp  (≤ 10 MB)
 *          video/mp4, video/webm               (≤ 200 MB)
 *
 * Supports single file (field: 'file') or multiple files (field: 'files[]')
 *
 * Files are saved to:  user_uploads/gallery/{salon_id}/
 * DB path stored as:   uploads/gallery/{salon_id}/{filename}
 * Public URL:          https://maqas.site/uploads/gallery/{salon_id}/{filename}
 * Served by:           /api/file-server.php via .htaccess rewrite
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/response.php';

$user    = requireAdmin();
$salonId = $user['salon_id'];

if (getMethod() !== 'POST') sendError('Method not allowed', 405);

// ── Auto-create table ──
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS salon_gallery (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            salon_id    INT NOT NULL,
            file_path   VARCHAR(500) NOT NULL,
            file_type   ENUM('image','video') NOT NULL DEFAULT 'image',
            order_num   INT NOT NULL DEFAULT 0,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_salon_id (salon_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} catch (Exception $e) { /* ignore */ }

$allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
$allowedVideos = ['video/mp4', 'video/webm'];

// ── Collect files (support 'file' single or 'files[]' multiple) ──
$fileList = [];
if (!empty($_FILES['files']['tmp_name'])) {
    // Multiple files
    $count = is_array($_FILES['files']['tmp_name']) ? count($_FILES['files']['tmp_name']) : 1;
    for ($i = 0; $i < $count; $i++) {
        $fileList[] = [
            'tmp_name' => is_array($_FILES['files']['tmp_name']) ? $_FILES['files']['tmp_name'][$i] : $_FILES['files']['tmp_name'],
            'name'     => is_array($_FILES['files']['name'])     ? $_FILES['files']['name'][$i]     : $_FILES['files']['name'],
            'size'     => is_array($_FILES['files']['size'])     ? $_FILES['files']['size'][$i]     : $_FILES['files']['size'],
        ];
    }
} elseif (!empty($_FILES['file']['tmp_name'])) {
    // Single file
    $fileList[] = [
        'tmp_name' => $_FILES['file']['tmp_name'],
        'name'     => $_FILES['file']['name'],
        'size'     => $_FILES['file']['size'],
    ];
}

if (empty($fileList)) sendError('لم يتم رفع أي ملف');

// ── Storage path (same pattern as other upload scripts) ──
$storageRoot = dirname($_SERVER['DOCUMENT_ROOT']) . '/user_uploads';
$uploadDir   = $storageRoot . '/gallery/' . $salonId . '/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$baseUrl  = $protocol . '://' . $_SERVER['HTTP_HOST'] . '/';

$results = [];

foreach ($fileList as $f) {
    $tmpPath  = $f['tmp_name'];
    $origName = $f['name'] ?? 'upload';
    $size     = $f['size'];
    $mimeType = mime_content_type($tmpPath);

    $isVideo = in_array($mimeType, $allowedVideos);
    $isImage = in_array($mimeType, $allowedImages);

    if (!$isVideo && !$isImage) continue; // skip invalid

    $maxSize = $isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024;
    if ($size > $maxSize) continue; // skip oversized

    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    $validExts = $isVideo ? ['mp4', 'webm'] : ['jpg', 'jpeg', 'png', 'webp'];
    if (!in_array($ext, $validExts)) $ext = $isVideo ? 'mp4' : 'jpg';

    $filename = ($isVideo ? 'vid_' : 'img_') . $salonId . '_' . time() . '_' . mt_rand(1000, 9999) . '.' . $ext;
    $destPath = $uploadDir . $filename;

    if (!move_uploaded_file($tmpPath, $destPath)) continue;

    $dbPath   = 'uploads/gallery/' . $salonId . '/' . $filename;
    $fileType = $isVideo ? 'video' : 'image';

    $stmt = $pdo->prepare("INSERT INTO salon_gallery (salon_id, file_path, file_type) VALUES (?, ?, ?)");
    $stmt->execute([$salonId, $dbPath, $fileType]);
    $newId = $pdo->lastInsertId();

    $results[] = [
        'id'        => (int)$newId,
        'file_path' => $dbPath,
        'file_type' => $fileType,
        'url'       => $baseUrl . $dbPath,
    ];
}

if (empty($results)) sendError('فشل في رفع الملفات');

// Return single item for backward compat, or array
if (count($results) === 1) {
    sendSuccess($results[0]);
} else {
    sendSuccess(['items' => $results]);
}
