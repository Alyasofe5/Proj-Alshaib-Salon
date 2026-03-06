<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../includes/functions.php';
requireAdmin();

$pageTitle = 'التقارير - AL SHAYEB';

$period = $_GET['period'] ?? 'daily';
$date = $_GET['date'] ?? date('Y-m-d');
$month = $_GET['month'] ?? date('Y-m');
$year = $_GET['year'] ?? date('Y');

// ===== Daily Report =====
if ($period === 'daily') {
    $stmt = $pdo->prepare("
        SELECT t.*, e.name as emp_name, e.commission_rate, e.salary_type
        FROM transactions t JOIN employees e ON t.employee_id = e.id
        WHERE DATE(t.created_at) = ? ORDER BY t.created_at DESC
    ");
    $stmt->execute([$date]);
    $transactions = $stmt->fetchAll();

    $stmt = $pdo->prepare("
        SELECT e.id, e.name, e.commission_rate, e.salary_type,
               COUNT(t.id) as cnt, COALESCE(SUM(t.total_amount),0) as total
        FROM employees e
        LEFT JOIN transactions t ON e.id = t.employee_id AND DATE(t.created_at) = ?
        WHERE e.is_active = 1 GROUP BY e.id
    ");
    $stmt->execute([$date]);
    $empStats = $stmt->fetchAll();

    $totalDay = 0.0;
    foreach ($transactions as $tx) {
        $totalDay += (float) ($tx['total_amount'] ?? 0);
    }
    $totalCustomers = count($transactions);
}

// ===== Monthly Report =====
if ($period === 'monthly') {
    $stmt = $pdo->prepare("
        SELECT e.id, e.name, e.commission_rate, e.salary_type,
               COUNT(t.id) as cnt, COALESCE(SUM(t.total_amount),0) as total
        FROM employees e
        LEFT JOIN transactions t ON e.id = t.employee_id AND DATE_FORMAT(t.created_at,'%Y-%m') = ?
        WHERE e.is_active = 1 GROUP BY e.id ORDER BY total DESC
    ");
    $stmt->execute([$month]);
    $empStats = $stmt->fetchAll();

    $totalSales = 0.0;
    $totalCustomers = 0;
    foreach ($empStats as $s) {
        $totalSales += (float) ($s['total'] ?? 0);
        $totalCustomers += (int) ($s['cnt'] ?? 0);
    }

    $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE DATE_FORMAT(created_at,'%Y-%m')=?");
    $stmt->execute([$month]);
    $totalExpenses = (float) ($stmt->fetchColumn() ?: 0);
    $netProfit = (float) ($totalSales - $totalExpenses);

    // Daily breakdown for chart
    $chartLabels = [];
    $chartData = [];
    $daysInMonth = (int) date('t', strtotime($month . '-01'));
    for ($d = 1; $d <= $daysInMonth; $d++) {
        $chartLabels[] = $d;
        $fullDate = $month . '-' . str_pad($d, 2, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) FROM transactions WHERE DATE(created_at)=?");
        $stmt->execute([$fullDate]);
        $chartData[] = (float) ($stmt->fetchColumn() ?: 0);
    }
}

// ===== Yearly Report =====
if ($period === 'yearly') {
    $monthlyData = [];
    for ($m = 1; $m <= 12; $m++) {
        $ym = $year . '-' . str_pad($m, 2, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total FROM transactions WHERE DATE_FORMAT(created_at,'%Y-%m')=?");
        $stmt->execute([$ym]);
        $row = $stmt->fetch();
        $stmt2 = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE DATE_FORMAT(created_at,'%Y-%m')=?");
        $stmt2->execute([$ym]);
        $exp = (float) ($stmt2->fetchColumn() ?: 0);
        $mTotal = (float) ($row['total'] ?? 0);
        $mCnt = (int) ($row['cnt'] ?? 0);
        $monthlyData[] = ['month' => $m, 'cnt' => $mCnt, 'total' => $mTotal, 'expenses' => $exp, 'net' => (float) ($mTotal - $exp)];
    }
    $yearTotal = 0.0;
    $yearExpenses = 0.0;
    $yearCustomers = 0;
    foreach ($monthlyData as $md) {
        $yearTotal += (float) ($md['total'] ?? 0);
        $yearExpenses += (float) ($md['expenses'] ?? 0);
        $yearCustomers += (int) ($md['cnt'] ?? 0);
    }
    $yearNet = (float) ($yearTotal - $yearExpenses);
    $monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
}

require_once __DIR__ . '/../includes/header.php';
?>
</head>

<body>
    <?php require_once __DIR__ . '/../includes/sidebar_admin.php'; ?>
    <div class="main-content">
        <div class="topbar">
            <div class="topbar-title">📊 <span>التقارير الشاملة</span></div>
            <div class="d-flex gap-2">
                <a href="?period=daily&date=<?= $date ?>"
                    class="btn btn-sm <?= $period === 'daily' ? 'btn-gold' : 'btn-outline-gold' ?>">يومي</a>
                <a href="?period=monthly&month=<?= $month ?>"
                    class="btn btn-sm <?= $period === 'monthly' ? 'btn-gold' : 'btn-outline-gold' ?>">شهري</a>
                <a href="?period=yearly&year=<?= $year ?>"
                    class="btn btn-sm <?= $period === 'yearly' ? 'btn-gold' : 'btn-outline-gold' ?>">سنوي</a>
            </div>
        </div>
        <div class="content-area">

            <?php if ($period === 'daily'): ?>
                <!-- Date Picker -->
                <div class="mb-4 d-flex align-items-center gap-3">
                    <label style="color:#aaa;">اختر التاريخ:</label>
                    <input type="date" class="form-control" style="width:200px;" value="<?= $date ?>"
                        onchange="window.location='?period=daily&date='+this.value" />
                </div>
                <div class="row g-3 mb-4">
                    <div class="col-md-4">
                        <div class="stat-card gold">
                            <div class="stat-icon gold"><i class="fas fa-users"></i></div>
                            <div class="stat-value">
                                <?= $totalCustomers ?>
                            </div>
                            <div class="stat-label">زبائن اليوم</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-card green">
                            <div class="stat-icon green"><i class="fas fa-coins"></i></div>
                            <div class="stat-value">
                                <?= number_format($totalDay, 3) ?>
                            </div>
                            <div class="stat-label">دخل اليوم (د.أ)</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-card blue">
                            <div class="stat-icon blue"><i class="fas fa-users-cog"></i></div>
                            <div class="stat-value">
                                <?= count($empStats) ?>
                            </div>
                            <div class="stat-label">موظفون عملوا</div>
                        </div>
                    </div>
                </div>

                <div class="row g-3">
                    <div class="col-md-5">
                        <div class="custom-table">
                            <div style="padding:14px 18px;border-bottom:1px solid rgba(201,168,76,0.1);"><span
                                    style="color:#ddd;font-weight:700;">أداء الموظفين</span></div>
                            <table class="table table-borderless mb-0">
                                <thead>
                                    <tr>
                                        <th>الموظف</th>
                                        <th>الزبائن</th>
                                        <th>المبيعات</th>
                                        <th>العمولة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($empStats as $e): ?>
                                        <tr>
                                            <td>
                                                <?= clean($e['name']) ?>
                                            </td>
                                            <td><span class="badge badge-blue rounded-pill">
                                                    <?= $e['cnt'] ?>
                                                </span></td>
                                            <td style="color:var(--gold);">
                                                <?= formatAmount($e['total']) ?>
                                            </td>
                                            <td style="color:#2ecc71;">
                                                <?= $e['salary_type'] === 'commission' ? formatAmount(calcCommission($e['total'], $e['commission_rate'])) : '<span style="color:#888">ثابت</span>' ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="col-md-7">
                        <div class="custom-table">
                            <div style="padding:14px 18px;border-bottom:1px solid rgba(201,168,76,0.1);"><span
                                    style="color:#ddd;font-weight:700;">تفاصيل العمليات</span></div>
                            <table class="table table-borderless mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>الموظف</th>
                                        <th>المبلغ</th>
                                        <th>الدفع</th>
                                        <th>الوقت</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($transactions as $tx): ?>
                                        <tr>
                                            <td style="color:#555;">#
                                                <?= $tx['id'] ?>
                                            </td>
                                            <td>
                                                <?= clean($tx['emp_name']) ?>
                                            </td>
                                            <td style="color:var(--gold);font-weight:700;">
                                                <?= formatAmount($tx['total_amount']) ?>
                                            </td>
                                            <td><span class="badge badge-green rounded-pill">
                                                    <?= paymentMethodLabel($tx['payment_method']) ?>
                                                </span></td>
                                            <td style="color:#555;font-size:12px;">
                                                <?= date('H:i', strtotime($tx['created_at'])) ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                    <?php if (empty($transactions)): ?>
                                        <tr>
                                            <td colspan="5" class="text-center" style="color:#555;padding:20px;">لا توجد عمليات
                                            </td>
                                        </tr>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            <?php elseif ($period === 'monthly'): ?>
                <div class="mb-4 d-flex align-items-center gap-3">
                    <label style="color:#aaa;">اختر الشهر:</label>
                    <input type="month" class="form-control" style="width:200px;" value="<?= $month ?>"
                        onchange="window.location='?period=monthly&month='+this.value" />
                </div>
                <div class="row g-3 mb-4">
                    <div class="col-md-3">
                        <div class="stat-card blue">
                            <div class="stat-icon blue"><i class="fas fa-users"></i></div>
                            <div class="stat-value">
                                <?= $totalCustomers ?>
                            </div>
                            <div class="stat-label">إجمالي الزبائن</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card gold">
                            <div class="stat-icon gold"><i class="fas fa-coins"></i></div>
                            <div class="stat-value">
                                <?= number_format($totalSales, 3) ?>
                            </div>
                            <div class="stat-label">إجمالي المبيعات</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card red">
                            <div class="stat-icon red"><i class="fas fa-file-invoice"></i></div>
                            <div class="stat-value">
                                <?= number_format($totalExpenses, 3) ?>
                            </div>
                            <div class="stat-label">إجمالي المصاريف</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card <?= $netProfit >= 0 ? 'green' : 'red' ?>">
                            <div class="stat-icon <?= $netProfit >= 0 ? 'green' : 'red' ?>"><i
                                    class="fas fa-hand-holding-usd"></i></div>
                            <div class="stat-value">
                                <?= number_format(abs($netProfit), 3) ?>
                            </div>
                            <div class="stat-label">صافي الربح</div>
                        </div>
                    </div>
                </div>
                <div class="row g-3">
                    <div class="col-md-8">
                        <div class="chart-card">
                            <div class="chart-card-title">📈 المبيعات اليومية</div><canvas id="monthChart"
                                height="100"></canvas>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="custom-table">
                            <div style="padding:14px 18px;border-bottom:1px solid rgba(201,168,76,0.1);"><span
                                    style="color:#ddd;font-weight:700;">أداء الموظفين</span></div>
                            <table class="table table-borderless mb-0">
                                <thead>
                                    <tr>
                                        <th>الموظف</th>
                                        <th>المبيعات</th>
                                        <th>العمولة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($empStats as $e): ?>
                                        <tr>
                                            <td>
                                                <?= clean($e['name']) ?>
                                            </td>
                                            <td style="color:var(--gold);">
                                                <?= formatAmount($e['total']) ?>
                                            </td>
                                            <td style="color:#2ecc71;">
                                                <?= $e['salary_type'] === 'commission' ? formatAmount(calcCommission($e['total'], $e['commission_rate'])) : '<span style="color:#888">ثابت</span>' ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            <?php elseif ($period === 'yearly'): ?>
                <div class="mb-4 d-flex align-items-center gap-3">
                    <label style="color:#aaa;">اختر السنة:</label>
                    <select class="form-select" style="width:120px;"
                        onchange="window.location='?period=yearly&year='+this.value">
                        <?php for ($y = date('Y'); $y >= date('Y') - 5; $y--): ?>
                            <option value="<?= $y ?>" <?= $y == $year ? 'selected' : '' ?>>
                                <?= $y ?>
                            </option>
                        <?php endfor; ?>
                    </select>
                </div>
                <div class="row g-3 mb-4">
                    <div class="col-md-3">
                        <div class="stat-card blue">
                            <div class="stat-icon blue"><i class="fas fa-users"></i></div>
                            <div class="stat-value">
                                <?= $yearCustomers ?>
                            </div>
                            <div class="stat-label">إجمالي الزبائن</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card gold">
                            <div class="stat-icon gold"><i class="fas fa-coins"></i></div>
                            <div class="stat-value">
                                <?= number_format($yearTotal, 3) ?>
                            </div>
                            <div class="stat-label">إجمالي المبيعات</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card red">
                            <div class="stat-icon red"><i class="fas fa-file-invoice"></i></div>
                            <div class="stat-value">
                                <?= number_format($yearExpenses, 3) ?>
                            </div>
                            <div class="stat-label">إجمالي المصاريف</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card <?= $yearNet >= 0 ? 'green' : 'red' ?>">
                            <div class="stat-icon <?= $yearNet >= 0 ? 'green' : 'red' ?>"><i
                                    class="fas fa-hand-holding-usd"></i>
                            </div>
                            <div class="stat-value">
                                <?= number_format(abs($yearNet), 3) ?>
                            </div>
                            <div class="stat-label">صافي الربح السنوي</div>
                        </div>
                    </div>
                </div>
                <div class="row g-3">
                    <div class="col-md-8">
                        <div class="chart-card">
                            <div class="chart-card-title">📊 المبيعات الشهرية -
                                <?= $year ?>
                            </div><canvas id="yearChart" height="100"></canvas>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="custom-table">
                            <div style="padding:14px 18px;border-bottom:1px solid rgba(201,168,76,0.1);"><span
                                    style="color:#ddd;font-weight:700;">تفاصيل شهرية</span></div>
                            <table class="table table-borderless mb-0">
                                <thead>
                                    <tr>
                                        <th>الشهر</th>
                                        <th>المبيعات</th>
                                        <th>الربح</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($monthlyData as $md): ?>
                                        <tr>
                                            <td style="color:#aaa;">
                                                <?= $monthNames[$md['month'] - 1] ?>
                                            </td>
                                            <td style="color:var(--gold);">
                                                <?= number_format($md['total'], 3) ?>
                                            </td>
                                            <td style="color:<?= $md['net'] >= 0 ? '#2ecc71' : '#e74c3c' ?>;">
                                                <?= number_format($md['net'], 3) ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        <?php if ($period === 'monthly'): ?>
            new Chart(document.getElementById('monthChart').getContext('2d'), {
                type: 'line',
                data: {
                    labels: <?= json_encode($chartLabels) ?>,
                    datasets: [{
                        label: 'المبيعات',
                        data: <?= json_encode($chartData) ?>,
                        borderColor: '#C9A84C',
                        backgroundColor: 'rgba(201,168,76,0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#C9A84C',
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#888' } },
                        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#888' } }
                    }
                }
            });
        <?php elseif ($period === 'yearly'): ?>
            new Chart(document.getElementById('yearChart').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: <?= json_encode($monthNames) ?>,
                    datasets: [
                        { label: 'المبيعات', data: <?= json_encode(array_column($monthlyData, 'total')) ?>, backgroundColor: 'rgba(201,168,76,0.5)', borderColor: '#C9A84C', borderWidth: 1, borderRadius: 4 },
                        { label: 'المصاريف', data: <?= json_encode(array_column($monthlyData, 'expenses')) ?>, backgroundColor: 'rgba(231,76,60,0.4)', borderColor: '#e74c3c', borderWidth: 1, borderRadius: 4 },
                    ]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { labels: { color: '#aaa' } } },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#888' } },
                        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#888' } }
                    }
                }
            });
        <?php endif; ?>
    </script>
</body>

</html>