<?php
/**
 * Gallery API (Admin Auth Required)
 * GET    /api/salon/gallery.php           → List gallery items
 * PUT    /api/salon/gallery.php           → Reorder items (body: { order: [id1, id2, ...] })
 * DELETE /api/salon/gallery.php?id=X      → Delete item
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/response.php';

$user    = requireAdmin();
$salonId = $user['salon_id'];

// ── Auto-create table if not exists ──
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

// ── GET: List items ──
if (getMethod() === 'GET') {
    $stmt = $pdo->prepare("
        SELECT id, file_path, file_type, order_num, created_at
        FROM salon_gallery
        WHERE salon_id = ?
        ORDER BY order_num ASC, created_at DESC
    ");
    $stmt->execute([$salonId]);
    $items = $stmt->fetchAll();

    foreach ($items as &$item) {
        $item['url'] = $item['file_path'];
    }
    unset($item);

    sendSuccess(['items' => $items]);
}

// ── PUT: Reorder items ──
if (getMethod() === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true);
    $order = $body['order'] ?? [];

    if (!is_array($order) || empty($order)) sendError('ترتيب غير صالح');

    $stmt = $pdo->prepare("UPDATE salon_gallery SET order_num = ? WHERE id = ? AND salon_id = ?");
    foreach ($order as $index => $id) {
        $stmt->execute([$index, (int)$id, $salonId]);
    }

    sendSuccess(['message' => 'تم تحديث الترتيب']);
}

// ── DELETE: Remove item ──
if (getMethod() === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('معرف العنصر مطلوب');

    $stmt = $pdo->prepare("SELECT file_path FROM salon_gallery WHERE id = ? AND salon_id = ?");
    $stmt->execute([$id, $salonId]);
    $item = $stmt->fetch();

    if (!$item) sendError('العنصر غير موجود', 404);

    // Remove from DB
    $pdo->prepare("DELETE FROM salon_gallery WHERE id = ? AND salon_id = ?")->execute([$id, $salonId]);

    // Remove physical file
    $storageRoot  = dirname($_SERVER['DOCUMENT_ROOT']) . '/user_uploads';
    $relativePath = preg_replace('/^uploads\//', '', $item['file_path']);
    $physicalPath = $storageRoot . '/' . $relativePath;
    if (file_exists($physicalPath)) @unlink($physicalPath);

    sendSuccess(['message' => 'تم حذف العنصر بنجاح']);
}

sendError('Method not allowed', 405);
