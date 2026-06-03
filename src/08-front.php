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
    $stmt = $pdo->prepare("SELECT title, public_html, status FROM pages WHERE slug = ?");
    $stmt->execute([$slug]);
    $page = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($page && $page['status'] !== 'published') {
        $page = false;
    }

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

// Inyección dinámica de componentes para que el Frontend siempre muestre la última versión
$content = preg_replace_callback('/<!-- ESCMS_COMPONENT:([a-zA-Z0-9_-]+) -->/', function($matches) use ($pdo) {
    try {
        $stmt = $pdo->prepare("SELECT public_html FROM components WHERE ref_id = ?");
        $stmt->execute([$matches[1]]);
        return $stmt->fetchColumn() ?: '';
    } catch (Throwable $e) {
        return '';
    }
}, $content);

// Cargar el CSS del tema activo (por ahora asumimos pichi)
$style_css = '';
$template_css_path = __DIR__ . '/../data/templates/pichi/style.css';
if (file_exists($template_css_path)) {
    $style_css = file_get_contents($template_css_path);
}

// Cargar opciones globales
$options = $pdo->query("SELECT k, v FROM options WHERE k NOT LIKE 'ai_%'")->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];

// Cargar fuentes de Google desde opciones
$google_fonts_html = "";
if (!empty($options['google_fonts'])) {
    $fontsArr = json_decode($options['google_fonts'], true);
    if (is_array($fontsArr)) {
        $fontLinks = [];
        foreach($fontsArr as $url) {
            $fontLinks[] = '<link href="'.htmlspecialchars($url).'" rel="stylesheet">';
        }
        $google_fonts_html = implode("\n    ", $fontLinks);
    }
}

// Generar variables CSS
$custom_css_vars = ":root {\n";
$css_keys = [
    '--max-width', 
    '--color-background', 
    '--color-text', 
    '--color-accent', 
    '--color-link', 
    '--color-link-hover', 
    '--font-body'
];
foreach ($css_keys as $ck) {
    if (!empty($options[$ck])) {
        $custom_css_vars .= "    {$ck}: " . htmlspecialchars($options[$ck]) . ";\n";
    }
}
$custom_css_vars .= "}";

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $title ?></title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <?= $google_fonts_html ?>

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
