<?php
/**
 * SuperAdmin: Platform Revenues Management
 * GET    /api/superadmin/revenues.php         - list revenues (+ monthly total)
 * POST   /api/superadmin/revenues.php         - add a revenue entry
 * DELETE /api/superadmin/revenues.php?id=X   - delete a revenue entry
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();
if ($user['role'] !== 'super_admin') sendError('غير مصرح', 403);

// Create table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS platform_revenues (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    salon_id    INT NULL,
    salon_name  VARCHAR(255) NOT NULL DEFAULT '',
    amount      DECIMAL(10,3) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    payment_date DATE NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$method = getMethod();

// ── GET: list revenues ──────────────────────────────────────────────────
if ($method === 'GET') {
    // Monthly total (current month)
    $monthTotal = (float) $pdo
        ->query("SELECT COALESCE(SUM(amount),0) FROM platform_revenues WHERE DATE_FORMAT(payment_date,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m')")
        ->fetchColumn();

    // All revenues ordered by date desc
    $revenues = $pdo
        ->query("SELECT * FROM platform_revenues ORDER BY payment_date DESC, id DESC LIMIT 200")
        ->fetchAll();

    // Yearly chart (last 6 months)
    $chart = [];
    for ($i = 5; $i >= 0; $i--) {
        $month = date('Y-m', strtotime("-$i months"));
        $label = date('m/Y', strtotime("-$i months"));
        $stmt  = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM platform_revenues WHERE DATE_FORMAT(payment_date,'%Y-%m') = ?");
        $stmt->execute([$month]);
        $chart[] = ['month' => $label, 'revenue' => (float) $stmt->fetchColumn()];
    }

    sendSuccess([
        'revenues'    => $revenues,
        'month_total' => $monthTotal,
        'chart'       => $chart,
    ]);
}

// ── POST: add revenue ───────────────────────────────────────────────────
if ($method === 'POST') {
    $body       = json_decode(file_get_contents('php://input'), true) ?? [];
    $salon_id   = $body['salon_id']   ? (int)$body['salon_id']               : null;
    $salon_name = trim($body['salon_name']   ?? '');
    $amount     = (float)($body['amount']    ?? 0);
    $desc       = trim($body['description'] ?? '');
    $date       = trim($body['payment_date'] ?? date('Y-m-d'));

    if ($amount <= 0) sendError('المبلغ يجب أن يكون أكبر من الصفر', 422);
    if (!$salon_name && !$salon_id) sendError('يرجى تحديد الصالون', 422);
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) sendError('تاريخ غير صحيح', 422);
    if (mb_strlen($desc) > 500) sendError('الوصف طويل جداً', 422);

    // Resolve salon_name from salon_id if provided
    if ($salon_id && !$salon_name) {
        $s = $pdo->prepare("SELECT COALESCE(name_ar, name) as name FROM salons WHERE id = ?");
        $s->execute([$salon_id]);
        $salon_name = $s->fetchColumn() ?: '';
    }

    $stmt = $pdo->prepare("INSERT INTO platform_revenues (salon_id, salon_name, amount, description, payment_date) VALUES (?,?,?,?,?)");
    $stmt->execute([$salon_id, $salon_name, $amount, $desc, $date]);

    sendSuccess(['id' => (int)$pdo->lastInsertId()], 200, 'تم تسجيل الإيراد بنجاح');
}

// ── DELETE: remove revenue ──────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('يرجى تحديد السجل', 400);
    $pdo->prepare("DELETE FROM platform_revenues WHERE id = ?")->execute([$id]);
    sendSuccess(null, 200, 'تم الحذف');
}

sendError('Method not allowed', 405);
