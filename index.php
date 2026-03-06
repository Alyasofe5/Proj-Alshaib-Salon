<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/session.php';

if (isset($_SESSION['user_id'])) {
    if ($_SESSION['role'] === 'admin') {
        header('Location: ' . BASE_URL . '/admin/dashboard.php');
    } else {
        header('Location: ' . BASE_URL . '/employee/dashboard.php');
    }
} else {
    header('Location: ' . BASE_URL . '/auth/login.php');
}
exit;
