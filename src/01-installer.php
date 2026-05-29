<?php

$data_dir = __DIR__ . '/data';
$db_path = $data_dir . '/escms.sqlite';
$core_dir = __DIR__ . '/core';

$needs_install = !file_exists($db_path);
$needs_assets = !file_exists($core_dir . '/js/editor-app.js');

if ($needs_install || $needs_assets) {
    $dirs = [
        $data_dir,
        $data_dir . '/uploads',
        $data_dir . '/templates',
        $data_dir . '/atoms',
        $data_dir . '/locales',
        $core_dir,
        $core_dir . '/js',
        $core_dir . '/css'
    ];

    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }

    $assets = [
        /*__ASSETS_PAYLOAD__*/
    ];
    foreach ($assets as $file => $b64) {
        file_put_contents(__DIR__ . '/' . $file, base64_decode($b64));
    }

    $htaccess_path = __DIR__ . '/.htaccess';
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
        $pdo->exec("CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            editor_data TEXT,
            public_html TEXT,
            views INTEGER DEFAULT 0,
            seo_title TEXT,
            seo_desc TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
        
        $pdo->exec("CREATE TRIGGER IF NOT EXISTS update_pages_updated_at 
            AFTER UPDATE ON pages
            FOR EACH ROW
            BEGIN
                UPDATE pages SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
            END;
        ");
    } catch (PDOException $e) {
        die("Fatal Error: Database creation failed - " . $e->getMessage());
    }

    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESCMS Setup</title>
    <style>
        :root {
            --bg-base: #0a0a0a;
            --text-solid: #f5f5f5;
            --accent-solid: #3b82f6;
            --accent-fade: rgba(59, 130, 246, 0.6);
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
        }
        h1 {
            font-size: 1.5rem;
            font-weight: 500;
            margin: 0 0 2rem 0;
        }
        button {
            background: var(--accent-solid);
            color: var(--text-solid);
            border: none;
            padding: 1rem 1.5rem;
            font-size: 1rem;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            transition: all 0.2s ease;
        }
        button:hover {
            background: var(--accent-fade);
        }
    </style>
</head>
<body>
    <div class="setup-card">
        <h1>ESCMS Setup</h1>
        <button id="btn-setup-passkey">Create Admin Passkey</button>
    </div>
    <script src="core/js/installer.js"></script>
</body>
</html>';
    exit;
}