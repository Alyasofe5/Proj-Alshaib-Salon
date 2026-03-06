<?php
// ملف تشخيص مؤقت - احذفه بعد الانتهاء
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>🔍 تشخيص أخطاء الصالون</h2><pre>";

// 1. فحص اتصال قاعدة البيانات
echo "1. فحص اتصال DB...\n";
try {
    require_once __DIR__ . '/config/db.php';
    echo "   ✅ اتصال DB ناجح\n\n";
} catch (Exception $e) {
    echo "   ❌ خطأ DB: " . $e->getMessage() . "\n\n";
}

// 2. فحص الجداول
echo "2. فحص الجداول...\n";
$tables = ['employees', 'expenses', 'services', 'transactions', 'transaction_details', 'users'];
foreach ($tables as $t) {
    try {
        $r = $pdo->query("SELECT COUNT(*) as cnt FROM `$t`");
        $row = $r->fetch();
        echo "   ✅ $t: {$row['cnt']} سجلات\n";
    } catch (Exception $e) {
        echo "   ❌ $t: " . $e->getMessage() . "\n";
    }
}

// 3. فحص ملفات مطلوبة
echo "\n3. فحص الملفات...\n";
$files = [
    'config/db.php',
    'config/session.php',
    'includes/functions.php',
    'includes/header.php',
    'includes/sidebar_admin.php',
    'admin/expenses.php',
    'admin/reports.php',
    'admin/services.php',
];
foreach ($files as $f) {
    $path = __DIR__ . '/' . $f;
    echo (file_exists($path) ? "   ✅" : "   ❌") . " $f\n";
}

// 4. فحص أعمدة جدول expenses
echo "\n4. فحص أعمدة expenses...\n";
try {
    $cols = $pdo->query("DESCRIBE expenses")->fetchAll();
    foreach ($cols as $col) {
        echo "   📋 {$col['Field']} ({$col['Type']})\n";
    }
} catch (Exception $e) {
    echo "   ❌ خطأ: " . $e->getMessage() . "\n";
}

// 5. فحص أعمدة جدول transactions
echo "\n5. فحص أعمدة transactions...\n";
try {
    $cols = $pdo->query("DESCRIBE transactions")->fetchAll();
    foreach ($cols as $col) {
        echo "   📋 {$col['Field']} ({$col['Type']})\n";
    }
} catch (Exception $e) {
    echo "   ❌ خطأ: " . $e->getMessage() . "\n";
}

// 6. اختبار الاستعلامات المستخدمة في expenses.php
echo "\n6. اختبار استعلامات expenses.php...\n";
$month = date('Y-m');
try {
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as cnt FROM transactions WHERE DATE_FORMAT(created_at,'%Y-%m')=?");
    $stmt->execute([$month]);
    $row = $stmt->fetch();
    echo "   ✅ استعلام الدخل: total={$row['total']}, cnt={$row['cnt']}\n";
} catch (Exception $e) {
    echo "   ❌ خطأ استعلام الدخل: " . $e->getMessage() . "\n";
}

try {
    $stmt = $pdo->prepare("SELECT * FROM expenses WHERE DATE_FORMAT(created_at,'%Y-%m') = ? ORDER BY created_at DESC");
    $stmt->execute([$month]);
    $expenses = $stmt->fetchAll();
    echo "   ✅ استعلام المصاريف: " . count($expenses) . " سجلات\n";
} catch (Exception $e) {
    echo "   ❌ خطأ استعلام المصاريف: " . $e->getMessage() . "\n";
}

// 7. فحص PHP version و extensions
echo "\n7. معلومات PHP...\n";
echo "   PHP Version: " . phpversion() . "\n";
echo "   PDO MySQL: " . (extension_loaded('pdo_mysql') ? '✅' : '❌') . "\n";
echo "   mbstring: " . (extension_loaded('mbstring') ? '✅' : '❌') . "\n";

echo "\n</pre>";
echo "<p style='color:red;font-weight:bold;'>⚠️ احذف هذا الملف بعد الانتهاء من التشخيص!</p>";
