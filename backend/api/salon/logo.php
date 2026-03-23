<?php
/**
 * Upload Salon Logo
 * POST /api/salon/logo.php — upload logo (multipart/form-data, field: logo)
 * GET  /api/salon/logo.php — get current logo
 *
 * Files stored in: maqas.site/user_uploads/logos/ (ABOVE public_html — deploy-safe)
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate(['admin', 'super_admin']);
$method = getMethod();
$salonId = $user['salon_id'] ?? null;

if ($user['role'] !== 'super_admin' && !$salonId) {
    sendError('لم يتم ربط حسابك بصالون', 403);
}

if ($user['role'] === 'super_admin' && isset($_GET['salon_id'])) {
    $salonId = (int)$_GET['salon_id'];
}

// ── Helper: persistent storage root (above public_html) ──
function getStorageRoot(): string {
    $base = dirname($_SERVER['DOCUMENT_ROOT']) . '/user_uploads';
    if (!is_dir($base)) mkdir($base, 0755, true);
    return $base;
}

// ===== GET: current logo =====
if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT logo_path FROM salons WHERE id = ?");
    $stmt->execute([$salonId]);
    $salon = $stmt->fetch();
    if (!$salon) sendError('الصالون غير موجود', 404);
    sendSuccess(['logo' => $salon['logo_path']]);
}

// ===== POST: upload logo =====
if ($method === 'POST') {
    if (!isset($_FILES['logo'])) {
        sendError('يرجى اختيار صورة');
    }

    $file = $_FILES['logo'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/bmp', 'image/tiff'];

    if (!in_array($file['type'], $allowedTypes)) {
        sendError('نوع الملف غير مدعوم. المسموح: JPG, PNG, WebP, GIF, SVG');
    }

    if ($file['size'] > 2 * 1024 * 1024) {
        sendError('حجم الصورة يجب أن يكون أقل من 2MB');
    }

    // Upload to persistent storage (above public_html — survives deploys)
    $uploadDir = getStorageRoot() . '/logos/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    // Generate unique filename
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) ?: 'jpg';
    $filename = 'salon_' . $salonId . '_' . time() . '.' . $ext;
    $filePath = $uploadDir . $filename;

    // Delete old logo from persistent storage
    $stmt = $pdo->prepare("SELECT logo_path FROM salons WHERE id = ?");
    $stmt->execute([$salonId]);
    $old = $stmt->fetch();
    if ($old && $old['logo_path']) {
        $oldFile = getStorageRoot() . '/' . ltrim(str_replace('uploads/', '', $old['logo_path']), '/');
        if (file_exists($oldFile)) @unlink($oldFile);
    }

    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        sendError('فشل في رفع الصورة');
    }

    // Optimize image if GD available
    if (in_array($ext, ['jpg', 'jpeg']) && function_exists('imagecreatefromjpeg')) {
        $img = @imagecreatefromjpeg($filePath);
        if ($img) { imagejpeg($img, $filePath, 85); imagedestroy($img); }
    }

    // Save relative path — URL: /uploads/logos/filename.jpg → served by file-server.php
    $relativePath = 'uploads/logos/' . $filename;
    $stmt = $pdo->prepare("UPDATE salons SET logo_path = ? WHERE id = ?");
    $stmt->execute([$relativePath, $salonId]);

    sendSuccess(['logo' => $relativePath], 200, 'تم رفع اللوجو بنجاح');
}

sendError('Method not allowed', 405);
