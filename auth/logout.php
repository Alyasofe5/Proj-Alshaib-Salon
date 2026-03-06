<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
session_destroy();
header('Location: ' . BASE_URL . '/auth/login.php');
exit;
