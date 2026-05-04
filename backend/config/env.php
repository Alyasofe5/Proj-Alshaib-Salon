<?php
/**
 * Lightweight .env loader (zero dependencies).
 *
 * Usage:
 *   require_once __DIR__ . '/env.php';
 *   loadEnv(__DIR__ . '/../.env');
 *   $dbPass = env('DB_PASS', '');
 *
 * Behavior:
 * - Reads `KEY=VALUE` lines, ignoring blanks and `# comments`.
 * - Supports values wrapped in single or double quotes.
 * - Sets each variable into $_ENV, $_SERVER, and getenv() for compatibility
 *   across PHP/Apache/PHP-FPM environments.
 * - Existing environment variables are NEVER overwritten — real env takes
 *   precedence over the .env file (production-safe).
 * - Silent if the .env file is missing (callers fall back to env() defaults).
 */

if (!function_exists('loadEnv')) {
    function loadEnv(string $path): void
    {
        if (!is_file($path) || !is_readable($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') {
                continue;
            }

            $eq = strpos($line, '=');
            if ($eq === false) {
                continue;
            }

            $key = trim(substr($line, 0, $eq));
            $val = trim(substr($line, $eq + 1));

            if ($key === '' || !preg_match('/^[A-Z_][A-Z0-9_]*$/i', $key)) {
                continue;
            }

            // Strip a single matched pair of surrounding quotes.
            if (strlen($val) >= 2) {
                $first = $val[0];
                $last = $val[strlen($val) - 1];
                if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                    $val = substr($val, 1, -1);
                }
            }

            // Do not overwrite values that the host already provides.
            if (getenv($key) !== false || isset($_ENV[$key]) || isset($_SERVER[$key])) {
                continue;
            }

            putenv($key . '=' . $val);
            $_ENV[$key] = $val;
            $_SERVER[$key] = $val;
        }
    }
}

if (!function_exists('env')) {
    function env(string $key, $default = null)
    {
        $value = getenv($key);
        if ($value === false || $value === '') {
            $value = $_ENV[$key] ?? $_SERVER[$key] ?? null;
        }
        if ($value === null || $value === '') {
            return $default;
        }
        return $value;
    }
}

// Auto-load the .env from the backend root on every include.
loadEnv(dirname(__DIR__) . '/.env');
