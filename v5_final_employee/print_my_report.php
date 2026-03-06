<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../includes/functions.php';

// تحقق من تسجيل الدخول والصلاحيات
requireEmployee();

$empId = currentEmployeeId();

// جلب اسم الموظف
$stmtEmp = $pdo->prepare("SELECT name, commission_rate, salary_type FROM employees WHERE id = ?");
$stmtEmp->execute([$empId]);
$employee = $stmtEmp->fetch();
if (!$employee) {
    $employee = ['name' => 'غير مرتبط بموظف', 'commission_rate' => 0, 'salary_type' => 'fixed'];
}

$period = $_GET['period'] ?? 'daily';
$date = $_GET['date'] ?? date('Y-m-d');
$month = $_GET['month'] ?? date('Y-m');

switch ($period) {
    case 'daily':
        $from = $date . ' 00:00:00';
        $to = $date . ' 23:59:59';
        $label = 'يوم ' . date('d/m/Y', strtotime($date));
        break;
    case 'monthly':
    default:
        $from = $month . '-01 00:00:00';
        $to = date('Y-m-t', strtotime($month . '-01')) . ' 23:59:59';
        $label = date('F Y', strtotime($month . '-01'));
        break;
}

// معاملات الموظف فقط
$stmt = $pdo->prepare("
    SELECT t.*
    FROM transactions t
    WHERE t.employee_id = ? AND t.created_at BETWEEN ? AND ?
    ORDER BY t.created_at ASC
");
$stmt->execute([$empId, $from, $to]);
$transactions = $stmt->fetchAll();

$totalRevenue = 0.0;
foreach ($transactions as $tx) {
    $totalRevenue += (float) ($tx['total_amount'] ?? 0);
}
$totalTx = count($transactions);

// العمولة
$commission = 0.0;
if ($employee['salary_type'] === 'commission') {
    $commission = $totalRevenue * ((float) ($employee['commission_rate'] ?? 0) / 100);
}

// الخدمات الأكثر تقديماً
$stmt3 = $pdo->prepare("
    SELECT s.name, COUNT(*) as qty, SUM(td.price) as revenue
    FROM transaction_details td
    JOIN transactions t ON td.transaction_id = t.id
    JOIN services s ON td.service_id = s.id
    WHERE t.employee_id = ? AND t.created_at BETWEEN ? AND ?
    GROUP BY s.id ORDER BY qty DESC LIMIT 10
");
$stmt3->execute([$empId, $from, $to]);
$topServices = $stmt3->fetchAll();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>تقريري -
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
            background: #f5f0e8;
            color: #222;
            font-size: 13px;
            direction: rtl;
        }

        .no-print {
            background: #1a1a2e;
            padding: 14px 24px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .no-print select,
        .no-print input {
            background: #2a2a3e;
            border: 1px solid #c9a84c;
            color: #fff;
            padding: 6px 12px;
            border-radius: 6px;
            font-family: 'Tajawal', sans-serif;
            font-size: 13px;
        }

        .no-print button {
            background: #c9a84c;
            color: #111;
            border: none;
            padding: 8px 20px;
            border-radius: 6px;
            font-family: 'Tajawal', sans-serif;
            font-weight: 700;
            cursor: pointer;
        }

        .no-print button:hover {
            background: #e0bc6a;
        }

        .no-print a {
            color: #c9a84c;
            text-decoration: none;
            font-size: 13px;
        }

        .report {
            max-width: 800px;
            margin: 24px auto;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
        }

        .report-header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #fff;
            padding: 28px 32px;
            text-align: center;
            border-bottom: 3px solid #c9a84c;
        }

        .report-header h1 {
            font-size: 22px;
            color: #c9a84c;
            letter-spacing: 2px;
            margin-bottom: 4px;
        }

        .report-header h2 {
            font-size: 15px;
            color: #bbb;
            font-weight: 400;
            margin-bottom: 8px;
        }

        .report-header .emp-badge {
            display: inline-block;
            background: rgba(201, 168, 76, 0.15);
            border: 1px solid rgba(201, 168, 76, 0.4);
            border-radius: 20px;
            padding: 4px 16px;
            font-size: 13px;
            color: #c9a84c;
            margin-top: 6px;
        }

        .report-header .meta {
            font-size: 11px;
            color: #888;
            margin-top: 10px;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1px;
            background: #e0d4b8;
        }

        .summary-card {
            background: #fff;
            padding: 18px 16px;
            text-align: center;
        }

        .summary-card .val {
            font-size: 22px;
            font-weight: 800;
            color: #c9a84c;
        }

        .summary-card .val.blue {
            color: #3498db;
        }

        .summary-card .val.green {
            color: #27ae60;
        }

        .summary-card .lbl {
            font-size: 11px;
            color: #888;
            margin-top: 4px;
        }

        .section-title {
            background: #f0e8d0;
            color: #8b6914;
            font-weight: 700;
            font-size: 12px;
            padding: 8px 16px;
            border-right: 3px solid #c9a84c;
            margin: 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }

        th {
            background: #2d2d2d;
            color: #c9a84c;
            padding: 8px 12px;
            text-align: right;
            font-weight: 700;
            font-size: 11px;
        }

        td {
            padding: 7px 12px;
            border-bottom: 1px solid #f0e8d0;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover td {
            background: #fdf9f0;
        }

        .text-gold {
            color: #c9a84c;
            font-weight: 700;
        }

        .text-blue {
            color: #3498db;
            font-weight: 700;
        }

        .text-green {
            color: #27ae60;
            font-weight: 700;
        }

        tfoot td {
            font-weight: 700;
            background: #f9f3e3;
        }

        .report-footer {
            background: #f9f3e3;
            padding: 12px 24px;
            text-align: center;
            font-size: 11px;
            color: #aaa;
            border-top: 1px solid #e0d4b8;
        }

        @media print {
            .no-print {
                display: none !important;
            }

            body {
                background: #fff;
            }

            .report {
                margin: 0;
                box-shadow: none;
                border-radius: 0;
                max-width: 100%;
            }

            @page {
                margin: 1cm;
            }
        }
    </style>
</head>

<body>

    <!-- شريط التحكم -->
    <div class="no-print">
        <a href="<?= BASE_URL ?>/employee/dashboard.php"><i class="fas fa-arrow-right me-1"></i> العودة</a>
        <form method="GET" style="display:flex;gap:8px;align-items:center;margin-right:auto;">
            <select name="period" onchange="this.form.submit()">
                <option value="daily" <?= $period === 'daily' ? 'selected' : '' ?>>يومي</option>
                <option value="monthly" <?= $period === 'monthly' ? 'selected' : '' ?>>شهري</option>
            </select>
            <?php if ($period === 'daily'): ?>
                <input type="date" name="date" value="<?= $date ?>" onchange="this.form.submit()" />
            <?php else: ?>
                <input type="month" name="month" value="<?= $month ?>" onchange="this.form.submit()" />
            <?php endif; ?>
        </form>
        <button onclick="window.print()"><i class="fas fa-print"></i> طباعة</button>
    </div>

    <!-- التقرير -->
    <div class="report">
        <div class="report-header">
            <h1><i class="fas fa-cut"></i> AL SHAYEB SALON</h1>
            <h2>تقرير
                <?= $period === 'daily' ? 'يومي' : 'شهري' ?>:
                <?= $label ?>
            </h2>
            <div class="emp-badge">👤
                <?= clean($employee['name']) ?>
            </div>
            <div class="meta">تاريخ الطباعة:
                <?= date('Y/m/d h:i A') ?>
            </div>
        </div>

        <!-- الملخص -->
        <div class="summary">
            <div class="summary-card">
                <div class="val">
                    <?= $totalTx ?>
                </div>
                <div class="lbl">عدد العمليات</div>
            </div>
            <div class="summary-card">
                <div class="val">
                    <?= number_format($totalRevenue, 3) ?>
                </div>
                <div class="lbl">إجمالي الدخل (د.أ)</div>
            </div>
            <div class="summary-card">
                <div class="val green">
                    <?= number_format($commission, 3) ?>
                </div>
                <div class="lbl">
                    <?= $employee['salary_type'] === 'commission'
                        ? 'عمولتي (' . $employee['commission_rate'] . '%)'
                        : 'راتب ثابت' ?>
                </div>
            </div>
        </div>

        <!-- تفاصيل العمليات -->
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
                        <th>المبلغ (د.أ)</th>
                        <th>طريقة الدفع</th>
                        <th>الملاحظات</th>
                        <th>الوقت</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($transactions as $i => $tx): ?>
                        <tr>
                            <td style="color:#aaa;">
                                <?= $i + 1 ?>
                            </td>
                            <td class="text-gold">
                                <?= number_format($tx['total_amount'], 3) ?>
                            </td>
                            <td>
                                <?= ['cash' => '💵 نقد', 'transfer' => '🏦 تحويل'][$tx['payment_method']] ?? $tx['payment_method'] ?>
                            </td>
                            <td style="color:#888;">
                                <?= clean($tx['notes'] ?? '') ?>
                            </td>
                            <td style="color:#888;">
                                <?= date('h:i A', strtotime($tx['created_at'])) ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="1" style="text-align:right;">الإجمالي</td>
                        <td class="text-gold">
                            <?= number_format($totalRevenue, 3) ?>
                        </td>
                        <td colspan="3"></td>
                    </tr>
                </tfoot>
            </table>
        <?php endif; ?>

        <!-- أبرز الخدمات -->
        <?php if (!empty($topServices)): ?>
            <div class="section-title">✂️ الخدمات المقدمة</div>
            <table>
                <thead>
                    <tr>
                        <th>الخدمة</th>
                        <th>عدد مرات التقديم</th>
                        <th>الإيراد (د.أ)</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($topServices as $s): ?>
                        <tr>
                            <td style="font-weight:700;">
                                <?= clean($s['name']) ?>
                            </td>
                            <td>
                                <?= $s['qty'] ?>
                            </td>
                            <td class="text-gold">
                                <?= number_format($s['revenue'], 3) ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>

        <div class="report-footer">
            <p>AL SHAYEB SALON &nbsp;|&nbsp; تقرير
                <?= clean($employee['name']) ?> &nbsp;—&nbsp;
                <?= date('Y/m/d h:i A') ?>
            </p>
        </div>
    </div>

</body>

</html>