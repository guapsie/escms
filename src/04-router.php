<?php
declare(strict_types=1);

// --- 1. Carga de Preflight ---
if (file_exists(__DIR__ . '/core/00-preflight.php')) require_once __DIR__ . '/core/00-preflight.php';

// --- 2. Check de Instalación ---
// Usamos filesize para detectar si la BD está vacía (creada por PDO pero sin tablas)
$db_path = __DIR__ . '/data/escms.sqlite';
if (!file_exists($db_path) || filesize($db_path) === 0) {
    if (file_exists(__DIR__ . '/core/01-installer.php')) require_once __DIR__ . '/core/01-installer.php';
}

// --- 3. Carga del Core y Auth ---
if (file_exists(__DIR__ . '/core/02-core.php')) require_once __DIR__ . '/core/02-core.php';
if (file_exists(__DIR__ . '/core/03-auth.php')) require_once __DIR__ . '/core/03-auth.php';

// --- 4. Enrutamiento ---
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
$base = dirname($_SERVER['SCRIPT_NAME']);
if ($base !== '/' && str_starts_with($uri, $base)) {
    $uri = substr($uri, strlen($base));
}
$route = trim($_GET['route'] ?? $uri, '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// --- 5. Delegación ---

if (str_starts_with($route, 'api/')) {
    if (str_starts_with($route, 'api/pages/')) {
        if (file_exists(__DIR__ . '/core/api-pages.php')) require_once __DIR__ . '/core/api-pages.php';
    } elseif (str_starts_with($route, 'api/components/')) {
        if (file_exists(__DIR__ . '/core/api-components.php')) require_once __DIR__ . '/core/api-components.php';
    } elseif (str_starts_with($route, 'api/media/')) {
        if (file_exists(__DIR__ . '/core/api-media.php')) require_once __DIR__ . '/core/api-media.php';
    } elseif ($route === 'api/challenge' || $route === 'api/register' || $route === 'api/login-challenge' || $route === 'api/login-verify') {
        if (file_exists(__DIR__ . '/core/api-auth.php')) require_once __DIR__ . '/core/api-auth.php';
    } elseif (str_starts_with($route, 'api/addons/')) {
        $parts = explode('/', $route);
        if (count($parts) >= 3) {
            $addon_id = preg_replace('/[^a-zA-Z0-9_-]/', '', $parts[2]);
            $addon_file = __DIR__ . '/data/addons/' . $addon_id . '/' . $addon_id . '.php';
            if (file_exists($addon_file)) {
                require_once $addon_file;
            } else {
                header('Content-Type: application/json');
                http_response_code(404);
                echo json_encode(['error' => 'Addon PHP not found']);
                exit;
            }
        }
    } else {
        if (file_exists(__DIR__ . '/core/api-settings.php')) require_once __DIR__ . '/core/api-settings.php';
    }
} elseif ($route === 'admin' || str_starts_with($route, 'admin/')) {
    if (file_exists(__DIR__ . '/core/05-login.php')) require_once __DIR__ . '/core/05-login.php';
    if (file_exists(__DIR__ . '/core/06-editor.php')) require_once __DIR__ . '/core/06-editor.php';
} elseif ($route === 'sitemap.xml') {
    if (file_exists(__DIR__ . '/core/api-sitemap.php')) require_once __DIR__ . '/core/api-sitemap.php';
} else {
    if (file_exists(__DIR__ . '/core/08-front.php')) require_once __DIR__ . '/core/08-front.php';
}