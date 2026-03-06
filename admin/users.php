<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../includes/functions.php';
requireAdmin();

$pageTitle = 'إدارة المستخدمين - AL SHAYEB';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'add') {
        $hashedPw = password_hash($_POST['password'], PASSWORD_BCRYPT);
        $empId = !empty($_POST['employee_id']) ? (int) $_POST['employee_id'] : null;
        $stmt = $pdo->prepare("INSERT INTO users (name, username, password, role, employee_id) VALUES (?,?,?,?,?)");
        $stmt->execute([trim($_POST['name']), trim($_POST['username']), $hashedPw, $_POST['role'], $empId]);
        setFlash('success', 'تم إضافة المستخدم بنجاح');
    } elseif ($action === 'reset_password') {
        $hashedPw = password_hash($_POST['new_password'], PASSWORD_BCRYPT);
        $pdo->prepare("UPDATE users SET password=? WHERE id=?")->execute([$hashedPw, (int) $_POST['id']]);
        setFlash('success', 'تم تغيير كلمة المرور');
    } elseif ($action === 'toggle') {
        $pdo->prepare("UPDATE users SET is_active = NOT is_active WHERE id=?")->execute([(int) $_POST['id']]);
        setFlash('success', 'تم تغيير حالة المستخدم');
    } elseif ($action === 'delete') {
        if ($_POST['id'] != $_SESSION['user_id']) {
            $pdo->prepare("DELETE FROM users WHERE id=?")->execute([(int) $_POST['id']]);
            setFlash('success', 'تم حذف المستخدم بنجاح');
        } else {
            setFlash('error', 'لا يمكنك حذف حسابك الخاص');
        }
    }
    header('Location: users.php');
    exit;
}

$users = $pdo->query("SELECT u.*, e.name as emp_name FROM users u LEFT JOIN employees e ON u.employee_id = e.id ORDER BY u.role, u.name")->fetchAll();
$employees = $pdo->query("SELECT id, name FROM employees WHERE is_active=1 ORDER BY name")->fetchAll();

require_once __DIR__ . '/../includes/header.php';
?>
</head>

<body>
    <?php require_once __DIR__ . '/../includes/sidebar_admin.php'; ?>
    <div class="main-content">
        <div class="topbar">
            <div class="topbar-title">إدارة <span>المستخدمين</span></div>
            <button class="btn btn-gold btn-sm px-3" data-bs-toggle="modal" data-bs-target="#addModal">
                <i class="fas fa-user-plus me-1"></i> إضافة مستخدم
            </button>
        </div>
        <div class="content-area">
            <?php showFlash(); ?>
            <div class="custom-table">
                <table class="table table-borderless mb-0">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>الاسم</th>
                            <th>اسم الدخول</th>
                            <th>الدور</th>
                            <th>الموظف المرتبط</th>
                            <th>الحالة</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($users as $u): ?>
                            <tr>
                                <td style="color:#555;">
                                    <?= $u['id'] ?>
                                </td>
                                <td style="font-weight:600;color:#fff;">
                                    <?= clean($u['name']) ?>
                                </td>
                                <td style="color:#aaa;font-family:monospace;">
                                    <?= clean($u['username']) ?>
                                </td>
                                <td>
                                    <span
                                        class="badge <?= $u['role'] === 'admin' ? 'badge-gold' : 'badge-blue' ?> rounded-pill">
                                        <?= $u['role'] === 'admin' ? '👑 مدير' : '👨‍🔧 موظف' ?>
                                    </span>
                                </td>
                                <td style="color:#aaa;">
                                    <?= $u['emp_name'] ? clean($u['emp_name']) : '-' ?>
                                </td>
                                <td><span class="badge <?= $u['is_active'] ? 'badge-green' : 'badge-red' ?> rounded-pill">
                                        <?= $u['is_active'] ? 'نشط' : 'موقوف' ?>
                                    </span></td>
                                <td>
                                    <button class="btn btn-outline-gold btn-sm me-1"
                                        onclick="resetPassword(<?= $u['id'] ?>, '<?= clean($u['name']) ?>')">
                                        <i class="fas fa-key"></i>
                                    </button>
                                    <?php if ($u['id'] != $_SESSION['user_id']): ?>
                                        <form method="POST" style="display:inline;">
                                            <input type="hidden" name="action" value="toggle" />
                                            <input type="hidden" name="id" value="<?= $u['id'] ?>" />
                                            <button class="btn btn-sm"
                                                style="background:rgba(255,255,255,0.05);border:1px solid #333;color:#888;"
                                                title="تفعيل/إيقاف">
                                                <i class="fas fa-<?= $u['is_active'] ? 'ban' : 'check' ?>"></i>
                                            </button>
                                        </form>
                                        <form method="POST" style="display:inline;"
                                            onsubmit="return confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟');">
                                            <input type="hidden" name="action" value="delete" />
                                            <input type="hidden" name="id" value="<?= $u['id'] ?>" />
                                            <button class="btn btn-sm ms-1"
                                                style="background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.3);color:#e74c3c;"
                                                title="حذف">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </form>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
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
                    <h5 class="modal-title"><i class="fas fa-user-plus me-2" style="color:var(--gold)"></i>إضافة مستخدم
                        جديد</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form method="POST">
                    <input type="hidden" name="action" value="add" />
                    <div class="modal-body">
                        <div class="mb-3"><label class="form-label">الاسم الكامل *</label><input type="text" name="name"
                                class="form-control" required /></div>
                        <div class="mb-3"><label class="form-label">اسم الدخول *</label><input type="text"
                                name="username" class="form-control" required /></div>
                        <div class="mb-3"><label class="form-label">كلمة المرور *</label><input type="password"
                                name="password" class="form-control" required /></div>
                        <div class="mb-3">
                            <label class="form-label">الدور</label>
                            <select name="role" class="form-select" id="addRole" onchange="toggleEmpField()">
                                <option value="employee">موظف (حلاق)</option>
                                <option value="admin">مدير</option>
                            </select>
                        </div>
                        <div class="mb-3" id="empField">
                            <label class="form-label">ربط بموظف</label>
                            <select name="employee_id" class="form-select">
                                <option value="">-- اختر موظف --</option>
                                <?php foreach ($employees as $e): ?>
                                    <option value="<?= $e['id'] ?>">
                                        <?= clean($e['name']) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
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

    <!-- Reset Password Modal -->
    <div class="modal fade" id="resetModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-key me-2" style="color:var(--gold)"></i>تغيير كلمة المرور
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form method="POST">
                    <input type="hidden" name="action" value="reset_password" />
                    <input type="hidden" name="id" id="resetUserId" />
                    <div class="modal-body">
                        <p style="color:#aaa;">تغيير كلمة مرور: <strong id="resetUserName"
                                style="color:var(--gold)"></strong></p>
                        <div class="mb-3"><label class="form-label">كلمة المرور الجديدة *</label><input type="password"
                                name="new_password" class="form-control" required /></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        <button type="submit" class="btn btn-gold px-4">تغيير</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function toggleEmpField() {
            document.getElementById('empField').style.display = document.getElementById('addRole').value === 'employee' ? '' : 'none';
        }
        function resetPassword(id, name) {
            document.getElementById('resetUserId').value = id;
            document.getElementById('resetUserName').textContent = name;
            new bootstrap.Modal(document.getElementById('resetModal')).show();
        }
    </script>
</body>

</html>