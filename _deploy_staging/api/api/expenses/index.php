<?php
/**
 * Expenses API (SaaS Multi-Tenant)
 * GET  /api/expenses        → المصاريف (فلتر بالشهر + salon_id)
 * POST /api/expenses        → إضافة مصروف (with salon_id)
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

[$user, $salonId, $salon] = resolveCurrentTenant();
if (!isSuperAdmin($user) && $user['role'] !== 'admin') {
    sendError('هذا الإجراء يتطلب صلاحية المدير', 403);
}

$method = getMethod();

// ===== GET: قائمة المصاريف =====
if ($method === 'GET') {
    $month = $_GET['month'] ?? date('Y-m');

    $stmt = $pdo->prepare("SELECT * FROM expenses WHERE salon_id = ? AND DATE_FORMAT(created_at,'%Y-%m') = ? ORDER BY created_at DESC");
    $stmt->execute([$salonId, $month]);
    $expenses = $stmt->fetchAll();

    $totalExpenses = 0.0;
    foreach ($expenses as $e) {
        $totalExpenses += (float) ($e['amount'] ?? 0);
    }

    $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as cnt FROM transactions WHERE salon_id = ? AND DATE_FORMAT(created_at,'%Y-%m')=?");
    $stmt->execute([$salonId, $month]);
    $incomeRow = $stmt->fetch();
    $totalIncome = (float) ($incomeRow['total'] ?? 0);

    $byType = [];
    foreach ($expenses as $e) {
        $type = $e['type'];
        if (!isset($byType[$type])) $byType[$type] = 0.0;
        $byType[$type] += (float) ($e['amount'] ?? 0);
    }

    $chartMonths = [];
    $chartIncome = [];
    $chartExpense = [];
    for ($i = 5; $i >= 0; $i--) {
        $m = date('Y-m', strtotime("-$i months", strtotime($month . '-01')));
        $chartMonths[] = date('M', strtotime($m . '-01'));

        $r = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) FROM transactions WHERE salon_id = ? AND DATE_FORMAT(created_at,'%Y-%m')=?");
        $r->execute([$salonId, $m]);
        $chartIncome[] = (float) ($r->fetchColumn() ?: 0);

        $r = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE salon_id = ? AND DATE_FORMAT(created_at,'%Y-%m')=?");
        $r->execute([$salonId, $m]);
        $chartExpense[] = (float) ($r->fetchColumn() ?: 0);
    }

    sendSuccess([
        'expenses' => $expenses,
        'summary' => [
            'total_income' => $totalIncome,
            'total_expenses' => $totalExpenses,
            'net_profit' => $totalIncome - $totalExpenses,
            'transactions_count' => (int) ($incomeRow['cnt'] ?? 0),
        ],
        'by_type' => $byType,
        'chart' => [
            'months' => $chartMonths,
            'income' => $chartIncome,
            'expenses' => $chartExpense,
        ],
    ]);
}

// ===== POST: إضافة مصروف =====
if ($method === 'POST') {
    $data = getRequestBody();

    $title = trim($data['title'] ?? '');
    $amount = (float) ($data['amount'] ?? 0);
    $type = $data['type'] ?? 'other';
    $notes = trim($data['notes'] ?? '');

    if (empty($title)) sendError('عنوان المصروف مطلوب');
    if ($amount <= 0) sendError('المبلغ يجب أن يكون أكبر من صفر');

    $stmt = $pdo->prepare("INSERT INTO expenses (salon_id, title, amount, type, notes) VALUES (?,?,?,?,?)");
    $stmt->execute([$salonId, $title, $amount, $type, $notes]);

    sendSuccess(['id' => (int) $pdo->lastInsertId()], 201, 'تم إضافة المصروف بنجاح');
}

sendError('Method not allowed', 405);
