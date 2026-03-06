<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../includes/functions.php';
requireEmployee();

// If admin, redirect to admin dashboard
if (isAdmin()) {
    header('Location: ' . BASE_URL . '/admin/dashboard.php');
    exit;
}

$pageTitle = 'لوحتي - AL SHAYEB';
$empId = currentEmployeeId();
$today = date('Y-m-d');
$thisMonth = date('Y-m');

// Today stats for this employee - استخدام CURDATE() من MySQL مباشرة
$stmt = $pdo->prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total FROM transactions WHERE employee_id=? AND DATE(created_at)=CURDATE()");
$stmt->execute([$empId]);
$todayStats = $stmt->fetch();

// Month stats
$stmt = $pdo->prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total FROM transactions WHERE employee_id=? AND DATE_FORMAT(created_at,'%Y-%m')=DATE_FORMAT(NOW(),'%Y-%m')");
$stmt->execute([$empId]);
$monthStats = $stmt->fetch();

// Employee commission rate
$stmt = $pdo->prepare("SELECT * FROM employees WHERE id=?");
$stmt->execute([$empId]);
$employee = $stmt->fetch();
if (!$employee) {
    $employee = ['name' => 'غير مرتبط بموظف', 'commission_rate' => 0, 'salary_type' => 'fixed'];
}

$todayCommission = $employee ? calcCommission($todayStats['total'], $employee['commission_rate']) : 0;
$monthCommission = $employee ? calcCommission($monthStats['total'], $employee['commission_rate']) : 0;

// Last 5 transactions today
$stmt = $pdo->prepare("
    SELECT t.*, GROUP_CONCAT(s.name SEPARATOR ', ') as services
    FROM transactions t
    LEFT JOIN transaction_details td ON t.id = td.transaction_id
    LEFT JOIN services s ON td.service_id = s.id
    WHERE t.employee_id=? AND DATE(t.created_at)=CURDATE()
    GROUP BY t.id ORDER BY t.created_at DESC LIMIT 5
");
$stmt->execute([$empId]);
$todayTx = $stmt->fetchAll();

require_once __DIR__ . '/../includes/header.php';
?>
</head>

<body>
    <?php require_once __DIR__ . '/../includes/sidebar_employee.php'; ?>
    <div class="main-content">
        <div class="topbar">
            <div>
                <div class="topbar-title">أهلاً، <span>
                        <?= clean($employee['name'] ?? 'موظف') ?>
                    </span> 👋</div>
                <div class="topbar-date"><i class="fas fa-calendar-alt me-1"></i>
                    <?= date('l، d F Y') ?>
                </div>
            </div>
            <a href="<?= BASE_URL ?>/employee/new_customer.php" class="btn btn-gold px-4">
                <i class="fas fa-plus me-2"></i> تسجيل زبون جديد
            </a>
        </div>
        <div class="content-area">
            <?php showFlash(); ?>

            <!-- Stats -->
            <div class="row g-3 mb-4">
                <div class="col-md-3 col-6">
                    <div class="stat-card gold">
                        <div class="stat-icon gold"><i class="fas fa-users"></i></div>
                        <div class="stat-value">
                            <?= $todayStats['cnt'] ?>
                        </div>
                        <div class="stat-label">زبائن اليوم</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card green">
                        <div class="stat-icon green"><i class="fas fa-coins"></i></div>
                        <div class="stat-value">
                            <?= number_format($todayStats['total'], 3) ?>
                        </div>
                        <div class="stat-label">مبيعات اليوم (د.أ)</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card blue">
                        <div class="stat-icon blue"><i class="fas fa-percentage"></i></div>
                        <div class="stat-value">
                            <?= number_format($todayCommission, 3) ?>
                        </div>
                        <div class="stat-label">عمولتي اليوم (د.أ)</div>
                        <div class="stat-sub">
                            <?= $employee['commission_rate'] ?>% عمولة
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card purple">
                        <div class="stat-icon purple"><i class="fas fa-calendar-alt"></i></div>
                        <div class="stat-value">
                            <?= number_format($monthCommission, 3) ?>
                        </div>
                        <div class="stat-label">عمولة الشهر (د.أ)</div>
                        <div class="stat-sub">
                            <?= $monthStats['cnt'] ?> زبون هذا الشهر
                        </div>
                    </div>
                </div>
            </div>

            <!-- Big CTA Button -->
            <div class="text-center mb-4">
                <a href="<?= BASE_URL ?>/employee/new_customer.php" style="
        display: inline-flex; align-items: center; justify-content: center; gap: 12px;
        background: linear-gradient(135deg, var(--gold), var(--gold-light));
        color: var(--black); font-weight: 800; font-size: 18px;
        padding: 18px 40px; border-radius: 12px; text-decoration: none;
        box-shadow: 0 8px 30px rgba(201,168,76,0.4);
        transition: all 0.3s;
      " onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform=''">
                    <i class="fas fa-plus-circle" style="font-size:24px;"></i>
                    تسجيل زبون جديد
                </a>
            </div>

            <!-- Today's transactions -->
            <div class="custom-table">
                <div
                    style="padding:16px 20px;border-bottom:1px solid rgba(201,168,76,0.1);display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:#ddd;font-weight:700;">🧾 عملياتي اليوم</span>
                    <a href="<?= BASE_URL ?>/employee/my_reports.php?period=daily"
                        style="color:var(--gold);font-size:12px;">عرض
                        الكل</a>
                </div>
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
                        <?php foreach ($todayTx as $tx): ?>
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
                        <?php if (empty($todayTx)): ?>
                            <tr>
                                <td colspan="6" class="text-center" style="color:#555;padding:30px;">لا توجد عمليات اليوم
                                    بعد</td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>