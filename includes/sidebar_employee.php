<?php
$currentPage = basename($_SERVER['PHP_SELF'], '.php');
$userName = $_SESSION['user_name'] ?? 'موظف';
$initials = mb_substr($userName, 0, 1, 'UTF-8');
?>
<!-- Mobile Overlay -->
<div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>

<div class="sidebar" id="mainSidebar">
    <div class="sidebar-logo">
        <div class="logo-icon">
            <svg viewBox="0 0 100 100" class="as-logo-svg" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#C9A84C;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#e8c96a;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <text x="35" y="70" font-family="sans-serif" font-weight="900" font-size="75" fill="#fff">A</text>
                <text x="60" y="75" font-family="sans-serif" font-weight="bold" font-size="75"
                    fill="url(#goldGrad2)">S</text>
            </svg>
        </div>
        <div class="salon-name">AL <span>SHAYEB</span> SALON</div>
        <div class="salon-sub">EMPLOYEE PANEL</div>
    </div>

    <nav class="sidebar-nav">
        <div class="nav-section-title">الرئيسية</div>
        <a href="<?= BASE_URL ?>/employee/dashboard.php"
            class="nav-link-item <?= $currentPage === 'dashboard' ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-home"></i></span> لوحتي
        </a>
        <a href="<?= BASE_URL ?>/employee/new_customer.php"
            class="nav-link-item <?= $currentPage === 'new_customer' ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-plus-circle"></i></span> تسجيل زبون
        </a>

        <div class="nav-section-title">تقاريري</div>
        <a href="<?= BASE_URL ?>/employee/my_reports.php?period=daily"
            class="nav-link-item <?= ($currentPage === 'my_reports' && ($_GET['period'] ?? '') === 'daily') ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-calendar-day"></i></span> تقرير اليوم
        </a>
        <a href="<?= BASE_URL ?>/employee/my_reports.php?period=monthly"
            class="nav-link-item <?= ($currentPage === 'my_reports' && ($_GET['period'] ?? '') === 'monthly') ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-calendar-alt"></i></span> تقرير الشهر
        </a>
        <a href="<?= BASE_URL ?>/employee/my_reports.php?period=yearly"
            class="nav-link-item <?= ($currentPage === 'my_reports' && ($_GET['period'] ?? '') === 'yearly') ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-calendar"></i></span> تقرير السنة
        </a>
        <a href="<?= BASE_URL ?>/employee/print_my_report.php"
            class="nav-link-item <?= $currentPage === 'print_my_report' ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-print"></i></span> طباعة تقريري
        </a>
    </nav>

    <div class="sidebar-footer">
        <div class="user-info">
            <div class="user-avatar"><?= $initials ?></div>
            <div>
                <div class="user-name"><?= clean($userName) ?></div>
                <div class="user-role"><i class="fas fa-cut me-1"></i>حلاق</div>
            </div>
        </div>
        <a href="<?= BASE_URL ?>/auth/logout.php" class="btn-logout">
            <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
        </a>
    </div>
</div>

<script>
    function openSidebar() { document.getElementById('mainSidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('active'); }
    function closeSidebar() { document.getElementById('mainSidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('active'); }
</script>