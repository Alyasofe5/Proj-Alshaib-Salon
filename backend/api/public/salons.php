<?php
/**
 * Public - Salons List
 * GET /api/public/salons.php
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    try {
        global $pdo;
        
        // Fetch real salons - using COALESCE because the table has name_ar and name_en columns
        $stmt = $pdo->query("
            SELECT 
                s.id,
                s.slug,
                s.status,
                COALESCE(s.name_ar, s.name_en, 'صالون') AS name,
                s.logo_path,
                s.settings,
                (SELECT COUNT(*) FROM services sv WHERE sv.salon_id = s.id AND sv.is_active = 1) AS services_count,
                (SELECT COUNT(*) FROM employees e WHERE e.salon_id = s.id AND e.is_active = 1) AS employees_count
            FROM salons s
            WHERE s.status = 'active'
            ORDER BY s.created_at DESC
        ");
        $salons = $stmt->fetchAll();

        // Format response for mobile app
        $formattedSalons = array_map(function($salon) {
            // Try to extract hero image from settings JSON
            $heroImage = null;
            if (!empty($salon['settings'])) {
                $settings = json_decode($salon['settings'], true);
                $heroImage = $settings['heroImage'] ?? $settings['hero_image'] ?? null;
            }

            return [
                'id'              => (int) $salon['id'],
                'slug'            => $salon['slug'],
                'status'          => $salon['status'],
                'name'            => $salon['name'],
                'logo_path'       => $salon['logo_path'] ?? null,
                'hero_image'      => $heroImage,
                'services_count'  => (int) $salon['services_count'],
                'employees_count' => (int) $salon['employees_count'],
            ];
        }, $salons);

        sendSuccess(['salons' => $formattedSalons]);
    } catch (Exception $e) {
        sendError('فشل جلب الصالونات: ' . $e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
