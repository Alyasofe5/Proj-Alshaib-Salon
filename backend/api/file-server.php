<?php
/**
 * Persistent File Server
 * Serves user-uploaded files stored ABOVE public_html (outside deploy zone)
 * Route: GET /uploads/{path} → reads from ../user_uploads/{path}
 *
 * Checks locations in priority order:
 *   1. NEW (correct): maqas.site/user_uploads/{path}
 *   2. LEGACY (old bug): domains/uploads/{path}   ← where old photo.php accidentally saved files
 *      Legacy path occurs because old photo.php used __DIR__/../../../../ (4 levels up from
 *      public_html/api/employees/) which resolved to /home/.../domains/ instead of public_html
 */

// Allowed MIME types for uploaded files
const ALLOWED_MIME = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/svg+xml', 'image/bmp', 'image/tiff',
    'video/mp4', 'video/webm', 'video/ogg',
];

$docRoot     = $_SERVER['DOCUMENT_ROOT'];                          // .../maqas.site/public_html
$siteDir     = dirname($docRoot);                                  // .../maqas.site/
$domainsDir  = dirname($siteDir);                                  // .../domains/

// ── Primary (new) storage root ──
$primaryRoot = $siteDir . '/user_uploads';
if (!is_dir($primaryRoot)) {
    mkdir($primaryRoot, 0755, true);
}

// ── Legacy storage root (old bug: photo.php saved 4 levels above itself) ──
$legacyRoot = $domainsDir . '/uploads';

// Get the requested path from query string (set by .htaccess rewrite)
$requestedPath = $_GET['path'] ?? '';

// Security: sanitize — prevent directory traversal
$requestedPath = str_replace(['..', '\\', "\0"], '', $requestedPath);
$requestedPath = trim($requestedPath, '/');

if (empty($requestedPath)) {
    http_response_code(400);
    exit('Bad Request');
}

// ── Candidate paths (priority order) ──
$candidatePaths = [
    realpath($primaryRoot . '/' . $requestedPath),       // e.g. .../user_uploads/employees/emp_1.png
    realpath($legacyRoot  . '/' . $requestedPath),       // e.g. .../domains/uploads/employees/emp_1.png
];

$realFilePath = null;
foreach ($candidatePaths as $candidate) {
    if (!$candidate) continue;

    // Security: ensure the resolved path stays within an allowed root
    if (
        strpos($candidate, realpath($primaryRoot) . DIRECTORY_SEPARATOR) === 0 ||
        (is_dir($legacyRoot) && strpos($candidate, realpath($legacyRoot) . DIRECTORY_SEPARATOR) === 0)
    ) {
        if (file_exists($candidate) && is_file($candidate)) {
            $realFilePath = $candidate;
            break;
        }
    }
}

if (!$realFilePath) {
    http_response_code(404);
    exit('File Not Found');
}

// Get MIME type and validate
$mime = mime_content_type($realFilePath);
if (!in_array($mime, ALLOWED_MIME, true)) {
    http_response_code(403);
    exit('Forbidden');
}

$size     = filesize($realFilePath);
$etag     = md5_file($realFilePath);
$modified = filemtime($realFilePath);

// Cache headers — 1 year for uploaded assets
header("Content-Type: $mime");
header("Content-Length: $size");
header('Cache-Control: public, max-age=31536000, immutable');
header('ETag: "' . $etag . '"');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $modified) . ' GMT');
header('Accept-Ranges: bytes');

// 304 Not Modified check
if (
    (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] === '"' . $etag . '"') ||
    (isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) && strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) >= $modified)
) {
    http_response_code(304);
    exit;
}

// Serve the file
readfile($realFilePath);
exit;
