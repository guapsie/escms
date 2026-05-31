<?php

declare(strict_types=1);

// En el entorno compilado, este bloque asegura que la API solo procese lo suyo y muera aquí.
if (str_starts_with($route, 'api/')) {

    header('Content-Type: application/json');

    $send_json = function(array $data, int $status = 200): void {
        http_response_code($status);
        echo json_encode($data);
        exit;
    };

    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    switch ($route) {
        case 'api/challenge':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            try {
                $challenge = EscmsAuth::generateChallenge();
                $_SESSION['auth_challenge'] = $challenge;
                $send_json(['challenge' => $challenge]);
            } catch (Throwable $e) {
                $send_json(['error' => 'Failed to generate challenge'], 500);
            }
            break;

        case 'api/register':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            try {
                if (empty($input)) throw new RuntimeException('Invalid JSON payload');
                
                if (empty($_SESSION['auth_challenge'])) {
                    throw new RuntimeException('No active challenge. Reload the page.');
                }

                $count = $pdo->query("SELECT COUNT(*) FROM passkeys")->fetchColumn();
                if ($count > 0) {
                    throw new RuntimeException('Admin passkey already registered.');
                }

                $origin = ($is_https ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
                $pem = EscmsAuth::verifyRegistration($input, $origin, $_SESSION['auth_challenge']);
                
                $stmt = $pdo->prepare("INSERT INTO passkeys (id, public_key) VALUES (?, ?)");
                $stmt->execute([$input['id'], $pem]);
                
                unset($_SESSION['auth_challenge']);
                EscmsAuth::login();
                
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/login-challenge':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            try {
                $challenge = EscmsAuth::generateChallenge();
                $_SESSION['auth_challenge'] = $challenge;
                $send_json(['challenge' => $challenge]);
            } catch (Throwable $e) {
                $send_json(['error' => 'Failed to generate challenge'], 500);
            }
            break;

        case 'api/login-verify':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            try {
                if (empty($input)) throw new RuntimeException('Invalid JSON payload');
                if (empty($_SESSION['auth_challenge'])) throw new RuntimeException('No active challenge.');

                $stmt = $pdo->prepare("SELECT public_key, sign_count FROM passkeys WHERE id = ?");
                $stmt->execute([$input['id'] ?? '']);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) throw new RuntimeException('Passkey not found.');

                $origin = ($is_https ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
                $newSignCount = 0;
                
                $verified = EscmsAuth::verifyLogin($input, $origin, $user['public_key'], $_SESSION['auth_challenge'], (int)$user['sign_count'], $newSignCount);
                if (!$verified) throw new RuntimeException('Signature verification failed.');

                $stmt = $pdo->prepare("UPDATE passkeys SET sign_count = ? WHERE id = ?");
                $stmt->execute([$newSignCount, $input['id']]);

                unset($_SESSION['auth_challenge']);
                EscmsAuth::login();

                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/save':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) {
                $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            }
            try {
                $id = $input['id'] ?? null;
                $editor_data = $input['editor_data'] ?? '';
                $public_html = $input['public_html'] ?? '';

                if ($id) {
                    $stmt = $pdo->prepare("UPDATE pages SET editor_data = ?, public_html = ? WHERE id = ?");
                    $stmt->execute([$editor_data, $public_html, $id]);
                } else {
                    $title = 'Draft ' . date('Y-m-d H:i:s');
                    $slug = 'draft-' . bin2hex(random_bytes(4));
                    $stmt = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$title, $slug, $editor_data, $public_html]);
                    $id = $pdo->lastInsertId();
                }

                $send_json(['status' => 'success', 'id' => $id]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/list':
            if ($method !== 'GET') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $pages = $pdo->query("SELECT id, title, slug, views, updated_at FROM pages ORDER BY updated_at DESC")->fetchAll(PDO::FETCH_ASSOC);
                
                if (count($pages) === 0) {
                    $defaultData = '{"tag":"div","classes":["escms-container"],"styles":"max-width: var(--max-width); margin: 0px auto; padding: 20px;","children":[{"tag":"h2","children":[{"tag":"span","children":["Welcome to ESCMS"]}]},{"tag":"p","children":[{"tag":"span","children":["This is your brand new lightweight CMS."]}]}]}';
                    $defaultHtml = '<div class="escms-container" style="max-width: var(--max-width); margin: 0px auto; padding: 20px;"><h2>New Heading</h2><p>Type something here...</p></div>';
                    
                    $stmt = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html) VALUES (?, ?, ?, ?)");
                    $stmt->execute(['Home', 'home', $defaultData, $defaultHtml]);
                    $homeId = $pdo->lastInsertId();
                    
                    $stmtOpt = $pdo->prepare("INSERT INTO options (k, v) VALUES ('home_page_id', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                    $stmtOpt->execute([$homeId]);
                    
                    $config['home_page_id'] = $homeId; // Update in memory so the loop below sees it
                    
                    $pages = $pdo->query("SELECT id, title, slug, views, updated_at FROM pages ORDER BY updated_at DESC")->fetchAll(PDO::FETCH_ASSOC);
                }

                $home_id = (int)($config['home_page_id'] ?? 0);
                $blog_id = (int)($config['blog_page_id'] ?? 0);

                foreach ($pages as &$p) {
                    $p['is_home'] = ((int)$p['id'] === $home_id);
                    $p['is_blog'] = ((int)$p['id'] === $blog_id);
                }

                $send_json(['status' => 'success', 'pages' => $pages]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/get':
            if ($method !== 'GET') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $_GET['id'] ?? null;
                if (!$id) throw new RuntimeException('ID required');
                $stmt = $pdo->prepare("SELECT id, title, slug, editor_data FROM pages WHERE id = ?");
                $stmt->execute([$id]);
                $page = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$page) throw new RuntimeException('Page not found');
                $send_json(['status' => 'success', 'page' => $page]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/create':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $title = 'Draft ' . date('Y-m-d H:i:s');
                $slug = 'draft-' . bin2hex(random_bytes(4));
                $emptyContainer = '{"tag":"div","classes":["escms-container"],"styles":"max-width: var(--max-width); margin: 0px auto; padding: 20px;","children":[]}';
                $stmt = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html) VALUES (?, ?, ?, '')");
                $stmt->execute([$title, $slug, $emptyContainer]);
                
                $send_json(['status' => 'success', 'id' => $pdo->lastInsertId()]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/rename':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                $title = trim($input['title'] ?? '');
                if (!$id || !$title) throw new RuntimeException('ID and Title required');
                
                $stmt = $pdo->prepare("UPDATE pages SET title = ? WHERE id = ?");
                $stmt->execute([$title, $id]);
                
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/delete':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                if (!$id) throw new RuntimeException('ID required');
                
                $stmt = $pdo->prepare("DELETE FROM pages WHERE id = ?");
                $stmt->execute([$id]);

                // Limpiar opciones si la borrada era home o blog
                if ((int)($config['home_page_id'] ?? 0) === (int)$id) {
                    $pdo->exec("DELETE FROM options WHERE k = 'home_page_id'");
                }
                if ((int)($config['blog_page_id'] ?? 0) === (int)$id) {
                    $pdo->exec("DELETE FROM options WHERE k = 'blog_page_id'");
                }
                
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/duplicate':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                if (!$id) throw new RuntimeException('ID required');
                
                $stmt = $pdo->prepare("SELECT title, editor_data FROM pages WHERE id = ?");
                $stmt->execute([$id]);
                $page = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$page) throw new RuntimeException('Page not found');

                $newTitle = $page['title'] . ' (Copy)';
                $newSlug = 'draft-' . bin2hex(random_bytes(4));
                
                $stmtInsert = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html) VALUES (?, ?, ?, '')");
                $stmtInsert->execute([$newTitle, $newSlug, $page['editor_data']]);
                
                $send_json(['status' => 'success', 'id' => $pdo->lastInsertId()]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/set_home':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                if (!$id) throw new RuntimeException('ID required');
                
                $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES ('home_page_id', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                $stmt->execute([$id]);
                
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/set_blog':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                if (!$id) throw new RuntimeException('ID required');
                
                $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES ('blog_page_id', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                $stmt->execute([$id]);
                
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;
        case 'api/settings':
            if ($method === 'GET') {
                if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
                $send_json(['status' => 'success', 'data' => $config]);
            } elseif ($method === 'POST') {
                if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
                try {
                    $pdo->beginTransaction();
                    foreach ($input as $k => $v) {
                        $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v=excluded.v");
                        $stmt->execute([$k, is_bool($v) ? ($v ? '1' : '0') : (string)$v]);
                    }
                    $pdo->commit();
                    $send_json(['status' => 'success']);
                } catch (Throwable $e) {
                    $pdo->rollBack();
                    $send_json(['status' => 'error', 'msg' => $e->getMessage()], 500);
                }
            } else {
                $send_json(['error' => 'Method not allowed'], 405);
            }
            break;


        case 'api/menus':
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            if ($method === 'GET') {
                try {
                    $stmt = $pdo->prepare("SELECT v FROM options WHERE k = 'main_menu'");
                    $stmt->execute();
                    $result = $stmt->fetchColumn();
                    $menus = $result ? json_decode($result, true) : [];
                    $send_json(['status' => 'success', 'menus' => $menus]);
                } catch (Throwable $e) {
                    $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
                }
            } elseif ($method === 'POST') {
                try {
                    $menusJson = json_encode($input['menus'] ?? []);
                    $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES ('main_menu', ?) ON CONFLICT(k) DO UPDATE SET v=excluded.v");
                    $stmt->execute([$menusJson]);
                    $send_json(['status' => 'success']);
                } catch (Throwable $e) {
                    $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
                }
            } else {
                $send_json(['error' => 'Method not allowed'], 405);
            }
            break;
        case 'api/atoms':
            if ($method !== 'GET') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $atoms_dir = dirname(__DIR__) . '/data/atoms';
                $atoms = [];
                if (is_dir($atoms_dir)) {
                    $dirs = array_filter(glob($atoms_dir . '/*'), 'is_dir');
                    foreach ($dirs as $dir) {
                        $json_path = $dir . '/atom.json';
                        if (file_exists($json_path)) {
                            $content = file_get_contents($json_path);
                            $parsed = json_decode($content, true);
                            if ($parsed) {
                                $atoms[] = $parsed;
                            }
                        }
                    }
                }
                $send_json(['status' => 'success', 'atoms' => $atoms]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 500);
            }
            break;
        case 'api/media/list':
            if ($method !== 'GET') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            $media_dir = dirname(__DIR__) . '/data/media';
            if (!is_dir($media_dir)) mkdir($media_dir, 0755, true);
            $files = [];
            foreach (glob($media_dir . '/*.*') as $file) {
                $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'])) {
                    $files[] = [
                        'id' => basename($file),
                        'url' => '/data/media/' . basename($file),
                        'name' => basename($file),
                        'date' => filemtime($file),
                        'size' => filesize($file)
                    ];
                }
            }
            // Sort by date descending
            usort($files, function($a, $b) { return $b['date'] - $a['date']; });
            $send_json(['status' => 'success', 'media' => $files]);
            break;

        case 'api/media/upload':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                $send_json(['status' => 'error', 'msg' => 'No file uploaded or upload error'], 400);
            }
            $media_dir = dirname(__DIR__) . '/data/media/';
            if (!is_dir($media_dir)) mkdir($media_dir, 0755, true);
            
            $file = $_FILES['file'];
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'])) {
                $send_json(['status' => 'error', 'msg' => 'Invalid file type'], 400);
            }

            // Get webp setting
            $stmt = $pdo->prepare("SELECT v FROM options WHERE k = 'webp_enabled'");
            $stmt->execute();
            $webp_enabled_row = $stmt->fetchColumn();
            $webp_enabled = $webp_enabled_row === false ? '1' : $webp_enabled_row;

            $filename_base = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
            $is_image = in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
            $generate_webp = ($webp_enabled === '1') && function_exists('imagewebp') && $is_image && $ext !== 'svg';

            $final_name = '';

            if ($generate_webp) {
                $src = null;
                if ($ext === 'jpg' || $ext === 'jpeg') $src = @imagecreatefromjpeg($file['tmp_name']);
                elseif ($ext === 'png') $src = @imagecreatefrompng($file['tmp_name']);
                elseif ($ext === 'webp') $src = @imagecreatefromwebp($file['tmp_name']);
                elseif ($ext === 'gif') $src = @imagecreatefromgif($file['tmp_name']);

                if ($src) {
                    $counter = 1;
                    $final_name = $filename_base . '.webp';
                    while (file_exists($media_dir . $final_name)) {
                        $final_name = $filename_base . '-' . $counter . '.webp';
                        $counter++;
                    }

                    $w = imagesx($src);
                    $h = imagesy($src);
                    $new_w = min($w, 1920);
                    $new_h = (int)($h * ($new_w / $w));
                    $dst = imagecreatetruecolor($new_w, $new_h);

                    if ($ext === 'png' || $ext === 'webp') {
                        imagealphablending($dst, false);
                        imagesavealpha($dst, true);
                        $transparent = imagecolorallocatealpha($dst, 255, 255, 255, 127);
                        imagefilledrectangle($dst, 0, 0, $new_w, $new_h, $transparent);
                    }

                    imagecopyresampled($dst, $src, 0, 0, 0, 0, $new_w, $new_h, $w, $h);
                    imagewebp($dst, $media_dir . $final_name, 85);
                    imagedestroy($dst);
                    imagedestroy($src);
                } else {
                    $generate_webp = false; // fallback if imagecreate fails
                }
            }
            
            if (!$generate_webp) {
                $counter = 1;
                $final_name = $filename_base . '.' . $ext;
                while (file_exists($media_dir . $final_name)) {
                    $final_name = $filename_base . '-' . $counter . '.' . $ext;
                    $counter++;
                }
                move_uploaded_file($file['tmp_name'], $media_dir . $final_name);
            }

            $send_json([
                'status' => 'success', 
                'media' => [
                    'id' => $final_name,
                    'url' => '/data/media/' . $final_name,
                    'name' => $final_name,
                    'date' => time(),
                    'size' => file_exists($media_dir . $final_name) ? filesize($media_dir . $final_name) : 0
                ]
            ]);
            break;

        case 'api/media/delete':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            $media_dir = dirname(__DIR__) . '/data/media';
            $input = json_decode(file_get_contents('php://input'), true);
            if (!isset($input['files']) || !is_array($input['files'])) {
                $send_json(['status' => 'error', 'msg' => 'Invalid payload'], 400);
            }
            $deleted = 0;
            foreach ($input['files'] as $filename) {
                // Prevent directory traversal
                $safe_filename = basename($filename);
                $path = $media_dir . '/' . $safe_filename;
                if (file_exists($path) && is_file($path)) {
                    unlink($path);
                    $deleted++;
                }
            }
            $send_json(['status' => 'success', 'deleted' => $deleted]);
            break;

        case 'api/ai/settings':
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            if ($method === 'GET') {
                $provider = $pdo->query("SELECT v FROM options WHERE k='ai_provider'")->fetchColumn() ?: 'gemini';
                $key = $pdo->query("SELECT v FROM options WHERE k='ai_key'")->fetchColumn() ?: '';
                $model = $pdo->query("SELECT v FROM options WHERE k='ai_model'")->fetchColumn() ?: '';
                $send_json(['status' => 'success', 'provider' => $provider, 'has_key' => !empty($key), 'model' => $model]);
            } else if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                if (isset($input['provider'])) {
                    $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES ('ai_provider', ?) ON CONFLICT(k) DO UPDATE SET v=excluded.v");
                    $stmt->execute([$input['provider']]);
                }
                if (isset($input['key'])) {
                    $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES ('ai_key', ?) ON CONFLICT(k) DO UPDATE SET v=excluded.v");
                    $stmt->execute([trim($input['key'])]);
                }
                if (isset($input['model'])) {
                    $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES ('ai_model', ?) ON CONFLICT(k) DO UPDATE SET v=excluded.v");
                    $stmt->execute([$input['model']]);
                }
                $send_json(['status' => 'success']);
            }
            break;

        case 'api/ai/models':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            $input = json_decode(file_get_contents('php://input'), true);
            $provider = $input['provider'] ?? '';
            $key = trim($input['key'] ?? '');
            if (!$provider || !$key) $send_json(['status' => 'error', 'msg' => 'Provider and key required'], 400);

            if ($provider === 'claude') {
                $send_json([
                    'status' => 'success',
                    'models' => [
                        ['value' => 'claude-3-5-sonnet-latest', 'label' => 'Claude 3.5 Sonnet'],
                        ['value' => 'claude-3-haiku-20240307', 'label' => 'Claude 3 Haiku'],
                        ['value' => 'claude-3-opus-latest', 'label' => 'Claude 3 Opus']
                    ]
                ]);
            } else if ($provider === 'gemini') {
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, "https://generativelanguage.googleapis.com/v1beta/models?key=" . urlencode($key));
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
                $response = curl_exec($ch);
                $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpcode >= 400 || $response === false) {
                    $send_json(['status' => 'error', 'msg' => 'Error fetching models', 'details' => $response], 500);
                }

                $data = json_decode($response, true);
                $models = [];
                if (isset($data['models'])) {
                    foreach ($data['models'] as $m) {
                        if (isset($m['supportedGenerationMethods']) && in_array('generateContent', $m['supportedGenerationMethods'])) {
                            $val = str_replace('models/', '', $m['name']);
                            $models[] = ['value' => $val, 'label' => $m['displayName'] ?? $val];
                        }
                    }
                }
                $send_json(['status' => 'success', 'models' => $models]);
            } else {
                $send_json(['status' => 'error', 'msg' => 'Unsupported provider'], 400);
            }
            break;

        case 'api/ai/generate':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            
            $input = json_decode(file_get_contents('php://input'), true);
            $prompt = $input['prompt'] ?? '';
            if (!$prompt) $send_json(['status' => 'error', 'msg' => 'Prompt is required'], 400);

            $provider = $pdo->query("SELECT v FROM options WHERE k='ai_provider'")->fetchColumn() ?: 'gemini';
            $key = $pdo->query("SELECT v FROM options WHERE k='ai_key'")->fetchColumn();
            $model = $pdo->query("SELECT v FROM options WHERE k='ai_model'")->fetchColumn();

            if (!$key) $send_json(['status' => 'error', 'msg' => 'No API Key configured'], 400);

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

            if ($provider === 'gemini') {
                if (!$model) $model = 'gemini-1.5-flash-latest';
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($key);
                $payload = json_encode([
                    'contents' => [['parts' => [['text' => $prompt]]]]
                ]);
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            } else if ($provider === 'claude') {
                if (!$model) $model = 'claude-3-haiku-20240307';
                $url = "https://api.anthropic.com/v1/messages";
                $payload = json_encode([
                    'model' => $model,
                    'max_tokens' => 1024,
                    'messages' => [['role' => 'user', 'content' => $prompt]]
                ]);
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                    'x-api-key: ' . $key,
                    'anthropic-version: 2023-06-01'
                ]);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            } else {
                $send_json(['status' => 'error', 'msg' => 'Unsupported provider'], 400);
            }

            $response = curl_exec($ch);
            $err = curl_error($ch);
            $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpcode >= 400 || $response === false) {
                $send_json(['status' => 'error', 'msg' => 'API Error', 'details' => $response ?: $err], 500);
            }

            $resData = json_decode($response, true);
            $text = '';
            
            if ($provider === 'gemini') {
                $text = $resData['candidates'][0]['content']['parts'][0]['text'] ?? '';
            } else if ($provider === 'claude') {
                $text = $resData['content'][0]['text'] ?? '';
            }

            $send_json(['status' => 'success', 'text' => $text]);
            break;

        default:
            $send_json(['error' => 'Endpoint no encontrado'], 404);
    }
}