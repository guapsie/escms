<?php

declare(strict_types=1);

// Soporte universal para Nginx, Caddy, PHP server y subcarpetas sin .htaccess
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
$base = dirname($_SERVER['SCRIPT_NAME']);
if ($base !== '/' && str_starts_with($uri, $base)) {
    $uri = substr($uri, strlen($base));
}
$route = trim($_GET['route'] ?? $uri, '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// --- Delegación API REST ---
// En desarrollo requiere el archivo. En producción (build.js), pasará de largo y ejecutará el bloque concatenado abajo.
if (str_starts_with($route, 'api/') && file_exists(__DIR__ . '/07-api.php')) {
    require_once __DIR__ . '/07-api.php';
}