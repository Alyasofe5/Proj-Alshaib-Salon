<?php
/**
 * Salon (Tenant) Middleware
 */

require_once __DIR__ . '/../config/db.php';

function buildSalonSelectSql(string $whereClause = 'WHERE s.id = ?'): string
{
    $hasPlanTable = dbTableExists('subscription_plans');
    $hasSalonPlanId = dbHasColumn('salons', 'subscription_plan_id');
    $hasSalonStatus = dbHasColumn('salons', 'status');
    $hasSalonExpires = dbHasColumn('salons', 'subscription_expires_at');
    $hasPlanType = $hasPlanTable && dbHasColumn('subscription_plans', 'plan_type');
    $hasFeaturesConfig = $hasPlanTable && dbHasColumn('subscription_plans', 'features_config');
    $hasPlanName = $hasPlanTable && dbHasColumn('subscription_plans', 'name');
    $hasPlanNameAr = $hasPlanTable && dbHasColumn('subscription_plans', 'name_ar');
    $hasMaxEmployees = $hasPlanTable && dbHasColumn('subscription_plans', 'max_employees');
    $hasMaxServices = $hasPlanTable && dbHasColumn('subscription_plans', 'max_services');

    $select = [
        's.*',
        ($hasPlanName ? 'sp.name' : 'NULL') . ' AS plan_name',
        ($hasPlanNameAr ? 'sp.name_ar' : 'NULL') . ' AS plan_name_ar',
        ($hasMaxEmployees ? 'sp.max_employees' : '999') . ' AS max_employees',
        ($hasMaxServices ? 'sp.max_services' : '999') . ' AS max_services',
        ($hasPlanType ? 'sp.plan_type' : "'free'") . ' AS plan_type',
        ($hasFeaturesConfig ? 'sp.features_config' : 'NULL') . ' AS features_config',
        ($hasSalonStatus ? 's.status' : "'active'") . ' AS status',
        ($hasSalonExpires ? 's.subscription_expires_at' : 'NULL') . ' AS subscription_expires_at',
    ];

    $sql = "SELECT " . implode(",\n               ", $select) . "\n        FROM salons s";
    if ($hasPlanTable && $hasSalonPlanId) {
        $sql .= "\n        LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id";
    }
    $sql .= "\n        " . $whereClause;

    return $sql;
}

function getSalonId(array $user): int
{
    $salonId = (int)($user['salon_id'] ?? 0);
    if ($salonId <= 0) {
        sendError('لم يتم تحديد الصالون', 400);
    }
    return $salonId;
}

function validateSalonSubscription(int $salonId): array
{
    global $pdo;

    $stmt = $pdo->prepare(buildSalonSelectSql());
    $stmt->execute([$salonId]);
    $salon = $stmt->fetch();

    if (!$salon) {
        sendError('الصالون غير موجود', 404);
    }

    if (($salon['status'] ?? 'active') === 'suspended') {
        sendError('تم إيقاف اشتراك هذا الصالون. يرجى التواصل مع الإدارة لتفعيل الاشتراك.', 403);
    }

    if (($salon['status'] ?? 'active') === 'expired') {
        sendError('انتهى اشتراك هذا الصالون. يرجى تجديد الاشتراك للمتابعة.', 403);
    }

    if (!empty($salon['subscription_expires_at']) && strtotime($salon['subscription_expires_at']) < time()) {
        if (dbHasColumn('salons', 'status')) {
            $pdo->prepare("UPDATE salons SET status = 'expired' WHERE id = ?")->execute([$salonId]);
        }
        sendError('انتهى اشتراك هذا الصالون. يرجى تجديد الاشتراك للمتابعة.', 403);
    }

    return $salon;
}

function getSubscriptionDaysLeft(array $salon): ?int
{
    if (empty($salon['subscription_expires_at'])) {
        return null;
    }

    $expiresAt = strtotime($salon['subscription_expires_at']);
    $daysLeft = (int)ceil(($expiresAt - time()) / 86400);
    return max(0, $daysLeft);
}

function isSuperAdmin(array $user): bool
{
    return ($user['role'] ?? '') === 'super_admin';
}

if (!function_exists('requireSuperAdmin')) {
    function requireSuperAdmin(): array
    {
        $user = authenticate();
        if (!isSuperAdmin($user)) {
            sendError('هذا الإجراء يتطلب صلاحية مدير المنصة', 403);
        }
        return $user;
    }
}

function resolveCurrentTenant(bool $checkSubscription = true): array
{
    $user = authenticate();
    $salonId = getSalonId($user);

    if (isSuperAdmin($user)) {
        if (isset($_GET['salon_id'])) {
            $salonId = (int)$_GET['salon_id'];
        }
        $salon = getSalonInfo($salonId);
        return [$user, $salonId, $salon];
    }

    $salon = $checkSubscription ? validateSalonSubscription($salonId) : getSalonInfo($salonId);
    return [$user, $salonId, $salon];
}

function getSalonInfo(int $salonId): array
{
    global $pdo;

    $stmt = $pdo->prepare(buildSalonSelectSql());
    $stmt->execute([$salonId]);
    $salon = $stmt->fetch();

    if (!$salon) {
        sendError('الصالون غير موجود', 404);
    }

    return $salon;
}

function checkEmployeeLimit(int $salonId, array $salon): void
{
    global $pdo;

    $maxEmployees = (int)($salon['max_employees'] ?? 999);
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM employees WHERE salon_id = ? AND is_active = 1");
    $stmt->execute([$salonId]);
    $count = (int)$stmt->fetchColumn();

    if ($count >= $maxEmployees) {
        sendError("لقد وصلت للحد الأقصى من الموظفين ({$maxEmployees}) في باقتك الحالية. يرجى الترقية.", 403);
    }
}

function checkServiceLimit(int $salonId, array $salon): void
{
    global $pdo;

    $maxServices = (int)($salon['max_services'] ?? 999);
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM services WHERE salon_id = ? AND is_active = 1");
    $stmt->execute([$salonId]);
    $count = (int)$stmt->fetchColumn();

    if ($count >= $maxServices) {
        sendError("لقد وصلت للحد الأقصى من الخدمات ({$maxServices}) في باقتك الحالية. يرجى الترقية.", 403);
    }
}

function getSalonFeaturesConfig(array $salon): array
{
    $raw = $salon['features_config'] ?? null;
    if (!$raw) {
        return [
            'has_booking_page' => false,
            'has_advanced_reports' => false,
            'has_whatsapp' => false,
            'has_multi_branch' => false,
            'has_custom_api' => false,
            'has_priority_support' => false,
            'has_full_customize' => false,
            'max_bookings_month' => 50,
        ];
    }

    $config = is_string($raw) ? json_decode($raw, true) : $raw;
    return is_array($config) ? $config : [];
}

function hasFeature(array $salon, string $feature): bool
{
    $config = getSalonFeaturesConfig($salon);
    return !empty($config[$feature]);
}

function getPlanType(array $salon): string
{
    return $salon['plan_type'] ?? 'free';
}

function getSalonBranches(int $userId): array
{
    global $pdo;

    $hasPlanTable = dbTableExists('subscription_plans');
    $hasSalonPlanId = dbHasColumn('salons', 'subscription_plan_id');
    $hasSalonStatus = dbHasColumn('salons', 'status');
    $hasSalonExpires = dbHasColumn('salons', 'subscription_expires_at');
    $hasOwnerUserId = dbHasColumn('salons', 'owner_user_id');
    $hasPlanType = $hasPlanTable && dbHasColumn('subscription_plans', 'plan_type');
    $hasPlanNameAr = $hasPlanTable && dbHasColumn('subscription_plans', 'name_ar');

    $select = "
        SELECT DISTINCT s.id, s.name, s.slug,
               " . ($hasSalonStatus ? "s.status" : "'active'") . " AS status,
               s.logo_path,
               " . ($hasPlanNameAr ? "sp.name_ar" : "NULL") . " AS plan_name,
               " . ($hasPlanType ? "sp.plan_type" : "'free'") . " AS plan_type,
               " . ($hasSalonExpires ? "s.subscription_expires_at" : "NULL") . " AS subscription_expires_at
        FROM salons s
        " . (($hasPlanTable && $hasSalonPlanId) ? "LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id" : "") . "
        INNER JOIN users u ON u.salon_id = s.id AND u.id = ?
        " . ($hasSalonStatus ? "WHERE s.status = 'active'" : "") . "
        ORDER BY s.id
    ";

    $stmt = $pdo->prepare($select);
    $stmt->execute([$userId]);
    $directSalons = $stmt->fetchAll();

    $linkedSalons = [];
    if ($hasOwnerUserId) {
        $ownerSql = "
            SELECT s.id, s.name, s.slug,
                   " . ($hasSalonStatus ? "s.status" : "'active'") . " AS status,
                   s.logo_path,
                   " . ($hasPlanNameAr ? "sp.name_ar" : "NULL") . " AS plan_name,
                   " . ($hasPlanType ? "sp.plan_type" : "'free'") . " AS plan_type,
                   " . ($hasSalonExpires ? "s.subscription_expires_at" : "NULL") . " AS subscription_expires_at
            FROM salons s
            " . (($hasPlanTable && $hasSalonPlanId) ? "LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id" : "") . "
            WHERE s.owner_user_id = ?
            " . ($hasSalonStatus ? "AND s.status = 'active'" : "") . "
            ORDER BY s.id
        ";

        $stmt2 = $pdo->prepare($ownerSql);
        $stmt2->execute([$userId]);
        $linkedSalons = $stmt2->fetchAll();
    }

    $merged = [];
    $seen = [];
    foreach (array_merge($directSalons, $linkedSalons) as $salon) {
        if (!in_array($salon['id'], $seen, true)) {
            $seen[] = $salon['id'];
            $merged[] = $salon;
        }
    }

    return $merged;
}
