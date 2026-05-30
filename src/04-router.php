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
    if (file_exists(__DIR__ . '/core/07-api.php')) require_once __DIR__ . '/core/07-api.php';
} else {
    // Para simplificar la compatibilidad con el código actual que ejecuta top-to-bottom:
    if (file_exists(__DIR__ . '/core/05-login.php')) require_once __DIR__ . '/core/05-login.php';
    if (file_exists(__DIR__ . '/core/06-editor.php')) require_once __DIR__ . '/core/06-editor.php';
}