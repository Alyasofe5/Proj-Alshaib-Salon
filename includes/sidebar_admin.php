<?php
$currentPage = basename($_SERVER['PHP_SELF'], '.php');
$userName = $_SESSION['user_name'] ?? 'Admin';
$initials = mb_substr($userName, 0, 1, 'UTF-8');
?>
<!-- Mobile Overlay -->
<div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>

<div class="sidebar" id="mainSidebar">
    <div class="sidebar-logo">
        <div class="logo-icon">
            <svg viewBox="0 0 100 100" class="as-logo-svg" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#C9A84C;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#e8c96a;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <text x="35" y="70" font-family="sans-serif" font-weight="900" font-size="75" fill="#fff">A</text>
                <text x="60" y="75" font-family="sans-serif" font-weight="bold" font-size="75"
                    fill="url(#goldGrad)">S</text>
            </svg>
        </div>
        <div class="salon-name">AL <span>SHAYEB</span> SALON</div>
        <div class="salon-sub">MANAGEMENT SYSTEM</div>
    </div>

    <nav class="sidebar-nav">
        <div class="nav-section-title">الرئيسية</div>
        <a href="<?= BASE_URL ?>/admin/dashboard"
            class="nav-link-item <?= $currentPage === 'dashboard' ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-chart-pie"></i></span> لوحة التحكم
        </a>

        <div class="nav-section-title">الإدارة</div>
        <a href="<?= BASE_URL ?>/admin/employees"
            class="nav-link-item <?= $currentPage === 'employees' ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-users"></i></span> الموظفون
        </a>
        <a href="<?= BASE_URL ?>/admin/services"
            class="nav-link-item <?= $currentPage === 'services' ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-scissors"></i></span> الخدمات
        </a>
        <a href="<?= BASE_URL ?>/admin/expenses"
            class="nav-link-item <?= $currentPage === 'expenses' ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-file-invoice-dollar"></i></span> المصاريف
        </a>

        <div class="nav-section-title">التقارير</div>
        <a href="<?= BASE_URL ?>/admin/reports"
            class="nav-link-item <?= $currentPage === 'reports' ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-chart-bar"></i></span> التقارير الشاملة
        </a>
        <a href="<?= BASE_URL ?>/admin/print_report"
            class="nav-link-item <?= $currentPage === 'print_report' ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-print"></i></span> طباعة التقارير
        </a>

        <div class="nav-section-title">الإعدادات</div>
        <a href="<?= BASE_URL ?>/admin/users" class="nav-link-item <?= $currentPage === 'users' ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-user-cog"></i></span> المستخدمون
        </a>
        <a href="<?= BASE_URL ?>/admin/backup"
            class="nav-link-item <?= $currentPage === 'backup' ? 'active' : '' ?>">
            <span class="nav-icon"><i class="fas fa-database"></i></span> النسخ الاحتياطي
        </a>
    </nav>

    <div class="sidebar-footer">
        <div class="user-info">
            <div class="user-avatar"><?= $initials ?></div>
            <div>
                <div class="user-name"><?= clean($userName) ?></div>
                <div class="user-role"><i class="fas fa-crown me-1"></i>مدير النظام</div>
            </div>
        </div>
        <a href="<?= BASE_URL ?>/auth/logout" class="btn-logout">
            <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
        </a>
    </div>
</div>

<script>
    function openSidebar() { document.getElementById('mainSidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('active'); }
    function closeSidebar() { document.getElementById('mainSidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('active'); }
</script>