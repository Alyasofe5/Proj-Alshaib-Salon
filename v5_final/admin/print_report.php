<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../includes/functions.php';
requireAdmin();

$period = $_GET['period'] ?? 'daily';
$date = $_GET['date'] ?? date('Y-m-d');
$week = $_GET['week'] ?? date('o-\WW');
$month = $_GET['month'] ?? date('Y-m');

// ===== حساب نطاق التاريخ =====
switch ($period) {
    case 'daily':
        $from = $date . ' 00:00:00';
        $to = $date . ' 23:59:59';
        $label = 'يوم ' . date('d/m/Y', strtotime($date));
        break;
    case 'weekly':
        $parts = explode('-W', $week);
        $y = isset($parts[0]) && is_numeric($parts[0]) ? (int) $parts[0] : (int) date('o');
        $w = isset($parts[1]) && is_numeric($parts[1]) ? (int) $parts[1] : (int) date('W');
        $fromDate = new DateTime();
        $fromDate->setISODate($y, $w, 1);
        $toDate = clone $fromDate;
        $toDate->modify('+6 days');
        $from = $fromDate->format('Y-m-d') . ' 00:00:00';
        $to = $toDate->format('Y-m-d') . ' 23:59:59';
        $label = 'أسبوع ' . $fromDate->format('d/m') . ' - ' . $toDate->format('d/m/Y');
        break;
    case 'monthly':
    default:
        $from = $month . '-01 00:00:00';
        $to = date('Y-m-t', strtotime($month . '-01')) . ' 23:59:59';
        $label = date('F Y', strtotime($month . '-01'));
        break;
}

// ===== جلب البيانات =====
// المعاملات
$stmt = $pdo->prepare("
    SELECT t.*, u.name as employee_name
    FROM transactions t
    LEFT JOIN employees u ON t.employee_id = u.id
    WHERE t.created_at BETWEEN ? AND ?
    ORDER BY t.created_at ASC
");
$stmt->execute([$from, $to]);
$transactions = $stmt->fetchAll();

$totalRevenue = 0.0;
foreach ($transactions as $tx) {
    $totalRevenue += (float) ($tx['total_amount'] ?? 0);
}
$totalTx = count($transactions);

// المصاريف
$stmt2 = $pdo->prepare("SELECT * FROM expenses WHERE created_at BETWEEN ? AND ? ORDER BY created_at ASC");
$stmt2->execute([$from, $to]);
$expenses = $stmt2->fetchAll();
$totalExpenses = 0.0;
foreach ($expenses as $e) {
    $totalExpenses += (float) ($e['amount'] ?? 0);
}
$netProfit = $totalRevenue - $totalExpenses;
$isProfit = $netProfit >= 0;

// أكثر الخدمات مبيعاً
$stmt3 = $pdo->prepare("
    SELECT s.name, COUNT(*) as qty, SUM(td.price) as revenue
    FROM transaction_details td
    JOIN transactions t ON td.transaction_id = t.id
    JOIN services s ON td.service_id = s.id
    WHERE t.created_at BETWEEN ? AND ?
    GROUP BY s.id ORDER BY revenue DESC LIMIT 10
");
$stmt3->execute([$from, $to]);
$topServices = $stmt3->fetchAll();

// إحصائيات الموظفين
$stmt4 = $pdo->prepare("
    SELECT u.name, COUNT(*) as cnt, SUM(t.total_amount) as revenue
    FROM transactions t LEFT JOIN employees u ON t.employee_id = u.id
    WHERE t.created_at BETWEEN ? AND ?
    GROUP BY t.employee_id ORDER BY revenue DESC
");
$stmt4->execute([$from, $to]);
$empStats = $stmt4->fetchAll();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>تقرير
        <?= $label ?> - AL SHAYEB
    </title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet" />
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Tajawal', sans-serif;
            background: #fff;
            color: #111;
            font-size: 13px;
        }

        /* ===== شريط التحكم (لا يُطبع) ===== */
        .no-print {
            background: #1a1a1a;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .no-print select,
        .no-print input {
            border: 1px solid #444;
            background: #2a2a2a;
            color: #ddd;
            padding: 6px 10px;
            border-radius: 6px;
            font-family: 'Tajawal', sans-serif;
        }

        .btn-print {
            background: #c9a84c;
            color: #000;
            border: none;
            padding: 8px 20px;
            border-radius: 6px;
            font-family: 'Tajawal', sans-serif;
            font-weight: 700;
            cursor: pointer;
        }

        .btn-print:hover {
            background: #e6c060;
        }

        .btn-back {
            background: transparent;
            border: 1px solid #555;
            color: #aaa;
            padding: 8px 16px;
            border-radius: 6px;
            font-family: 'Tajawal', sans-serif;
            cursor: pointer;
            text-decoration: none;
        }

        /* ===== التقرير ===== */
        .report {
            max-width: 850px;
            margin: 0 auto;
            padding: 24px;
        }

        /* رأس التقرير */
        .report-header {
            text-align: center;
            border-bottom: 3px solid #c9a84c;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }

        .report-header h1 {
            font-size: 22px;
            font-weight: 800;
            color: #c9a84c;
        }

        .report-header h2 {
            font-size: 15px;
            font-weight: 700;
            color: #333;
            margin-top: 4px;
        }

        .report-header p {
            font-size: 12px;
            color: #777;
            margin-top: 4px;
        }

        /* بطاقات الملخص */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }

        .summary-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        }

        .summary-card.gold {
            border-color: #c9a84c;
            background: #fffbf0;
        }

        .summary-card.green {
            border-color: #27ae60;
            background: #f0fdf4;
        }

        .summary-card.red {
            border-color: #e74c3c;
            background: #fff5f5;
        }

        .summary-card .val {
            font-size: 20px;
            font-weight: 800;
            color: #111;
        }

        .summary-card .lbl {
            font-size: 11px;
            color: #777;
            margin-top: 4px;
        }

        /* الربح/الخسارة */
        .profit-bar {
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
        }

        .profit-bar.profit {
            background: #f0fdf4;
            border: 1px solid #27ae60;
            color: #1a7a42;
        }

        .profit-bar.loss {
            background: #fff5f5;
            border: 1px solid #e74c3c;
            color: #c0392b;
        }

        /* عناوين الأقسام */
        .section-title {
            font-size: 14px;
            font-weight: 800;
            color: #c9a84c;
            border-bottom: 2px solid #c9a84c;
            padding-bottom: 6px;
            margin: 20px 0 12px;
        }

        /* الجداول */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        thead th {
            background: #c9a84c;
            color: #000;
            padding: 8px;
            font-size: 12px;
            text-align: right;
        }

        tbody td {
            padding: 7px 8px;
            border-bottom: 1px solid #eee;
            font-size: 12px;
        }

        tbody tr:nth-child(even) {
            background: #fafafa;
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        .text-red {
            color: #e74c3c;
            font-weight: 700;
        }

        .text-green {
            color: #27ae60;
            font-weight: 700;
        }

        .text-gold {
            color: #b8860b;
            font-weight: 700;
        }

        /* تذييل التقرير */
        .report-footer {
            text-align: center;
            margin-top: 24px;
            padding-top: 14px;
            border-top: 1px solid #eee;
            font-size: 11px;
            color: #aaa;
        }

        @media print {
            .no-print {
                display: none !important;
            }

            body {
                font-size: 12px;
            }

            .report {
                padding: 10px;
            }

            .summary-card .val {
                font-size: 16px;
            }
        }

        @media (max-width: 600px) {
            .summary-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>

<body>

    <!-- شريط التحكم -->
    <div class="no-print">
        <a href="reports.php" class="btn-back">← العودة</a>

        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <select onchange="changePeriod(this.value)" id="periodSel">
                <option value="daily" <?= $period === 'daily' ? 'selected' : '' ?>>يومي</option>
                <option value="weekly" <?= $period === 'weekly' ? 'selected' : '' ?>>أسبوعي</option>
                <option value="monthly" <?= $period === 'monthly' ? 'selected' : '' ?>>شهري</option>
            </select>
            <input type="date" id="dateInput" value="<?= $date ?>"
                style="<?= $period === 'daily' ? '' : 'display:none' ?>" />
            <input type="week" id="weekInput" value="<?= $week ?>"
                style="<?= $period === 'weekly' ? '' : 'display:none' ?>" />
            <input type="month" id="monthInput" value="<?= $month ?>"
                style="<?= $period === 'monthly' ? '' : 'display:none' ?>" />
            <button onclick="loadReport()" class="btn-print" style="background:#444;color:#ddd;">عرض</button>
        </div>

        <button onclick="window.print()" class="btn-print">
            🖨️ طباعة
        </button>
    </div>

    <!-- التقرير -->
    <div class="report">
        <div class="report-header">
            <h1><i class="fas fa-cut"></i> AL SHAYEB</h1>
            <h2>تقرير
                <?= $period === 'daily' ? 'يومي' : ($period === 'weekly' ? 'أسبوعي' : 'شهري') ?>:
                <?= $label ?>
            </h2>
            <p>تاريخ الإصدار:
                <?= date('Y/m/d h:i A') ?> &nbsp;|&nbsp; النظام: Salon Management System
            </p>
        </div>

        <!-- ملخص إحصائي -->
        <div class="summary-grid">
            <div class="summary-card gold">
                <div class="val">
                    <?= number_format($totalRevenue, 3) ?>
                </div>
                <div class="lbl">إجمالي الدخل (د.أ)</div>
            </div>
            <div class="summary-card red">
                <div class="val">
                    <?= number_format($totalExpenses, 3) ?>
                </div>
                <div class="lbl">إجمالي المصاريف (د.أ)</div>
            </div>
            <div class="summary-card <?= $isProfit ? 'green' : 'red' ?>">
                <div class="val" style="color:<?= $isProfit ? '#27ae60' : '#e74c3c' ?>">
                    <?= number_format(abs($netProfit), 3) ?>
                </div>
                <div class="lbl">صافي
                    <?= $isProfit ? 'الربح' : 'الخسارة' ?> (د.أ)
                </div>
            </div>
            <div class="summary-card">
                <div class="val">
                    <?= $totalTx ?>
                </div>
                <div class="lbl">عدد العمليات</div>
            </div>
        </div>

        <!-- شريط الربح/الخسارة -->
        <div class="profit-bar <?= $isProfit ? 'profit' : 'loss' ?>">
            <span>
                <?= $isProfit ? '✅ الوضع المالي: أنت في ربح' : '❌ الوضع المالي: أنت في خسارة' ?>
            </span>
            <span>
                <?= number_format(abs($netProfit), 3) ?> د.أ
            </span>
        </div>

        <!-- ===== تفاصيل العمليات ===== -->
        <div class="section-title">📋 تفاصيل العمليات (
            <?= $totalTx ?>)
        </div>
        <?php if (empty($transactions)): ?>
            <p style="color:#aaa;text-align:center;padding:20px;">لا توجد عمليات في هذه الفترة</p>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>الموظف</th>
                        <th>المبلغ</th>
                        <th>طريقة الدفع</th>
                        <th>الملاحظات</th>
                        <th>التاريخ</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($transactions as $i => $tx): ?>
                        <tr>
                            <td style="color:#aaa;"><?= $i + 1 ?></td>
                            <td><?= clean($tx['employee_name'] ?? '-') ?></td>
                            <td class="text-gold"><?= formatAmount($tx['total_amount']) ?></td>
                            <td><?= ['cash' => '💵 نقد', 'transfer' => '🏦 تحويل'][$tx['payment_method']] ?? $tx['payment_method'] ?>
                            </td>
                            <td style="color:#888;font-size:11px;"><?= clean($tx['notes'] ?? '') ?></td>
                            <td style="color:#888;"><?= formatDateTime($tx['created_at']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
                <tfoot>
                    <tr style="background:#fffbf0;font-weight:700;">
                        <td colspan="2" style="padding:8px;text-align:left;">الإجمالي</td>
                        <td class="text-gold"><?= formatAmount($totalRevenue) ?></td>
                        <td colspan="3"></td>
                    </tr>
                </tfoot>
            </table>
        <?php endif; ?>

        <!-- ===== المصاريف ===== -->
        <div class="section-title">💸 المصاريف (
            <?= count($expenses) ?>)
        </div>
        <?php if (empty($expenses)): ?>
            <p style="color:#aaa;text-align:center;padding:20px;">لا توجد مصاريف في هذه الفترة</p>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>العنوان</th>
                        <th>النوع</th>
                        <th>المبلغ</th>
                        <th>التاريخ</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($expenses as $i => $e): ?>
                        <tr>
                            <td style="color:#aaa;">
                                <?= $i + 1 ?>
                            </td>
                            <td>
                                <?= clean($e['title']) ?>
                            </td>
                            <td>
                                <?= expenseTypeLabel($e['type']) ?>
                            </td>
                            <td class="text-red">
                                <?= formatAmount($e['amount']) ?>
                            </td>
                            <td style="color:#888;">
                                <?= formatDate($e['created_at']) ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
                <tfoot>
                    <tr style="background:#fff5f5;font-weight:700;">
                        <td colspan="3" style="padding:8px;text-align:left;">الإجمالي</td>
                        <td class="text-red">
                            <?= formatAmount($totalExpenses) ?>
                        </td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        <?php endif; ?>

        <!-- ===== أداء الموظفين ===== -->
        <?php if (!empty($empStats)): ?>
            <div class="section-title">👷 أداء الموظفين</div>
            <table>
                <thead>
                    <tr>
                        <th>الموظف</th>
                        <th>عدد العمليات</th>
                        <th>الدخل</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($empStats as $e): ?>
                        <tr>
                            <td style="font-weight:700;"><?= clean($e['name'] ?? 'غير محدد') ?></td>
                            <td><?= $e['cnt'] ?></td>
                            <td class="text-gold"><?= formatAmount($e['revenue']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>

        <!-- ===== أكثر الخدمات مبيعاً ===== -->
        <?php if (!empty($topServices)): ?>
            <div class="section-title">🔝 أكثر الخدمات مبيعاً</div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>الخدمة</th>
                        <th>عدد المرات</th>
                        <th>الإيراد</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($topServices as $i => $s): ?>
                        <tr>
                            <td style="color:#aaa;">
                                <?= $i + 1 ?>
                            </td>
                            <td>
                                <?= clean($s['name']) ?>
                            </td>
                            <td>
                                <?= $s['qty'] ?>
                            </td>
                            <td class="text-gold">
                                <?= formatAmount($s['revenue']) ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>

        <!-- تذييل -->
        <div class="report-footer">
            <p>AL SHAYEB Management System &nbsp;|&nbsp; تقرير آلي —
                <?= date('Y/m/d h:i A') ?>
            </p>
        </div>
    </div>

    <script>
        function changePeriod(v) {
            document.getElementById('dateInput').style.display = v === 'daily' ? '' : 'none';
            document.getElementById('weekInput').style.display = v === 'weekly' ? '' : 'none';
            document.getElementById('monthInput').style.display = v === 'monthly' ? '' : 'none';
        }
        function loadReport() {
            const p = document.getElementById('periodSel').value;
            let extra = '';
            if (p === 'daily') extra = '&date=' + document.getElementById('dateInput').value;
            if (p === 'weekly') extra = '&week=' + document.getElementById('weekInput').value;
            if (p === 'monthly') extra = '&month=' + document.getElementById('monthInput').value;
            window.location = 'print_report.php?period=' + p + extra;
        }
    </script>
</body>

</html>