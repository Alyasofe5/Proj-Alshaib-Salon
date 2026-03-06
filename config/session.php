<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * التحقق من تسجيل الدخول
 */
function requireLogin()
{
    if (!isset($_SESSION['user_id'])) {
        header('Location: ' . BASE_URL . '/auth/login');
        exit;
    }
}

/**
 * التحقق من صلاحية الأدمن
 */
function requireAdmin()
{
    requireLogin();
    if ($_SESSION['role'] !== 'admin') {
        header('Location: ' . BASE_URL . '/employee/dashboard');
        exit;
    }
}

/**
 * التحقق من صلاحية الموظف أو الأدمن
 */
function requireEmployee()
{
    requireLogin();
    if (!in_array($_SESSION['role'], ['admin', 'employee'])) {
        header('Location: ' . BASE_URL . '/auth/login.php');
        exit;
    }
}

/**
 * هل المستخدم أدمن؟
 */
function isAdmin()
{
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

/**
 * هل المستخدم موظف؟
 */
function isEmployee()
{
    return isset($_SESSION['role']) && $_SESSION['role'] === 'employee';
}

/**
 * الحصول على معرف الموظف الحالي
 */
function currentEmployeeId()
{
    return $_SESSION['employee_id'] ?? null;
}
