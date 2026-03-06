<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../includes/functions.php';
requireAdmin();

$pageTitle = 'المالية والمصاريف - AL SHAYEB';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'add') {
        $stmt = $pdo->prepare("INSERT INTO expenses (title, amount, type, notes) VALUES (?,?,?,?)");
        $stmt->execute([trim($_POST['title']), (float) $_POST['amount'], $_POST['type'], trim($_POST['notes'] ?? '')]);
        setFlash('success', 'تم إضافة المصروف بنجاح');
    } elseif ($action === 'delete') {
        $pdo->prepare("DELETE FROM expenses WHERE id=?")->execute([(int) $_POST['id']]);
        setFlash('success', 'تم حذف المصروف');
    }
    header('Location: expenses.php?month=' . ($_POST['month'] ?? date('Y-m')));
    exit;
}

$month = $_GET['month'] ?? date('Y-m');
$monthLabel = date('F Y', strtotime($month . '-01'));

// ===== الدخل الشهري =====
$stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as cnt FROM transactions WHERE DATE_FORMAT(created_at,'%Y-%m')=?");
$stmt->execute([$month]);
$incomeRow = $stmt->fetch() ?: ['total' => 0, 'cnt' => 0];
$totalIncome = (float) ($incomeRow['total'] ?? 0);
$totalTx = (int) ($incomeRow['cnt'] ?? 0);

// ===== المصاريف الشهرية =====
$stmt = $pdo->prepare("SELECT * FROM expenses WHERE DATE_FORMAT(created_at,'%Y-%m') = ? ORDER BY created_at DESC");
$stmt->execute([$month]);
$expenses = $stmt->fetchAll();
$totalExpenses = 0.0;
foreach ($expenses as $e) {
    $totalExpenses += (float) ($e['amount'] ?? 0);
}

// ===== صافي الربح =====
$netProfit = $totalIncome - $totalExpenses;
$isProfit = $netProfit >= 0;
$profitPct = $totalIncome > 0 ? round(($netProfit / $totalIncome) * 100, 1) : 0;
$expensePct = $totalIncome > 0 ? min(round(($totalExpenses / $totalIncome) * 100, 1), 100) : 100;

// ===== تفصيل حسب النوع =====
$byType = [];
foreach ($expenses as $e) {
    if (!isset($byType[$e['type']]))
        $byType[$e['type']] = 0.0;
    $byType[$e['type']] += (float) ($e['amount'] ?? 0);
}

// ===== آخر 6 أشهر للمقارنة =====
$chartMonths = [];
$chartIncome = [];
$chartExpense = [];
for ($i = 5; $i >= 0; $i--) {
    $m = date('Y-m', strtotime("-$i months", strtotime($month . '-01')));
    $chartMonths[] = date('M', strtotime($m . '-01'));
    $r = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) FROM transactions WHERE DATE_FORMAT(created_at,'%Y-%m')=?");
    $r->execute([$m]);
    $chartIncome[] = (float) ($r->fetchColumn() ?: 0);
    $r = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE DATE_FORMAT(created_at,'%Y-%m')=?");
    $r->execute([$m]);
    $chartExpense[] = (float) ($r->fetchColumn() ?: 0);
}

require_once __DIR__ . '/../includes/header.php';
?>
</head>

<body>
    <?php require_once __DIR__ . '/../includes/sidebar_admin.php'; ?>
    <div class="main-content">
        <div class="topbar">
            <div class="topbar-title">📊 المالية <span>والمصاريف</span></div>
            <div class="d-flex gap-2 align-items-center">
                <input type="month" id="monthPicker" class="form-control form-control-sm" value="<?= $month ?>"
                    onchange="window.location='expenses.php?month='+this.value" style="width:160px;" />
                <button class="btn btn-gold btn-sm px-3" data-bs-toggle="modal" data-bs-target="#addModal">
                    <i class="fas fa-plus me-1"></i> إضافة مصروف
                </button>
            </div>
        </div>

        <div class="content-area">
            <?php showFlash(); ?>

            <!-- ===== بطاقة الملخص الرئيسي ===== -->
            <div class="row g-3 mb-4">

                <!-- الدخل -->
                <div class="col-md-3 col-6">
                    <div class="stat-card green">
                        <div class="stat-icon green"><i class="fas fa-arrow-trend-up"></i></div>
                        <div class="stat-value"><?= number_format($totalIncome, 3) ?></div>
                        <div class="stat-label">إجمالي الدخل (د.أ)</div>
                        <div class="stat-sub"><?= $totalTx ?> عملية</div>
                    </div>
                </div>

                <!-- المصاريف -->
                <div class="col-md-3 col-6">
                    <div class="stat-card red">
                        <div class="stat-icon red"><i class="fas fa-arrow-trend-down"></i></div>
                        <div class="stat-value"><?= number_format($totalExpenses, 3) ?></div>
                        <div class="stat-label">إجمالي المصاريف (د.أ)</div>
                        <div class="stat-sub"><?= count($expenses) ?> بند</div>
                    </div>
                </div>

                <!-- صافي الربح / الخسارة -->
                <div class="col-md-3 col-6">
                    <div class="stat-card <?= $isProfit ? 'gold' : 'red' ?>">
                        <div class="stat-icon <?= $isProfit ? 'gold' : 'red' ?>">
                            <i class="fas fa-<?= $isProfit ? 'coins' : 'triangle-exclamation' ?>"></i>
                        </div>
                        <div class="stat-value" style="color:<?= $isProfit ? 'var(--gold)' : '#e74c3c' ?>">
                            <?= ($isProfit ? '' : '-') . number_format(abs($netProfit), 3) ?>
                        </div>
                        <div class="stat-label">صافي <?= $isProfit ? 'الربح' : 'الخسارة' ?> (د.أ)</div>
                        <div class="stat-sub"><?= $isProfit ? '✅ ربح' : '❌ خسارة' ?></div>
                    </div>
                </div>

                <!-- نسبة الربح -->
                <div class="col-md-3 col-6">
                    <div class="stat-card <?= $isProfit ? 'green' : 'red' ?>">
                        <div class="stat-icon <?= $isProfit ? 'green' : 'red' ?>">
                            <i class="fas fa-percent"></i>
                        </div>
                        <div class="stat-value" style="color:<?= $isProfit ? '#2ecc71' : '#e74c3c' ?>">
                            <?= abs($profitPct) ?>%
                        </div>
                        <div class="stat-label">هامش <?= $isProfit ? 'الربح' : 'الخسارة' ?></div>
                        <div class="stat-sub">من إجمالي الدخل</div>
                    </div>
                </div>
            </div>

            <!-- ===== شريط الدخل/المصاريف المرئي ===== -->
            <div
                style="background:var(--dark3);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:22px;margin-bottom:24px;">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span style="font-weight:700;color:#ddd;">📅 ملخص <?= $monthLabel ?></span>
                    <span style="font-size:13px;color:<?= $isProfit ? '#2ecc71' : '#e74c3c' ?>;font-weight:700;">
                        <?= $isProfit ? '✅ أنت في ربح' : '❌ أنت في خسارة' ?>
                        — <?= formatAmount(abs($netProfit)) ?>
                    </span>
                </div>

                <!-- شريط المقارنة -->
                <div style="margin-bottom:12px;">
                    <div class="d-flex justify-content-between mb-1">
                        <small style="color:#2ecc71;">الدخل: <?= formatAmount($totalIncome) ?></small>
                        <small style="color:#e74c3c;">المصاريف: <?= formatAmount($totalExpenses) ?></small>
                    </div>
                    <div style="background:#111;border-radius:8px;height:18px;overflow:hidden;position:relative;">
                        <?php
                        $maxVal = max($totalIncome, $totalExpenses, 0.001);
                        $incW = round(($totalIncome / $maxVal) * 100);
                        $expW = round(($totalExpenses / $maxVal) * 100);
                        ?>
                        <div
                            style="position:absolute;right:0;top:0;height:100%;width:<?= $incW ?>%;background:linear-gradient(90deg,#27ae60,#2ecc71);border-radius:8px;transition:width 0.5s;">
                        </div>
                        <div
                            style="position:absolute;right:0;top:0;height:100%;width:<?= $expW ?>%;background:rgba(231,76,60,0.5);border-radius:8px;">
                        </div>
                    </div>
                    <div class="d-flex gap-3 mt-2">
                        <span style="font-size:11px;color:#2ecc71;"><span
                                style="display:inline-block;width:10px;height:10px;background:#2ecc71;border-radius:2px;margin-left:4px;"></span>دخل</span>
                        <span style="font-size:11px;color:#e74c3c;"><span
                                style="display:inline-block;width:10px;height:10px;background:#e74c3c;border-radius:2px;margin-left:4px;"></span>مصاريف</span>
                        <span style="font-size:11px;color:var(--gold);"><span
                                style="display:inline-block;width:10px;height:10px;background:var(--gold);border-radius:2px;margin-left:4px;"></span>صافي:
                            <?= formatAmount($netProfit) ?></span>
                    </div>
                </div>
            </div>

            <!-- ===== رسم بياني + تفصيل المصاريف ===== -->
            <div class="row g-3 mb-4">
                <!-- رسم بياني آخر 6 أشهر -->
                <div class="col-md-8">
                    <div class="chart-card">
                        <div class="chart-card-title">📈 مقارنة <span>آخر 6 أشهر</span></div>
                        <canvas id="financeChart" height="200"></canvas>
                    </div>
                </div>

                <!-- تفصيل المصاريف حسب النوع -->
                <div class="col-md-4">
                    <div class="chart-card" style="height:100%;">
                        <div class="chart-card-title">🗂️ <span>تفصيل المصاريف</span></div>
                        <?php if (empty($byType)): ?>
                            <p style="color:#555;text-align:center;margin-top:30px;">لا توجد مصاريف</p>
                        <?php else: ?>
                            <?php foreach ($byType as $type => $amount):
                                $pct = $totalExpenses > 0 ? round(($amount / $totalExpenses) * 100) : 0;
                                $colors = ['rent' => '#e74c3c', 'salary' => '#3498db', 'supplies' => '#f39c12', 'utilities' => '#9b59b6', 'other' => '#888'];
                                $col = $colors[$type] ?? '#888';
                                ?>
                                <div style="margin-bottom:12px;">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span style="font-size:13px;color:#ccc;"><?= expenseTypeLabel($type) ?></span>
                                        <span
                                            style="font-size:13px;color:<?= $col ?>;font-weight:700;"><?= formatAmount($amount) ?></span>
                                    </div>
                                    <div style="background:#111;border-radius:4px;height:8px;">
                                        <div style="width:<?= $pct ?>%;height:100%;background:<?= $col ?>;border-radius:4px;">
                                        </div>
                                    </div>
                                    <small style="color:#555;"><?= $pct ?>%</small>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- ===== جدول المصاريف ===== -->
            <div class="custom-table">
                <div
                    style="padding:16px 20px;border-bottom:1px solid rgba(201,168,76,0.1);display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:#ddd;font-weight:700;font-size:14px;">📋 تفاصيل المصاريف —
                        <?= $monthLabel ?></span>
                    <span
                        style="color:#e74c3c;font-size:13px;font-weight:700;"><?= formatAmount($totalExpenses) ?></span>
                </div>
                <table class="table table-borderless mb-0">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>العنوان</th>
                            <th>النوع</th>
                            <th>المبلغ</th>
                            <th>نسبة من الدخل</th>
                            <th>الملاحظات</th>
                            <th>التاريخ</th>
                            <th>حذف</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($expenses as $i => $exp):
                            $amt = (float) ($exp['amount'] ?? 0);
                            $ofIncome = $totalIncome > 0 ? round(($amt / $totalIncome) * 100, 1) : 0;
                            ?>
                            <tr>
                                <td style="color:#555;"><?= $i + 1 ?></td>
                                <td style="color:#fff;font-weight:600;"><?= clean($exp['title']) ?></td>
                                <td>
                                    <?php
                                    $typeColors = ['rent' => 'badge-red', 'salary' => 'badge-blue', 'supplies' => 'badge-gold', 'utilities' => 'badge-gold', 'other' => ''];
                                    $tc = $typeColors[$exp['type']] ?? 'badge-red';
                                    ?>
                                    <span class="badge <?= $tc ?> rounded-pill"><?= expenseTypeLabel($exp['type']) ?></span>
                                </td>
                                <td style="color:#e74c3c;font-weight:700;"><?= formatAmount($exp['amount']) ?></td>
                                <td>
                                    <div style="display:flex;align-items:center;gap:6px;">
                                        <div style="background:#111;border-radius:3px;height:6px;width:60px;flex-shrink:0;">
                                            <div
                                                style="width:<?= min($ofIncome, 100) ?>%;height:100%;background:#e74c3c;border-radius:3px;">
                                            </div>
                                        </div>
                                        <small style="color:#888;"><?= $ofIncome ?>%</small>
                                    </div>
                                </td>
                                <td style="color:#888;font-size:13px;"><?= clean($exp['notes'] ?? '-') ?></td>
                                <td style="color:#555;font-size:12px;"><?= formatDate($exp['created_at']) ?></td>
                                <td>
                                    <form method="POST" style="display:inline;"
                                        onsubmit="return confirm('حذف هذا المصروف؟')">
                                        <input type="hidden" name="action" value="delete" />
                                        <input type="hidden" name="id" value="<?= $exp['id'] ?>" />
                                        <input type="hidden" name="month" value="<?= $month ?>" />
                                        <button class="btn btn-sm"
                                            style="background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.3);color:#e74c3c;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                        <?php if (empty($expenses)): ?>
                            <tr>
                                <td colspan="8" class="text-center" style="color:#555;padding:30px;">لا توجد مصاريف لهذا
                                    الشهر</td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Add Modal -->
    <div class="modal fade" id="addModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-plus me-2" style="color:var(--gold)"></i>إضافة مصروف جديد
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form method="POST">
                    <input type="hidden" name="action" value="add" />
                    <input type="hidden" name="month" value="<?= $month ?>" />
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">عنوان المصروف *</label>
                            <input type="text" name="title" class="form-control" required
                                placeholder="مثال: إيجار المحل" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">المبلغ (د.أ) *</label>
                            <input type="number" name="amount" class="form-control" required min="0" step="0.001" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">النوع</label>
                            <select name="type" class="form-select">
                                <option value="rent">🏠 إيجار</option>
                                <option value="salary">👷 رواتب</option>
                                <option value="supplies">🛒 مستلزمات</option>
                                <option value="utilities">💡 خدمات (كهرباء/ماء)</option>
                                <option value="other">📦 أخرى</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">ملاحظات</label>
                            <textarea name="notes" class="form-control" rows="2" placeholder="اختياري..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        <button type="submit" class="btn btn-gold px-4">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script>
        const ctx = document.getElementById('financeChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: <?= json_encode($chartMonths) ?>,
                datasets: [
                    {
                        label: 'الدخل (د.أ)',
                        data: <?= json_encode($chartIncome) ?>,
                        backgroundColor: 'rgba(46,204,113,0.7)',
                        borderColor: '#2ecc71',
                        borderWidth: 1,
                        borderRadius: 6,
                    },
                    {
                        label: 'المصاريف (د.أ)',
                        data: <?= json_encode($chartExpense) ?>,
                        backgroundColor: 'rgba(231,76,60,0.7)',
                        borderColor: '#e74c3c',
                        borderWidth: 1,
                        borderRadius: 6,
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#aaa', font: { family: 'Tajawal' } } },
                    tooltip: {
                        callbacks: {
                            label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(3) + ' د.أ'
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    y: { ticks: { color: '#888', callback: v => v.toFixed(0) }, grid: { color: 'rgba(255,255,255,0.04)' } }
                }
            }
        });
    </script>
</body>

</html>