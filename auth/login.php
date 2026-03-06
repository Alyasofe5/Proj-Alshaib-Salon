<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

// إذا كان مسجل دخول، وجهه للوحة المناسبة
if (isset($_SESSION['user_id'])) {
    if ($_SESSION['role'] === 'admin') {
        header('Location: ' . BASE_URL . '/admin/dashboard.php');
    } else {
        header('Location: ' . BASE_URL . '/employee/dashboard.php');
    }
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($username && $password) {
        $stmt = $pdo->prepare("SELECT u.*, e.name as emp_name FROM users u LEFT JOIN employees e ON u.employee_id = e.id WHERE u.username = ? AND u.is_active = 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['employee_id'] = $user['employee_id'];

            if ($user['role'] === 'admin') {
                header('Location: ' . BASE_URL . '/admin/dashboard.php');
            } else {
                header('Location: ' . BASE_URL . '/employee/dashboard.php');
            }
            exit;
        } else {
            $error = 'اسم المستخدم أو كلمة المرور غير صحيحة';
        }
    } else {
        $error = 'يرجى إدخال اسم المستخدم وكلمة المرور';
    }
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>تسجيل الدخول - AL SHAYEB</title>

    <!-- PWA Settings -->
    <link rel="manifest" href="<?= BASE_URL ?>/manifest.json">
    <meta name="theme-color" content="#C9A84C">
    <link rel="apple-touch-icon" href="<?= BASE_URL ?>/assets/icons/icon-192x192.png">

    <link
        href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&family=Cinzel:wght@700&display=swap"
        rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet" />
    <style>
        :root {
            --gold: #C9A84C;
            --gold-light: #e8c96a;
            --black: #1A1A1A;
            --dark: #111111;
        }

        * {
            font-family: 'Tajawal', sans-serif;
        }

        body {
            background: var(--dark);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }

        body::before {
            content: '';
            position: fixed;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(ellipse at center, rgba(201, 168, 76, 0.08) 0%, transparent 60%);
            pointer-events: none;
        }

        .login-card {
            background: #1c1c1c;
            border: 1px solid rgba(201, 168, 76, 0.2);
            border-radius: 12px;
            padding: 48px 40px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(201, 168, 76, 0.05);
            position: relative;
            z-index: 1;
        }

        .login-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, transparent, var(--gold), transparent);
            border-radius: 12px 12px 0 0;
        }

        .logo-section {
            text-align: center;
            margin-bottom: 36px;
        }

        .logo-section .salon-name {
            font-size: 26px;
            font-weight: 800;
            color: #fff;
            letter-spacing: 2px;
        }

        .logo-section .salon-name span {
            color: var(--gold);
        }

        .logo-section .salon-sub {
            font-size: 10px;
            color: var(--gold);
            letter-spacing: 3px;
            margin-top: 4px;
        }

        .logo-icon-wrap {
            width: 100px;
            height: 100px;
            background: transparent;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 0;
        }

        .logo-icon-wrap span {
            position: relative;
        }

        .logo-icon-wrap .letter-a {
            color: #fff;
            /* White A */
            margin-right: -14px;
            /* Overlap */
            z-index: 2;
            text-shadow: 2px 2px 0 #1c1c1c;
            /* Soft shadow/outline */
        }

        .logo-icon-wrap .letter-s {
            color: var(--gold);
            z-index: 1;
        }

        .form-label {
            color: #aaa;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 6px;
        }

        .form-control {
            background: #252525;
            border: 1px solid #333;
            color: #fff;
            border-radius: 8px;
            padding: 12px 16px;
            font-family: 'Tajawal', sans-serif;
            font-size: 15px;
            transition: all 0.3s;
        }

        .form-control:focus {
            background: #2a2a2a;
            border-color: var(--gold);
            color: #fff;
            box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.15);
        }

        .form-control::placeholder {
            color: #555;
        }

        .input-group-text {
            background: #252525;
            border: 1px solid #333;
            border-left: none;
            color: var(--gold);
        }

        .btn-login {
            background: linear-gradient(135deg, var(--gold), var(--gold-light));
            border: none;
            color: var(--black);
            font-weight: 700;
            font-size: 16px;
            padding: 13px;
            border-radius: 8px;
            width: 100%;
            transition: all 0.3s;
            letter-spacing: 1px;
        }

        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(201, 168, 76, 0.4);
        }

        .alert-danger {
            background: rgba(220, 53, 69, 0.15);
            border: 1px solid rgba(220, 53, 69, 0.3);
            color: #ff6b7a;
            border-radius: 8px;
            font-size: 14px;
        }
    </style>
</head>

<body>
    <div class="login-card">
        <div class="logo-section">
            <div class="logo-icon-wrap">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
                    style="width:100%;height:100%;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
                    <defs>
                        <linearGradient id="goldGradLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#C9A84C;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#e8c96a;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <text x="55" y="70" font-family="sans-serif" font-weight="900" font-size="80" fill="#fff">A</text>
                    <text x="80" y="75" font-family="sans-serif" font-weight="bold" font-size="80"
                        fill="url(#goldGradLogin)">S</text>
                </svg>
            </div>
            <div class="salon-name">AL <span>SHAYEB</span> SALON </div>
            <div class="salon-sub">GENTLEMEN'S GROOMING</div>
        </div>

        <?php if ($error): ?>
            <div class="alert alert-danger mb-3">
                <i class="fas fa-exclamation-circle me-2"></i>
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="">
            <div class="mb-3">
                <label class="form-label"><i class="fas fa-user me-1"></i> اسم المستخدم</label>
                <input type="text" name="username" class="form-control" placeholder="أدخل اسم المستخدم"
                    value="<?= htmlspecialchars($_POST['username'] ?? '') ?>" required autofocus />
            </div>
            <div class="mb-4">
                <label class="form-label"><i class="fas fa-lock me-1"></i> كلمة المرور</label>
                <input type="password" name="password" class="form-control" placeholder="أدخل كلمة المرور" required />
            </div>
            <button type="submit" class="btn-login">
                <i class="fas fa-sign-in-alt me-2"></i> تسجيل الدخول
            </button>
        </form>


    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Register PWA Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('<?= BASE_URL ?>/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(err => {
                        console.log('ServiceWorker registration failed: ', err);
                    });
            });
        }
    </script>
</body>

</html>