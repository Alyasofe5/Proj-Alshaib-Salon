<?php
/**
 * JWT Authentication Middleware (SaaS Multi-Tenant)
 * يتحقق من JWT Token في كل request محمي
 * يدعم: super_admin, admin, employee
 */

require_once __DIR__ . '/../config/jwt.php';

function authenticate(): array
{
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

    if (empty($authHeader)) {
        sendError('يرجى تسجيل الدخول أولاً', 401);
    }

    if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
        $token = $matches[1];
    } else {
        sendError('صيغة Token غير صحيحة', 401);
    }

    $payload = verifyJWT($token);

    if (!$payload) {
        sendError('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً', 401);
    }

    return $payload;
}

/** أي مستخدم مسجل دخول */
function requireAuth(): array
{
    return authenticate();
}

/** مدير النظام أو Super Admin */
function requireAdmin(): array
{
    $user = authenticate();
    if (!in_array($user['role'], ['admin', 'super_admin'])) {
        sendError('هذا الإجراء يتطلب صلاحية المدير', 403);
    }
    return $user;
}

/** Super Admin فقط — تستخدم في ملفات superadmin/* ت yang لا تضمن salon.php */
function requireSuperAdmin(): array
{
    $user = authenticate();
    if ($user['role'] !== 'super_admin') {
        sendError('هذا الإجراء يتطلب صلاحية مدير النظام الأعلى', 403);
    }
    return $user;
}


/** موظف أو أدمن أو Super Admin */
function requireEmployee(): array
{
    $user = authenticate();
    if (!in_array($user['role'], ['admin', 'employee', 'super_admin'])) {
        sendError('ليس لديك صلاحية', 403);
    }
    return $user;
}

// calcCommission موجودة في response.php
