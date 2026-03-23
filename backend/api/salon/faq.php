<?php
/**
 * FAQ Management API — stored as JSON inside salons.settings
 * GET    /api/salon/faq.php            → Get all FAQs
 * POST   /api/salon/faq.php            → Add FAQ
 * PUT    /api/salon/faq.php?id={n}     → Update FAQ
 * DELETE /api/salon/faq.php?id={n}     → Remove FAQ
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/response.php';

$user    = requireAdmin();
$salonId = $user['salon_id'];

function getFaqs(PDO $pdo, int $salonId): array {
    $stmt = $pdo->prepare("SELECT settings FROM salons WHERE id = ?");
    $stmt->execute([$salonId]);
    $row  = $stmt->fetch();
    $meta = $row && $row['settings'] ? json_decode($row['settings'], true) : [];
    return $meta['faqs'] ?? [];
}

function saveFaqs(PDO $pdo, int $salonId, array $faqs): void {
    $stmt = $pdo->prepare("SELECT settings FROM salons WHERE id = ?");
    $stmt->execute([$salonId]);
    $row  = $stmt->fetch();
    $meta = $row && $row['settings'] ? json_decode($row['settings'], true) : [];
    $meta['faqs'] = array_values($faqs); // re-index
    $pdo->prepare("UPDATE salons SET settings = ? WHERE id = ?")
        ->execute([json_encode($meta, JSON_UNESCAPED_UNICODE), $salonId]);
}

$method = getMethod();

// ── GET ──
if ($method === 'GET') {
    sendSuccess(getFaqs($pdo, $salonId));
}

// ── POST (add) ──
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $q = trim($data['question'] ?? '');
    $a = trim($data['answer']   ?? '');
    if (empty($q) || empty($a)) sendError('السؤال والجواب مطلوبان');

    $faqs   = getFaqs($pdo, $salonId);
    $faqs[] = [
        'id'       => uniqid('faq_'),
        'question' => $q,
        'answer'   => $a,
        'order'    => count($faqs),
    ];
    saveFaqs($pdo, $salonId, $faqs);
    sendSuccess($faqs, 201, 'تمت إضافة السؤال');
}

// ── PUT (update) ──
if ($method === 'PUT') {
    $faqId = $_GET['id'] ?? '';
    if (!$faqId) sendError('معرّف السؤال مطلوب');

    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $q = trim($data['question'] ?? '');
    $a = trim($data['answer']   ?? '');
    if (empty($q) || empty($a)) sendError('السؤال والجواب مطلوبان');

    $faqs = getFaqs($pdo, $salonId);
    $found = false;
    foreach ($faqs as &$faq) {
        if ($faq['id'] === $faqId) {
            $faq['question'] = $q;
            $faq['answer']   = $a;
            $found = true;
            break;
        }
    }
    unset($faq);
    if (!$found) sendError('السؤال غير موجود', 404);

    saveFaqs($pdo, $salonId, $faqs);
    sendSuccess($faqs, 200, 'تم تحديث السؤال');
}

// ── DELETE ──
if ($method === 'DELETE') {
    $faqId = $_GET['id'] ?? '';
    if (!$faqId) sendError('معرّف السؤال مطلوب');

    $faqs = getFaqs($pdo, $salonId);
    $faqs = array_filter($faqs, fn($f) => $f['id'] !== $faqId);
    saveFaqs($pdo, $salonId, array_values($faqs));
    sendSuccess(array_values($faqs), 200, 'تم حذف السؤال');
}

sendError('Method not allowed', 405);
