<?php
/**
 * 🔧 TEMPORARY LOGIN DIAGNOSTIC + ONE-CLICK FIX
 *
 * MODES:
 *
 *  1. Diagnose (default):
 *     https://maqas.site/api/auth/debug-login.php?username=admin&password=YOUR_PASS
 *
 *  2. Fix the truncated bcrypt column + reset a user password:
 *     https://maqas.site/api/auth/debug-login.php?action=reset&username=admin&new_password=NEW_STRONG_PASS&secret=fix-bcrypt-2026
 *
 *     → ALTERs users.password to VARCHAR(255)
 *     → Generates a fresh bcrypt hash and stores it
 *     → Verifies the new hash round-trips correctly
 *
 *  ⚠️  DELETE this file IMMEDIATELY after the fix works (it leaks data + lets anyone reset passwords).
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/response.php';

$action       = $_GET['action']       ?? $_POST['action']       ?? 'diagnose';
$username     = trim($_GET['username']     ?? $_POST['username']     ?? '');
$password     = trim($_GET['password']     ?? $_POST['password']     ?? '');
$newPassword  = trim($_GET['new_password'] ?? $_POST['new_password'] ?? '');
$secret       = $_GET['secret']       ?? $_POST['secret']       ?? '';

// ════════════════════════════════════════════════════════════════════════════
// MODE: RESET PASSWORD + WIDEN COLUMN
// ════════════════════════════════════════════════════════════════════════════
if ($action === 'reset') {
    if ($secret !== 'fix-bcrypt-2026') {
        sendError('Forbidden — wrong secret', 403);
    }
    if ($username === '' || $newPassword === '') {
        sendError('username and new_password are required', 400);
    }
    if (strlen($newPassword) < 6) {
        sendError('new_password must be at least 6 characters', 400);
    }

    $report = [];

    try {
        // 1. Inspect current column definition.
        $stmt = $pdo->query("
            SELECT COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME = 'password'
        ");
        $colInfo = $stmt->fetch();
        $report['before_column'] = $colInfo;

        // 2. Widen if needed (safe, idempotent).
        if (!$colInfo || (int)$colInfo['CHARACTER_MAXIMUM_LENGTH'] < 255) {
            $pdo->exec("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL");
            $report['column_alter'] = 'OK → users.password widened to VARCHAR(255)';
        } else {
            $report['column_alter'] = 'SKIP → column already >= VARCHAR(255)';
        }

        // 3. Re-check column.
        $stmt = $pdo->query("
            SELECT COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME = 'password'
        ");
        $report['after_column'] = $stmt->fetch();

        // 4. Generate a fresh bcrypt hash.
        $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 10]);
        $report['new_hash_length'] = strlen($newHash);
        $report['new_hash_looks_bcrypt'] = preg_match('/^\$2[aby]\$/', $newHash) === 1;

        // 5. Update the user.
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE username = ?");
        $stmt->execute([$newHash, $username]);
        $report['rows_affected'] = $stmt->rowCount();

        if ($report['rows_affected'] === 0) {
            sendError("User '$username' not found — nothing updated", 404, $report);
        }

        // 6. Round-trip test: read it back and verify.
        $stmt = $pdo->prepare("SELECT password FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $storedHash = $stmt->fetchColumn();
        $report['stored_hash_length'] = strlen($storedHash);
        $report['round_trip_verify']  = password_verify($newPassword, $storedHash) ? 'MATCH ✅' : 'MISMATCH ❌';

        if ($report['round_trip_verify'] !== 'MATCH ✅') {
            sendError('Hash got truncated AGAIN after update — column may still be too narrow', 500, $report);
        }

        sendSuccess($report, 200,
            "✅ Password for '$username' reset. You can now log in with the new password. DELETE this debug file now.");
    } catch (Throwable $e) {
        sendError('Reset failed: ' . $e->getMessage(), 500, ['partial_report' => $report]);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// MODE: SIMULATE — runs the rest of login.php after password check, isolates 500
// ════════════════════════════════════════════════════════════════════════════
if ($action === 'simulate') {
    if ($username === '') sendError('username param required', 400);

    $report = [];

    try {
        $report['step'] = 'fetching user';
        $hasSalonStatus  = dbHasColumn('salons', 'status');
        $hasSalonExpires = dbHasColumn('salons', 'subscription_expires_at');
        $hasSalonPlanId  = dbHasColumn('salons', 'subscription_plan_id');
        $hasPlanTable    = dbTableExists('subscription_plans');
        $hasPlanType     = $hasPlanTable && dbHasColumn('subscription_plans', 'plan_type');
        $hasFeaturesConfig = $hasPlanTable && dbHasColumn('subscription_plans', 'features_config');

        $stmt = $pdo->prepare("
            SELECT u.*, e.name_ar AS emp_name, e.name_en AS emp_name_en,
                   s.id AS s_id, s.name_ar AS s_name, s.name_en AS s_name_en,
                   s.slug AS s_slug, s.logo_path AS s_logo,
                   " . ($hasSalonStatus ? "s.status" : "'active'") . " AS s_status,
                   " . ($hasSalonExpires ? "s.subscription_expires_at" : "NULL") . " AS s_expires
            FROM users u
            LEFT JOIN employees e ON u.employee_id = e.id
            LEFT JOIN salons s ON u.salon_id = s.id
            WHERE u.username = ? AND u.is_active = 1
        ");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if (!$user) sendError('user not found', 404);
        $report['step'] = 'user fetched OK';

        $report['step'] = 'fetching plan info';
        if (!empty($user['s_id']) && $hasSalonPlanId && $hasPlanTable) {
            $planQuery = "
                SELECT " . ($hasPlanType ? "sp.plan_type" : "'free'") . " AS plan_type,
                       " . ($hasFeaturesConfig ? "sp.features_config" : "NULL") . " AS features_config
                FROM salons s
                LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
                WHERE s.id = ?
            ";
            $stmt = $pdo->prepare($planQuery);
            $stmt->execute([$user['s_id']]);
            $planInfo = $stmt->fetch();
            $report['plan_info'] = $planInfo;
            $planType = $planInfo['plan_type'] ?? 'free';
        } else {
            $planType = 'free';
        }
        $report['plan_type'] = $planType;
        $report['step'] = 'plan info fetched OK';

        if ($planType === 'enterprise' || ($user['role'] ?? '') === 'super_admin') {
            $report['step'] = 'calling getSalonBranches() — THIS is where 500 likely happens';
            require_once __DIR__ . '/../../middleware/salon.php';
            $branches = getSalonBranches((int)$user['id']);
            $report['branches_count'] = count($branches);
            $report['step'] = 'getSalonBranches OK';
        }

        sendSuccess($report, 200, '✅ All steps after password check succeed. Login should work.');
    } catch (Throwable $e) {
        sendError('💥 FAILED at: ' . ($report['step'] ?? '?'), 500, [
            'partial_report' => $report,
            'error_message'  => $e->getMessage(),
            'error_file'     => $e->getFile() . ':' . $e->getLine(),
        ]);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// MODE: DIAGNOSE (default)
// ════════════════════════════════════════════════════════════════════════════
$report = [
    'step_1_schema_check'        => null,
    'step_2_user_lookup_simple'  => null,
    'step_3_user_lookup_full'    => null,
    'step_4_password_verify'     => null,
    'step_5_password_column_def' => null,
    'verdict'                    => null,
];

try {
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

    if ($username !== '') {
        $stmt = $pdo->prepare("SELECT id, username, role, is_active, salon_id, employee_id,
                                      LENGTH(password) AS pwd_length,
                                      LEFT(password, 4) AS pwd_prefix
                               FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $simple = $stmt->fetch();
        $report['step_2_user_lookup_simple'] = $simple ?: 'NO USER FOUND with that username';
    }

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
            $report['step_3_user_lookup_full'] = $full ?: 'NO ROW returned by login.php query';
        } catch (PDOException $e) {
            $report['step_3_user_lookup_full'] = 'SQL ERROR: ' . $e->getMessage();
        }
    }

    if ($username !== '' && $password !== '') {
        $stmt = $pdo->prepare("SELECT password FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $hash = $stmt->fetchColumn();
        if ($hash) {
            $report['step_4_password_verify'] = [
                'hash_length'   => strlen($hash),
                'looks_bcrypt'  => preg_match('/^\$2[aby]\$/', $hash) === 1,
                'verify_result' => password_verify($password, $hash) ? 'MATCH ✅' : 'MISMATCH ❌',
            ];
        } else {
            $report['step_4_password_verify'] = 'No hash stored for this username';
        }
    }

    // Inspect the column definition — this confirms truncation.
    $stmt = $pdo->query("
        SELECT COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'password'
    ");
    $report['step_5_password_column_def'] = $stmt->fetch();

    $colLen = (int)($report['step_5_password_column_def']['CHARACTER_MAXIMUM_LENGTH'] ?? 0);
    if ($colLen > 0 && $colLen < 60) {
        $report['verdict'] = "ROOT CAUSE: users.password is VARCHAR($colLen). Bcrypt needs 60 chars → all hashes truncated.";
    } elseif (is_array($report['step_4_password_verify']) && $report['step_4_password_verify']['hash_length'] !== 60 && $report['step_4_password_verify']['looks_bcrypt']) {
        $report['verdict'] = 'ROOT CAUSE: stored bcrypt hash is ' . $report['step_4_password_verify']['hash_length'] . ' chars (must be 60). Hash is corrupted/truncated.';
    } else {
        $report['verdict'] = 'No obvious truncation detected — credentials may simply be wrong.';
    }

    sendSuccess($report, 200, 'Diagnostic complete');
} catch (Throwable $e) {
    sendError('Diagnostic failed: ' . $e->getMessage(), 500, [
        'partial_report' => $report,
        'trace'          => $e->getTraceAsString(),
    ]);
}
