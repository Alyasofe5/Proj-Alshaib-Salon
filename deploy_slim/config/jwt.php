<?php
/**
 * JWT (JSON Web Token) Configuration & Helpers
 * تنفيذ JWT بدون مكتبات خارجية (Pure PHP)
 */

define('JWT_SECRET', 'alshaib_salon_jwt_secret_key_2026_change_this_in_production');
define('JWT_EXPIRY', 86400); // 24 ساعة
define('JWT_ALGORITHM', 'HS256');

/**
 * إنشاء JWT Token
 */
function createJWT(array $payload): string
{
    $header = base64url_encode(json_encode([
        'typ' => 'JWT',
        'alg' => JWT_ALGORITHM
    ]));

    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;

    $payloadEncoded = base64url_encode(json_encode($payload));

    $signature = base64url_encode(
        hash_hmac('sha256', "$header.$payloadEncoded", JWT_SECRET, true)
    );

    return "$header.$payloadEncoded.$signature";
}

/**
 * التحقق من JWT Token وإرجاع البيانات
 */
function verifyJWT(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $payload, $signature] = $parts;

    // التحقق من التوقيع
    $expectedSignature = base64url_encode(
        hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
    );

    if (!hash_equals($expectedSignature, $signature)) return null;

    // فك البيانات
    $data = json_decode(base64url_decode($payload), true);
    if (!$data) return null;

    // التحقق من انتهاء الصلاحية
    if (isset($data['exp']) && $data['exp'] < time()) return null;

    return $data;
}

/**
 * Base64 URL-safe encoding
 */
function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Base64 URL-safe decoding
 */
function base64url_decode(string $data): string
{
    return base64_decode(strtr($data, '-_', '+/'));
}
