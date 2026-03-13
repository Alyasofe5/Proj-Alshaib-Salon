<?php
/**
 * CORS Configuration — Fixed for mobile browsers
 * 
 * Problem: Access-Control-Allow-Credentials cannot be used with wildcard (*)
 * Solution: Always echo back the specific origin, or use * without credentials
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// List of allowed origins
$allowed = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://blanchedalmond-stingray-366103.hostingersite.com',
    'https://red-cheetah-384990.hostingersite.com',
];

if (in_array($origin, $allowed, true)) {
    // Specific origin — can use credentials
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
} else {
    // Unknown origin (direct API calls, Postman, etc.) — no credentials
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set JSON content type for all API responses
header('Content-Type: application/json; charset=utf-8');
