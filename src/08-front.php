<?php
declare(strict_types=1);

if (!isset($pdo)) {
    // Si se accede directamente sin pasar por router/core
    http_response_code(403);
    die("Forbidden");
}

// $route is defined in 04-router.php
$slug = $route === '' ? 'home' : $route;

try {
    $stmt = $pdo->prepare("SELECT title, public_html FROM pages WHERE slug = ?");
    $stmt->execute([$slug]);
    $page = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$page) {
        $stmt = $pdo->prepare("SELECT title, public_html FROM pages WHERE slug = '404'");
        $stmt->execute();
        $page = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$page) {
            http_response_code(404);
            $page = [
                'title' => '404 - Not Found',
                'public_html' => '<div style="text-align:center; padding: 100px 20px; font-family: sans-serif;"><h1>404</h1><p>The requested page could not be found.</p></div>'
            ];
        } else {
            http_response_code(404);
        }
    }
} catch (Throwable $e) {
    http_response_code(500);
    die("Database error: " . $e->getMessage());
}

$title = htmlspecialchars($page['title']);
$content = $page['public_html'];

// Cargar el CSS del tema activo (por ahora asumimos pichi)
$style_css = '';
$template_css_path = __DIR__ . '/../data/templates/pichi/style.css';
if (file_exists($template_css_path)) {
    $style_css = file_get_contents($template_css_path);
}

// Cargar fuentes de Google (Extraídas de los ajustes o hardcodeadas por ahora según la plantilla pichi)
$google_fonts = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Roboto:wght@400;500&display=swap";

// Cargar variables CSS guardadas por el usuario (cuando esté implementado el guardado en Fase 2)
$custom_css_vars = '';
// $settings_path = __DIR__ . '/../data/user-settings/global.json'; // Fase 2

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $title ?></title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <?php if ($google_fonts): ?>
        <link href="<?= $google_fonts ?>" rel="stylesheet">
    <?php endif; ?>

    <style>
        /* Estilos del Tema */
        <?= $style_css ?>
        
        /* Ajustes Globales del Usuario */
        <?= $custom_css_vars ?>
    </style>
</head>
<body>
    <?= $content ?>
</body>
</html>
