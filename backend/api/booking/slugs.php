<?php
/**
 * Public Salons Slugs API
 * GET /api/booking/slugs.php
 *
 * Returns a list of all active salon slugs that have the booking page feature enabled.
 * Used by Next.js generateStaticParams() to pre-render all salon booking pages at build time.
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

if (getMethod() !== 'GET') sendError('Method not allowed', 405);

try {
    $stmt = $pdo->query("
        SELECT s.slug, sp.features_config
        FROM salons s
        LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
        WHERE s.status = 'active'
        ORDER BY s.id ASC
    ");
    $rows = $stmt->fetchAll();

    $slugs = [];
    foreach ($rows as $row) {
        // Only include salons that have the booking page feature enabled
        $features = $row['features_config'] ? json_decode($row['features_config'], true) : [];
        if (!empty($features['has_booking_page'])) {
            $slugs[] = $row['slug'];
        }
    }

    sendSuccess(['slugs' => $slugs]);
} catch (Exception $e) {
    sendError('حدث خطأ أثناء جلب البيانات', 500);
}
