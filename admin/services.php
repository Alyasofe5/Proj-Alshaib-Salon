<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../includes/functions.php';
requireAdmin();

$pageTitle = 'إدارة الخدمات - AL SHAYEB';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'add') {
        $stmt = $pdo->prepare("INSERT INTO services (name, price) VALUES (?,?)");
        $stmt->execute([trim($_POST['name']), (float) $_POST['price']]);
        setFlash('success', 'تم إضافة الخدمة بنجاح');
    } elseif ($action === 'edit') {
        $stmt = $pdo->prepare("UPDATE services SET name=?, price=? WHERE id=?");
        $stmt->execute([trim($_POST['name']), (float) $_POST['price'], (int) $_POST['id']]);
        setFlash('success', 'تم تعديل الخدمة');
    } elseif ($action === 'toggle') {
        $stmt = $pdo->prepare("UPDATE services SET is_active = NOT is_active WHERE id=?");
        $stmt->execute([(int) $_POST['id']]);
        setFlash('success', 'تم تغيير حالة الخدمة');
    } elseif ($action === 'delete') {
        try {
            $pdo->prepare("DELETE FROM services WHERE id=?")->execute([(int) $_POST['id']]);
            setFlash('success', 'تم حذف الخدمة نهائياً');
        } catch (PDOException $e) {
            if ($e->getCode() == '23000') {
                setFlash('error', 'لا يمكن حذف هذه الخدمة لوجود فواتير وتقارير مرتبطة بها. قم بإيقافها بدلاً من ذلك.');
            } else {
                setFlash('error', 'حدث خطأ أثناء عملية الحذف.');
            }
        }
    }
    header('Location: services.php');
    exit;
}

$services = $pdo->query("SELECT * FROM services ORDER BY is_active DESC, created_at DESC")->fetchAll();

require_once __DIR__ . '/../includes/header.php';
?>
</head>

<body>
    <?php require_once __DIR__ . '/../includes/sidebar_admin.php'; ?>
    <div class="main-content">
        <div class="topbar">
            <div class="topbar-title">إدارة <span>الخدمات</span></div>
            <button class="btn btn-gold btn-sm px-3" data-bs-toggle="modal" data-bs-target="#addModal">
                <i class="fas fa-plus me-1"></i> إضافة خدمة
            </button>
        </div>
        <div class="content-area">
            <?php showFlash(); ?>
            <div class="row g-3">
                <?php foreach ($services as $svc): ?>
                    <div class="col-md-4 col-6">
                        <div class="stat-card <?= $svc['is_active'] ? 'gold' : '' ?>"
                            style="<?= !$svc['is_active'] ? 'opacity:0.5' : '' ?>">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:6px;">
                                        <?= clean($svc['name']) ?>
                                    </div>
                                    <div style="font-size:22px;font-weight:800;color:var(--gold);">
                                        <?= formatAmount($svc['price']) ?>
                                    </div>
                                </div>
                                <div class="d-flex gap-1">
                                    <button class="btn btn-outline-gold btn-sm"
                                        onclick="editService(<?= htmlspecialchars(json_encode($svc)) ?>)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <input type="hidden" name="action" value="toggle" />
                                    <input type="hidden" name="id" value="<?= $svc['id'] ?>" />
                                    <button class="btn btn-sm"
                                        style="background:rgba(255,255,255,0.05);border:1px solid #333;color:#888;"
                                        title="<?= $svc['is_active'] ? 'إيقاف' : 'تفعيل' ?>">
                                        <i class="fas fa-<?= $svc['is_active'] ? 'eye-slash' : 'eye' ?>"></i>
                                    </button>
                                    </form>
                                    <form method="POST" style="display:inline;"
                                        onsubmit="return confirm('هل أنت متأكد من حذف هذه الخدمة نهائياً؟ \nملاحظة: إذا كانت الخدمة مستخدمة في فواتير سابقة، فلن تتمكن من حذفها.')">
                                        <input type="hidden" name="action" value="delete" />
                                        <input type="hidden" name="id" value="<?= $svc['id'] ?>" />
                                        <button class="btn btn-sm ms-1"
                                            style="background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.3);color:#e74c3c;"
                                            title="حذف نهائي">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </form>
                                </div>
                            </div>
                            <div style="margin-top:10px;">
                                <span class="badge <?= $svc['is_active'] ? 'badge-green' : 'badge-red' ?> rounded-pill">
                                    <?= $svc['is_active'] ? 'نشطة' : 'موقوفة' ?>
                                </span>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <!-- Add Modal -->
    <div class="modal fade" id="addModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-scissors me-2" style="color:var(--gold)"></i>إضافة خدمة
                        جديدة</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form method="POST">
                    <input type="hidden" name="action" value="add" />
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">اسم الخدمة *</label>
                            <input type="text" name="name" class="form-control" required
                                placeholder="مثال: حلاقة شعر" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">السعر (د.أ) *</label>
                            <input type="number" name="price" class="form-control" required min="0" step="0.001"
                                placeholder="0.000" />
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
                    <h5 class="modal-title"><i class="fas fa-edit me-2" style="color:var(--gold)"></i>تعديل الخدمة</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form method="POST">
                    <input type="hidden" name="action" value="edit" />
                    <input type="hidden" name="id" id="editId" />
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">اسم الخدمة *</label>
                            <input type="text" name="name" id="editName" class="form-control" required />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">السعر (د.أ) *</label>
                            <input type="number" name="price" id="editPrice" class="form-control" required min="0"
                                step="0.001" />
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
    <script>
        function editService(svc) {
            document.getElementById('editId').value = svc.id;
            document.getElementById('editName').value = svc.name;
            document.getElementById('editPrice').value = svc.price;
            new bootstrap.Modal(document.getElementById('editModal')).show();
        }
    </script>
</body>

</html>