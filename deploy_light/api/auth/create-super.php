<?php
/**
 * إنشاء مستخدم Super Admin واحد — احذف هذا الملف بعد الاستخدام!
 * GET /api/auth/create-super.php?key=maqass2026
 */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

// مفتاح أمان بسيط
if (($_GET['key'] ?? '') !== 'maqass2026') sendError('غير مصرح', 403);

$username = 'administrator';
$password = password_hash('Admin@2026', PASSWORD_DEFAULT);
$name = 'مدير المنصة';

// تحقق إذا موجود
$check = $pdo->prepare("SELECT id FROM users WHERE username = ?");
$check->execute([$username]);

if ($check->fetch()) {
    // حدّث فقط
    $stmt = $pdo->prepare("UPDATE users SET password = ?, role = 'super_admin', salon_id = NULL WHERE username = ?");
    $stmt->execute([$password, $username]);
    sendSuccess(['action' => 'updated'], 200, "تم تحديث حساب $username");
} else {
    $stmt = $pdo->prepare("INSERT INTO users (username, password, name, role, salon_id) VALUES (?,?,?,'super_admin', NULL)");
    $stmt->execute([$username, $password, $name]);
    sendSuccess(['action' => 'created'], 201, "تم إنشاء حساب $username");
}
