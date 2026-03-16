<?php
/**
 * SuperAdmin: Contact Requests Management
 * GET  /api/superadmin/contacts.php        - list all requests
 * PATCH /api/superadmin/contacts.php?id=X  - update status/notes
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();
if ($user['role'] !== 'super_admin') sendError('غير مصرح', 403);

// Create table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS contact_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    salon_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    employees INT DEFAULT 1,
    message TEXT,
    status ENUM('new','contacted','done') DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$method = getMethod();

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM contact_requests ORDER BY created_at DESC");
    $requests = $stmt->fetchAll();
    $total   = count($requests);
    $newCount = count(array_filter($requests, fn($r) => $r['status'] === 'new'));
    sendSuccess(['requests' => $requests, 'total' => $total, 'new_count' => $newCount]);
}

if ($method === 'PATCH') {
    $id   = intval($_GET['id'] ?? 0);
    $body = json_decode(file_get_contents('php://input'), true);
    $status = $body['status'] ?? null;
    $notes  = $body['notes'] ?? null;

    if (!$id) sendError('ID مطلوب', 422);

    $fields = [];
    $vals   = [];
    if ($status) { $fields[] = "status = ?"; $vals[] = $status; }
    if ($notes !== null) { $fields[] = "notes = ?"; $vals[] = $notes; }
    if (empty($fields)) sendError('لا يوجد بيانات للتحديث', 422);

    $vals[] = $id;
    $pdo->prepare("UPDATE contact_requests SET " . implode(', ', $fields) . " WHERE id = ?")->execute($vals);
    sendSuccess([], 200, 'تم التحديث');
}

sendError('Method not allowed', 405);
