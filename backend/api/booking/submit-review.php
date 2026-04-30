<?php
/**
 * Customer Review Submission API
 * POST /api/booking/submit-review.php
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

if (getMethod() !== 'POST') sendError('Method not allowed', 405);

$slug = $_POST['slug'] ?? '';
$customerName = trim($_POST['customer_name'] ?? '');
$comment = trim($_POST['comment'] ?? '');

if (empty($slug)) sendError('Slug is required', 400);
if (empty($customerName)) sendError('Customer name is required', 400);
if (empty($comment)) sendError('Comment is required', 400);

// Fetch salon by slug
$stmt = $pdo->prepare("SELECT id, settings FROM salons WHERE slug = ?");
$stmt->execute([strtolower(trim($slug))]);
$salon = $stmt->fetch();

if (!$salon) sendError('Salon not found', 404);

$salonId = $salon['id'];
$settings = !empty($salon['settings']) ? json_decode($salon['settings'], true) : [];
$reviews = $settings['reviews'] ?? [];

$photoPath = null;
if (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['image'];
    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    $detectedMime = $file['type'] ?? '';
    
    if (in_array($detectedMime, $allowed, true)) {
        $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
        if (empty($docRoot)) $docRoot = realpath(__DIR__ . '/../../..');
        
        $uploadDir = rtrim($docRoot, '/\\') . '/uploads/reviews/';
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0755, true);
        }
        
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg');
        $filename = 'review_customer_' . $salonId . '_' . time() . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
        $filepath = $uploadDir . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            $photoPath = 'uploads/reviews/' . $filename;
        }
    }
}

// Create new review object
$newReview = [
    'customer_name' => $customerName . ' || ' . $customerName, // Set same for both AR and EN
    'role' => 'عميل الصالون || Salon Client',
    'rating' => 5, // Default rating 5
    'comment' => $comment . ' || ' . $comment,
    'photo' => $photoPath,
    'is_shown' => false, // Requires admin approval
    'created_at' => date('Y-m-d H:i:s')
];

$reviews[] = $newReview;
$settings['reviews'] = $reviews;

$settingsJson = json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

$updateStmt = $pdo->prepare("UPDATE salons SET settings = ? WHERE id = ?");
$updateStmt->execute([$settingsJson, $salonId]);

sendSuccess(['message' => 'Review submitted successfully pending approval.']);
