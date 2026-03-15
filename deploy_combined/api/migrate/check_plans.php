<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

$plans = $pdo->query("SELECT id, name, name_ar, price, plan_type, is_active FROM subscription_plans ORDER BY id")->fetchAll();
echo json_encode($plans, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
