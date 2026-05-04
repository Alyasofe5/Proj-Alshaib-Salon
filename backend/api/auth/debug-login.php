<?php
/**
 * 🔧 TEMPORARY LOGIN DIAGNOSTIC
 *
 * GOAL: Identify exactly why login.php returns 401 after the bilingual migration.
 *
 * USAGE:
 *   1. Upload to: /backend/api/auth/debug-login.php on maqas.site
 *   2. Open in browser:
 *        https://maqas.site/api/auth/debug-login.php?username=YOUR_USER&password=YOUR_PASS
 *   3. Read the JSON output — it tells you the root cause.
 *   4. ⚠️  DELETE this file IMMEDIATELY after debugging (it leaks data).
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

$username = trim($_GET['username'] ?? $_POST['username'] ?? '');
$password = trim($_GET['password'] ?? $_POST['password'] ?? '');

$report = [
    'step_1_schema_check'        => null,
    'step_2_user_lookup_simple'  => null,
    'step_3_user_lookup_full'    => null,
    'step_4_password_verify'     => null,
    'step_5_join_test'           => null,
    'verdict'                    => null,
];

try {
    // ─── 1. Verify the schema still has the columns login.php depends on ──────
    $required = [
        'users'     => ['id', 'username', 'password', 'is_active', 'role', 'salon_id', 'employee_id', 'name'],
        'employees' => ['id', 'name_ar', 'name_en'],
        'salons'    => ['id', 'name_ar', 'name_en', 'slug', 'logo_path', 'status', 'subscription_expires_at'],
    ];

    $schema = [];
    foreach ($required as $table => $cols) {
        $schema[$table] = ['table_exists' => dbTableExists($table), 'missing_columns' => []];
        if (!$schema[$table]['table_exists']) continue;
        foreach ($cols as $c) {
            if (!dbHasColumn($table, $c)) {
                $schema[$table]['missing_columns'][] = $c;
            }
        }
    }
    $report['step_1_schema_check'] = $schema;

    // ─── 2. Simple user lookup (no JOIN) — does the user even exist? ─────────
    if ($username !== '') {
        $stmt = $pdo->prepare("SELECT id, username, role, is_active, salon_id, employee_id,
                                      LENGTH(password) AS pwd_length,
                                      LEFT(password, 4) AS pwd_prefix
                               FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $simple = $stmt->fetch();
        $report['step_2_user_lookup_simple'] = $simple ?: 'NO USER FOUND with that username';
    } else {
        $report['step_2_user_lookup_simple'] = 'username param missing';
    }

    // ─── 3. Full lookup using the EXACT same query as login.php ──────────────
    if ($username !== '') {
        $hasSalonStatus  = dbHasColumn('salons', 'status');
        $hasSalonExpires = dbHasColumn('salons', 'subscription_expires_at');

        $query = "
            SELECT u.*, e.name_ar AS emp_name, e.name_en AS emp_name_en,
                   s.id AS s_id,
                   s.name_ar AS s_name, s.name_en AS s_name_en,
                   s.slug AS s_slug,
                   s.logo_path AS s_logo,
                   " . ($hasSalonStatus  ? "s.status" : "'active'") . " AS s_status,
                   " . ($hasSalonExpires ? "s.subscription_expires_at" : "NULL") . " AS s_expires
            FROM users u
            LEFT JOIN employees e ON u.employee_id = e.id
            LEFT JOIN salons s ON u.salon_id = s.id
            WHERE u.username = ? AND u.is_active = 1
        ";

        try {
            $stmt = $pdo->prepare($query);
            $stmt->execute([$username]);
            $full = $stmt->fetch();
            if ($full) {
                $full['password'] = '[hidden, length=' . strlen($full['password']) . ']';
            }
            $report['step_3_user_lookup_full'] = $full ?: 'NO ROW returned by login.php query (user inactive, missing, or JOIN broken)';
        } catch (PDOException $e) {
            $report['step_3_user_lookup_full'] = 'SQL ERROR: ' . $e->getMessage();
        }
    }

    // ─── 4. Password verify test ─────────────────────────────────────────────
    if ($username !== '' && $password !== '') {
        $stmt = $pdo->prepare("SELECT password FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $hash = $stmt->fetchColumn();
        if ($hash) {
            $isValid    = password_verify($password, $hash);
            $isBcrypt   = preg_match('/^\$2[aby]\$/', $hash) === 1;
            $report['step_4_password_verify'] = [
                'hash_length'   => strlen($hash),
                'looks_bcrypt'  => $isBcrypt,
                'verify_result' => $isValid ? 'MATCH ✅' : 'MISMATCH ❌',
            ];
        } else {
            $report['step_4_password_verify'] = 'No hash stored for this username';
        }
    }

    // ─── 5. Verdict ──────────────────────────────────────────────────────────
    $missing = [];
    foreach ($schema as $t => $info) {
        if (!$info['table_exists']) $missing[] = "table '$t' missing";
        if (!empty($info['missing_columns'])) $missing[] = "$t missing column(s): " . implode(',', $info['missing_columns']);
    }

    if ($missing) {
        $report['verdict'] = 'SCHEMA PROBLEM → ' . implode(' | ', $missing);
    } elseif (is_string($report['step_2_user_lookup_simple'])) {
        $report['verdict'] = 'USER NOT FOUND in users table';
    } elseif (is_array($report['step_2_user_lookup_simple']) && (int)$report['step_2_user_lookup_simple']['is_active'] === 0) {
        $report['verdict'] = 'USER EXISTS but is_active = 0';
    } elseif (is_string($report['step_3_user_lookup_full'])) {
        $report['verdict'] = $report['step_3_user_lookup_full'];
    } elseif (is_array($report['step_4_password_verify']) && $report['step_4_password_verify']['verify_result'] !== 'MATCH ✅') {
        $report['verdict'] = 'PASSWORD HASH MISMATCH (wrong password OR hash got corrupted/re-encoded)';
    } else {
        $report['verdict'] = 'Login should succeed for these credentials. If 401 still happens, check CORS / request body.';
    }

    sendSuccess($report, 200, 'Diagnostic complete');
} catch (Throwable $e) {
    sendError('Diagnostic failed: ' . $e->getMessage(), 500, [
        'partial_report' => $report,
        'trace'          => $e->getTraceAsString(),
    ]);
}
