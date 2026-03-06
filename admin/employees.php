<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../includes/functions.php';
requireAdmin();

$pageTitle = 'إدارة الموظفين - AL SHAYEB';

// Handle POST actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'add') {
        $stmt = $pdo->prepare("INSERT INTO employees (name, phone, salary_type, commission_rate, base_salary) VALUES (?,?,?,?,?)");
        $stmt->execute([
            trim($_POST['name']),
            trim($_POST['phone']),
            $_POST['salary_type'],
            (float) ($_POST['commission_rate'] ?? 0),
            (float) ($_POST['base_salary'] ?? 0),
        ]);
        setFlash('success', 'تم إضافة الموظف بنجاح');
    } elseif ($action === 'edit') {
        $stmt = $pdo->prepare("UPDATE employees SET name=?, phone=?, salary_type=?, commission_rate=?, base_salary=? WHERE id=?");
        $stmt->execute([
            trim($_POST['name']),
            trim($_POST['phone']),
            $_POST['salary_type'],
            (float) ($_POST['commission_rate'] ?? 0),
            (float) ($_POST['base_salary'] ?? 0),
            (int) $_POST['id'],
        ]);
        setFlash('success', 'تم تعديل بيانات الموظف');
    } elseif ($action === 'delete') {
        try {
            $stmt = $pdo->prepare("DELETE FROM employees WHERE id=?");
            $stmt->execute([(int) $_POST['id']]);
            setFlash('success', 'تم حذف الموظف نهائياً');
        } catch (PDOException $e) {
            // Check for foreign key constraint violation
            if ($e->getCode() == '23000') {
                setFlash('error', 'لا يمكن حذف الموظف لوجود عمليات مالية مسجلة باسمه.');
            } else {
                setFlash('error', 'حدث خطأ أثناء عملية الحذف.');
            }
        }
    }
    header('Location: employees');
    exit;
}

$employees = $pdo->query("
    SELECT e.*, u.username,
           (SELECT COUNT(*) FROM transactions t WHERE t.employee_id = e.id) as tx_count,
           (SELECT COALESCE(SUM(total_amount),0) FROM transactions t WHERE t.employee_id = e.id) as total_sales
    FROM employees e
    LEFT JOIN users u ON u.employee_id = e.id
    WHERE e.is_active = 1
    ORDER BY e.created_at DESC
")->fetchAll();

require_once __DIR__ . '/../includes/header.php';
?>
</head>

<body>
    <?php require_once __DIR__ . '/../includes/sidebar_admin.php'; ?>
    <div class="main-content">
        <div class="topbar">
            <div class="topbar-title">إدارة <span>الموظفين</span></div>
            <button class="btn btn-gold btn-sm px-3" data-bs-toggle="modal" data-bs-target="#addModal">
                <i class="fas fa-plus me-1"></i> إضافة موظف
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
                            <th>الهاتف</th>
                            <th>نوع الراتب</th>
                            <th>العمولة/الراتب</th>
                            <th>الزبائن</th>
                            <th>إجمالي المبيعات</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($employees as $emp): ?>
                            <tr>
                                <td style="color:#555;">
                                    <?= $emp['id'] ?>
                                </td>
                                <td style="font-weight:600;color:#fff;">
                                    <?= clean($emp['name']) ?>
                                </td>
                                <td style="color:#aaa;">
                                    <?= clean($emp['phone'] ?? '-') ?>
                                </td>
                                <td><span
                                        class="badge <?= $emp['salary_type'] === 'commission' ? 'badge-gold' : 'badge-blue' ?> rounded-pill">
                                        <?= salaryTypeLabel($emp['salary_type']) ?>
                                    </span></td>
                                <td style="color:var(--gold);">
                                    <?= $emp['salary_type'] === 'commission' ? $emp['commission_rate'] . '%' : formatAmount($emp['base_salary']) ?>
                                </td>
                                <td><span class="badge badge-blue rounded-pill">
                                        <?= $emp['tx_count'] ?>
                                    </span></td>
                                <td style="color:#2ecc71;">
                                    <?= formatAmount($emp['total_sales']) ?>
                                </td>
                                <td>
                                    <button class="btn btn-outline-gold btn-sm me-1"
                                        onclick="editEmployee(<?= htmlspecialchars(json_encode($emp)) ?>)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <form method="POST" style="display:inline;"
                                        onsubmit="return confirm('هل أنت متأكد من حذف هذا الموظف؟')">
                                        <input type="hidden" name="action" value="delete" />
                                        <input type="hidden" name="id" value="<?= $emp['id'] ?>" />
                                        <button class="btn btn-sm"
                                            style="background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.3);color:#e74c3c;"
                                            title="حذف نهائي">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                        <?php if (empty($employees)): ?>
                            <tr>
                                <td colspan="8" class="text-center" style="color:#555;padding:30px;">لا يوجد موظفون</td>
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
                    <h5 class="modal-title"><i class="fas fa-user-plus me-2" style="color:var(--gold)"></i>إضافة موظف
                        جديد</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form method="POST">
                    <input type="hidden" name="action" value="add" />
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">الاسم *</label>
                            <input type="text" name="name" class="form-control" required placeholder="اسم الموظف" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">رقم الهاتف</label>
                            <input type="text" name="phone" class="form-control" placeholder="+965XXXXXXXX" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">نوع الراتب</label>
                            <select name="salary_type" class="form-select" id="addSalaryType"
                                onchange="toggleSalaryFields('add')">
                                <option value="commission">عمولة %</option>
                                <option value="fixed">راتب ثابت</option>
                            </select>
                        </div>
                        <div id="addCommissionField" class="mb-3">
                            <label class="form-label">نسبة العمولة %</label>
                            <input type="number" name="commission_rate" class="form-control" min="0" max="100"
                                step="0.5" value="30" />
                        </div>
                        <div id="addSalaryField" class="mb-3" style="display:none;">
                            <label class="form-label">الراتب الثابت (د.أ)</label>
                            <input type="number" name="base_salary" class="form-control" min="0" step="0.001"
                                value="0" />
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

    <!-- Edit Modal -->
    <div class="modal fade" id="editModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-edit me-2" style="color:var(--gold)"></i>تعديل بيانات
                        الموظف</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form method="POST">
                    <input type="hidden" name="action" value="edit" />
                    <input type="hidden" name="id" id="editId" />
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">الاسم *</label>
                            <input type="text" name="name" id="editName" class="form-control" required />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">رقم الهاتف</label>
                            <input type="text" name="phone" id="editPhone" class="form-control" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">نوع الراتب</label>
                            <select name="salary_type" id="editSalaryType" class="form-select"
                                onchange="toggleSalaryFields('edit')">
                                <option value="commission">عمولة %</option>
                                <option value="fixed">راتب ثابت</option>
                            </select>
                        </div>
                        <div id="editCommissionField" class="mb-3">
                            <label class="form-label">نسبة العمولة %</label>
                            <input type="number" name="commission_rate" id="editCommissionRate" class="form-control"
                                min="0" max="100" step="0.5" />
                        </div>
                        <div id="editSalaryField" class="mb-3" style="display:none;">
                            <label class="form-label">الراتب الثابت (د.أ)</label>
                            <input type="number" name="base_salary" id="editBaseSalary" class="form-control" min="0"
                                step="0.001" />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        <button type="submit" class="btn btn-gold px-4">حفظ التعديلات</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function toggleSalaryFields(prefix) {
            const type = document.getElementById(prefix + 'SalaryType').value;
            document.getElementById(prefix + 'CommissionField').style.display = type === 'commission' ? '' : 'none';
            document.getElementById(prefix + 'SalaryField').style.display = type === 'fixed' ? '' : 'none';
        }
        function editEmployee(emp) {
            document.getElementById('editId').value = emp.id;
            document.getElementById('editName').value = emp.name;
            document.getElementById('editPhone').value = emp.phone || '';
            document.getElementById('editSalaryType').value = emp.salary_type;
            document.getElementById('editCommissionRate').value = emp.commission_rate;
            document.getElementById('editBaseSalary').value = emp.base_salary;
            toggleSalaryFields('edit');
            new bootstrap.Modal(document.getElementById('editModal')).show();
        }
    </script>
</body>

</html>