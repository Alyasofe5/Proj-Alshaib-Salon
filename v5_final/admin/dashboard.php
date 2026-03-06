<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../includes/functions.php';
requireAdmin();

$pageTitle = 'لوحة التحكم - AL SHAYEB';
$today = date('Y-m-d');
$thisMonth = date('Y-m');
$thisYear = date('Y');

// ===== إحصائيات اليوم =====
$stmt = $pdo->query("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total FROM transactions WHERE DATE(created_at) = CURDATE()");
$todayStats = $stmt->fetch();

// ===== إحصائيات الشهر =====
$stmt = $pdo->query("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total FROM transactions WHERE DATE_FORMAT(created_at,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m')");
$monthStats = $stmt->fetch();

// ===== مصاريف الشهر =====
$stmt = $pdo->query("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE DATE_FORMAT(created_at,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m')");
$monthExpenses = $stmt->fetchColumn();

// ===== صافي الربح =====
$netProfit = (float) ($monthStats['total'] ?? 0) - (float) ($monthExpenses ?? 0);

// ===== أفضل موظف اليوم =====
$stmt = $pdo->query("
    SELECT e.name, COUNT(t.id) as cnt, COALESCE(SUM(t.total_amount),0) as total
    FROM transactions t
    JOIN employees e ON t.employee_id = e.id
    WHERE DATE(t.created_at) = CURDATE()
    GROUP BY t.employee_id
    ORDER BY total DESC LIMIT 1
");
$bestEmployee = $stmt->fetch();

// ===== دخل كل موظف اليوم =====
$stmt = $pdo->query("
    SELECT e.name, COUNT(t.id) as cnt, COALESCE(SUM(t.total_amount),0) as total,
           e.commission_rate, e.salary_type
    FROM employees e
    LEFT JOIN transactions t ON e.id = t.employee_id AND DATE(t.created_at) = CURDATE()
    WHERE e.is_active = 1
    GROUP BY e.id
    ORDER BY total DESC
");
$employeesToday = $stmt->fetchAll();

// ===== بيانات الرسم البياني - آخر 7 أيام =====
$chartLabels = [];
$chartData = [];
for ($i = 6; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $chartLabels[] = date('d/m', strtotime($date));
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) FROM transactions WHERE DATE(created_at) = ?");
    $stmt->execute([$date]);
    $chartData[] = (float) $stmt->fetchColumn();
}

// ===== آخر 5 عمليات =====
$stmt = $pdo->query("
    SELECT t.*, e.name as emp_name
    FROM transactions t
    JOIN employees e ON t.employee_id = e.id
    ORDER BY t.created_at DESC LIMIT 5
");
$lastTransactions = $stmt->fetchAll();


require_once __DIR__ . '/../includes/header.php';
?>
</head>

<body>
    <?php require_once __DIR__ . '/../includes/sidebar_admin.php'; ?>

    <div class="main-content">
        <div class="topbar">
            <div>
                <div class="topbar-title">لوحة <span>التحكم</span></div>
                <div class="topbar-date"><i class="fas fa-calendar-alt me-1"></i>
                    <?= date('l، d F Y') ?>
                </div>
            </div>
        </div>

        <div class="content-area">
            <?php showFlash(); ?>

            <!-- Stats Row -->
            <div class="row g-3 mb-4">
                <div class="col-md-3 col-6">
                    <div class="stat-card gold">
                        <div class="stat-icon gold"><i class="fas fa-users"></i></div>
                        <div class="stat-value">
                            <?= $todayStats['cnt'] ?>
                        </div>
                        <div class="stat-label">زبائن اليوم</div>
                        <div class="stat-sub"><i class="fas fa-calendar me-1"></i>اليوم</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card green">
                        <div class="stat-icon green"><i class="fas fa-coins"></i></div>
                        <div class="stat-value">
                            <?= number_format($todayStats['total'], 3) ?>
                        </div>
                        <div class="stat-label">دخل اليوم (د.أ)</div>
                        <div class="stat-sub"><i class="fas fa-arrow-up me-1"></i>اليوم</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card blue">
                        <div class="stat-icon blue"><i class="fas fa-chart-line"></i></div>
                        <div class="stat-value">
                            <?= number_format($monthStats['total'], 3) ?>
                        </div>
                        <div class="stat-label">دخل الشهر (د.أ)</div>
                        <div class="stat-sub"><i class="fas fa-calendar-alt me-1"></i>
                            <?= date('F Y') ?>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card <?= $netProfit >= 0 ? 'green' : 'red' ?>">
                        <div class="stat-icon <?= $netProfit >= 0 ? 'green' : 'red' ?>"><i
                                class="fas fa-hand-holding-usd"></i></div>
                        <div class="stat-value">
                            <?= number_format(abs($netProfit), 3) ?>
                        </div>
                        <div class="stat-label">صافي الربح (د.أ)</div>
                        <div class="stat-sub">
                            <?= $netProfit >= 0 ? '✅ ربح' : '❌ خسارة' ?> -
                            <?= date('F') ?>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-3 mb-4">
                <!-- Chart -->
                <div class="col-md-8">
                    <div class="chart-card">
                        <div class="chart-card-title">📈 المبيعات - <span>آخر 7 أيام</span></div>
                        <canvas id="salesChart" height="100"></canvas>
                    </div>
                </div>

                <!-- Best Employee -->
                <div class="col-md-4">
                    <div class="chart-card h-100">
                        <div class="chart-card-title">🏆 <span>أفضل موظف اليوم</span></div>
                        <?php if ($bestEmployee): ?>
                            <div class="text-center py-3">
                                <div
                                    style="width:70px;height:70px;background:rgba(201,168,76,0.15);border:2px solid var(--gold);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:28px;">
                                    🏅
                                </div>
                                <div style="font-size:18px;font-weight:700;color:#fff;">
                                    <?= clean($bestEmployee['name']) ?>
                                </div>
                                <div style="color:var(--gold);font-size:14px;margin-top:6px;">
                                    <?= formatAmount($bestEmployee['total']) ?>
                                </div>
                                <div style="color:#888;font-size:12px;margin-top:4px;">
                                    <?= $bestEmployee['cnt'] ?> زبون
                                </div>
                            </div>
                        <?php else: ?>
                            <div class="text-center py-4" style="color:#555;">
                                <i class="fas fa-user-slash fa-2x mb-2"></i>
                                <div>لا توجد عمليات اليوم</div>
                            </div>
                        <?php endif; ?>

                        <!-- معادلة الربح -->
                        <div
                            style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-top:12px;font-size:12px;">
                            <div style="color:#888;margin-bottom:6px;">📊 معادلة الربح (الشهر)</div>
                            <div style="color:#ccc;">
                                <?= formatAmount($monthStats['total']) ?> مبيعات
                            </div>
                            <div style="color:#e74c3c;">-
                                <?= formatAmount($monthExpenses) ?> مصاريف
                            </div>
                            <div style="border-top:1px solid #333;margin:6px 0;"></div>
                            <div style="color:<?= $netProfit >= 0 ? '#2ecc71' : '#e74c3c' ?>;font-weight:700;">
                                <?= formatAmount($netProfit) ?> صافي
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-3">
                <!-- Employee Performance Today -->
                <div class="col-md-6">
                    <div class="custom-table">
                        <div style="padding:16px 20px;border-bottom:1px solid rgba(201,168,76,0.1);">
                            <span style="color:#ddd;font-weight:700;font-size:14px;">👨‍🔧 أداء الموظفين اليوم</span>
                        </div>
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
                                <?php foreach ($employeesToday as $emp): ?>
                                    <tr>
                                        <td>
                                            <?= clean($emp['name']) ?>
                                        </td>
                                        <td><span class="badge badge-blue rounded-pill">
                                                <?= $emp['cnt'] ?>
                                            </span></td>
                                        <td style="color:var(--gold);">
                                            <?= formatAmount($emp['total']) ?>
                                        </td>
                                        <td style="color:#2ecc71;">
                                            <?php if ($emp['salary_type'] === 'commission'): ?>
                                                <?= formatAmount(calcCommission($emp['total'], $emp['commission_rate'])) ?>
                                            <?php else: ?>
                                                <span style="color:#888;">ثابت</span>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Last Transactions -->
                <div class="col-md-6">
                    <div class="custom-table">
                        <div
                            style="padding:16px 20px;border-bottom:1px solid rgba(201,168,76,0.1);display:flex;justify-content:space-between;align-items:center;">
                            <span style="color:#ddd;font-weight:700;font-size:14px;">🧾 آخر العمليات</span>
                            <a href="<?= BASE_URL ?>/admin/reports.php" style="color:var(--gold);font-size:12px;">عرض
                                الكل</a>
                        </div>
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
                                <?php foreach ($lastTransactions as $tx): ?>
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
                                <?php if (empty($lastTransactions)): ?>
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
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        const ctx = document.getElementById('salesChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: <?= json_encode($chartLabels) ?>,
                datasets: [{
                    label: 'المبيعات (د.أ)',
                    data: <?= json_encode($chartData) ?>,
                    backgroundColor: 'rgba(201,168,76,0.3)',
                    borderColor: '#C9A84C',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ctx.parsed.y.toFixed(3) + ' د.أ'
                        }
                    }
                },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#888' } },
                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#888' } }
                }
            }
        });
    </script>
</body>

</html>