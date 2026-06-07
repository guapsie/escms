<?php

$root_dir = dirname(__DIR__);
$data_dir = $root_dir . '/data';
$db_path = $data_dir . '/escms.sqlite';
$core_dir = __DIR__;

$needs_install = !file_exists($db_path) || filesize($db_path) === 0;
$needs_assets = !file_exists($root_dir . '/assets/js/editor-app.js');

if ($needs_install || $needs_assets) {
    $dirs = [
        $data_dir,
        $data_dir . '/media',
        $data_dir . '/media/thumbs',
        $data_dir . '/templates',
        $data_dir . '/atoms',
        $data_dir . '/locales',
        $root_dir . '/assets/js',
        $root_dir . '/assets/css'
    ];

    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }

    // La extracción real de assets y core ahora la hace el Kamikaze installer (build.js)

    $htaccess_path = $root_dir . '/.htaccess';
    if (!file_exists($htaccess_path)) {
        $htaccess_content = "<IfModule mod_rewrite.c>\n    RewriteEngine On\n    RewriteCond %{HTTPS} off\n    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]\n    RewriteRule \.sqlite$ - [F,L]\n    RewriteCond %{REQUEST_FILENAME} !-f\n    RewriteCond %{REQUEST_FILENAME} !-d\n    RewriteRule ^(.*)$ index.php?route=$1 [QSA,L]\n</IfModule>";
        file_put_contents($htaccess_path, $htaccess_content);
    }
}

if ($needs_install) {
    try {
        $pdo = new PDO('sqlite:' . $db_path);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec("CREATE TABLE IF NOT EXISTS options (k TEXT PRIMARY KEY, v TEXT)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS passkeys (id TEXT PRIMARY KEY, public_key TEXT, sign_count INTEGER DEFAULT 0)");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                editor_data TEXT DEFAULT '{}',
                public_html TEXT DEFAULT '',
                views INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'draft',
                seo_title TEXT,
                seo_desc TEXT,
                parent_id INTEGER DEFAULT NULL,
                menu_order INTEGER DEFAULT 0,
                is_hidden_menu INTEGER DEFAULT 0,
                is_custom_link INTEGER DEFAULT 0,
                custom_link_url TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS components (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                ref_id TEXT NOT NULL UNIQUE,
                template_id VARCHAR(50) DEFAULT 'custom',
                editor_data TEXT DEFAULT '{}',
                public_html TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TRIGGER IF NOT EXISTS trigger_pages_updated_at
              AFTER UPDATE ON pages
              FOR EACH ROW
              BEGIN
                  UPDATE pages SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
              END;
              
            CREATE TRIGGER IF NOT EXISTS trigger_components_updated_at
              AFTER UPDATE ON components
              FOR EACH ROW
              BEGIN
                  UPDATE components SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
              END;
        ");

        // 3. Seeding de página de inicio (Pichi Template por defecto)
        $defaultData = '{"tag":"div","classes":["escms-template-home"],"children":[{"tag":"h2","children":["Welcome to ESCMS"]},{"tag":"p","children":["Edit this page in the admin panel."]}]}';
        $defaultHtml = '<div class="escms-template-home"><h2>Welcome to ESCMS</h2><p>Edit this page in the admin panel.</p></div>';
        
        $tpl_path = dirname(__DIR__) . '/data/templates/pichi/pichi.json';
        if (file_exists($tpl_path)) {
            $tpl = json_decode(file_get_contents($tpl_path), true);
            if (isset($tpl['views']['home'])) {
                $nodes = $tpl['views']['home'];
                $nodeTree = ['tag' => 'div', 'classes' => ['escms-template-home'], 'children' => $nodes];
                $defaultData = json_encode($nodeTree);
                
                $jsonToHtml = function($node) use (&$jsonToHtml) {
                    if (is_string($node)) return htmlspecialchars($node);
                    if (!is_array($node)) return '';
                    $tag = $node['tag'] ?? 'div';
                    $html = "<$tag";
                    if (!empty($node['id'])) {
                        $html .= ' id="' . htmlspecialchars($node['id']) . '"';
                    }
                    if (!empty($node['classes'])) {
                        $html .= ' class="' . htmlspecialchars(implode(' ', $node['classes'])) . '"';
                    }
                    if (!empty($node['attributes'])) {
                        foreach ($node['attributes'] as $attrKey => $attrVal) {
                            $html .= ' ' . htmlspecialchars($attrKey) . '="' . htmlspecialchars($attrVal) . '"';
                        }
                    }
                    $html .= '>';
                    if (!empty($node['children'])) {
                        foreach ($node['children'] as $child) {
                            $html .= $jsonToHtml($child);
                        }
                    }
                    $html .= "</$tag>";
                    return $html;
                };
                
                $defaultHtml = $jsonToHtml($nodeTree);
                if (isset($tpl['globals'])) {
                    $templateName = $tpl['_manifest']['name'] ?? 'pichi';
                    foreach ($tpl['globals'] as $refId => $componentNodes) {
                        $compTree = ['tag' => 'div', 'classes' => ['escms-component'], 'children' => $componentNodes];
                        $compData = json_encode($compTree);
                        $compHtml = $jsonToHtml($compTree);
                        $stmtComp = $pdo->prepare("INSERT INTO components (name, ref_id, template_id, editor_data, public_html) VALUES (?, ?, ?, ?, ?)");
                        $stmtComp->execute([ucfirst($refId), $refId, $templateName, $compData, $compHtml]);
                    }
                }
            }
        }

        $stmt = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html) VALUES (?, ?, ?, ?)");
        $stmt->execute(['Home', 'home', $defaultData, $defaultHtml]);
        $homeId = $pdo->lastInsertId();
        
        $stmtOpt = $pdo->prepare("INSERT INTO options (k, v) VALUES ('home_page_id', ?)");
        $stmtOpt->execute([$homeId]);

        // Seed 404 page
        $default404Data = '{"tag":"div","classes":["escms-template-404"],"children":[{"tag":"h1","children":["404"]},{"tag":"p","children":["Page not found"]}]}';
        $default404Html = '<div class="escms-template-404"><h1>404</h1><p>Page not found</p></div>';
        if (isset($tpl) && isset($tpl['views']['404'])) {
            $nodeTree404 = ['tag' => 'div', 'classes' => ['escms-template-404'], 'children' => $tpl['views']['404']];
            $default404Data = json_encode($nodeTree404);
            if (isset($jsonToHtml)) {
                $default404Html = $jsonToHtml($nodeTree404);
            }
        }
        $stmt404 = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html, status, is_hidden_menu) VALUES (?, ?, ?, ?, 'published', 1)");
        $stmt404->execute(['404', '404', $default404Data, $default404Html]);

        if (isset($tpl['theme_config'])) {
            $tc = $tpl['theme_config'];
            $stmtTheme = $pdo->prepare("INSERT INTO options (k, v) VALUES (?, ?)");
            if (!empty($tc['typography']['body'])) $stmtTheme->execute(['--font-body', $tc['typography']['body']]);
            if (!empty($tc['colors']['background'])) $stmtTheme->execute(['--color-background', $tc['colors']['background']]);
            if (!empty($tc['colors']['text'])) $stmtTheme->execute(['--color-text', $tc['colors']['text']]);
            if (!empty($tc['colors']['accent'])) $stmtTheme->execute(['--color-accent', $tc['colors']['accent']]);
            if (!empty($tc['width'])) $stmtTheme->execute(['--max-width', $tc['width']]);
            if (isset($tc['google_fonts']) && is_array($tc['google_fonts'])) {
                $stmtTheme->execute(['google_fonts', json_encode($tc['google_fonts'])]);
            }
        }

    } catch (PDOException $e) {
        die("Fatal Error: Database creation failed - " . $e->getMessage());
    }

    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Installing ESCMS</title>
    <style>
        :root {
            --bg-base: #0a0a0a;
            --text-solid: #f5f5f5;
            --accent-solid: #3b82f6;
            --accent-faint: rgba(59, 130, 246, 0.3);
        }
        body {
            background-color: var(--bg-base);
            color: var(--text-solid);
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }
        .setup-card {
            background: transparent;
            border: 1px solid var(--accent-faint);
            border-radius: 8px;
            padding: 3rem 2.5rem;
            max-width: 450px;
            width: 100%;
            text-align: center;
            backdrop-filter: blur(10px);
            box-shadow: 0 0 30px var(--accent-faint);
            box-sizing: border-box;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 15px var(--accent-faint); }
            50% { box-shadow: 0 0 40px var(--accent-faint); }
            100% { box-shadow: 0 0 15px var(--accent-faint); }
        }
        h1 { font-size: 1.5rem; font-weight: 500; margin: 0; }
        p { color: rgba(245, 245, 245, 0.6); margin-top: 1rem; }
    </style>
</head>
<body>
    <div class="setup-card">
        <h1>ESCMS</h1>
        <p>Hold on, installing the system...</p>
    </div>
    <script>
        setTimeout(() => window.location.href = "/admin", 1500);
    </script>
</body>
</html>';
    exit;
}