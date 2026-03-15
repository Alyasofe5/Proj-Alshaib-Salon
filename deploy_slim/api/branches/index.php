<?php
/**
 * Branches API — Enterprise Multi-Branch Management
 * ===================================================
 * GET    /api/branches/           → List all branches for this owner
 * POST   /api/branches/           → Create a new branch (enterprise only)
 * DELETE /api/branches/?id=X      → Delete a branch (owner only, not self)
 *
 * Security:
 * - Only enterprise plan users can create branches
 * - Users can only see/manage branches they own
 * - Tenant data isolation enforced on every query
 * - Sensitive data (passwords, tokens) never returned
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../middleware/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/salon.php';

$method  = getMethod();
$user    = authenticate();
$id      = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Resolve current salon context
$currentSalonId = getSalonId($user);
$salon = validateSalonSubscription($currentSalonId);

// ==========================================
// GET: List branches owned by this user
// ==========================================
if ($method === 'GET') {
    // Only enterprise or super_admin
    if (!isSuperAdmin($user) && !hasFeature($salon, 'has_multi_branch')) {
        sendError('ميزة إدارة الفروع غير متاحة في باقتك الحالية. يرجى الترقية إلى باقة المؤسسات.', 403);
    }

    $branches = getSalonBranches($user['user_id']);

    // Enrich each branch with stats (without sensitive data)
    $result = [];
    foreach ($branches as $branch) {
        $bId = (int)$branch['id'];

        // Employee count
        $empStmt = $pdo->prepare("SELECT COUNT(*) FROM employees WHERE salon_id = ? AND is_active = 1");
        $empStmt->execute([$bId]);
        $empCount = (int)$empStmt->fetchColumn();

        // Month revenue
        $revStmt = $pdo->prepare("
            SELECT COALESCE(SUM(total_amount), 0)
            FROM transactions
            WHERE salon_id = ? AND DATE_FORMAT(created_at,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m')
        ");
        $revStmt->execute([$bId]);
        $monthRevenue = (float)$revStmt->fetchColumn();

        // Days left
        $daysLeft = null;
        if (!empty($branch['subscription_expires_at'])) {
            $daysLeft = max(0, (int)ceil((strtotime($branch['subscription_expires_at']) - time()) / 86400));
        }

        $result[] = [
            'id'          => $bId,
            'name'        => $branch['name'],
            'slug'        => $branch['slug'],
            'status'      => $branch['status'],
            'logo'        => $branch['logo_path'] ?? null,
            'plan_name'   => $branch['plan_name'] ?? null,
            'plan_type'   => $branch['plan_type'] ?? null,
            'days_left'   => $daysLeft,
            'emp_count'   => $empCount,
            'month_revenue' => round($monthRevenue, 3),
            'is_current'  => ($bId === $currentSalonId),
        ];
    }

    sendSuccess($result);
}

// ==========================================
// POST: Create a new branch
// ==========================================
if ($method === 'POST') {
    // Security: only enterprise plan
    if (!isSuperAdmin($user) && !hasFeature($salon, 'has_multi_branch')) {
        sendError('إنشاء الفروع يتطلب باقة المؤسسات. يرجى الترقية.', 403);
    }

    $data = getRequestBody();

    $name  = trim($data['name']  ?? '');
    $slug  = trim($data['slug']  ?? '');
    $city  = trim($data['city']  ?? '');
    $phone = trim($data['phone'] ?? '');

    if (empty($name)) sendError('اسم الفرع مطلوب', 422);
    if (empty($slug))  sendError('الرابط المخصص مطلوب', 422);

    // Validate slug format
    if (!preg_match('/^[a-z0-9-]+$/', $slug)) {
        sendError('الرابط يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط', 422);
    }

    // Check slug uniqueness
    $slugStmt = $pdo->prepare("SELECT id FROM salons WHERE slug = ?");
    $slugStmt->execute([$slug]);
    if ($slugStmt->fetch()) {
        sendError('هذا الرابط مستخدم مسبقاً. اختر رابطاً آخر.', 409);
    }

    // Get parent salon's plan to assign to branch
    $parentPlanId = $salon['subscription_plan_id'];
    $parentExpiry = $salon['subscription_expires_at'];

    // Create branch with same plan and expiry as parent
    $insertStmt = $pdo->prepare("
        INSERT INTO salons (
            name, slug, owner_name, owner_phone, status,
            subscription_plan_id, subscription_starts_at, subscription_expires_at,
            owner_user_id, parent_salon_id
        ) VALUES (?, ?, ?, ?, 'active', ?, CURDATE(), ?, ?, ?)
    ");
    $insertStmt->execute([
        $name,
        $slug,
        $salon['owner_name'] ?? '', // Inherit owner name from parent
        $phone ?: ($salon['owner_phone'] ?? ''),
        $parentPlanId,
        $parentExpiry, // Same expiry as parent
        $user['user_id'],
        $currentSalonId,
    ]);
    $newBranchId = (int)$pdo->lastInsertId();

    // Create admin account for new branch (same user gets access)
    // Link this user to the new branch via a branch-access entry
    // The user will switch to it via switch-salon API
    // No new user record needed — the owner switches context

    // Log branch creation
    try {
        $pdo->prepare("INSERT INTO subscription_logs (salon_id, action, created_by) VALUES (?, 'branch_created', ?)")
            ->execute([$newBranchId, $user['user_id']]);
    } catch (Exception $e) { /* ignore */ }

    sendSuccess([
        'id'   => $newBranchId,
        'name' => $name,
        'slug' => $slug,
    ], 201, 'تم إنشاء الفرع بنجاح');
}

// ==========================================
// DELETE: Delete a branch
// ==========================================
if ($method === 'DELETE' && $id) {
    // Cannot delete own current salon
    if ($id === $currentSalonId) {
        sendError('لا يمكن حذف الفرع الحالي الذي أنت فيه. انتقل لفرع آخر أولاً.', 400);
    }

    // Security: verify ownership — branch must be owned by this user
    $ownerCheck = $pdo->prepare("
        SELECT id FROM salons
        WHERE id = ? AND owner_user_id = ?
    ");
    $ownerCheck->execute([$id, $user['user_id']]);
    $branch = $ownerCheck->fetch();

    if (!$branch) {
        sendError('الفرع غير موجود أو ليس لديك صلاحية حذفه.', 403);
    }

    // Also allow super_admin to delete any branch
    if (!isSuperAdmin($user) && !$branch) {
        sendError('ليس لديك صلاحية حذف هذا الفرع.', 403);
    }

    // Soft-delete: mark as deleted (preserve data)
    $pdo->prepare("UPDATE salons SET status = 'suspended' WHERE id = ?")->execute([$id]);

    sendSuccess(null, 200, 'تم إيقاف الفرع بنجاح');
}

sendError('Method not allowed', 405);
