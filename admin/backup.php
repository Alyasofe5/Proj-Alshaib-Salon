<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../includes/functions.php';
requireAdmin();

define('BACKUP_PASSWORD', 'salon2026'); // 🔐 كلمة مرور التنزيل
$pageTitle = 'النسخ الاحتياطي - AL SHAYEB';
$backupDir = __DIR__ . '/../backups/';
if (!is_dir($backupDir))
    mkdir($backupDir, 0755, true);

// ===== دالة توليد SQL =====
require_once __DIR__ . '/../includes/backup_engine.php';

// ===== Backup تلقائي شهري عند الدخول للصفحة =====
$autoBackupFile = $backupDir . 'auto_' . date('Y-m') . '.sql';
if (!file_exists($autoBackupFile)) {
    file_put_contents($autoBackupFile, generateSQL($pdo));
}

// ===== تنزيل نسخة بكلمة مرور =====
if (isset($_POST['action']) && $_POST['action'] === 'download_secure') {
    if ($_POST['password'] !== BACKUP_PASSWORD) {
        setFlash('error', '❌ كلمة المرور غير صحيحة');
        header('Location: backup');
        exit;
    }
    $file = basename($_POST['file'] ?? '');
    $path = $backupDir . $file;
    if (file_exists($path)) {
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $file . '"');
        header('Content-Length: ' . filesize($path));
        readfile($path);
        exit;
    }
}

// ===== إنشاء Backup يدوي =====
if (isset($_POST['action']) && $_POST['action'] === 'backup') {
    $prefix = isset($_POST['auto']) ? 'auto_' : 'backup_';
    $filename = $prefix . date('Y-m-d_H-i-s') . '.sql';
    $filepath = $backupDir . $filename;
    $sql = generateSQL($pdo);
    file_put_contents($filepath, $sql);
    if (isset($_POST['download'])) {
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($sql));
        echo $sql;
        exit;
    }
    setFlash('success', '✅ تم إنشاء النسخة: ' . $filename);
    header('Location: backup');
    exit;
}

// ===== حذف نسخة =====
if (isset($_POST['action']) && $_POST['action'] === 'delete') {
    $file = basename($_POST['file']);
    $path = $backupDir . $file;
    if (file_exists($path)) {
        unlink($path);
        setFlash('success', 'تم الحذف');
    }
    header('Location: backup');
    exit;
}

// ===== قائمة الملفات =====
$backupFiles = glob($backupDir . '*.sql') ?: [];
usort($backupFiles, fn($a, $b) => filemtime($b) - filemtime($a));

require_once __DIR__ . '/../includes/header.php';
?>
</head>

<body>
    <?php require_once __DIR__ . '/../includes/sidebar_admin.php'; ?>
    <div class="main-content">
        <div class="topbar">
            <div class="d-flex align-items-center gap-3">
                <button class="hamburger-btn" onclick="openSidebar()"><i class="fas fa-bars"></i></button>
                <div class="topbar-title">💾 النسخ <span>الاحتياطي</span></div>
            </div>
        </div>
        <div class="content-area">
            <?php showFlash(); ?>

            <!-- Stats -->
            <div class="row g-3 mb-4">
                <div class="col-md-4 col-6">
                    <div class="stat-card gold">
                        <div class="stat-icon gold"><i class="fas fa-database"></i></div>
                        <div class="stat-value"><?= count($backupFiles) ?></div>
                        <div class="stat-label">نسخة محفوظة</div>
                    </div>
                </div>
                <div class="col-md-4 col-6">
                    <div class="stat-card green">
                        <div class="stat-icon green"><i class="fas fa-robot"></i></div>
                        <div class="stat-value" style="font-size:16px;"><?= date('F Y') ?></div>
                        <div class="stat-label">آخر نسخة تلقائية</div>
                        <div class="stat-sub">تحفظ تلقائياً كل أول الشهر</div>
                    </div>
                </div>
                <div class="col-md-4 col-6">
                    <div class="stat-card blue">
                        <div class="stat-icon blue"><i class="fas fa-hdd"></i></div>
                        <div class="stat-value">
                            <?php
                            $sz = array_sum(array_map('filesize', $backupFiles));
                            echo $sz > 1048576 ? round($sz / 1048576, 1) . ' MB' : ($sz > 1024 ? round($sz / 1024, 1) . ' KB' : $sz . ' B');
                            ?>
                        </div>
                        <div class="stat-label">إجمالي الحجم</div>
                    </div>
                </div>
            </div>

            <!-- إنشاء نسخة يدوية -->
            <div
                style="background:var(--dark3);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:22px;margin-bottom:24px;">
                <h6 style="color:#ddd;margin-bottom:4px;font-weight:700;">🔧 إنشاء نسخة يدوية</h6>
                <p style="color:#555;font-size:12px;margin-bottom:14px;">تشمل النسخة: الموظفين، العمليات، المصاريف،
                    الخدمات</p>
                <div class="d-flex gap-3 flex-wrap">
                    <form method="POST">
                        <input type="hidden" name="action" value="backup" />
                        <button type="submit" class="btn btn-gold px-4">
                            <i class="fas fa-save me-2"></i>حفظ على السيرفر
                        </button>
                    </form>
                </div>
            </div>

            <!-- التنزيل المحمي بكلمة مرور -->
            <div
                style="background:rgba(201,168,76,0.05);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
                <h6 style="color:var(--gold);margin-bottom:12px;"><i class="fas fa-lock me-2"></i>تنزيل نسخة محمية بكلمة
                    مرور</h6>
                <form method="POST" class="d-flex gap-2 align-items-end flex-wrap">
                    <input type="hidden" name="action" value="download_secure" />
                    <div>
                        <label class="form-label" style="font-size:12px;">اختر النسخة</label>
                        <select name="file" class="form-select form-select-sm" style="min-width:220px;">
                            <?php foreach ($backupFiles as $f): ?>
                                <option value="<?= basename($f) ?>"><?= basename($f) ?>
                                    (<?= date('d/m/Y', filemtime($f)) ?>)</option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div>
                        <label class="form-label" style="font-size:12px;">كلمة المرور</label>
                        <input type="password" name="password" class="form-control form-control-sm"
                            placeholder="أدخل كلمة المرور" required style="min-width:180px;" />
                    </div>
                    <button type="submit" class="btn btn-gold btn-sm px-4">
                        <i class="fas fa-download me-1"></i>تنزيل
                    </button>
                </form>
                <p style="color:#555;font-size:11px;margin-top:8px;margin-bottom:0;">
                    <i class="fas fa-info-circle me-1"></i>
                    كلمة المرور محددة في ملف <code style="color:var(--gold);">backup.php</code> السطر الأول — غيّرها حسب
                    رغبتك.
                </p>
            </div>

            <!-- جدول النسخ -->
            <div class="custom-table">
                <div
                    style="padding:14px 20px;border-bottom:1px solid rgba(201,168,76,0.1);display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:#ddd;font-weight:700;font-size:14px;">📋 النسخ المحفوظة</span>
                    <span style="color:#555;font-size:12px;"><?= count($backupFiles) ?> نسخة</span>
                </div>
                <table class="table table-borderless mb-0">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>الملف</th>
                            <th>النوع</th>
                            <th>التاريخ</th>
                            <th>الحجم</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($backupFiles)): ?>
                            <tr>
                                <td colspan="6" class="text-center" style="color:#555;padding:30px;">لا توجد نسخ بعد</td>
                            </tr>
                        <?php endif; ?>
                        <?php foreach ($backupFiles as $i => $f):
                            $fname = basename($f);
                            $isAuto = str_starts_with($fname, 'auto_');
                            ?>
                            <tr>
                                <td style="color:#555;"><?= $i + 1 ?></td>
                                <td style="color:#fff;font-weight:600;">
                                    <i class="fas fa-file-code me-2" style="color:var(--gold);"></i><?= $fname ?>
                                </td>
                                <td>
                                    <span class="badge <?= $isAuto ? 'badge-green' : 'badge-blue' ?> rounded-pill">
                                        <?= $isAuto ? '🤖 تلقائي' : '👤 يدوي' ?>
                                    </span>
                                </td>
                                <td style="color:#888;"><?= date('Y/m/d h:i A', filemtime($f)) ?></td>
                                <td style="color:#3498db;">
                                    <?php $sz = filesize($f);
                                    echo $sz > 1024 ? round($sz / 1024, 1) . ' KB' : $sz . ' B'; ?>
                                </td>
                                <td>
                                    <form method="POST" style="display:inline;"
                                        onsubmit="return confirm('حذف هذه النسخة؟')">
                                        <input type="hidden" name="action" value="delete" />
                                        <input type="hidden" name="file" value="<?= $fname ?>" />
                                        <button class="btn btn-sm"
                                            style="background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.3);color:#e74c3c;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Modal كلمة المرور للتنزيل المباشر -->
    <?php
    if (isset($_GET['dl'])) {
        $file = basename($_GET['dl']);
        $path = $backupDir . $file;
        if (file_exists($path)) {
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $file . '"');
            readfile($path);
            exit;
        }
    }
    ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>