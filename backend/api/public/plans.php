<?php
/**
 * Public API — Get Subscription Plans (no auth required)
 * GET /api/public/plans.php
 */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$plans = $pdo->query("
    SELECT id, name, name_ar, price, duration_days, max_employees, max_services, features, is_popular
    FROM subscription_plans
    WHERE is_active = 1
    ORDER BY price ASC
")->fetchAll();

foreach ($plans as &$p) {
    if ($p['features'] && is_string($p['features'])) {
        $p['features'] = json_decode($p['features'], true) ?? [];
    } else {
        $p['features'] = [];
    }
    $p['price'] = number_format((float)$p['price'], 3, '.', '');
    $p['is_popular'] = (bool) $p['is_popular'];
}

sendSuccess($plans);
