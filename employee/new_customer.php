<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../includes/functions.php';
requireEmployee();

if (isAdmin()) {
    header('Location: ' . BASE_URL . '/admin/dashboard');
    exit;
}

$pageTitle = 'تسجيل زبون - AL SHAYEB';
$empId = currentEmployeeId();

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $serviceIds = $_POST['service_ids'] ?? [];
    $paymentMethod = $_POST['payment_method'] ?? 'cash';
    $notes = trim($_POST['notes'] ?? '');

    // تحقق من وجود employee_id
    if (empty($empId)) {
        setFlash('error', '❌ خطأ: لا يوجد معرف موظف مرتبط بحسابك. يرجى التواصل مع المدير.');
    } elseif (empty($serviceIds)) {
        setFlash('error', 'يرجى اختيار خدمة واحدة على الأقل');
    } else {
        try {
            // احسب الإجمالي من الخدمات المختارة
            $placeholders = implode(',', array_fill(0, count($serviceIds), '?'));
            $stmt = $pdo->prepare("SELECT id, price FROM services WHERE id IN ($placeholders) AND is_active=1");
            $stmt->execute($serviceIds);
            $selectedServices = $stmt->fetchAll();

            if (empty($selectedServices)) {
                setFlash('error', '❌ الخدمات المختارة غير موجودة أو غير نشطة');
            } else {
                $total = array_sum(array_column($selectedServices, 'price'));

                // أدخل العملية
                $stmt = $pdo->prepare("INSERT INTO transactions (employee_id, total_amount, payment_method, notes) VALUES (?,?,?,?)");
                $stmt->execute([$empId, $total, $paymentMethod, $notes]);
                $txId = $pdo->lastInsertId();

                // أدخل تفاصيل العملية
                $stmt = $pdo->prepare("INSERT INTO transaction_details (transaction_id, service_id, price) VALUES (?,?,?)");
                foreach ($selectedServices as $svc) {
                    $stmt->execute([$txId, $svc['id'], $svc['price']]);
                }

                setFlash('success', "✅ تم تسجيل الزبون بنجاح! المبلغ: " . formatAmount($total));
                header('Location: ' . BASE_URL . '/employee/dashboard');
                exit;
            }
        } catch (PDOException $e) {
            setFlash('error', '❌ خطأ في قاعدة البيانات: ' . $e->getMessage());
        }
    }
}


// Get active services
$services = $pdo->query("SELECT * FROM services WHERE is_active=1 ORDER BY name")->fetchAll();

require_once __DIR__ . '/../includes/header.php';
?>
</head>

<body>
    <?php require_once __DIR__ . '/../includes/sidebar_employee.php'; ?>
    <div class="main-content">
        <div class="topbar">
            <div class="topbar-title">➕ تسجيل <span>زبون جديد</span></div>
            <a href="<?= BASE_URL ?>/employee/dashboard.php" class="btn btn-outline-gold btn-sm px-3">
                <i class="fas fa-arrow-right me-1"></i> رجوع
            </a>
        </div>
        <div class="content-area">
            <?php showFlash(); ?>

            <div class="row g-4">
                <!-- Services Selection -->
                <div class="col-md-7">
                    <div class="chart-card">
                        <div class="chart-card-title">✂️ اختر <span>الخدمات</span></div>
                        <div class="row g-2" id="servicesGrid">
                            <?php foreach ($services as $svc): ?>
                                <div class="col-6 col-md-4">
                                    <div class="service-card" data-id="<?= $svc['id'] ?>" data-price="<?= $svc['price'] ?>"
                                        data-name="<?= clean($svc['name']) ?>" onclick="toggleService(this)" style="
                     background: #252525;
                     border: 2px solid #333;
                     border-radius: 10px;
                     padding: 16px 12px;
                     text-align: center;
                     cursor: pointer;
                     transition: all 0.2s;
                   ">
                                        <div style="font-size: 22px; margin-bottom: 6px;">✂️</div>
                                        <div style="font-size: 13px; font-weight: 600; color: #ddd; margin-bottom: 4px;">
                                            <?= clean($svc['name']) ?>
                                        </div>
                                        <div style="font-size: 15px; font-weight: 800; color: var(--gold);">
                                            <?= formatAmount($svc['price']) ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

                <!-- Order Summary -->
                <div class="col-md-5">
                    <div class="chart-card" style="position: sticky; top: 80px;">
                        <div class="chart-card-title">🧾 ملخص <span>العملية</span></div>

                        <!-- Selected services list -->
                        <div id="selectedList" style="min-height: 80px; margin-bottom: 16px;">
                            <div id="emptyMsg" style="color: #555; text-align: center; padding: 20px; font-size: 13px;">
                                <i class="fas fa-hand-pointer fa-2x mb-2" style="display:block;"></i>
                                اختر خدمة من اليسار
                            </div>
                        </div>

                        <div style="border-top: 1px solid #333; padding-top: 14px; margin-bottom: 16px;">
                            <div class="d-flex justify-content-between align-items-center">
                                <span style="color: #aaa; font-size: 14px;">الإجمالي:</span>
                                <span id="totalDisplay"
                                    style="font-size: 24px; font-weight: 800; color: var(--gold);">0.000 د.أ</span>
                            </div>
                        </div>

                        <form method="POST" id="txForm">
                            <!-- Hidden service IDs -->
                            <div id="hiddenInputs"></div>

                            <div class="mb-3">
                                <label class="form-label">طريقة الدفع</label>
                                <div class="d-flex gap-2">
                                    <label class="payment-opt"
                                        style="flex:1;text-align:center;padding:10px;border:2px solid #333;border-radius:8px;cursor:pointer;transition:all 0.2s;">
                                        <input type="radio" name="payment_method" value="cash" checked
                                            style="display:none;" />
                                        💵 نقداً
                                    </label>

                                    <label class="payment-opt"
                                        style="flex:1;text-align:center;padding:10px;border:2px solid #333;border-radius:8px;cursor:pointer;transition:all 0.2s;">
                                        <input type="radio" name="payment_method" value="transfer"
                                            style="display:none;" />
                                        🏦 تحويل
                                    </label>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">ملاحظات (اختياري)</label>
                                <textarea name="notes" class="form-control" rows="2"
                                    placeholder="أي ملاحظات..."></textarea>
                            </div>

                            <button type="submit" id="submitBtn" class="btn btn-gold w-100 py-3" style="font-size:16px;"
                                disabled>
                                <i class="fas fa-check-circle me-2"></i> حفظ العملية
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <style>
        .service-card.selected {
            border-color: var(--gold) !important;
            background: rgba(201, 168, 76, 0.1) !important;
            transform: scale(1.02);
        }

        .service-card:hover {
            border-color: #555 !important;
        }

        .payment-opt:has(input:checked) {
            border-color: var(--gold) !important;
            background: rgba(201, 168, 76, 0.1);
            color: var(--gold);
        }
    </style>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        let selectedServices = {};

        function toggleService(card) {
            const id = card.dataset.id;
            const price = parseFloat(card.dataset.price);
            const name = card.dataset.name;

            if (selectedServices[id]) {
                delete selectedServices[id];
                card.classList.remove('selected');
            } else {
                selectedServices[id] = { price, name };
                card.classList.add('selected');
            }
            updateSummary();
        }

        function updateSummary() {
            const list = document.getElementById('selectedList');
            const emptyMsg = document.getElementById('emptyMsg');
            const hiddenInputs = document.getElementById('hiddenInputs');
            const totalDisplay = document.getElementById('totalDisplay');
            const submitBtn = document.getElementById('submitBtn');

            const keys = Object.keys(selectedServices);

            if (keys.length === 0) {
                list.innerHTML = '<div id="emptyMsg" style="color:#555;text-align:center;padding:20px;font-size:13px;"><i class="fas fa-hand-pointer fa-2x mb-2" style="display:block;"></i>اختر خدمة من اليسار</div>';
                hiddenInputs.innerHTML = '';
                totalDisplay.textContent = '0.000 د.أ';
                submitBtn.disabled = true;
                return;
            }

            let html = '';
            let hidden = '';
            let total = 0;

            keys.forEach(id => {
                const svc = selectedServices[id];
                total += svc.price;
                html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #2a2a2a;">
      <span style="color:#ddd;font-size:13px;">${svc.name}</span>
      <span style="color:var(--gold);font-weight:700;">${svc.price.toFixed(3)} د.أ</span>
    </div>`;
                hidden += `<input type="hidden" name="service_ids[]" value="${id}"/>`;
            });

            list.innerHTML = html;
            hiddenInputs.innerHTML = hidden;
            totalDisplay.textContent = total.toFixed(3) + ' د.أ';
            submitBtn.disabled = false;
        }

        // Payment option styling
        document.querySelectorAll('.payment-opt').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.payment-opt').forEach(o => {
                    o.style.borderColor = '#333';
                    o.style.background = '';
                    o.style.color = '';
                });
                opt.style.borderColor = 'var(--gold)';
                opt.style.background = 'rgba(201,168,76,0.1)';
                opt.style.color = 'var(--gold)';
            });
        });
        // Set initial state
        document.querySelector('.payment-opt').click();
    </script>
</body>

</html>