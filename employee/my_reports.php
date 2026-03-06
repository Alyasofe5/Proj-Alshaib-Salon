<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../includes/functions.php';
requireEmployee();

if (isAdmin()) {
    header('Location: ' . BASE_URL . '/admin/dashboard');
    exit;
}

$pageTitle = 'تقاريري - AL SHAYEB';
$empId = currentEmployeeId();
$period = $_GET['period'] ?? 'daily';
$date = $_GET['date'] ?? date('Y-m-d');
$month = $_GET['month'] ?? date('Y-m');
$year = $_GET['year'] ?? date('Y');

// Employee info
$stmt = $pdo->prepare("SELECT * FROM employees WHERE id=?");
$stmt->execute([$empId]);
$employee = $stmt->fetch();
if (!$employee) {
    $employee = ['name' => 'غير مرتبط بموظف', 'commission_rate' => 0, 'salary_type' => 'fixed'];
}

if ($period === 'daily') {
    $stmt = $pdo->prepare("
        SELECT t.*, GROUP_CONCAT(s.name SEPARATOR ', ') as services
        FROM transactions t
        LEFT JOIN transaction_details td ON t.id = td.transaction_id
        LEFT JOIN services s ON td.service_id = s.id
        WHERE t.employee_id=? AND DATE(t.created_at)=?
        GROUP BY t.id ORDER BY t.created_at DESC
    ");
    $stmt->execute([$empId, $date]);
    $transactions = $stmt->fetchAll();
    $totalSales = 0.0;
    foreach ($transactions as $tx) {
        $totalSales += (float) ($tx['total_amount'] ?? 0);
    }
    $totalCustomers = count($transactions);
    $commission = calcCommission($totalSales, (float) ($employee['commission_rate'] ?? 0));
}

if ($period === 'monthly') {
    // Daily breakdown
    $daysInMonth = (int) date('t', strtotime($month . '-01'));
    $dailyData = [];
    for ($d = 1; $d <= $daysInMonth; $d++) {
        $fullDate = $month . '-' . str_pad($d, 2, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total FROM transactions WHERE employee_id=? AND DATE(created_at)=?");
        $stmt->execute([$empId, $fullDate]);
        $row = $stmt->fetch();
        $dailyData[] = ['day' => $d, 'cnt' => (int) ($row['cnt'] ?? 0), 'total' => (float) ($row['total'] ?? 0)];
    }
    $totalSales = 0.0;
    $totalCustomers = 0;
    foreach ($dailyData as $r) {
        $totalSales += (float) ($r['total'] ?? 0);
        $totalCustomers += (int) ($r['cnt'] ?? 0);
    }
    $commission = calcCommission($totalSales, (float) ($employee['commission_rate'] ?? 0));
    $chartLabels = array_column($dailyData, 'day');
    $chartData = array_column($dailyData, 'total');
    $chartData = array_map('floatval', $chartData); // Ensure all chart data values are floats
}

if ($period === 'yearly') {
    $monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    $monthlyData = [];
    for ($m = 1; $m <= 12; $m++) {
        $ym = $year . '-' . str_pad($m, 2, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total FROM transactions WHERE employee_id=? AND DATE_FORMAT(created_at,'%Y-%m')=?");
        $stmt->execute([$empId, $ym]);
        $row = $stmt->fetch();
        $monthlyData[] = ['month' => $monthNames[$m - 1], 'cnt' => (int) ($row['cnt'] ?? 0), 'total' => (float) ($row['total'] ?? 0)];
    }
    $totalSales = 0.0;
    $totalCustomers = 0;
    foreach ($monthlyData as $m) {
        $totalSales += (float) ($m['total'] ?? 0);
        $totalCustomers += (int) ($m['cnt'] ?? 0);
    }
    $commission = calcCommission($totalSales, (float) ($employee['commission_rate'] ?? 0));
    $avgMonthly = $totalSales / 12;
}

require_once __DIR__ . '/../includes/header.php';
?>
</head>

<body>
    <?php require_once __DIR__ . '/../includes/sidebar_employee.php'; ?>
    <div class="main-content">
        <div class="topbar">
            <div class="topbar-title">📈 تقاريري <span>الشخصية</span></div>
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

            <!-- Period filter -->
            <div class="mb-4 d-flex align-items-center gap-3">
                <?php if ($period === 'daily'): ?>
                    <label style="color:#aaa;">التاريخ:</label>
                    <input type="date" class="form-control" style="width:200px;" value="<?= $date ?>"
                        onchange="window.location='?period=daily&date='+this.value" />
                <?php elseif ($period === 'monthly'): ?>
                    <label style="color:#aaa;">الشهر:</label>
                    <input type="month" class="form-control" style="width:200px;" value="<?= $month ?>"
                        onchange="window.location='?period=monthly&month='+this.value" />
                <?php elseif ($period === 'yearly'): ?>
                    <label style="color:#aaa;">السنة:</label>
                    <select class="form-select" style="width:120px;"
                        onchange="window.location='?period=yearly&year='+this.value">
                        <?php for ($y = date('Y'); $y >= date('Y') - 5; $y--): ?>
                            <option value="<?= $y ?>" <?= $y == $year ? 'selected' : '' ?>>
                                <?= $y ?>
                            </option>
                        <?php endfor; ?>
                    </select>
                <?php endif; ?>
            </div>

            <!-- Stats -->
            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="stat-card gold">
                        <div class="stat-icon gold"><i class="fas fa-users"></i></div>
                        <div class="stat-value">
                            <?= $totalCustomers ?>
                        </div>
                        <div class="stat-label">عدد الزبائن</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card green">
                        <div class="stat-icon green"><i class="fas fa-coins"></i></div>
                        <div class="stat-value">
                            <?= number_format($totalSales, 3) ?>
                        </div>
                        <div class="stat-label">مجموع المبيعات (د.أ)</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card blue">
                        <div class="stat-icon blue"><i class="fas fa-percentage"></i></div>
                        <div class="stat-value">
                            <?= number_format($commission, 3) ?>
                        </div>
                        <div class="stat-label">عمولتي (
                            <?= $employee['commission_rate'] ?>%)
                        </div>
                    </div>
                </div>
                <?php if ($period === 'yearly'): ?>
                    <div class="col-md-4">
                        <div class="stat-card purple">
                            <div class="stat-icon purple"><i class="fas fa-chart-line"></i></div>
                            <div class="stat-value">
                                <?= number_format($avgMonthly, 3) ?>
                            </div>
                            <div class="stat-label">متوسط الدخل الشهري</div>
                        </div>
                    </div>
                <?php endif; ?>
            </div>

            <?php if ($period === 'daily'): ?>
                <div class="custom-table">
                    <div style="padding:14px 18px;border-bottom:1px solid rgba(201,168,76,0.1);"><span
                            style="color:#ddd;font-weight:700;">تفاصيل العمليات</span></div>
                    <table class="table table-borderless mb-0">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>الخدمات</th>
                                <th>الملاحظات</th>
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
                                    <td style="color:#ccc;">
                                        <?= clean($tx['services'] ?? '-') ?>
                                    </td>
                                    <td style="color:#aaa;font-size:13px;max-width:200px;">
                                        <?= clean($tx['notes'] ?? '-') ?>
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
                                    <td colspan="6" class="text-center" style="color:#555;padding:20px;">لا توجد عمليات</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

            <?php elseif ($period === 'monthly'): ?>
                <div class="chart-card mb-3">
                    <div class="chart-card-title">📈 مبيعاتي اليومية</div>
                    <canvas id="myChart" height="100"></canvas>
                </div>
                <div class="custom-table">
                    <table class="table table-borderless mb-0">
                        <thead>
                            <tr>
                                <th>اليوم</th>
                                <th>الزبائن</th>
                                <th>المبيعات</th>
                                <th>العمولة</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($dailyData as $dd):
                                if ($dd['cnt'] == 0)
                                    continue; ?>
                                <tr>
                                    <td style="color:#aaa;">
                                        <?= $dd['day'] ?>
                                    </td>
                                    <td><span class="badge badge-blue rounded-pill">
                                            <?= $dd['cnt'] ?>
                                        </span></td>
                                    <td style="color:var(--gold);">
                                        <?= formatAmount($dd['total']) ?>
                                    </td>
                                    <td style="color:#2ecc71;">
                                        <?= formatAmount(calcCommission($dd['total'], $employee['commission_rate'])) ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

            <?php elseif ($period === 'yearly'): ?>
                <div class="chart-card mb-3">
                    <div class="chart-card-title">📊 مبيعاتي الشهرية -
                        <?= $year ?>
                    </div>
                    <canvas id="myChart" height="100"></canvas>
                </div>
                <div class="custom-table">
                    <table class="table table-borderless mb-0">
                        <thead>
                            <tr>
                                <th>الشهر</th>
                                <th>الزبائن</th>
                                <th>المبيعات</th>
                                <th>العمولة</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($monthlyData as $md): ?>
                                <tr>
                                    <td style="color:#aaa;">
                                        <?= $md['month'] ?>
                                    </td>
                                    <td><span class="badge badge-blue rounded-pill">
                                            <?= $md['cnt'] ?>
                                        </span></td>
                                    <td style="color:var(--gold);">
                                        <?= formatAmount($md['total']) ?>
                                    </td>
                                    <td style="color:#2ecc71;">
                                        <?= formatAmount(calcCommission($md['total'], $employee['commission_rate'])) ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>

        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        <?php if ($period === 'monthly' || $period === 'yearly'): ?>
            new Chart(document.getElementById('myChart').getContext('2d'), {
                type: '<?= $period === "monthly" ? "bar" : "line" ?>',
                data: {
                    labels: <?= $period === 'monthly' ? json_encode($chartLabels) : json_encode(array_column($monthlyData, 'month')) ?>,
                    datasets: [{
                        label: 'المبيعات',
                        data: <?= $period === 'monthly' ? json_encode($chartData) : json_encode(array_column($monthlyData, 'total')) ?>,
                        backgroundColor: 'rgba(201,168,76,0.3)',
                        borderColor: '#C9A84C',
                        borderWidth: 2,
                        borderRadius: 6,
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
        <?php endif; ?>
    </script>
</body>

</html>