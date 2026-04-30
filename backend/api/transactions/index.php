<?php
/**
 * Transactions API (SaaS Multi-Tenant)
 * GET  /api/transactions        → العمليات (مع فلترة + scoped by salon_id)
 * POST /api/transactions        → عملية جديدة (with salon_id)
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

[$currentUser, $salonId, $salon] = resolveCurrentTenant();
$method = getMethod();

// ===== GET: قائمة العمليات =====
if ($method === 'GET') {
    $date = $_GET['date'] ?? null;
    $month = $_GET['month'] ?? null;
    $employeeId = $_GET['employee_id'] ?? null;
    $limit = (int) ($_GET['limit'] ?? 50);

    $where = ["t.salon_id = ?"];
    $params = [$salonId];

    // فلتر حسب الدور
    if ($currentUser['role'] === 'employee') {
        $where[] = "t.employee_id = ?";
        $params[] = $currentUser['employee_id'];
    }

    if ($date) {
        $where[] = "DATE(t.created_at) = ?";
        $params[] = $date;
    }
    if ($month) {
        $where[] = "DATE_FORMAT(t.created_at,'%Y-%m') = ?";
        $params[] = $month;
    }
    if ($employeeId) {
        $where[] = "t.employee_id = ?";
        $params[] = (int) $employeeId;
    }

    $whereClause = 'WHERE ' . implode(' AND ', $where);

    $stmt = $pdo->prepare("
        SELECT t.*, COALESCE(e.name_ar, 'محذوف') as emp_name, e.name_en as emp_name_en
        FROM transactions t
        LEFT JOIN employees e ON t.employee_id = e.id
        $whereClause
        ORDER BY t.created_at DESC
        LIMIT $limit
    ");
    $stmt->execute($params);
    $transactions = $stmt->fetchAll();

    sendSuccess($transactions);
}

// ===== POST: عملية جديدة =====
if ($method === 'POST') {
    $data = getRequestBody();

    $serviceIds = $data['service_ids'] ?? [];
    $paymentMethod = $data['payment_method'] ?? 'cash';
    $notes = trim($data['notes'] ?? '');
    $employeeId = $currentUser['employee_id'];

    // الأدمن يمكنه تحديد الموظف
    if (in_array($currentUser['role'], ['admin', 'super_admin']) && !empty($data['employee_id'])) {
        $employeeId = (int) $data['employee_id'];
    }

    if (empty($employeeId)) {
        sendError('لا يوجد معرف موظف مرتبط بحسابك');
    }

    if (empty($serviceIds)) {
        sendError('يرجى اختيار خدمة واحدة على الأقل');
    }

    try {
        $placeholders = implode(',', array_fill(0, count($serviceIds), '?'));
        $stmt = $pdo->prepare("SELECT id, price FROM services WHERE id IN ($placeholders) AND salon_id = ? AND is_active=1");
        $stmt->execute(array_merge($serviceIds, [$salonId]));
        $selectedServices = $stmt->fetchAll();

        if (empty($selectedServices)) {
            sendError('الخدمات المختارة غير موجودة أو غير نشطة');
        }

        $total = array_sum(array_column($selectedServices, 'price'));

        // إدخال العملية
        $stmt = $pdo->prepare("INSERT INTO transactions (salon_id, employee_id, total_amount, payment_method, notes) VALUES (?,?,?,?,?)");
        $stmt->execute([$salonId, $employeeId, $total, $paymentMethod, $notes]);
        $txId = $pdo->lastInsertId();

        // إدخال تفاصيل العملية
        $stmt = $pdo->prepare("INSERT INTO transaction_details (transaction_id, service_id, price) VALUES (?,?,?)");
        foreach ($selectedServices as $svc) {
            $stmt->execute([$txId, $svc['id'], $svc['price']]);
        }

        sendSuccess([
            'id' => (int) $txId,
            'total' => (float) $total,
        ], 201, 'تم تسجيل الزبون بنجاح! المبلغ: ' . number_format($total, 3) . ' د.أ');

    } catch (PDOException $e) {
        sendError('خطأ في قاعدة البيانات: ' . $e->getMessage(), 500);
    }
}

sendError('Method not allowed', 405);
