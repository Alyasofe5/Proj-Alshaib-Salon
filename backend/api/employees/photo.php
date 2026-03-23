<?php
/**
 * Employee Photo Upload API
 * POST /api/employees/photo.php?id={employee_id} → Upload/update employee photo
 *
 * Files stored in: maqas.site/user_uploads/employees/ (ABOVE public_html — deploy-safe)
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/response.php';

$user = requireAdmin();
$salonId = $user['salon_id'];

if (getMethod() !== 'POST') {
    sendError('Method not allowed', 405);
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if (!$id) sendError('معرف الحلاق مطلوب');

// Verify employee belongs to this salon
$check = $pdo->prepare("SELECT id, photo_path FROM employees WHERE id = ? AND salon_id = ?");
$check->execute([$id, $salonId]);
$employee = $check->fetch();
if (!$employee) sendError('الحلاق غير موجود', 404);

if (empty($_FILES['photo'])) sendError('لم يتم رفع صورة');

$file     = $_FILES['photo'];
$ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed  = ['jpg', 'jpeg', 'png', 'webp'];

if (!in_array($ext, $allowed)) sendError('نوع الملف غير مدعوم. يُسمح بـ: jpg, png, webp');
if ($file['size'] > 5 * 1024 * 1024) sendError('حجم الصورة يتجاوز 5 ميغابايت');

// Persistent storage root (above public_html — survives deploys)
$storageRoot = dirname($_SERVER['DOCUMENT_ROOT']) . '/user_uploads';
if (!is_dir($storageRoot)) mkdir($storageRoot, 0755, true);

$uploadDir = $storageRoot . '/employees/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

// Delete old photo if exists
if (!empty($employee['photo_path'])) {
    // Handle both old path formats (uploads/employees/ or just the filename)
    $oldRelative = str_replace('uploads/employees/', '', $employee['photo_path']);
    $oldFile = $uploadDir . basename($oldRelative);
    if (file_exists($oldFile)) @unlink($oldFile);
}

$filename  = "emp_{$id}_" . time() . '.' . $ext;
$destPath  = $uploadDir . $filename;
$publicPath = 'uploads/employees/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    sendError('فشل في رفع الصورة', 500);
}

// Optimize image if GD available
if (function_exists('imagecreatefromjpeg') && in_array($ext, ['jpg','jpeg'])) {
    $img = @imagecreatefromjpeg($destPath);
    if ($img) { imagejpeg($img, $destPath, 85); imagedestroy($img); }
} elseif (function_exists('imagecreatefrompng') && $ext === 'png') {
    $img = @imagecreatefrompng($destPath);
    if ($img) { imagepng($img, $destPath, 7); imagedestroy($img); }
}

// Update DB — path served via file-server.php → /uploads/employees/emp_1_xxx.jpg
$stmt = $pdo->prepare("UPDATE employees SET photo_path = ? WHERE id = ? AND salon_id = ?");
$stmt->execute([$publicPath, $id, $salonId]);

sendSuccess(['photo' => $publicPath], 200, 'تم رفع صورة الحلاق بنجاح');
