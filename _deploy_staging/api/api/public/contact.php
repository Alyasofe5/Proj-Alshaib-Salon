<?php
/**
 * Public Contact Request API (No Auth Required)
 * POST /api/public/contact.php
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

if (getMethod() === 'OPTIONS') exit;
if (getMethod() !== 'POST') sendError('Method not allowed', 405);

$body = json_decode(file_get_contents('php://input'), true);

$salon_name   = trim($body['salon_name'] ?? '');
$owner_name   = trim($body['owner_name'] ?? '');
$phone        = trim($body['phone'] ?? '');
$city         = trim($body['city'] ?? '');
$employees    = intval($body['employees'] ?? 1);
$message      = trim($body['message'] ?? '');

if (!$salon_name || !$owner_name || !$phone) {
    sendError('اسم الصالون واسم المالك والجوال مطلوبة', 422);
}

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

$stmt = $pdo->prepare("
    INSERT INTO contact_requests (salon_name, owner_name, phone, city, employees, message)
    VALUES (?, ?, ?, ?, ?, ?)
");
$stmt->execute([$salon_name, $owner_name, $phone, $city, $employees, $message]);

sendSuccess(['id' => (int)$pdo->lastInsertId()], 200, 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً');
