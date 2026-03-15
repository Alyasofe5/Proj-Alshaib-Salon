<?php
/**
 * Salon (Tenant) Middleware
 * ========================
 * Multi-Tenancy Core: يحدد الصالون الحالي ويعزل البيانات
 * 
 * Pattern: Tenant Context Resolution
 * - يستخرج salon_id من JWT Token
 * - يتحقق من حالة الاشتراك (active/suspended/expired)
 * - يوفر helper functions لفلترة الـ queries
 * 
 * Best Practice: Centralized Data Scoping (مثل Stripe, Shopify)
 */

require_once __DIR__ . '/../config/db.php';

/**
 * استخراج salon_id من بيانات المستخدم المصادق
 * يُستدعى بعد authenticate() دائماً
 */
function getSalonId(array $user): int
{
    $salonId = (int)($user['salon_id'] ?? 0);
    if ($salonId <= 0) {
        sendError('لم يتم تحديد الصالون', 400);
    }
    return $salonId;
}

/**
 * التحقق من حالة اشتراك الصالون
 * يُستدعى في كل request محمي
 * 
 * @return array بيانات الصالون
 */
function validateSalonSubscription(int $salonId): array
{
    global $pdo;

    $stmt = $pdo->prepare("
        SELECT s.*, sp.name as plan_name, sp.name_ar as plan_name_ar,
               sp.max_employees, sp.max_services,
               sp.plan_type, sp.features_config
        FROM salons s
        LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
        WHERE s.id = ?
    ");
    $stmt->execute([$salonId]);
    $salon = $stmt->fetch();

    if (!$salon) {
        sendError('الصالون غير موجود', 404);
    }

    // التحقق من حالة الاشتراك
    if ($salon['status'] === 'suspended') {
        sendError('تم إيقاف اشتراك هذا الصالون. يرجى التواصل مع الإدارة لتفعيل الاشتراك.', 403);
    }

    if ($salon['status'] === 'expired') {
        sendError('انتهى اشتراك هذا الصالون. يرجى تجديد الاشتراك للمتابعة.', 403);
    }

    // التحقق من تاريخ الانتهاء
    if ($salon['subscription_expires_at'] && strtotime($salon['subscription_expires_at']) < time()) {
        // تحديث الحالة تلقائياً
        $pdo->prepare("UPDATE salons SET status = 'expired' WHERE id = ?")->execute([$salonId]);
        sendError('انتهى اشتراك هذا الصالون. يرجى تجديد الاشتراك للمتابعة.', 403);
    }

    return $salon;
}

/**
 * حساب الأيام المتبقية في الاشتراك
 */
function getSubscriptionDaysLeft(array $salon): ?int
{
    if (empty($salon['subscription_expires_at'])) return null;
    $expiresAt = strtotime($salon['subscription_expires_at']);
    $daysLeft = (int)ceil(($expiresAt - time()) / 86400);
    return max(0, $daysLeft);
}

/**
 * التحقق مما إذا كان المستخدم super_admin (مالك المنصة)
 */
function isSuperAdmin(array $user): bool
{
    return ($user['role'] ?? '') === 'super_admin';
}

/**
 * التحقق من صلاحية Super Admin
 * مُحاطة بـ function_exists لتجنب redeclaration عند تضمين auth.php أيضاً
 */
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

/**
 * الحصول على بيانات الصالون الحالي مع التحقق من الاشتراك
 * Helper يجمع: authenticate + getSalonId + validateSubscription
 * 
 * يُستدعى في بداية كل API endpoint:
 *   [$user, $salonId, $salon] = resolveCurrentTenant();
 */
function resolveCurrentTenant(bool $checkSubscription = true): array
{
    $user = authenticate();
    $salonId = getSalonId($user);

    // Super Admin يتجاوز فحص الاشتراك
    if (isSuperAdmin($user)) {
        // إذا Super Admin يتصفح صالون معين عبر query param
        if (isset($_GET['salon_id'])) {
            $salonId = (int)$_GET['salon_id'];
        }
        $salon = getSalonInfo($salonId);
        return [$user, $salonId, $salon];
    }

    $salon = $checkSubscription
        ? validateSalonSubscription($salonId)
        : getSalonInfo($salonId);

    return [$user, $salonId, $salon];
}

/**
 * جلب بيانات الصالون بدون التحقق من الاشتراك
 */
function getSalonInfo(int $salonId): array
{
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT s.*, sp.name as plan_name, sp.name_ar as plan_name_ar,
               sp.max_employees, sp.max_services,
               sp.plan_type, sp.features_config
        FROM salons s
        LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
        WHERE s.id = ?
    ");
    $stmt->execute([$salonId]);
    $salon = $stmt->fetch();
    if (!$salon) sendError('الصالون غير موجود', 404);
    return $salon;
}

/**
 * التحقق من عدم تجاوز حد الموظفين
 */
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

/**
 * التحقق من عدم تجاوز حد الخدمات
 */
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

/**
 * استخراج features_config من بيانات الصالون
 * @return array خريطة المميزات الفعّالة
 */
function getSalonFeaturesConfig(array $salon): array
{
    $raw = $salon['features_config'] ?? null;
    if (!$raw) {
        // fallback defaults (free plan)
        return [
            'has_booking_page'     => false,
            'has_advanced_reports'  => false,
            'has_whatsapp'         => false,
            'has_multi_branch'     => false,
            'has_custom_api'       => false,
            'has_priority_support' => false,
            'has_full_customize'   => false,
            'max_bookings_month'   => 50,
        ];
    }
    $config = is_string($raw) ? json_decode($raw, true) : $raw;
    return is_array($config) ? $config : [];
}

/**
 * التحقق مما إذا كانت ميزة معينة مفعّلة في الباقة
 */
function hasFeature(array $salon, string $feature): bool
{
    $config = getSalonFeaturesConfig($salon);
    return !empty($config[$feature]);
}

/**
 * الحصول على نوع الباقة
 */
function getPlanType(array $salon): string
{
    return $salon['plan_type'] ?? 'free';
}

/**
 * الحصول على فروع الصالون (Enterprise)
 * يُرجع الفروع التابعة لنفس المالك
 */
function getSalonBranches(int $userId): array
{
    global $pdo;
    
    // Get all salons where this user is admin
    $stmt = $pdo->prepare("
        SELECT DISTINCT s.id, s.name, s.slug, s.status, s.logo_path,
               sp.name_ar as plan_name, sp.plan_type,
               s.subscription_expires_at
        FROM salons s
        LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
        INNER JOIN users u ON u.salon_id = s.id AND u.id = ?
        WHERE s.status = 'active'
        ORDER BY s.id
    ");
    $stmt->execute([$userId]);
    $directSalons = $stmt->fetchAll();

    // Also check owner_user_id link
    $stmt2 = $pdo->prepare("
        SELECT s.id, s.name, s.slug, s.status, s.logo_path,
               sp.name_ar as plan_name, sp.plan_type,
               s.subscription_expires_at
        FROM salons s
        LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
        WHERE s.owner_user_id = ? AND s.status = 'active'
        ORDER BY s.id
    ");
    $stmt2->execute([$userId]);
    $linkedSalons = $stmt2->fetchAll();

    // Merge and deduplicate
    $merged = [];
    $seen = [];
    foreach (array_merge($directSalons, $linkedSalons) as $s) {
        if (!in_array($s['id'], $seen)) {
            $seen[] = $s['id'];
            $merged[] = $s;
        }
    }
    return $merged;
}
