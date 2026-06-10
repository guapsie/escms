<?php
declare(strict_types=1);

if (!isset($pdo)) {
    // Si se accede directamente sin pasar por router/core
    http_response_code(403);
    die("Forbidden");
}

// $route is defined in 04-router.php
$slug = $route === '' ? null : $route;

try {
    if ($slug === null) {
        $home_id = $config['home_page_id'] ?? null;
        if ($home_id) {
            $stmt = $pdo->prepare("SELECT id, title, public_html, status, seo_title, seo_desc, seo_keywords, seo_language FROM pages WHERE id = ?");
            $stmt->execute([$home_id]);
        } else {
            $stmt = $pdo->prepare("SELECT id, title, public_html, status, seo_title, seo_desc, seo_keywords, seo_language FROM pages ORDER BY id ASC LIMIT 1");
            $stmt->execute();
        }
        $page = $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        $segments = explode('/', $slug);
        $current_parent_id = null;
        $page = null;
        foreach ($segments as $index => $seg) {
            if ($current_parent_id === null) {
                $stmt = $pdo->prepare("SELECT id, title, public_html, status, seo_title, seo_desc, seo_keywords, seo_language, parent_id FROM pages WHERE slug = ? AND (parent_id IS NULL OR parent_id = 0)");
                $stmt->execute([$seg]);
            } else {
                $stmt = $pdo->prepare("SELECT id, title, public_html, status, seo_title, seo_desc, seo_keywords, seo_language, parent_id FROM pages WHERE slug = ? AND parent_id = ?");
                $stmt->execute([$seg, $current_parent_id]);
            }
            $p = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$p) {
                $page = null;
                break;
            }
            $current_parent_id = (int)$p['id'];
            if ($index === count($segments) - 1) {
                $page = $p;
            }
        }
    }

    // Redirect if accessing home page via its slug
    if ($page && $slug !== null && isset($config['home_page_id']) && (int)$page['id'] === (int)$config['home_page_id']) {
        header("HTTP/1.1 301 Moved Permanently");
        header("Location: /");
        exit;
    }

    if ($page && $page['status'] !== 'published' && !EscmsAuth::isLoggedIn()) {
        $page = false;
    }

    if (!$page) {
        $stmt = $pdo->prepare("SELECT id, title, public_html, seo_title, seo_desc, seo_keywords, seo_language FROM pages WHERE slug = '404'");
        $stmt->execute();
        $page = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$page) {
            http_response_code(404);
            $page = [
                'title' => '404 - Not Found',
                'public_html' => '<div style="text-align:center; padding: 100px 20px; font-family: sans-serif;"><h1>404</h1><p>The requested page could not be found.</p></div>',
                'seo_language' => 'en'
            ];
        } else {
            http_response_code(404);
        }
    }

    // Increment views only for public visitors
    if ($page && !empty($page['id']) && !EscmsAuth::isLoggedIn()) {
        $stmtViews = $pdo->prepare("UPDATE pages SET views = views + 1 WHERE id = ?");
        $stmtViews->execute([$page['id']]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    die("Database error: " . $e->getMessage());
}

$title = !empty($page['seo_title']) ? htmlspecialchars($page['seo_title']) : htmlspecialchars($page['title']);
$meta_desc = !empty($page['seo_desc']) ? '<meta name="description" content="'.htmlspecialchars($page['seo_desc']).'">' : '';
$meta_keywords = !empty($page['seo_keywords']) ? '<meta name="keywords" content="'.htmlspecialchars($page['seo_keywords']).'">' : '';
$html_lang = !empty($page['seo_language']) ? htmlspecialchars($page['seo_language']) : 'en';
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

// Inyección dinámica del Menú (Nav)
$pages = $pdo->query("SELECT id, title, slug, parent_id, is_hidden_menu, is_custom_link, custom_link_url FROM pages WHERE is_hidden_menu = 0 AND status = 'published' ORDER BY menu_order ASC, updated_at DESC")->fetchAll(PDO::FETCH_ASSOC);

$map = [];
$roots = [];
foreach ($pages as $p) {
    $map[(int)$p['id']] = $p;
    $map[(int)$p['id']]['children'] = [];
}
foreach ($pages as $p) {
    $pid = (int)$p['id'];
    $parentId = $p['parent_id'] ? (int)$p['parent_id'] : null;
    if ($parentId && isset($map[$parentId])) {
        $map[$parentId]['children'][] = &$map[$pid];
    } else {
        $roots[] = &$map[$pid];
    }
}

$home_page_id = (int)($config['home_page_id'] ?? 0);
$buildHtml = function($nodes, $parentPath = '') use (&$buildHtml, $home_page_id) {
    $html = '';
    foreach ($nodes as $node) {
        if ((int)$node['is_custom_link'] === 1) {
            $href = htmlspecialchars($node['custom_link_url']);
            $currentPathForChildren = $parentPath;
        } else {
            $currentPath = $parentPath . '/' . htmlspecialchars($node['slug']);
            $currentPathForChildren = $currentPath;
            $href = ((int)$node['id'] === $home_page_id) ? '/' : $currentPath;
        }
        $icon = (int)$node['is_custom_link'] === 1 ? '<span style="display:inline-block; width:14px; margin-right:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 256 256"><path fill="currentColor" d="M141.66 114.34a8 8 0 0 0-11.32 0l-32 32a8 8 0 0 0 11.32 11.32l32-32a8 8 0 0 0 0-11.32Zm71.6 30.41l-24.36 24.36c-27.18 27.19-71.45 27.18-98.6 0a8 8 0 0 0-11.32 11.32c33.4 33.4 87.82 33.41 121.23 0l24.37-24.36a85.8 85.8 0 0 0 0-121.24a86.67 86.67 0 0 0-61-24.83a8 8 0 0 0 0 16a70.73 70.73 0 0 1 50.1 20.25a69.83 69.83 0 0 1 19.58 48.5Zm-83.33-91.8a8 8 0 0 0-11.31 0l-24.37 24.37a85.8 85.8 0 0 0 0 121.24a86.66 86.66 0 0 0 61 24.83a8 8 0 0 0 0-16a70.72 70.72 0 0 1-50.09-20.25a69.83 69.83 0 0 1-19.59-48.5a69.84 69.84 0 0 1 19.59-48.5l24.37-24.37c27.16-27.18 71.44-27.18 98.6 0a8 8 0 1 0 11.31-11.32c-33.39-33.4-87.82-33.4-121.22-.01Z"/></svg></span>' : '';
        
        $html .= '<li class="escms-nav-item">';
        $caret = !empty($node['children']) ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-caret-down" style="width: 14px; height: 14px; margin-left: 4px;"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 9c.852 0 1.297 .986 .783 1.623l-.076 .084l-6 6a1 1 0 0 1 -1.32 .083l-.094 -.083l-6 -6l-.083 -.094l-.054 -.077l-.054 -.096l-.017 -.036l-.027 -.067l-.032 -.108l-.01 -.053l-.01 -.06l-.004 -.057v-.118l.005 -.058l.009 -.06l.01 -.052l.032 -.108l.027 -.067l.07 -.132l.065 -.09l.073 -.081l.094 -.083l.077 -.054l.096 -.054l.036 -.017l.067 -.027l.108 -.032l.053 -.01l.06 -.01l.057 -.004l12.059 -.002z" /></svg>' : '';
        $html .= '<a href="' . $href . '" class="escms-nav-link">' . $icon . htmlspecialchars($node['title']) . $caret . '</a>';
        if (!empty($node['children'])) {
            $html .= '<ul class="escms-nav-sublist">';
            $html .= $buildHtml($node['children'], $currentPathForChildren);
            $html .= '</ul>';
        }
        $html .= '</li>';
    }
    return $html;
};

$dynamicHtml = $buildHtml($roots);

$offset = 0;
// Strip any existing hamburger to avoid duplicates
$content = preg_replace('/<div class="escms-hamburger"[^>]*>.*?<\/div>/s', '', $content);

$hamburgerHtml = '<div class="escms-hamburger" onclick="this.parentElement.classList.toggle(\'is-open\')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-menu-2"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 6l16 0" /><path d="M4 12l16 0" /><path d="M4 18l16 0" /></svg><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></div>';

while (($start = strpos($content, 'escms-nav-list', $offset)) !== false) {
    $ulStart = strrpos(substr($content, 0, $start), '<ul');
    if ($ulStart === false) { $offset = $start + 1; continue; }
    
    $ulEnd = strpos($content, '>', $start);
    if ($ulEnd === false) { $offset = $start + 1; continue; }
    
    $tagContentStart = $ulEnd + 1;
    $depth = 1;
    $pos = $tagContentStart;
    
    while ($depth > 0 && $pos < strlen($content)) {
        $nextOpen = strpos($content, '<ul', $pos);
        $nextClose = strpos($content, '</ul', $pos);
        if ($nextClose === false) break;
        
        if ($nextOpen !== false && $nextOpen < $nextClose) {
            $depth++;
            $pos = $nextOpen + 3;
        } else {
            $depth--;
            $pos = $nextClose + 4;
        }
    }
    
    if ($depth == 0) {
        $tagContentEnd = $pos - 4; 
        $content = substr($content, 0, $ulStart) . $hamburgerHtml . substr($content, $ulStart, $tagContentStart - $ulStart) . $dynamicHtml . substr($content, $tagContentEnd);
        $offset = $ulStart + strlen($hamburgerHtml) + ($tagContentStart - $ulStart) + strlen($dynamicHtml);
    } else {
        $offset = $start + 1;
    }
}

// Cargar el CSS del usuario o del tema activo (por ahora asumimos pichi)
$css_href = '/data/templates/pichi/style.css';
$user_css_path = __DIR__ . '/../data/user_settings/style.css';
$template_css_path = __DIR__ . '/../data/templates/pichi/style.css';

if (file_exists($user_css_path)) {
    $css_href = '/data/user_settings/style.css?v=' . filemtime($user_css_path);
} else if (file_exists($template_css_path)) {
    $css_href = '/data/templates/pichi/style.css?v=' . filemtime($template_css_path);
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

$favicon_html = "";
if (!empty($options['site_favicon'])) {
    $favicon_html = '<link rel="icon" href="' . htmlspecialchars($options['site_favicon']) . '">';
}

// Inyectar ESCMS Network Feed si está activo
if (!empty($options['escms_p2p_enabled']) && $options['escms_p2p_enabled'] === '1' && !empty($options['network_feed_html'])) {
    $feed = $options['network_feed_html'];
    
    // Attempt to inject Above Footer
    if (($p = strripos($content, '<footer')) !== false) {
        $content = substr_replace($content, $feed, $p, 0);
    } 
    // Fallback if no footer element exists: inject before the last closing div of the main container
    elseif (($p = strripos($content, '</div>')) !== false) {
        $content = substr_replace($content, $feed, $p, 0);
    } 
    // Absolute fallback: append to the end
    else {
        $content .= $feed;
    }
}

?>
<!DOCTYPE html>
<html lang="<?= $html_lang ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $title ?></title>
    <?= $meta_desc ?>
    <?= $meta_keywords ?>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <?= $google_fonts_html ?>
    <?= $favicon_html ?>

    <link rel="stylesheet" type="text/css" href="<?= $css_href ?>">
    <style>
        /* Ajustes Globales del Usuario */
        <?= $custom_css_vars ?>
        
        /* ESCMS Core Animations */
        @keyframes escms-bg-pan {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes escms-mesh-drift {
            0% { background-position: 0% 0%, 100% 100%, 50% 0%; }
            33% { background-position: 100% 0%, 0% 50%, 100% 100%; }
            66% { background-position: 50% 100%, 0% 0%, 0% 100%; }
            100% { background-position: 0% 0%, 100% 100%, 50% 0%; }
        }
        [data-escms-mesh="true"] {
            position: relative;
            isolation: isolate;
        }
        [data-escms-mesh="true"]::before {
            content: '';
            position: absolute;
            inset: 0;
            z-index: -1;
            pointer-events: none;
            border-radius: inherit;
            background-image: var(--escms-mesh-bg);
            background-size: var(--escms-mesh-size, 100% 100%);
            background-repeat: var(--escms-mesh-repeat, no-repeat);
            animation: var(--escms-mesh-anim, none);
            filter: blur(var(--escms-mesh-blur, 60px));
            clip-path: inset(0);
        }
    </style>
</head>
<body>
    <?= $content ?>
    <?php if (EscmsAuth::isLoggedIn() && !empty($page['id'])): ?>
    <script>
        (function() {
            const pageId = <?= json_encode($page['id']) ?>;
            const storageKey = 'escms_draft_' + pageId;
            
            const applyDraft = (jsonStr) => {
                if (!jsonStr) return;
                try {
                    const data = JSON.parse(jsonStr);
                    if (data && data.html) {
                        document.body.innerHTML = data.html;
                    }
                } catch(e) { console.error('Live preview error:', e); }
            };

            // Aplica el draft inicial si existe en LocalStorage (antes de que el server lo tenga)
            const initialDraft = localStorage.getItem(storageKey);
            if (initialDraft) {
                applyDraft(initialDraft);
            }

            // Escucha cambios en tiempo real desde la pestaña del editor
            window.addEventListener('storage', (e) => {
                if (e.key === storageKey) {
                    applyDraft(e.newValue);
                }
            });
        })();
    </script>
    <?php endif; ?>
</body>
</html>
