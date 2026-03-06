<?php
// اختبار مباشر بدون db.php - احذف فوراً بعد الانتهاء!
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>اختبار اتصال مباشر</h2><pre>";

// جرب كلمات مرور مختلفة
$host = 'localhost';
$dbname = 'u778871816_alshaib';
$user = 'u778871816_alshaib';

// اقرأ كلمة المرور من db.php بدون تنفيذه
$content = file_get_contents(__DIR__ . '/config/db.php');
echo "محتوى db.php (جزئي):\n";
echo "---\n";
// اعرض فقط سطر DB_PASS
foreach (explode("\n", $content) as $line) {
    if (stripos($line, 'DB_PASS') !== false) {
        // اخفي كلمة المرور جزئياً
        preg_match("/['\"]([^'\"]*)['\"]\\s*\\)/", $line, $m);
        if (isset($m[1])) {
            $pass = $m[1];
            echo "DB_PASS found: '" . substr($pass, 0, 3) . "..." . substr($pass, -2) . "' (length: " . strlen($pass) . ")\n";
            
            // جرب الاتصال بهذه الكلمة
            echo "\nجاري محاولة الاتصال...\n";
            try {
                $pdo = new PDO(
                    "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
                    $user,
                    $pass,
                    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
                );
                echo "✅ الاتصال ناجح!\n";
                $pdo = null;
            } catch (PDOException $e) {
                echo "❌ فشل: " . $e->getMessage() . "\n";
            }
        } else {
            echo "⚠️ لم أستطع قراءة كلمة المرور من السطر\n";
            echo "السطر: $line\n";
        }
    }
}

echo "\n---\n";
echo "💡 نصيحة: اذهب إلى hPanel → Databases → MySQL Databases\n";
echo "واضغط Reset Password للمستخدم $user\n";
echo "ضع كلمة مرور بسيطة مثل: Salon2026!pass\n";
echo "(بدون رموز خاصة مثل $ أو ' أو \" أو \\)\n";
echo "</pre>";
